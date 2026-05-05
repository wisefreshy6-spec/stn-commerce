"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

type Ticket = {
  id: string;
  status: string;
  subject?: string;
};

type TicketsResponse = {
  tickets?: Ticket[];
  error?: string;
};

function isActiveTicket(ticket: Ticket) {
  return ticket.status !== "CLOSED" && ticket.status !== "RESOLVED";
}

export default function FloatingLiveChatButton() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);

  const hideOnRoutes =
    pathname.startsWith("/support/tickets/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/admin/");

  const loadTickets = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/support/my-tickets");
      const data = (await res.json()) as TicketsResponse;

      if (res.ok && data.tickets && data.tickets.length > 0) {
        const activeTicket = data.tickets.find(isActiveTicket);
        setLatestTicket(activeTicket || null);
      } else {
        setLatestTicket(null);
      }
    } catch {
      setLatestTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadTickets();
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (hideOnRoutes) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed right-5 z-50 hidden items-center gap-2 rounded-full bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-xl shadow-orange-600/30 transition hover:-translate-y-0.5 hover:bg-orange-700 bottom-28 md:bottom-5 md:inline-flex"
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {open ? "Close" : "Live chat"}

        {latestTicket ? (
          <span className="ml-1 inline-flex h-2.5 w-2.5 rounded-full bg-green-300" />
        ) : null}
      </button>

      {open ? (
        <div className="fixed right-5 z-50 w-[320px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl bottom-32 md:bottom-20">
          <div className="border-b border-slate-200 bg-gradient-to-br from-orange-50 to-rose-50 p-4">
            <h3 className="text-sm font-black text-slate-950">STN Support</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Get help with orders, payments, account, or delivery.
            </p>
          </div>

          <div className="space-y-3 p-4">
            {loading ? (
              <p className="text-sm font-bold text-slate-500">
                Checking chats...
              </p>
            ) : latestTicket ? (
              <>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <p className="font-black text-slate-800">
                    {latestTicket.subject || "Continue your chat"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Status: {latestTicket.status}
                  </p>
                </div>

                <Link
                  href={`/support/tickets/${latestTicket.id}`}
                  className="block rounded-2xl bg-orange-600 py-3 text-center text-sm font-black text-white hover:bg-orange-700"
                >
                  Open live chat
                </Link>

                <Link
                  href="/support/my-tickets"
                  className="block rounded-2xl border border-slate-300 bg-white py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  View all tickets
                </Link>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  No active chats. Start a new request and continue the
                  conversation from your ticket.
                </div>

                <Link
                  href="/support"
                  className="block rounded-2xl bg-orange-600 py-3 text-center text-sm font-black text-white hover:bg-orange-700"
                >
                  Start new chat
                </Link>

                <Link
                  href="/support/my-tickets"
                  className="block rounded-2xl border border-slate-300 bg-white py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  View closed chats
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}