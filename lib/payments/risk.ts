export type PaymentRiskInput = {
  amount: number;
  paymentMethod: "CASH" | "MPESA" | "CARD" | "PAYPAL";
  accountName?: string;
  cardholderName?: string;
};

export type PaymentRiskResult = {
  allow: boolean;
  requiresReview: boolean;
  reasons: string[];
};

const HIGH_VALUE_REVIEW_LIMIT = 50000;
const CASH_LIMIT = 20000;

function normalizeName(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function assessPaymentRisk(input: PaymentRiskInput): PaymentRiskResult {
  const reasons: string[] = [];

  if (input.amount >= HIGH_VALUE_REVIEW_LIMIT) {
    reasons.push("Order is KES 50,000 or above and requires admin/system review.");
  }

  if (input.amount >= CASH_LIMIT && input.paymentMethod === "CASH") {
    return {
      allow: false,
      requiresReview: false,
      reasons: ["Orders of KES 20,000 and above cannot use cash/pay on delivery."],
    };
  }

  if (input.paymentMethod === "CARD" && input.cardholderName) {
    const accountParts = normalizeName(input.accountName);
    const cardParts = normalizeName(input.cardholderName);

    const hasSharedName = cardParts.some((part) => accountParts.includes(part));

    if (accountParts.length > 0 && cardParts.length > 0 && !hasSharedName) {
      reasons.push(
        "Cardholder name does not appear to match the account owner name."
      );
    }
  }

  return {
    allow: true,
    requiresReview: reasons.length > 0,
    reasons,
  };
}