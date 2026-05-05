import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "STN Commerce";

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || subject,
  });
}

export function baseEmailTemplate({
  title,
  preview,
  body,
  buttonText,
  buttonUrl,
}: {
  title: string;
  preview: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  return `
  <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:24px;padding:28px;border:1px solid #e2e8f0;">
        <div style="display:inline-block;background:#ffedd5;color:#c2410c;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;">
          STN Commerce
        </div>

        <h1 style="margin:24px 0 8px;font-size:28px;line-height:1.2;color:#020617;">
          ${title}
        </h1>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
          ${preview}
        </p>

        <div style="font-size:14px;line-height:1.8;color:#334155;">
          ${body}
        </div>

        ${
          buttonText && buttonUrl
            ? `
              <div style="margin-top:28px;">
                <a href="${buttonUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:14px 18px;border-radius:16px;font-weight:700;font-size:14px;">
                  ${buttonText}
                </a>
              </div>
            `
            : ""
        }

        <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;">
          This email was sent by STN Commerce. If you did not request this, you can ignore it.
        </div>
      </div>
    </div>
  </div>
  `;
}