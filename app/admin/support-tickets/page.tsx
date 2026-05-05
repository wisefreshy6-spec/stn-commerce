"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";

type SupportTicket = {
  id: string;
  customerId: string;
  assignedToId?: string | null;
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
  customer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    country?: string | null;
    city?: string | null;
    authProvider: string;
    status: string;
  };
  assignedTo?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    role: string;
  } | null;
};

type TicketsResponse = {
  tickets?: SupportTicket[];
  error?: string;
};

type UpdateResponse = {
  message?: string;
  error?: string;
};

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch("/api/admin/support-tickets");
      const data = (await response.json()) as TicketsResponse;

      if (!response.ok) {
        setPageError(data.error || "Unable to load support tickets.");
        return;
      }

      setTickets(data.tickets || []);
    } catch {
      setPageError("Something went wrong while loading support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const updateTicket = async (
    ticketId: string,
    input: {
      status?: SupportTicket["status"];
      priority?: SupportTicket["priority"];
    }
  ) => {
    try {
      setSavingId(ticketId);
      setMessage("");

      const response = await fetch("/api/admin/support-tickets/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          ...input,
        }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setMessage(data.error || "Unable to update ticket.");
        return;
      }

      setMessage(data.message || "Ticket updated.");
      await loadTickets();
    } catch {
      setMessage("Something went wrong while updating ticket.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <ProtectedShell
      badge="Support review"
      title="Support tickets"
      subtitle="Review customer support tickets, update priority, and move them through the support queue."
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Customer support queue
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Tickets submitted by customers from the support page appear here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTickets()}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {pageError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {message}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No support tickets yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {tickets.map((ticket) => {
              const customerName =
                [ticket.customer.firstName, ticket.customer.lastName]
                  .filter(Boolean)
                  .join(" ") || "Customer";

              const assignedName = ticket.assignedTo
                ? [ticket.assignedTo.firstName, ticket.assignedTo.lastName]
                    .filter(Boolean)
                    .join(" ") || ticket.assignedTo.email
                : "Unassigned";

              return (
                <div
                  key={ticket.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {ticket.status}
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

                      <p className="mt-2 text-sm text-slate-600">
                        Submitted by {customerName} — {ticket.customer.email}
                      </p>

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

                      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Phone:</span>{" "}
                          {ticket.customer.phone || "Not added"}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Country:</span>{" "}
                          {ticket.customer.country || "Not set"}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Provider:</span>{" "}
                          {ticket.customer.authProvider}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Assigned to:</span>{" "}
                          {assignedName}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                      </p>

                      <Link
                        href={`/support/tickets/${ticket.id}`}
                        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Open ticket detail
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Update status
                        </p>
                        <div className="flex flex-col gap-2">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={savingId === ticket.id}
                              onClick={() =>
                                updateTicket(ticket.id, { status })
                              }
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Mark {status.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Update priority
                        </p>
                        <div className="flex flex-col gap-2">
                          {priorities.map((priority) => (
                            <button
                              key={priority}
                              type="button"
                              disabled={savingId === ticket.id}
                              onClick={() =>
                                updateTicket(ticket.id, { priority })
                              }
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Set {priority.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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