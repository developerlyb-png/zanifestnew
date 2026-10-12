import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import SellerProfile from "@/models/SellerProfile";

export const config = {
  api: {
    bodyParser: {
      // 4 image uploads (logo, signature, stamp, officer signature), base64
      // encoded — headroom over the ~2MB-per-file cap enforced client-side.
      sizeLimit: "15mb",
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

// List rows never need the embedded image bytes — only the edit form does.
const LIST_PROJECTION = {
  "companyLogo.data": 0,
  "signatureImage.data": 0,
  "principalOfficerStamp.data": 0,
  "principalOfficerSignature.data": 0,
};

const REQUIRED_TOP = [
  "companyName",
  "pan",
  "gstin",
  "contactPerson",
  "email",
  "phone",
  "mobile",
  "website",
  "principalOfficerName",
];
const REQUIRED_ADDRESS = ["line1", "pincode", "city", "state"];
const REQUIRED_BANK = ["accountName", "accountNumber", "ifscCode", "bankName", "branch"];
const REQUIRED_FILES = ["companyLogo", "signatureImage", "principalOfficerStamp", "principalOfficerSignature"];

function validate(b: any): string | null {
  for (const f of REQUIRED_TOP) {
    if (!String(b?.[f] || "").trim()) return `${f} is required`;
  }
  for (const f of REQUIRED_ADDRESS) {
    if (!String(b?.registeredAddress?.[f] || "").trim()) return `Registered address ${f} is required`;
  }
  if (!b?.useRegisteredAsCorporate) {
    for (const f of REQUIRED_ADDRESS) {
      if (!String(b?.corporateAddress?.[f] || "").trim()) return `Corporate address ${f} is required`;
    }
  }
  if (!String(b?.coinSection || "").trim()) return "Coins section is required";
  if (b?.coinValueInr === undefined || b?.coinValueInr === null || b?.coinValueInr === "") {
    return "Coin value (INR) is required";
  }
  if (!String(b?.invoiceSeries || "").trim()) return "Invoice series is required";
  for (const f of REQUIRED_BANK) {
    if (!String(b?.bank?.[f] || "").trim()) return `Bank ${f} is required`;
  }
  for (const f of REQUIRED_FILES) {
    if (!b?.[f]?.data) return `${f} is required`;
  }
  return null;
}

function buildDoc(b: any, adminName: string, isEdit: boolean) {
  return {
    companyName: String(b.companyName).trim(),
    irdaLicenseNo: String(b.irdaLicenseNo || "").trim(),
    licenseExpiryDate: b.licenseExpiryDate || undefined,
    pan: String(b.pan).trim(),
    gstin: String(b.gstin).trim(),
    cin: String(b.cin || "").trim(),
    contactPerson: String(b.contactPerson).trim(),
    email: String(b.email).trim(),
    phone: String(b.phone).trim(),
    mobile: String(b.mobile).trim(),
    website: String(b.website).trim(),

    registeredAddress: {
      line1: String(b.registeredAddress?.line1 || "").trim(),
      line2: String(b.registeredAddress?.line2 || "").trim(),
      pincode: String(b.registeredAddress?.pincode || "").trim(),
      city: String(b.registeredAddress?.city || "").trim(),
      state: String(b.registeredAddress?.state || "").trim(),
    },
    useRegisteredAsCorporate: b.useRegisteredAsCorporate !== false,
    corporateAddress: b.useRegisteredAsCorporate
      ? undefined
      : {
          line1: String(b.corporateAddress?.line1 || "").trim(),
          line2: String(b.corporateAddress?.line2 || "").trim(),
          pincode: String(b.corporateAddress?.pincode || "").trim(),
          city: String(b.corporateAddress?.city || "").trim(),
          state: String(b.corporateAddress?.state || "").trim(),
        },

    coinSection: String(b.coinSection).trim(),
    coinValueInr: Number(b.coinValueInr) || 0,

    invoiceSeries: String(b.invoiceSeries).trim(),
    lastSequenceUsed: Number(b.lastSequenceUsed) || 0,

    bank: {
      accountName: String(b.bank?.accountName || "").trim(),
      accountNumber: String(b.bank?.accountNumber || "").trim(),
      ifscCode: String(b.bank?.ifscCode || "").trim(),
      bankName: String(b.bank?.bankName || "").trim(),
      branch: String(b.bank?.branch || "").trim(),
    },
    showBankDetailsOnInvoice: b.showBankDetailsOnInvoice !== false,

    companyLogo: b.companyLogo,
    signatureImage: b.signatureImage,
    principalOfficerName: String(b.principalOfficerName).trim(),
    principalOfficerStamp: b.principalOfficerStamp,
    principalOfficerSignature: b.principalOfficerSignature,

    isDefault: !!b.isDefault,
    ...(isEdit ? { updatedBy: adminName } : { createdBy: adminName }),
  };
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
      const { id } = req.query;
      if (id) {
        const profile = await SellerProfile.findById(String(id));
        if (!profile) return res.status(404).json({ success: false, message: "Seller profile not found" });
        return res.status(200).json({ success: true, profile });
      }
      const profiles = await SellerProfile.find({}, LIST_PROJECTION).sort({ isDefault: -1, createdAt: -1 }).lean();
      return res.status(200).json({ success: true, profiles });
    } catch (err: any) {
      console.log("SELLER PROFILES GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const invalid = validate(req.body);
      if (invalid) return res.status(400).json({ success: false, message: invalid });

      const doc = buildDoc(req.body, adminName, false);
      if (doc.isDefault) {
        await SellerProfile.updateMany({}, { $set: { isDefault: false } });
      }
      const profile = await SellerProfile.create(doc);
      return res.status(201).json({ success: true, profile });
    } catch (err: any) {
      console.log("SELLER PROFILES POST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = String(req.body?.id || "");
      if (!id) return res.status(400).json({ success: false, message: "Id is required" });

      const invalid = validate(req.body);
      if (invalid) return res.status(400).json({ success: false, message: invalid });

      const doc = buildDoc(req.body, adminName, true);
      if (doc.isDefault) {
        await SellerProfile.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
      }
      const profile = await SellerProfile.findByIdAndUpdate(id, doc, { new: true });
      if (!profile) return res.status(404).json({ success: false, message: "Seller profile not found" });
      return res.status(200).json({ success: true, profile });
    } catch (err: any) {
      console.log("SELLER PROFILES PUT ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
