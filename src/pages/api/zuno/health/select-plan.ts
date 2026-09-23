import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Same OAuth requirement confirmed for create-quote — Retail Health
// rejects x-api-key-only requests with a plain 401.
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

  try {
    const b = req.body;
    console.log("SELECT-PLAN FRONTEND BODY", JSON.stringify(b, null, 2));

    if (!b.quote_id || !b.plan_name) {
      return res
        .status(400)
        .json({ message: "quote_id and plan_name are required" });
    }

    // members must carry the addon flags + id Zuno handed back from
    // create-quote's member_details — SelectPlanRequest_members requires
    // all of them (is_restoration_addon, is_critical_illness_addon, etc).
    const payload = {
      business_type: b.business_type || "fresh",
      policy_type: b.policy_type || "individual",
      total_si: String(b.total_si || "500000"),
      policy_tenure: Number(b.policy_tenure || 1),
      plan_name: b.plan_name,
      source: process.env.ZUNO_SOURCE_ID,
      quote_id: b.quote_id,
      members: (b.members || []).map((m: any) => ({
        id: m.id,
        relation: m.relation,
        sum_insured: m.sum_insured,
        dob: m.dob,
        is_restoration_addon: m.is_restoration_addon ?? false,
        is_critical_illness_addon: m.is_critical_illness_addon ?? false,
        is_recharge_addon: m.is_recharge_addon ?? false,
        is_health_241_addon: m.is_health_241_addon ?? false,
        is_voluntary_copay_addon: m.is_voluntary_copay_addon ?? false,
        is_employee_discount: m.is_employee_discount ?? false,
      })),
    };

    console.log("ZUNO SELECT-PLAN PAYLOAD", JSON.stringify(payload, null, 2));

    const url = `${process.env.ZUNO_HEALTH_URL}/select-plan`;
    const token = await getZunoToken();

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_HEALTH_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "ZUNO SELECT-PLAN RESPONSE",
      JSON.stringify(response.data, null, 2),
    );

    // Confirmed live: select-plan's response member_details drops the
    // "id" field entirely (create-quote's does include it) — the next
    // step, create-proposal, requires that same member id and crashes
    // with an unhandled-exception 500 (no useful error body) if it gets
    // a bogus one. Re-attach the real ids from what we just sent, since
    // Zuno preserves member order in the response.
    const responseData = response.data;
    if (Array.isArray(responseData?.data?.member_details)) {
      responseData.data.member_details = responseData.data.member_details.map(
        (m: any, idx: number) => ({
          ...m,
          id: payload.members[idx]?.id,
        }),
      );
    }

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.log(
      "ZUNO SELECT-PLAN ERROR",
      JSON.stringify(error.response?.data || error.message, null, 2),
    );

    return res.status(error.response?.status || 500).json({
      message: "Select plan failed",
      error: error.response?.data,
    });
  }
}
