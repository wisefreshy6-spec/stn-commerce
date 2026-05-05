"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";

type SupportUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  };
  assignedTo?: SupportUser | null;
  messages: {
    message: string;
    createdAt: string;
    sender?: {
      firstName?: string | null;
      lastName?: string | null;
      email: string;
      role: string;
    };
  }[];
  _count: {
    messages: number;
  };
};

type InboxResponse = {
  tickets?: Ticket[];
  supportUsers?: SupportUser[];
  error?: string;
};

type UpdateResponse = {
  message?: string;
  error?: string;
};

const statuses = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

function nice(value: string) {
  return value.replaceAll("_", " ");
}

function personName(user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
}) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Unknown"
  );
}

export default function AdminSupportInboxPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [supportUsers, setSupportUsers] = useState<SupportUser[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInbox = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/support/tickets");
      const data = (await response.json()) as InboxResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load support inbox.");
        return;
      }

      setTickets(data.tickets || []);
      setSupportUsers(data.supportUsers || []);
    } catch {
      setError("Something went wrong while loading support inbox.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInbox();
  }, []);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      const matchesSearch =
        !term ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.message.toLowerCase().includes(term) ||
        ticket.category.toLowerCase().includes(term) ||
        ticket.customer.email.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tickets]);

  const updateTicket = async (
    ticketId: string,
    input: {
      status?: string;
      priority?: string;
      assignedToId?: string | null;
    }
  ) => {
    try {
      setSavingId(ticketId);
      setMessage("");
      setError("");

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update ticket.");
        return;
      }

      setMessage(data.message || "Ticket updated.");
      await loadInbox();
    } catch {
      setError("Something went wrong while updating ticket.");
    } finally {
      setSavingId("");
    }
  };

  const replyTicket = async (ticketId: string) => {
    const reply = replyText[ticketId]?.trim() || "";

    if (!reply) {
      setError("Write a reply first.");
      return;
    }

    try {
      setSavingId(ticketId);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/support/tickets/${ticketId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: reply }),
        }
      );

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setError(data.error || "Unable to send reply.");
        return;
      }

      setReplyText((current) => ({ ...current, [ticketId]: "" }));
      setMessage(data.message || "Reply sent.");
      await loadInbox();
    } catch {
      setError("Something went wrong while replying.");
    } finally {
      setSavingId("");
    }
  };

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    progress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  };

  return (
    <ProtectedShell
      badge="Support inbox"
      title="Customer support inbox"
      subtitle="View support tickets, reply to customers, assign staff, and update ticket progress."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="Total" value={counts.total} />
          <SummaryCard title="Open" value={counts.open} />
          <SummaryCard title="In progress" value={counts.progress} />
          <SummaryCard title="Resolved" value={counts.resolved} />
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Tickets</h2>
              <p className="mt-2 text-sm text-slate-600">
                Manage all customer support requests from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadInbox()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none focus:border-orange-600"
              placeholder="Search subject, message, category, or customer email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {nice(status)}
                </option>
              ))}
            </select>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading inbox...</p>
          ) : filteredTickets.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
              No tickets found.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {nice(ticket.status)}
                        </span>

                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                          {ticket.priority}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {ticket.category}
                        </span>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          {ticket._count.messages} replies
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-slate-950">
                        {ticket.subject}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        Customer: {personName(ticket.customer)} —{" "}
                        {ticket.customer.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Created: {new Date(ticket.createdAt).toLocaleString()} ·
                        Updated: {new Date(ticket.updatedAt).toLocaleString()}
                      </p>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {ticket.message}
                      </div>

                      {ticket.messages?.[0] ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                          <p className="font-black text-slate-950">
                            Latest reply by{" "}
                            {personName(ticket.messages[0].sender)}
                          </p>
                          <p className="mt-2">{ticket.messages[0].message}</p>
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
                          placeholder="Write reply to customer..."
                          value={replyText[ticket.id] || ""}
                          onChange={(e) =>
                            setReplyText((current) => ({
                              ...current,
                              [ticket.id]: e.target.value,
                            }))
                          }
                        />

                        <button
                          type="button"
                          disabled={savingId === ticket.id}
                          onClick={() => void replyTicket(ticket.id)}
                          className="mt-3 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white hover:bg-orange-700 disabled:bg-slate-300 disabled:text-slate-600"
                        >
                          Send reply
                        </button>
                      </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Ticket controls
                      </p>

                      <label className="mt-4 block text-xs font-bold text-slate-600">
                        Status
                      </label>
                      <select
                        value={ticket.status}
                        disabled={savingId === ticket.id}
                        onChange={(e) =>
                          void updateTicket(ticket.id, {
                            status: e.target.value,
                          })
                        }
                        className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                      >
                        {statuses
                          .filter((status) => status !== "ALL")
                          .map((status) => (
                            <option key={status} value={status}>
                              {nice(status)}
                            </option>
                          ))}
                      </select>

                      <label className="mt-4 block text-xs font-bold text-slate-600">
                        Priority
                      </label>
                      <select
                        value={ticket.priority}
                        disabled={savingId === ticket.id}
                        onChange={(e) =>
                          void updateTicket(ticket.id, {
                            priority: e.target.value,
                          })
                        }
                        className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                      >
                        {priorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>

                      <label className="mt-4 block text-xs font-bold text-slate-600">
                        Assign to
                      </label>
                      <select
                        value={ticket.assignedTo?.id || ""}
                        disabled={savingId === ticket.id}
                        onChange={(e) =>
                          void updateTicket(ticket.id, {
                            assignedToId: e.target.value || null,
                          })
                        }
                        className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                      >
                        <option value="">Unassigned</option>
                        {supportUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {personName(user)} — {user.role}
                          </option>
                        ))}
                      </select>

                      <div className="mt-5 rounded-2xl bg-white p-4 text-xs leading-5 text-slate-600">
                        Assigned:{" "}
                        <span className="font-bold">
                          {ticket.assignedTo
                            ? personName(ticket.assignedTo)
                            : "Nobody"}
                        </span>
                      </div>

                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Open full thread
                      </Link>
                    </aside>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </ProtectedShell>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{value}</h2>
    </div>
  );
}