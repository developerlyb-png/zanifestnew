import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import { FeedbackModel, ConfigModel, IFeedbackItem } from "@/models/feedback";

type Data = {
  success: boolean;
  data?: IFeedbackItem[] | IFeedbackItem;
  heading?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await dbConnect();
  const { method } = req;
  const { heading, _id, ...updateData } = req.body;

  try {
    switch (method) {
      case "GET": {
        const items = await FeedbackModel.find({}).sort({ createdAt: -1 });
        const config = await ConfigModel.findOne({ key: "feedbackHeading" });
        const currentHeading =
          config?.value || "What Our Customers Are Saying?";
        return res
          .status(200)
          .json({ success: true, data: items, heading: currentHeading });
      }

      case "POST": {
        const item = await FeedbackModel.create(req.body);
        return res.status(201).json({ success: true, data: item });
      }

      case "PUT": {
        // 🔹 Update Heading
        if (
          heading &&
          typeof heading === "string" &&
          Object.keys(req.body).length === 1
        ) {
          await ConfigModel.findOneAndUpdate(
            { key: "feedbackHeading" },
            { value: heading },
            { upsert: true, new: true }
          );
          return res
            .status(200)
            .json({ success: true, message: "Heading updated successfully" });
        }

        // 🔹 Update Feedback card
        if (!_id) {
          return res.status(400).json({
            success: false,
            message: "ID required for feedback card update",
          });
        }

        const updated = await FeedbackModel.findByIdAndUpdate(_id, updateData, {
          new: true,
          runValidators: true,
        });
        if (!updated) {
          return res
            .status(404)
            .json({ success: false, message: "Feedback not found" });
        }
        return res.status(200).json({ success: true, data: updated });
      }

      case "DELETE": {
        const { id } = req.body;
        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: "ID required for deletion" });
        }
        const deleted = await FeedbackModel.deleteOne({ _id: id });
        if (deleted.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Feedback not found" });
        }
        return res
          .status(200)
          .json({ success: true, message: "Feedback deleted successfully" });
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({
          success: false,
          message: `Method ${method} Not Allowed`,
        });
    }
  } catch (err: any) {
    console.error(err);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Server Error" });
  }
}
