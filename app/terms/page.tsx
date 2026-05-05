import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-bold text-orange-700">
          ← Back home
        </Link>

        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Terms and Conditions
        </h1>

        <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700">
          <p>
            By using STN Commerce, you agree to use the platform responsibly and
            provide accurate account, order, delivery, and payment information.
          </p>

          <p>
            Orders may be accepted, processed, cancelled, or rejected depending
            on stock availability, payment confirmation, delivery limitations,
            or suspected misuse.
          </p>

          <p>
            Users must not attempt to manipulate prices, stock, orders, checkout
            flows, support tickets, or admin-only systems.
          </p>

          <p>
            STN Commerce may update these terms as the platform grows.
          </p>
        </div>
      </section>
    </main>
  );
}