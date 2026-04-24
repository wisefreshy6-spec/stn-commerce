import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Headset,
  ShieldCheck,
  Users,
} from "lucide-react";
import ProtectedShell from "@/components/layout/ProtectedShell";

const adminCards = [
  {
    title: "Data requests",
    description:
      "Review customer account data export requests and update their processing status.",
    href: "/admin/data-requests",
    icon: FileText,
  },
  {
    title: "Support queue",
    description:
      "Support ticket handling will live here once we build the ticket review tools.",
    href: "#",
    icon: Headset,
  },
  {
    title: "User management",
    description:
      "User status, suspensions, roles, and account controls can be managed here later.",
    href: "#",
    icon: Users,
  },
  {
    title: "Security review",
    description:
      "Future security logs, account flags, and suspicious activity checks can live here.",
    href: "#",
    icon: ShieldCheck,
  },
];

export default function AdminPage() {
  return (
    <ProtectedShell
      badge="Admin workspace"
      title="Admin control center"
      subtitle="Manage operational tasks, support actions, customer requests, and future security controls from one protected workspace."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {adminCards.map((item) => {
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

      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Current admin tools
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          The first live admin tool is the customer data request review page.
          Next, we can add support ticket review, user management, and role
          controls step by step.
        </p>

        <div className="mt-6">
          <Link
            href="/admin/data-requests"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
          >
            Review data requests <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </ProtectedShell>
  );
}