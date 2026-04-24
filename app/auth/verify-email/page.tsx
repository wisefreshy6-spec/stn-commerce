import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200/70 sm:p-10">
        <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700">
          Verify your email
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Check your inbox to activate your account.
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          We have sent a verification link to your email address. Open the link
          from your email to verify your account, then come back and log in.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-bold text-slate-950">What happens next</h2>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>• Your account is created but not yet fully active.</li>
            <li>• You must verify your email before logging in.</li>
            <li>• After verification, you can access protected pages.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to login
          </Link>

          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to register
          </Link>
        </div>
      </div>
    </main>
  );
}