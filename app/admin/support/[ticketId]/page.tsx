"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";
import { ArrowLeft, CheckCircle2, Send, XCircle } from "lucide-react";

type UserLite = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
};

type TicketMessage = {
  id: string;
  message: string;
  createdAt: string;
  sender: UserLite;
};

type Ticket = {
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
  customer: UserLite;
  assignedTo?: UserLite | null;
  messages: TicketMessage[];
};

type TicketResponse = {
  ticket?: Ticket;
  message?: string;
  error?: string;
};

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
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

function isStaffRole(role?: string) {
  return role === "ADMIN" || role === "SUPPORT" || role === "TEAM";
}

export default function AdminSupportTicketThreadPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void params.then((value) => setTicketId(value.ticketId));
  }, [params]);

  const loadTicket = async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      const data = (await response.json()) as TicketResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load ticket.");
        return;
      }

      setTicket(data.ticket || null);
    } catch {
      setError("Something went wrong while loading the ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTicket();
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  const threadMessages = useMemo(() => {
    if (!ticket) return [];

    return [
      {
        id: "original",
        message: ticket.message,
        createdAt: ticket.createdAt,
        sender: ticket.customer,
        original: true,
      },
      ...ticket.messages.map((item) => ({
        ...item,
        original: false,
      })),
    ];
  }, [ticket]);

  const updateTicket = async (input: { status?: string; priority?: string }) => {
    if (!ticket) return;

    try {
      setSavingStatus(true);
      setNotice("");
      setError("");

      const response = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = (await response.json()) as TicketResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update ticket.");
        return;
      }

      setNotice(data.message || "Ticket updated.");
      await loadTicket();
    } catch {
      setError("Something went wrong while updating ticket.");
    } finally {
      setSavingStatus(false);
    }
  };

  const sendReply = async () => {
    if (!ticket) return;

    const cleanReply = reply.trim();

    if (!cleanReply) {
      setError("Write a reply first.");
      return;
    }

    try {
      setSending(true);
      setNotice("");
      setError("");

      const response = await fetch(
        `/api/admin/support/tickets/${ticket.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: cleanReply,
          }),
        }
      );

      const data = (await response.json()) as TicketResponse;

      if (!response.ok) {
        setError(data.error || "Unable to send reply.");
        return;
      }

      setReply("");
      setNotice(data.message || "Reply sent.");
      await loadTicket();
    } catch {
      setError("Something went wrong while sending reply.");
    } finally {
      setSending(false);
    }
  };

  const closed = ticket
    ? ticket.status === "RESOLVED" || ticket.status === "CLOSED"
    : false;

  return (
    <ProtectedShell
      badge="Admin support"
      title="Support ticket thread"
      subtitle="Reply to customers, review the full conversation, and close tickets when resolved."
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/support"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to support inbox
          </Link>

          {ticket ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={savingStatus || ticket.status === "RESOLVED"}
                onClick={() => void updateTicket({ status: "RESOLVED" })}
                className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-black text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark resolved
              </button>

              <button
                type="button"
                disabled={savingStatus || ticket.status === "CLOSED"}
                onClick={() => void updateTicket({ status: "CLOSED" })}
                className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Close ticket
              </button>
            </div>
          ) : null}
        </div>

        {notice ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[32px] border border-white/50 bg-white shadow-xl ring-1 ring-slate-200/70">
          {loading ? (
            <div className="p-8 text-sm text-slate-600">Loading ticket...</div>
          ) : !ticket ? (
            <div className="p-8 text-sm text-slate-600">Ticket not found.</div>
          ) : (
            <>
              <div className="border-b border-slate-200 bg-slate-50 p-6">
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
                </div>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  {ticket.subject}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Customer: {personName(ticket.customer)} · Assigned:{" "}
                  {ticket.assignedTo ? personName(ticket.assignedTo) : "Not yet"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Status
                    </label>
                    <select
                      value={ticket.status}
                      disabled={savingStatus}
                      onChange={(e) =>
                        void updateTicket({ status: e.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {nice(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Priority
                    </label>
                    <select
                      value={ticket.priority}
                      disabled={savingStatus}
                      onChange={(e) =>
                        void updateTicket({ priority: e.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
                    >
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-[560px] space-y-4 overflow-y-auto bg-slate-100 p-5">
                {threadMessages.map((item) => {
                  const staff = isStaffRole(item.sender.role);

                  return (
                    <div
                      key={item.id}
                      className={`flex ${staff ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[24px] px-5 py-4 shadow-sm ${
                          staff
                            ? "rounded-br-md bg-orange-600 text-white"
                            : "rounded-bl-md bg-white text-slate-800"
                        }`}
                      >
                        <div
                          className={`mb-2 text-xs font-black ${
                            staff ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          {personName(item.sender)} ·{" "}
                          {staff ? "Support" : "Customer"}
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {item.message}
                        </p>

                        <div
                          className={`mt-2 text-right text-[11px] ${
                            staff ? "text-white/70" : "text-slate-400"
                          }`}
                        >
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 bg-white p-5">
                {closed ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                    This ticket is {nice(ticket.status).toLowerCase()}. Reopen
                    it from status controls if more action is needed.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      className="min-h-14 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
                      placeholder="Type support reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />

                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void sendReply()}
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                    >
                      <Send className="mr-2 h-4 w-4 text-white" />
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </ProtectedShell>
  );
}