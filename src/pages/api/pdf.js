import html_to_pdf from "html-pdf-node";

export default async function handler(req, res) {

  // 👇 URL se dynamic data lo
  const { name = "Guest", plan = "Basic Plan" } = req.query;

  // 👇 Dynamic HTML
  const html = `
    <h1>Zanifest Insurance</h1>
    <p>Name: ${name}</p>
    <p>Plan: ${plan}</p>
    <p>This is Dynamic PDF</p>
  `;

  const options = { format: "A4" };
  const file = { content: html };

  try {
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "PDF not generated" });
  }
}
