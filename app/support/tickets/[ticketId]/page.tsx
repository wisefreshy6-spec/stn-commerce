"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";
import LiveTicketChat from "@/components/support/LiveTicketChat";
import SupportFeedbackBox from "@/components/support/SupportFeedbackBox";
import { ArrowLeft } from "lucide-react";

type UserLite = {
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
  status: string;
  priority: string;
  customer: UserLite;
  assignedTo?: UserLite | null;
};

type TicketResponse = {
  ticket?: Ticket;
  error?: string;
};

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

export default function SupportTicketThreadPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void params.then((value) => setTicketId(value.ticketId));
  }, [params]);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/support/tickets/${ticketId}`);
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

    void loadTicket();
  }, [ticketId]);

  return (
    <ProtectedShell
      badge="Support chat"
      title="Support conversation"
      subtitle="Chat with support, resolve the issue, or close the chat when finished."
    >
      <section className="space-y-5">
        <Link
          href="/support/my-tickets"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Link>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">
            Loading ticket...
          </div>
        ) : !ticket ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">
            Ticket not found.
          </div>
        ) : (
          <>
            <div className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70">
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
            </div>

            <LiveTicketChat
              ticketId={ticket.id}
              currentUserEmail={ticket.customer.email}
            />
            <SupportFeedbackBox
               ticketId={ticket.id}
               ticketStatus={ticket.status}
            />
          </>
        )}
      </section>
    </ProtectedShell>
  );
}