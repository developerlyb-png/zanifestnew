import nodemailer from "nodemailer";

interface EmailAttachment {
  filename: string;
  content: Buffer;
  cid: string; // referenced in html as <img src="cid:THIS_VALUE">
}

interface EmailProps {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export const sendEmail = async ({ to, subject, html, attachments }: EmailProps): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_PASS as string,
      },
    });

    await transporter.sendMail({
      from: `"Zanifest" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
};
