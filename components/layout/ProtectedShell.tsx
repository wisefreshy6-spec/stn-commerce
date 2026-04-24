import Link from "next/link";
import {
  Home,
  Settings,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

type ProtectedShellProps = {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
};

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Security",
    href: "/auth/set-password",
    icon: ShieldCheck,
  },
  {
    title: "Complete profile",
    href: "/auth/complete-profile",
    icon: UserCircle2,
  },
  {
  title: "Data requests",
  href: "/admin/data-requests",
  icon: ShieldCheck,
},
];

export default function ProtectedShell({
  title,
  subtitle,
  badge = "Protected area",
  children,
}: ProtectedShellProps) {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[32px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-sm font-black text-white shadow-lg shadow-orange-500/25">
              STN
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-950">
                STN Commerce
              </div>
              <div className="text-xs text-slate-500">
                Customer workspace
              </div>
            </div>
          </Link>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Navigation
            </div>

            <nav className="mt-3 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950"
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-6">
            <LogoutButton />
          </div>
        </aside>

        <section className="space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-8 sm:p-10">
                <div className="inline-flex rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700">
                  {badge}
                </div>

                <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {title}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {subtitle}
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white sm:p-10">
                <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white">
                  STN workspace
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-bold">Consistent workspace</h2>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      Dashboard, settings, and account tools now share one cleaner protected layout style.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-bold">Secure controls</h2>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      Logout, provider status, password controls, and onboarding paths stay easy to reach.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}