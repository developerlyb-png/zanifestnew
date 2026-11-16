import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import BajajCheckout from "@/models/BajajCheckout";
import IssuedPolicy from "@/models/IssuedPolicy";

// Server-side bookkeeping for Bajaj purchases: the checkout is saved when the
// proposal is priced/issued, and the IssuedPolicy is created when Bajaj's
// payment page returns with a policy number — no reliance on the browser.

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
// Bajaj's dd-Mon-yyyy -> Date
const fromBajajDate = (s: string) => {
  const m = String(s || "").match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  return m ? new Date(Date.UTC(+m[3], MONTHS[m[2].toUpperCase()], +m[1])) : undefined;
};

// The customer's account from the login cookie, if they're logged in
function loggedInUser(req: NextApiRequest) {
  try {
    const token = req.cookies.userToken;
    if (!token) return null;
    const d = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { id: d.id, email: d.email };
  } catch {
    return null;
  }
}

export async function saveBajajCheckout(args: {
  req: NextApiRequest;
  status: "priced" | "issued";
  vehicleClass: "4W" | "2W";
  transactionId: string;
  premiumBody: any; // the calculatemotorpremiumsig body that was priced
  product?: string;
  price?: { premium: number | null; netPremium: number | null; gst: number | null; idv: number | null };
  proposer: any;
}) {
  const { req, status, vehicleClass, transactionId, premiumBody, product, price, proposer } = args;
  if (!transactionId) return;
  const w = premiumBody?.weomotpolicyin || {};
  const user = loggedInUser(req);
  try {
    await dbConnect();
    await BajajCheckout.updateOne(
      { transactionId },
      {
        $set: {
          vehicleClass,
          status,
          ...(product ? { product } : {}),
          ...(price ? { premium: price.premium, netPremium: price.netPremium, gst: price.gst, idv: price.idv } : {}),
          termStart: fromBajajDate(w.termstartdate),
          termEnd: fromBajajDate(w.termenddate),
          isNew: Number(w.poltype) === 1,
          ...(user ? { userId: user.id, userEmail: user.email } : {}),
          customer: {
            fullName: `${proposer?.firstName || ""} ${proposer?.lastName || ""}`.trim(),
            email: proposer?.email || "",
            mobile: proposer?.mobile || "",
            address: [proposer?.address1, proposer?.city, proposer?.state, proposer?.pincode].filter(Boolean).join(", "),
          },
          vehicle: {
            number: w.registrationno || "",
            make: w.vehiclemake || "",
            model: [w.vehiclemodel, w.vehiclesubtype].filter(Boolean).join(" "),
          },
        },
      },
      { upsert: true }
    );
  } catch (e) {
    // Bookkeeping must never block the customer's purchase
    console.log("BAJAJ CHECKOUT SAVE ERROR", transactionId, e);
  }
}

// Payment went through but Bajaj sent no policy number: flag the checkout
// (with the payment reference) so it can be chased with Bajaj.
export async function markBajajPaidWithoutPolicy(transactionId: string, paymentRef: string) {
  await dbConnect();
  await BajajCheckout.updateOne(
    { transactionId, status: { $ne: "paid" } },
    { $set: { status: "paid_no_policy", ...(paymentRef ? { paymentRef } : {}) } }
  );
}

// Creates the IssuedPolicy for a paid Bajaj checkout. Idempotent: Bajaj may
// redirect twice or the customer may reload the result page.
export async function recordBajajPolicy(transactionId: string, policyNumber: string) {
  await dbConnect();
  const existing = await IssuedPolicy.findOne({ policyNumber }, { _id: 1 }).lean();
  if (existing) return { created: false, reason: "already recorded" };

  const c: any = await BajajCheckout.findOne({ transactionId }).lean();
  if (!c) return { created: false, reason: `no checkout saved for transaction ${transactionId}` };

  const now = new Date();
  const fallbackEnd = new Date(now);
  fallbackEnd.setFullYear(fallbackEnd.getFullYear() + 1);

  await IssuedPolicy.create({
    policyNumber,
    quoteNumber: transactionId,
    userId: c.userId,
    userEmail: c.userEmail || c.customer?.email,
    policyType: c.vehicleClass === "2W" ? "Two Wheeler Insurance" : "Car Insurance",
    insurer: "Bajaj Allianz General Insurance Company Limited",
    customer: c.customer,
    vehicle: { ...c.vehicle, vehicleType: c.vehicleClass === "2W" ? "Two Wheeler" : "Private Car" },
    premium: c.netPremium ?? c.premium,
    grossPremium: c.premium,
    transactionType: c.isNew ? "New" : "Rollover",
    status: "Active",
    startDate: c.termStart || now,
    endDate: c.termEnd || fallbackEnd,
  });
  await BajajCheckout.updateOne({ transactionId }, { $set: { status: "paid", policyNumber } });
  return { created: true };
}
