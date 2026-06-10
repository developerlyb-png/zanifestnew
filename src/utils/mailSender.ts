import nodemailer from "nodemailer";

interface EmailProps {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailProps): Promise<boolean> => {
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
    });

    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
};
