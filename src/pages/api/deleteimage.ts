import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/dbConnect";
import Image from "@/models/Home";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    await connectDB();

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Image ID is required" });
    }

    const deletedImage = await Image.findByIdAndDelete(id);

    if (!deletedImage) {
      return res
        .status(404)
        .json({ success: false, error: "Image not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}
