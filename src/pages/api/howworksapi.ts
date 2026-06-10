import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import HowWorks from "@/models/howworks";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

// ---------------- TYPES ----------------
type Step = {
  name: string;
  desc: string;
  image: string;
};

type Service = {
  name: string;
  desc: string;
  image: string;
};

// ---------------- DEFAULTS ----------------
const DEFAULT_STEPS: Step[] = Array.from({ length: 3 }, () => ({
  name: "",
  desc: "",
  image: "",
}));

const DEFAULT_SERVICES: Service[] = Array.from({ length: 8 }, () => ({
  name: "",
  desc: "",
  image: "",
}));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    await dbConnect();

    const includeImages = req.query.includeImages === "true";

    // ================= GET =================
    if (req.method === "GET") {
      const projection = includeImages
        ? "mainHeading servicesHeading steps services -_id"
        : "mainHeading servicesHeading steps.name steps.desc services.name services.desc -_id";

      const data = await HowWorks.findOne({}, projection).lean();

      if (!data) {
        const created = await HowWorks.create({
          mainHeading: "",
          servicesHeading: "",
          steps: DEFAULT_STEPS,
          services: DEFAULT_SERVICES,
        });

        res.status(200).json({
          data: includeImages
            ? created
            : {
                mainHeading: created.mainHeading,
                servicesHeading: created.servicesHeading,
                steps: created.steps.map((s: Step) => ({
                  name: s.name,
                  desc: s.desc,
                })),
                services: created.services.map((s: Service) => ({
                  name: s.name,
                  desc: s.desc,
                })),
              },
        });
        return;
      }

      res.status(200).json({ data });
      return;
    }

    // ================= POST =================
    if (req.method === "POST") {
      const body = req.body as {
        mainHeading?: string;
        servicesHeading?: string;
        steps?: Step[];
        services?: Service[];
      };

      const updateData: any = {};
      if (typeof body.mainHeading === "string")
        updateData.mainHeading = body.mainHeading;
      if (typeof body.servicesHeading === "string")
        updateData.servicesHeading = body.servicesHeading;
      if (Array.isArray(body.steps)) updateData.steps = body.steps;
      if (Array.isArray(body.services)) updateData.services = body.services;

      await HowWorks.updateOne({}, { $set: updateData }, { upsert: true });

      res.status(200).json({ success: true });
      return;
    }

    // ================= METHOD NOT ALLOWED =================
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({
      error: "Method " + req.method + " Not Allowed",
    });
    return;

  } catch (error) {
    console.error("HowWorks API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}