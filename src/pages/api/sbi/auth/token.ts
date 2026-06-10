import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import qs from "qs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await axios.post(
      "https://devapi.hizuno.com/oauth2/token",
      qs.stringify({
        grant_type: "password",
      }),
      {
        auth: {
          username: "2210004926",
          password: "Boat@2026",
        },
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.log(error?.response?.data);

    return res.status(500).json({
      success: false,
      error: error?.response?.data || error.message,
    });
  }
}