import type { NextApiRequest, NextApiResponse } from "next";

// Bajaj policy schedule (kit "POLICY PDF SCHEDULE DOWNLOAD"): POST
// {userid, password, pdfmode: "WS_POLICY_PDF", policynum} returns the PDF as
// base64. GET ?policyNo=… streams the PDF; add &format=json to only check
// that Bajaj has the policy (used to confirm a payment return).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const policyNo = String(req.query.policyNo || "").trim();
  if (!/^[A-Z0-9-]{8,40}$/i.test(policyNo)) {
    return res.status(400).json({ success: false, message: "A valid policyNo is required" });
  }
  const asJson = req.query.format === "json";

  try {
    const response = await fetch(process.env.BAJAJ_PDF_URL || "", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userid: process.env.BAJAJ_USERID,
        password: process.env.BAJAJ_PASSWORD,
        pdfmode: "WS_POLICY_PDF",
        policynum: policyNo,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const text = await response.text();

    // Seen live on UAT: {"errorcode","errormsg","policynum","fileByteObj"} —
    // the PDF is base64 in fileByteObj, null on error.
    let base64 = "";
    let bajajMessage = "";
    try {
      const data = JSON.parse(text);
      base64 = typeof data.fileByteObj === "string" ? data.fileByteObj : "";
      // Bajaj prefixes the real reason with a Java stack summary; keep the reason
      const msg = String(data.errormsg || "");
      bajajMessage = (msg.match(/Validation Error Mesg : (.*)$/)?.[1] || msg).slice(0, 300);
    } catch {
      bajajMessage = "Bajaj returned a non-JSON response";
    }

    const pdf = Buffer.from(base64, "base64");
    const isPdf = pdf.subarray(0, 4).toString() === "%PDF";
    if (!response.ok || !isPdf) {
      console.log("BAJAJ 4W PDF FAILED", response.status, text.slice(0, 500));
      return res.status(asJson ? 200 : 502).json({
        success: false,
        message: bajajMessage || "Bajaj did not return a policy PDF",
      });
    }

    if (asJson) return res.status(200).json({ success: true, policyNo });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${policyNo}.pdf"`);
    return res.status(200).send(pdf);
  } catch (err: any) {
    console.log("BAJAJ 4W PDF ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
