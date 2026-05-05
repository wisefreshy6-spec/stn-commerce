import Link from "next/link";
import { Hammer } from "lucide-react";

export default function HardwarePage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl rounded-[32px] border border-white/50 bg-white/90 p-8 text-center shadow-xl ring-1 ring-slate-200/70 backdrop-blur sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100">
          <Hammer className="h-7 w-7 text-orange-700" />
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Hardware Store
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Coming Soon! We are preparing the hardware section for tools,
          construction items, electricals, plumbing, and contractor requests.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back home
          </Link>

          <Link
            href="/online-store"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Visit online store
          </Link>
        </div>
      </section>
    </main>
  );
}