"use client";

import { useEffect, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Customer = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  newsletterSubscribed: boolean;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/customers");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load customers.");
        return;
      }

      setCustomers(data.users || []);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  return (
    <ProtectedShell
      badge="Admin customers"
      title="Customer contacts"
      subtitle="View emails and phone numbers for admin-approved communication only."
    >
      <section className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : customers.length === 0 ? (
          <p>No customers yet.</p>
        ) : (
          <div className="space-y-4">
            {customers.map((c) => {
              const name =
                [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                "Customer";

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border p-4 bg-slate-50"
                >
                  <div className="font-bold text-slate-900">{name}</div>

                  <div className="text-sm text-slate-600 mt-1">
                    {c.email}
                  </div>

                  <div className="text-sm text-slate-600">
                    {c.phone || "No phone"}
                  </div>

                  <div className="mt-2 text-xs">
                    {c.newsletterSubscribed ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Subscribed
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                        Not subscribed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </ProtectedShell>
  );
}