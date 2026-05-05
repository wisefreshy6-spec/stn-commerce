import { NextResponse } from "next/server";

type HistoryItem = {
  message?: string;
};

type Body = {
  message?: string;
  history?: HistoryItem[];
};

export function buildSupportAiReply(messageInput: string, historyInput: HistoryItem[] = []) {
  const message = String(messageInput || "").toLowerCase();

  const recentContext = historyInput
    .slice(-5)
    .map((m) => String(m.message || "").toLowerCase())
    .join(" ");

  const combined = `${recentContext} ${message}`;

  let reply =
    "Thanks for reaching out. Support will review this and assist you shortly.";

  if (
    combined.includes("payment") ||
    combined.includes("paystack") ||
    combined.includes("mpesa") ||
    combined.includes("charged") ||
    combined.includes("deducted") ||
    combined.includes("paid") ||
    combined.includes("pending")
  ) {
    reply =
      "It looks like a payment-related issue. Please share your invoice number, payment method, amount paid, and transaction reference such as the M-Pesa code or Paystack reference. If money was deducted but the order still shows pending, support can verify it from payment records.";
  } else if (
    combined.includes("delivery") ||
    combined.includes("pickup") ||
    combined.includes("g4s") ||
    combined.includes("location")
  ) {
    reply =
      "For delivery or pickup help, please share your invoice number and selected pickup station. Once your order is marked ready or delivered, you can collect it from your selected G4S location.";
  } else if (
    combined.includes("refund") ||
    combined.includes("cancel") ||
    combined.includes("return")
  ) {
    reply =
      "Cancellation is usually allowed before processing starts. Refund review depends on payment status, order status, and product type. Please share your invoice number so support can check eligibility.";
  } else if (
    combined.includes("login") ||
    combined.includes("password") ||
    combined.includes("account") ||
    combined.includes("verify")
  ) {
    reply =
      "For account issues, confirm whether you signed up using Google or email/password. Password resets and sensitive profile changes may require email verification.";
  } else if (
    combined.includes("order") ||
    combined.includes("status") ||
    combined.includes("where is")
  ) {
    reply =
      "To check your order status, please provide your invoice number. Orders normally move from pending to processing, then to delivery or ready for pickup.";
  }

  return reply;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const reply = buildSupportAiReply(body.message || "", body.history || []);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Unable to prepare assistant reply." },
      { status: 500 }
    );
  }
}