import { EAST_AFRICA_COUNTRIES } from "@/lib/constants/countries";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
            Contact and support
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
            Reach us for orders, support, wholesale, or partnerships.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/80 sm:text-base">
            This page can later connect to support tickets, WhatsApp, order
            help, supplier discussions, and branch contacts.
          </p>

          <div className="mt-8 space-y-4 text-sm text-white/85">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Business email: support@yourdomain.com
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Phone / WhatsApp: +254 XXX XXX XXX
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Coverage: East Africa first, with country support expanding later.
            </div>
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200/70">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Send us a message
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Use this form for customer help, wholesale requests, team
              enquiries, or supplier communication.
            </p>
          </div>

          <form className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-slate-950"
                placeholder="Full name"
              />
              <input
                type="email"
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-slate-950"
                placeholder="Email address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-slate-950"
                placeholder="Phone number"
              />
              <select className="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-slate-950">
                {EAST_AFRICA_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <select className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-slate-950">
              <option value="">What do you need help with?</option>
              <option value="customer-support">Customer support</option>
              <option value="order-help">Order help</option>
              <option value="wholesale">Wholesale enquiry</option>
              <option value="supplier">Supplier / partnership</option>
              <option value="team">Team / operations</option>
            </select>

            <textarea
              className="min-h-[150px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
              placeholder="Tell us what you need"
            />

            <button
              type="submit"
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white hover:bg-slate-800"
            >
              Send message
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}