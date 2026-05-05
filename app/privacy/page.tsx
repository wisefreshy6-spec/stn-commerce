import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-bold text-orange-700">
          ← Back home
        </Link>

        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Privacy Policy
        </h1>

        <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700">
          <p>
            STN Commerce collects account details, contact information, order
            records, support messages, and payment-related references needed to
            operate the platform.
          </p>

          <p>
            We use this information to manage accounts, process orders, support
            customers, improve security, and prevent misuse.
          </p>

          <p>
            Sensitive actions such as account changes, payment actions, and
            support handling may require verification.
          </p>

          <p>
            We do not intentionally expose customer information to unauthorized
            users. Admin and support access should be limited by role.
          </p>
        </div>
      </section>
    </main>
  );
}