import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Maps your React relations to Zuno's lowercase values.
// CONFIRM the full accepted list with Zuno — the sample only proves "self" and "spouse".
const relationMap: Record<string, string> = {
  self: "self",
  wife: "spouse",
  husband: "spouse",
  spouse: "spouse",
  father: "father",
  mother: "mother",
  son: "son",
  daughter: "daughter",
  "father-in-law": "father_in_law",
  "mother-in-law": "mother_in_law",
  grandfather: "grandfather",
  grandmother: "grandmother",
};

const mapRelation = (rel: string) => {
  const key = (rel || "").toLowerCase().trim();
  return relationMap[key] || key; // falls back to lowercased input
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
     console.log("USING KEY:", JSON.stringify(process.env.ZUNO_HEALTH_API_KEY));
    console.log("CREATE QUOTE FRONTEND BODY", req.body);

    const b = req.body;

    const getDobFromAge = (age: any) =>
      `${new Date().getFullYear() - Number(age)}-01-01`;

    const members =
      b.members && b.members.length > 0
        ? b.members
        : [{ relation: "self", age: b.age, dob: b.dob }];

    // ================= PAYLOAD (snake_case, per Postman) =================
    const payload = {
      business_type: "fresh",
      // single member -> individual, multiple -> floater. CONFIRM "individual" is accepted.
      policy_type: members.length > 1 ? "floater" : "individual",
      total_si: String(b.sumInsured || "500000"),
      source: process.env.ZUNO_SOURCE_ID,
      policy_tenure: Number(b.policyTenure || 1),
      members: members.map((m: any) => ({
        relation: mapRelation(m.relation || m.name),
        sum_insured: String(b.sumInsured || "500000"),
        dob: m.dob || getDobFromAge(m.age),
      })),
    };

    console.log("ZUNO CREATE-QUOTE PAYLOAD", JSON.stringify(payload, null, 2));

    const url = `${process.env.ZUNO_HEALTH_URL}/create-quote`;
    console.log("CALLING ZUNO URL", url);

    const response = await axios.post(url, payload, {
      headers: {
        "x-api-key": process.env.ZUNO_HEALTH_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "ZUNO CREATE-QUOTE RESPONSE",
      JSON.stringify(response.data, null, 2),
    );

    // Pass the raw response straight back for now — we'll shape `plans`
    // once we see the real response structure in the logs.
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.log(
      "ZUNO CREATE-QUOTE ERROR",
      JSON.stringify(error.response?.data || error.message, null, 2),
    );

    return res.status(error.response?.status || 500).json({
      message: "Create quote failed",
      error: error.response?.data,
    });
  }
}