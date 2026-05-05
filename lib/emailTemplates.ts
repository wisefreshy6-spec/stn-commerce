import { baseEmailTemplate } from "@/lib/email";

export function verificationEmailTemplate({
  name,
  verifyUrl,
}: {
  name: string;
  verifyUrl: string;
}) {
  return baseEmailTemplate({
    title: "Verify your STN Commerce account",
    preview: `Hi ${name}, please verify your email to activate your account.`,
    body: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for creating your STN Commerce account.</p>
      <p>Click the button below to verify your email address.</p>
    `,
    buttonText: "Verify email",
    buttonUrl: verifyUrl,
  });
}

export function loginOtpEmailTemplate({
  name,
  code,
}: {
  name: string;
  code: string;
}) {
  return baseEmailTemplate({
    title: "Your STN Commerce login code",
    preview: `Hi ${name}, use this code to complete login.`,
    body: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Use the code below to complete your login.</p>

      <div style="letter-spacing:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:22px 0;text-align:center;font-size:32px;font-weight:900;color:#ea580c;">
        ${code}
      </div>

      <p>This code expires in 10 minutes. If you did not try to log in, ignore this email.</p>
    `,
  });
}

export function passwordResetEmailTemplate({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) {
  return baseEmailTemplate({
    title: "Reset your STN Commerce password",
    preview: `Hi ${name}, use this secure link to reset your password.`,
    body: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your STN Commerce password.</p>
      <p>Click the button below to choose a new password. This link expires in 30 minutes.</p>
    `,
    buttonText: "Reset password",
    buttonUrl: resetUrl,
  });
}

export function orderReceiptEmailTemplate({
  name,
  invoiceNumber,
  orderUrl,
  total,
  paymentMethod,
  paymentStatus,
}: {
  name: string;
  invoiceNumber: string;
  orderUrl: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
}) {
  return baseEmailTemplate({
    title: "Your STN Commerce receipt",
    preview: `Receipt for order ${invoiceNumber}.`,
    body: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your order has been received successfully.</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;margin:18px 0;">
        <p style="margin:0 0 8px;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p style="margin:0 0 8px;"><strong>Total:</strong> ${total}</p>
        <p style="margin:0 0 8px;"><strong>Payment method:</strong> ${paymentMethod}</p>
        <p style="margin:0;"><strong>Payment status:</strong> ${paymentStatus}</p>
      </div>

      <p>You can open your invoice to view full items, delivery details, and order progress.</p>
    `,
    buttonText: "Open invoice",
    buttonUrl: orderUrl,
  });
}

export function paymentConfirmedEmailTemplate({
  name,
  invoiceNumber,
  orderUrl,
  total,
}: {
  name: string;
  invoiceNumber: string;
  orderUrl: string;
  total: string;
}) {
  return baseEmailTemplate({
    title: "Payment confirmed",
    preview: `Payment confirmed for ${invoiceNumber}.`,
    body: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We have confirmed your payment for order <strong>${invoiceNumber}</strong>.</p>

      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:16px;margin:18px 0;color:#166534;">
        <p style="margin:0;"><strong>Total paid:</strong> ${total}</p>
      </div>

      <p>Your order is now being processed.</p>
    `,
    buttonText: "View order",
    buttonUrl: orderUrl,
  });
}