import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST allowed",
    });
  }

  try {

    console.log(
      "CREATE QUOTE REQUEST",
      JSON.stringify(req.body, null, 2)
    );

    // ===============================
    // CREATE PAYLOAD
    // ===============================

    const payload = {

      business_type: "fresh",

      policy_type: "floater",

      total_si: req.body.sumInsured || "500000",

      source: process.env.NEW_ZUNO_HEALTH_SOURCE,

      policy_tenure: 1,

      members: req.body.members.map((member: any) => ({

        relation: String(member.relation).toLowerCase(),

        sum_insured: req.body.sumInsured || "500000",

        dob: member.dob

      }))

    };

    console.log(
      "FINAL PAYLOAD",
      JSON.stringify(payload, null, 2)
    );

    // ===============================
    // API CALL
    // ===============================
console.log("URL:", `${process.env.NEW_ZUNO_HEALTH_URL}/create-quote`);

console.log("API KEY:", process.env.NEW_ZUNO_HEALTH_API_KEY);

console.log("SOURCE:", process.env.NEW_ZUNO_HEALTH_SOURCE);
    const response = await axios.post(

      `${process.env.NEW_ZUNO_HEALTH_URL}/create-quote`,

      payload,

      {

        headers: {

          "x-api-key":
            process.env.NEW_ZUNO_HEALTH_API_KEY,

          "Content-Type":
            "application/json"

        }

      }

    );

    console.log(
      "CREATE QUOTE RESPONSE",
      JSON.stringify(response.data, null, 2)
    );

    return res.status(200).json(response.data);

  }

  catch (error: any) {

    console.log(
      "CREATE QUOTE ERROR",
      JSON.stringify(
        error.response?.data || error.message,
        null,
        2
      )
    );

    return res.status(
      error.response?.status || 500
    ).json({

      success: false,

      message:
        error.response?.data?.message ||
        "Create Quote Failed",

      error:
        error.response?.data

    });

  }

}