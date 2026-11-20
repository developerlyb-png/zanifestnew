import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import StaffRole, { SYSTEM_ROLES } from "@/models/StaffRole";
import StaffUser from "@/models/StaffUser";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;
  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

const str = (v: any) => (v === undefined || v === null ? "" : String(v).trim());

/**
 * Makes sure the two system roles exist, and that every role already used by
 * a StaffUser row has a StaffRole doc (users created back when roles were a
 * hardcoded list, e.g. "POSP Partner", would otherwise point at a role that
 * can't be picked in the form or filter). Cheap: two small queries, upserts
 * only when something is actually missing.
 */
async function ensureRoles() {
  const existing = await StaffRole.find().select("key").lean();
  const have = new Set(existing.map((r: any) => r.key));

  for (const name of SYSTEM_ROLES) {
    if (!have.has(name.toLowerCase())) {
      await StaffRole.updateOne(
        { key: name.toLowerCase() },
        { $setOnInsert: { name, key: name.toLowerCase(), isSystem: true, description: "Built-in role" } },
        { upsert: true }
      );
      have.add(name.toLowerCase());
    }
  }

  const usedRoles: string[] = await StaffUser.distinct("role");
  for (const name of usedRoles) {
    const n = str(name);
    if (!n || have.has(n.toLowerCase())) continue;
    await StaffRole.updateOne(
      { key: n.toLowerCase() },
      { $setOnInsert: { name: n, key: n.toLowerCase(), hasPospFields: /posp/i.test(n) } },
      { upsert: true }
    );
    have.add(n.toLowerCase());
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  await dbConnect();
  const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

  if (req.method === "GET") {
    try {
      await ensureRoles();
      const [roles, counts] = await Promise.all([
        StaffRole.find().sort({ isSystem: -1, name: 1 }).lean(),
        StaffUser.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      ]);
      const countMap = new Map(counts.map((c: any) => [String(c._id), c.count]));
      return res.status(200).json({
        success: true,
        roles: roles.map((r: any) => ({ ...r, userCount: countMap.get(r.name) || 0 })),
      });
    } catch (err: any) {
      console.log("STAFF ROLES GET ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      const name = str(b.name);
      if (!name) return res.status(400).json({ success: false, message: "Role name is required" });
      if (await StaffRole.exists({ key: name.toLowerCase() })) {
        return res.status(409).json({ success: false, message: "A role with this name already exists" });
      }
      const role = await StaffRole.create({
        name,
        key: name.toLowerCase(),
        description: str(b.description),
        hasPospFields: !!b.hasPospFields,
        isActive: b.isActive === undefined ? true : !!b.isActive,
        createdBy: adminName,
      });
      return res.status(201).json({ success: true, role });
    } catch (err: any) {
      console.log("STAFF ROLES POST ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const role: any = await StaffRole.findById(b.id);
      if (!role) return res.status(404).json({ success: false, message: "Role not found" });

      const name = str(b.name) || role.name;
      if (role.isSystem && name !== role.name) {
        return res.status(400).json({ success: false, message: "Built-in roles can't be renamed" });
      }
      if (name.toLowerCase() !== role.key && (await StaffRole.exists({ key: name.toLowerCase() }))) {
        return res.status(409).json({ success: false, message: "A role with this name already exists" });
      }

      const oldName = role.name;
      role.name = name;
      role.key = name.toLowerCase();
      if (b.description !== undefined) role.description = str(b.description);
      if (!role.isSystem && b.hasPospFields !== undefined) role.hasPospFields = !!b.hasPospFields;
      if (!role.isSystem && b.isActive !== undefined) role.isActive = !!b.isActive;
      await role.save();

      // Users store the role by name — carry a rename across to them.
      if (oldName !== name) {
        await StaffUser.updateMany({ role: oldName }, { $set: { role: name } });
      }
      return res.status(200).json({ success: true, role });
    } catch (err: any) {
      console.log("STAFF ROLES PUT ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = str(req.query.id || req.body?.id);
      const role: any = await StaffRole.findById(id);
      if (!role) return res.status(404).json({ success: false, message: "Role not found" });
      if (role.isSystem) return res.status(400).json({ success: false, message: "Built-in roles can't be deleted" });
      const inUse = await StaffUser.countDocuments({ role: role.name });
      if (inUse > 0) {
        return res.status(400).json({
          success: false,
          message: `${inUse} user(s) still have this role — move them to another role first`,
        });
      }
      await role.deleteOne();
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("STAFF ROLES DELETE ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
