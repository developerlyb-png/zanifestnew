import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Same OAuth requirement confirmed for create-quote/select-plan — Retail
// Health rejects x-api-key-only requests with a plain 401.
async function getZunoToken() {
  const basic = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`,
  ).toString("base64");

  const tokenResponse = await axios.post(
    process.env.ZUNO_TOKEN_URL!,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": process.env.ZUNO_X_API_KEY!,
      },
    },
  );

  return tokenResponse.data.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  // Declared outside the try block so the catch handler can echo back
  // exactly what we sent Zuno — the last two failures needed this pasted
  // from terminal scrollback, which kept getting lost.
  let payload: any;

  try {
    const b = req.body;
    console.log("CREATE-PROPOSAL FRONTEND BODY", JSON.stringify(b, null, 2));

    if (!b.quoteId || !Array.isArray(b.members) || !b.members.length) {
      return res
        .status(400)
        .json({ message: "quoteId and members are required" });
    }

    // CreateProposalRequest_members' real field name is "full_name" (its
    // own "required" list says "fullname" but the schema's properties
    // object — the thing that actually gets validated — only defines
    // "full_name". Confirmed live against Zuno's UAT: blood_group must be
    // plain "A+"/"O-" (their own documented example "B+ve" is rejected as
    // "not a valid choice"), relation/nominee_relation must be lowercase
    // ("Sister" is rejected, "brother" isn't), and the real field name is
    // has_made_any_claim — their own "has_made_any_calim" doc example was
    // a typo that gets silently ignored (server reports the field as
    // still required).
    const normalizeRelation = (rel: string) =>
      (rel || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

    const members = b.members.map((m: any) => ({
      id: m.id,
      full_name: m.fullName,
      relation: normalizeRelation(m.relation),
      sum_insured: m.sumInsured,
      gender: m.gender,
      dob: m.dob,
      blood_group: m.bloodGroup,
      height: String(m.height || ""),
      weight: String(m.weight || ""),
      nominee_name: m.nomineeName,
      nominee_dob: m.nomineeDob,
      nominee_relation: normalizeRelation(m.nomineeRelation),
      appointee_name: m.appointeeName || "",
      // Confirmed live: null is what Zuno actually wants here when no
      // appointee applies — "" caused a "Date has wrong format" 400 on a
      // 2-member floater request. (An earlier guess that null caused the
      // raw-HTML 500 was wrong; reverted.)
      appointee_dob: m.appointeeDob || null,
      appointee_relation: m.appointeeRelation
        ? normalizeRelation(m.appointeeRelation)
        : "",
      disease_name: (m.diseases || []).map((name: string) => ({ name })),
      has_past_medical_history: Boolean(m.hasPastMedicalHistory),
      past_medical_history_details: m.pastMedicalHistoryDetails || "",
      is_allergic: Boolean(m.isAllergic),
      allergy_details: m.allergyDetails || "",
      has_made_any_claim: Boolean(m.hasMadeAnyClaim),
      claim_details: m.claimDetails || "",
      covered_under_other_health_company: Boolean(
        m.coveredUnderOtherHealthCompany,
      ),
      other_company_name: m.otherCompanyName || "",
    }));

    // Confirmed live: Zuno rejects create-proposal outright with "Please
    // make sure proposer dob is same as self member dob." — the proposer
    // IS the self member, so force it rather than trust two separately
    // editable form fields to stay in sync.
    const selfMember = b.members.find(
      (m: any) => normalizeRelation(m.relation) === "self",
    );

    payload = {
      source: process.env.ZUNO_SOURCE_ID,
      quote_id: b.quoteId,
      members,
      proposal_details: {
        name: b.proposer?.name,
        dob: selfMember?.dob || b.proposer?.dob,
        mobile_number: b.proposer?.mobile,
        email: b.proposer?.email,
        gender: b.proposer?.gender,
        proposer_pan_number: b.proposer?.panNumber || "",
        proposer_aadhar_number: b.proposer?.aadharNumber || "",
        proposer_passport_number: "",
      },
      address_details: {
        permanent_address: b.address?.permanentAddress,
        permanent_state: b.address?.permanentState,
        permanent_city: b.address?.permanentCity,
        permanent_pincode: b.address?.permanentPincode,
        is_same_address: Boolean(b.address?.isSameAddress),
        correspondance_address: b.address?.isSameAddress
          ? b.address?.permanentAddress
          : b.address?.correspondanceAddress,
        correspondance_state: b.address?.isSameAddress
          ? b.address?.permanentState
          : b.address?.correspondanceState,
        correspondance_city: b.address?.isSameAddress
          ? b.address?.permanentCity
          : b.address?.correspondanceCity,
        correspondance_pincode: b.address?.isSameAddress
          ? b.address?.permanentPincode
          : b.address?.correspondancePincode,
      },
    };

    console.log(
      "ZUNO CREATE-PROPOSAL PAYLOAD",
      JSON.stringify(payload, null, 2),
    );

    const url = `${process.env.ZUNO_HEALTH_URL}/create-proposal`;
    const token = await getZunoToken();

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_HEALTH_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "ZUNO CREATE-PROPOSAL RESPONSE",
      JSON.stringify(response.data, null, 2),
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.log(
      "ZUNO CREATE-PROPOSAL ERROR",
      JSON.stringify(
        {
          zunoError: error.response?.data || error.message,
          sentPayload: payload,
        },
        null,
        2,
      ),
    );

    return res.status(error.response?.status || 500).json({
      message: "Create proposal failed",
      error: error.response?.data,
      sentPayload: payload,
    });
  }
}
