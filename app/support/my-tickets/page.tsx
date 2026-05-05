"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    message: string;
    createdAt: string;
  }[];
  _count: {
    messages: number;
  };
};

type TicketsResponse = {
  tickets?: Ticket[];
  error?: string;
};

function getStatusText(status: string) {
  if (status === "OPEN") return "Open";
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "RESOLVED") return "Resolved";
  if (status === "CLOSED") return "Closed";
  return status;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/support/my-tickets");
      const data = (await response.json()) as TicketsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load your tickets.");
        return;
      }

      setTickets(data.tickets || []);
    } catch {
      setError("Something went wrong while loading your tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  return (
    <ProtectedShell
      badge="Support history"
      title="My support tickets"
      subtitle="View the support requests you submitted, latest replies, and current status."
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Ticket history
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Admin/support can update ticket status. You can view progress and
              replies here.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadTickets()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>

            <Link
              href="/support"
              className="rounded-2xl bg-slate-950 px-5 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              New ticket
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            You have not submitted any support tickets yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {getStatusText(ticket.status)}
                  </span>

                  <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                    {ticket.priority}
                  </span>

                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {ticket.category}
                  </span>

                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {ticket._count.messages} replies
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-950">
                  {ticket.subject}
                </h3>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {ticket.message}
                </div>

                {ticket.messages[0] ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-semibold">Latest reply:</span>{" "}
                    {ticket.messages[0].message.length > 100
                      ? `${ticket.messages[0].message.slice(0, 100)}...`
                      : ticket.messages[0].message}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="font-semibold">Created:</span>{" "}
                    {new Date(ticket.createdAt).toLocaleString()}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="font-semibold">Last updated:</span>{" "}
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </div>
                </div>

                <Link
                  href={`/support/tickets/${ticket.id}`}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Open ticket
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </ProtectedShell>
  );
}