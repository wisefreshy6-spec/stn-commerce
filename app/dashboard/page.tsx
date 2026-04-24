import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Headset,
  Settings,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import ProtectedShell from "@/components/layout/ProtectedShell";

const quickActions = [
  {
    title: "Account settings",
    description: "Manage your profile, provider, password, and account details.",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Support",
    description: "Reach support and manage help requests when needed.",
    href: "/contact",
    icon: Headset,
  },
  {
    title: "Orders",
    description: "Order tools will appear here later as the platform expands.",
    href: "#",
    icon: ShoppingBag,
  },
  {
    title: "Security",
    description: "Password, verification, and provider controls live here.",
    href: "/auth/set-password",
    icon: ShieldCheck,
  },
];

export default function DashboardPage() {
  return (
    <ProtectedShell
      badge="Customer dashboard"
      title="Welcome to your dashboard."
      subtitle="This is your protected customer area. As the platform grows, this space will hold your orders, saved details, support history, and account tools in one place."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100">
                <Icon className="h-5 w-5 text-orange-700" />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-950">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              {item.href !== "#" ? (
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Open <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              ) : (
                <div className="mt-4 text-sm font-medium text-slate-400">
                  Coming later
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100">
            <CreditCard className="h-5 w-5 text-orange-700" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            Future billing tools
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Payment methods, invoices, subscriptions, and related billing tools
            can be added here later without redesigning the protected area.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100">
            <ShoppingBag className="h-5 w-5 text-orange-700" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            Order workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            As your stores grow, this is where order history, delivery status,
            saved carts, and product activity can live in one consistent layout.
          </p>
        </div>
      </section>
    </ProtectedShell>
  );
}