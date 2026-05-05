export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-lg font-black text-white">
          STN
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
          STN Commerce is under maintenance
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          We are currently updating and testing the platform to improve your
          shopping experience. Some actions are temporarily unavailable.
        </p>

        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
          For more information, contact support@stncommerce.com
        </div>
      </section>
    </main>
  );
}