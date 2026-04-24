import Link from "next/link";
import {
  ArrowRight,
  Gem,
  Hammer,
  ShieldCheck,
  ShoppingBag,
  Users,
  UtensilsCrossed,
} from "lucide-react";

const businessLines = [
  {
    title: "Fast Food",
    href: "/fast-food",
    description:
      "Meals, snacks, combos, and quick ordering built for delivery and pickup.",
    icon: UtensilsCrossed,
  },
  {
    title: "Hardware Store",
    href: "/hardware",
    description:
      "Tools, plumbing, electricals, building materials, and contractor requests.",
    icon: Hammer,
  },
  {
    title: "Online Store",
    href: "/online-store",
    description:
      "General shopping with categories, search, cart, and a smooth future checkout flow.",
    icon: ShoppingBag,
  },
  {
    title: "Exclusive Store",
    href: "/exclusive-store",
    description:
      "Premium products with a more refined and elegant brand experience.",
    icon: Gem,
  },
];

const highlights = [
  {
    title: "One shared account",
    description: "Customers use one account across all business sections.",
    icon: Users,
  },
  {
    title: "Security first",
    description:
      "Email verification first, then later phone OTP and stronger protection.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-sm font-black text-white shadow-lg shadow-orange-500/25">
              STN
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">
                STN Commerce
              </div>
              <div className="text-xs text-slate-500">
                Food, retail, premium, and digital commerce
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/auth/register"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Sign up
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Log in
            </Link>
            <Link
              href="/contact"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Contact us
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700">
            Clean launch first · Full platform later
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            One modern platform for food, hardware, online shopping, and premium
            products.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Start with a polished website that works on phones, tablets,
            laptops, and large screens, then grow it into a full app with
            accounts, support, admin, and team control.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/30 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
            Built for growth
          </div>

          <h2 className="mt-5 text-2xl font-black">
            Structure it right from day one.
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/80">
            Separate customer, admin, team, and support areas early so the
            system stays clean as orders, staff, and users grow.
          </p>

          <div className="mt-6 space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <Icon className="h-5 w-5 text-orange-300" />
                  <div className="mt-3 font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-white/70">
                    {item.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
              Business sections
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              One brand, four strong categories
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Launch one trusted brand first instead of building four disconnected
            systems too early.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {businessLines.map((line) => {
            const Icon = line.icon;

            return (
              <div
                key={line.title}
                className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100">
                  <Icon className="h-5 w-5 text-orange-700" />
                </div>

                <h3 className="mt-4 text-xl font-bold">{line.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {line.description}
                </p>

                <Link
                  href={line.href}
                  className="mt-4 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  View section <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}