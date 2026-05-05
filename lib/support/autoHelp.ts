type AutoHelpResponse = {
  matched: boolean;
  reply: string;
  suggestions?: string[];
};

export function getAutoHelpResponse(input: string): AutoHelpResponse {
  const text = input.toLowerCase();

  // 🔹 ORDER TRACKING
  if (text.includes("track") || text.includes("where is my order")) {
    return {
      matched: true,
      reply:
        "You can track your order from your Orders page. Use your invoice number or open the order to see its current status (Processing, Awaiting Delivery, Delivered).",
    };
  }

  // 🔹 DELIVERY
  if (text.includes("delivery") || text.includes("pickup")) {
    return {
      matched: true,
      reply:
        "Orders are delivered to G4S pickup stations based on your selected location. You will receive a notification once your order is ready for pickup.",
    };
  }

  // 🔹 CANCEL
  if (text.includes("cancel")) {
    return {
      matched: true,
      reply:
        "You can cancel your order only before it is marked as PROCESSING. Once processing starts, cancellation is disabled.",
    };
  }

  // 🔹 REFUND
  if (text.includes("refund")) {
    return {
      matched: true,
      reply:
        "Non-food items can be returned within 7 days. Food items are not eligible for refund once delivered.",
    };
  }

  // 🔹 PAYMENT
  if (text.includes("payment") || text.includes("pay")) {
    return {
      matched: true,
      reply:
        "We support Cash, M-Pesa, PayPal, and Card payments. Ensure payment is completed before order processing begins.",
    };
  }

  return {
    matched: false,
    reply: "",
    suggestions: [
      "Track my order",
      "Delivery information",
      "Cancel order",
      "Refund policy",
      "Payment methods",
    ],
  };
}