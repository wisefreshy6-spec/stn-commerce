import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-bold text-orange-700">
          ← Back home
        </Link>

        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Refund Policy
        </h1>

        <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700">
          <p>
            Non-food items may be reviewed for refund or return within 7 days,
            provided the item is unused, in acceptable condition, and the issue
            can be verified.
          </p>

          <p>
            Food items are generally not refundable once delivered or collected,
            except where there is a verified issue with the order.
          </p>

          <p>
            Orders can only be cancelled before processing starts. Once an order
            is marked as processing, awaiting delivery, delivered, or closed,
            cancellation may be blocked.
          </p>

          <p>
            Customers should include their invoice number when contacting
            support about refunds or order issues.
          </p>
        </div>
      </section>
    </main>
  );
}