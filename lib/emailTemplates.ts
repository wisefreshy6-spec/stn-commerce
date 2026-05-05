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