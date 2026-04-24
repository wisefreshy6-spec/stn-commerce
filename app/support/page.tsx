"use client";

import { useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type TicketResponse = {
  message?: string;
  error?: string;
};

const categories = [
  "Account",
  "Orders",
  "Payments",
  "Login/Security",
  "Profile",
  "Other",
];

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Account");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          category,
          message,
        }),
      });

      const data = (await response.json()) as TicketResponse;

      if (!response.ok) {
        setError(data.error || "Unable to submit support ticket.");
        return;
      }

      setSuccess(data.message || "Support ticket submitted successfully.");
      setSubject("");
      setCategory("Account");
      setMessage("");
    } catch {
      setError("Something went wrong while submitting your support ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedShell
      badge="Support"
      title="Contact support"
      subtitle="Submit an account or service support request. Admin/support staff can review and respond later."
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            New support ticket
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Give a clear subject and explain the issue. This creates a ticket
            for the support/admin queue.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
              placeholder="Subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setError("");
                setSuccess("");
              }}
            />

            <select
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setError("");
                setSuccess("");
              }}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <textarea
              className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950"
              placeholder="Describe your issue"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
                setSuccess("");
              }}
            />

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting ticket..." : "Submit ticket"}
            </button>
          </form>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Support guidance
          </h2>

          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              Use <span className="font-semibold">Account</span> for profile,
              name, phone, or account status questions.
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              Use <span className="font-semibold">Login/Security</span> for
              password, Google sign-in, or suspicious access issues.
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              Use <span className="font-semibold">Orders</span> and{" "}
              <span className="font-semibold">Payments</span> later when store
              purchasing features are active.
            </div>
          </div>
        </div>
      </section>
    </ProtectedShell>
  );
}