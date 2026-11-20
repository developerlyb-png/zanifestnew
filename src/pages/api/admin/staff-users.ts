import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import StaffUser from "@/models/StaffUser";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import StaffRole from "@/models/StaffRole";
import Agent from "@/models/Agent";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb", // covers the cancelled-cheque upload
    },
  },
};

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

// System-generated POSP code: POS{2-digit year}-{6-digit sequence}, e.g.
// POS26-000010. Sequenced the same low-risk way as other "find the last one
// and +1" generators in this app (agentCode.ts) rather than a separate
// counter collection.
async function nextPospCode(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(-2);
  const prefix = `POS${yy}-`;
  const last = await StaffUser.findOne({ pospCode: { $regex: `^${prefix}\\d{6}$` } })
    .sort({ pospCode: -1 })
    .select("pospCode");
  const lastNum = last?.pospCode ? parseInt(String(last.pospCode).slice(prefix.length), 10) : 0;
  const next = (Number.isFinite(lastNum) ? lastNum : 0) + 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
}

// Manager.managerId is required + unique but has no fixed format in this
// app (existing rows were hand-entered, e.g. "NM1", "SM2") — BM-prefixed and
// timestamp-based is simply guaranteed unique without colliding with those.
function nextManagerId(): string {
  return `BM-${Date.now().toString(36).toUpperCase()}`;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] || fullName, lastName: parts.slice(1).join(" ") || parts[0] || fullName };
}

function sanitize(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.password;
  return obj;
}

/**
 * Roles "Admin" and "Branch Manager" are, underneath this unified form, real
 * Admin/Manager accounts — created here so they show up and work everywhere
 * those already do (Admin List, Manager List, bulk-upload reporting-manager
 * picker, etc.), not just inside User Management. Returns the fields to
 * stamp onto the StaffUser row (linkedAccountType/linkedAccountId) once the
 * real record exists.
 *
 * Known limitation: a new Branch Manager isn't slotted into the existing
 * national -> state -> district assignment chain (Manager.assignedTo) —
 * it's created as a standalone "district" manager. If it needs a parent in
 * that hierarchy, assign that manually via the existing Manager edit screen
 * afterward.
 */
async function createLinkedAccount(
  role: string,
  b: any,
  plainPassword: string
): Promise<{ linkedAccountType?: "Admin" | "Manager"; linkedAccountId?: any; error?: string }> {
  if (role === "Admin") {
    const { firstName, lastName } = splitName(str(b.fullName));
    const admin = await Admin.create({
      userFirstName: firstName,
      userLastName: lastName,
      email: str(b.email).toLowerCase(),
      password: plainPassword,
      role: "admin",
      accountStatus: "active",
    });
    return { linkedAccountType: "Admin", linkedAccountId: admin._id };
  }

  if (role === "Branch Manager") {
    const missing = ["pinCode", "city", "district", "state"].filter((k) => !str(b[k]));
    if (missing.length) {
      return { error: `Branch Manager requires: ${missing.join(", ")}` };
    }
    const { firstName, lastName } = splitName(str(b.fullName));
    const manager = await Manager.create({
      firstName,
      lastName,
      email: str(b.email).toLowerCase(),
      phone: str(b.phone),
      managerId: nextManagerId(),
      password: plainPassword,
      pinCode: str(b.pinCode),
      city: str(b.city),
      district: str(b.district),
      state: str(b.state),
      category: "district",
      accountStatus: "active",
    });
    return { linkedAccountType: "Manager", linkedAccountId: manager._id };
  }

  return {};
}

/** Keeps the linked Admin/Manager account's matching fields in step when the
 * StaffUser row is edited or toggled from User Management. */
async function syncLinkedAccount(
  linkedAccountType: "Admin" | "Manager" | undefined,
  linkedAccountId: any,
  fields: { fullName?: string; email?: string; phone?: string; password?: string; isActive?: boolean }
) {
  if (!linkedAccountType || !linkedAccountId) return;

  if (linkedAccountType === "Admin") {
    const admin: any = await Admin.findById(linkedAccountId);
    if (!admin) return;
    if (fields.fullName) Object.assign(admin, splitName(fields.fullName));
    if (fields.email) admin.email = fields.email.toLowerCase();
    if (fields.password) admin.password = fields.password; // re-hashed by Admin's own pre-save hook
    if (fields.isActive !== undefined) admin.accountStatus = fields.isActive ? "active" : "inactive";
    await admin.save();
  }

  if (linkedAccountType === "Manager") {
    const manager: any = await Manager.findById(linkedAccountId);
    if (!manager) return;
    if (fields.fullName) Object.assign(manager, splitName(fields.fullName));
    if (fields.email) manager.email = fields.email.toLowerCase();
    if (fields.phone) manager.phone = fields.phone;
    if (fields.password) manager.password = fields.password; // re-hashed by Manager's own pre-save hook
    if (fields.isActive !== undefined) manager.accountStatus = fields.isActive ? "active" : "inactive";
    await manager.save();
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();
  const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

  if (req.method === "GET") {
    try {
      const { id, from, to, q } = req.query;
      if (id) {
        const user = await StaffUser.findById(String(id)).select("-password").lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, user });
      }

      const query: any = {};
      if (q) {
        const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
      } else if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(String(from));
        if (to) query.createdAt.$lte = new Date(String(to));
      }

      const users = await StaffUser.find(query).select("-password").sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, users });
    } catch (err: any) {
      console.log("STAFF USERS GET ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      if (!str(b.fullName)) return res.status(400).json({ success: false, message: "Full name is required" });
      if (!str(b.email)) return res.status(400).json({ success: false, message: "Email is required" });
      if (!str(b.role)) return res.status(400).json({ success: false, message: "Role is required" });
      if (!str(b.phone)) return res.status(400).json({ success: false, message: "Phone number is required" });
      if (!str(b.password)) return res.status(400).json({ success: false, message: "Password is required" });

      if (!(await StaffRole.exists({ key: str(b.role).toLowerCase() }))) {
        return res.status(400).json({ success: false, message: `Role "${str(b.role)}" doesn't exist — add it under Manage Roles first` });
      }

      const existing = await StaffUser.findOne({ email: str(b.email).toLowerCase() });
      if (existing) return res.status(409).json({ success: false, message: "A user with this email already exists" });

      const isPosp = str(b.pospType).length > 0;
      const pospCode = isPosp ? await nextPospCode() : undefined;

      const linked = await createLinkedAccount(str(b.role), b, b.password);
      if (linked.error) return res.status(400).json({ success: false, message: linked.error });

      const user = await StaffUser.create({
        fullName: str(b.fullName),
        email: str(b.email).toLowerCase(),
        password: b.password,
        phone: str(b.phone),
        role: str(b.role),
        branch: str(b.branch),
        pospType: str(b.pospType) || undefined,
        pospCode,
        irdaiPospCode: str(b.irdaiPospCode) || undefined,
        payoutPercentage: b.payoutPercentage != null && b.payoutPercentage !== "" ? Number(b.payoutPercentage) : undefined,
        bankDetails: isPosp
          ? {
              accountHolderName: str(b.bankDetails?.accountHolderName),
              bankName: str(b.bankDetails?.bankName),
              ifscCode: str(b.bankDetails?.ifscCode),
              accountNumber: str(b.bankDetails?.accountNumber),
              cancelledCheque: b.bankDetails?.cancelledCheque || undefined,
            }
          : undefined,
        pinCode: str(b.pinCode) || undefined,
        city: str(b.city) || undefined,
        district: str(b.district) || undefined,
        state: str(b.state) || undefined,
        accessModules: Array.isArray(b.accessModules) ? b.accessModules : [],
        adminAccessModules: Array.isArray(b.adminAccessModules) ? b.adminAccessModules : [],
        linkedAccountType: linked.linkedAccountType,
        linkedAccountId: linked.linkedAccountId,
        createdBy: adminName,
      });

      return res.status(201).json({ success: true, user: sanitize(user) });
    } catch (err: any) {
      console.log("STAFF USERS POST ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const { id } = b;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const user: any = await StaffUser.findById(id);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      if (str(b.role) && str(b.role) !== user.role && !(await StaffRole.exists({ key: str(b.role).toLowerCase() }))) {
        return res.status(400).json({ success: false, message: `Role "${str(b.role)}" doesn't exist` });
      }

      const isPosp = str(b.pospType).length > 0;
      // Assign a code the first time this user becomes POSP-typed; never
      // regenerate it on later edits (same code must persist).
      if (isPosp && !user.pospCode) {
        user.pospCode = await nextPospCode();
      }

      user.fullName = str(b.fullName) || user.fullName;
      user.email = str(b.email).toLowerCase() || user.email;
      user.phone = str(b.phone) || user.phone;
      user.role = str(b.role) || user.role;
      user.branch = str(b.branch);
      user.pospType = str(b.pospType) || undefined;
      user.irdaiPospCode = str(b.irdaiPospCode) || undefined;
      user.payoutPercentage = b.payoutPercentage != null && b.payoutPercentage !== "" ? Number(b.payoutPercentage) : undefined;
      user.bankDetails = isPosp
        ? {
            accountHolderName: str(b.bankDetails?.accountHolderName),
            bankName: str(b.bankDetails?.bankName),
            ifscCode: str(b.bankDetails?.ifscCode),
            accountNumber: str(b.bankDetails?.accountNumber),
            cancelledCheque: b.bankDetails?.cancelledCheque || user.bankDetails?.cancelledCheque || undefined,
          }
        : undefined;
      if (str(b.pinCode)) user.pinCode = str(b.pinCode);
      if (str(b.city)) user.city = str(b.city);
      if (str(b.district)) user.district = str(b.district);
      if (str(b.state)) user.state = str(b.state);
      user.accessModules = Array.isArray(b.accessModules) ? b.accessModules : user.accessModules;
      user.adminAccessModules = Array.isArray(b.adminAccessModules) ? b.adminAccessModules : user.adminAccessModules;
      if (str(b.password)) user.password = b.password; // re-hashed by the pre-save hook

      // A role created without a link (e.g. was "POSP Partner", now switched
      // to "Admin"/"Branch Manager") gets one created now; an existing link
      // just has its fields kept in sync instead of being recreated.
      if (!user.linkedAccountType && (user.role === "Admin" || user.role === "Branch Manager")) {
        const linked = await createLinkedAccount(user.role, b, b.password || "Welcome@123");
        if (linked.error) return res.status(400).json({ success: false, message: linked.error });
        user.linkedAccountType = linked.linkedAccountType;
        user.linkedAccountId = linked.linkedAccountId;
      } else {
        await syncLinkedAccount(user.linkedAccountType, user.linkedAccountId, {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          password: str(b.password) || undefined,
        });
      }

      await user.save();
      return res.status(200).json({ success: true, user: sanitize(user) });
    } catch (err: any) {
      console.log("STAFF USERS PUT ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "PATCH") {
    try {
      // Accepts a single { id, isActive } or a bulk { ids: [...], isActive }.
      const { id, ids, isActive } = req.body || {};
      const idList: string[] = Array.isArray(ids) ? ids.map(String) : id ? [String(id)] : [];
      if (!idList.length) return res.status(400).json({ success: false, message: "id is required" });

      const users: any[] = await StaffUser.find({ _id: { $in: idList } });
      if (!users.length) return res.status(404).json({ success: false, message: "User not found" });

      for (const u of users) {
        u.isActive = !!isActive;
        await u.save();
        await syncLinkedAccount(u.linkedAccountType, u.linkedAccountId, { isActive: !!isActive });
      }

      return res.status(200).json({
        success: true,
        updated: users.length,
        user: Array.isArray(ids) ? undefined : sanitize(users[0]),
      });
    } catch (err: any) {
      console.log("STAFF USERS PATCH ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = str(req.query.id || req.body?.id);
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const user: any = await StaffUser.findById(id);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      // A linked Manager may already have agents/managers reporting to it —
      // deleting it would leave them pointing at nothing. Make the admin
      // reassign them (or just deactivate this user) instead.
      if (user.linkedAccountType === "Manager" && user.linkedAccountId) {
        const mgr: any = await Manager.findById(user.linkedAccountId).select("managerId").lean();
        const agentRefs = [String(user.linkedAccountId), mgr?.managerId].filter(Boolean);
        const [agents, managers] = await Promise.all([
          Agent.countDocuments({ assignedTo: { $in: agentRefs } }),
          Manager.countDocuments({ assignedTo: user.linkedAccountId }),
        ]);
        if (agents + managers > 0) {
          return res.status(400).json({
            success: false,
            message: `This manager has ${agents} agent(s) and ${managers} manager(s) assigned — reassign them or deactivate the user instead`,
          });
        }
        await Manager.findByIdAndDelete(user.linkedAccountId);
      }
      if (user.linkedAccountType === "Admin" && user.linkedAccountId) {
        await Admin.findByIdAndDelete(user.linkedAccountId);
      }

      await user.deleteOne();
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("STAFF USERS DELETE ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
