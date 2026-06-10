import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import dbConnect from "@/lib/dbConnect";

import IssuedPolicy from "@/models/IssuedPolicy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {

    await dbConnect();

    const policies =
      await IssuedPolicy.find()
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({

      success: true,

      data: policies,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch policies",

    });

  }

}