"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Send, UserCircle2, XCircle } from "lucide-react";

type ChatMessage = {
  id: string;
  message: string;
  createdAt: string;
  sender?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

type AiMessage = {
  id: string;
  message: string;
  createdAt: string;
};

type TicketResponse = {
  ticket?: {
    id: string;
    subject: string;
    status: string;
    messages: ChatMessage[];
  };
  message?: string;
  error?: string;
};

type SendResponse = {
  message?: string;
  error?: string;
};

type AiResponse = {
  reply?: string;
  error?: string;
};

type LiveTicketChatProps = {
  ticketId: string;
  currentUserEmail?: string;
};

function senderName(item: ChatMessage) {
  const fullName = [item.sender?.firstName, item.sender?.lastName]
    .filter(Boolean)
    .join(" ");

  if (fullName) return fullName;
  if (item.sender?.role === "ADMIN") return "Admin support";
  if (item.sender?.role === "SUPPORT") return "Support";
  if (item.sender?.role === "TEAM") return "Support team";
  if (item.sender?.email) return item.sender.email;

  return "STN Support";
}

function isStaff(item: ChatMessage) {
  return (
    item.sender?.role === "ADMIN" ||
    item.sender?.role === "SUPPORT" ||
    item.sender?.role === "TEAM"
  );
}

function isClosedStatus(status: string) {
  return status === "CLOSED" || status === "RESOLVED";
}

export default function LiveTicketChat({
  ticketId,
  currentUserEmail,
}: LiveTicketChatProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [ticketStatus, setTicketStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const chatClosed = isClosedStatus(ticketStatus);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setPolling(true);

      const response = await fetch(`/api/support/tickets/${ticketId}`);
      const data = (await response.json()) as TicketResponse;

      if (!response.ok || !data.ticket) {
        setError(data.error || "Unable to load chat.");
        return;
      }

      setTicketStatus(data.ticket.status);
      setMessages(data.ticket.messages || []);
      setError("");
    } catch {
      setError("Something went wrong while loading chat.");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  const askAssistant = async (message: string) => {
    try {
      setAssistantTyping(true);

      const response = await fetch("/api/support/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = (await response.json()) as AiResponse;

      if (response.ok && data.reply) {
        const reply = data.reply;

        setAiMessages((prev) => [
         ...prev,
         {
           id: `ai-${Date.now()}`,
           message: reply,
           createdAt: new Date().toISOString(),
         },
        ]);
       }
    } finally {
      setAssistantTyping(false);
    }
  };

  useEffect(() => {
    void loadMessages(false);

    const interval = window.setInterval(() => {
      if (!chatClosed) {
        void loadMessages(true);
      }
    }, 1500);

    return () => window.clearInterval(interval);
  }, [ticketId, chatClosed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, aiMessages.length, assistantTyping]);

  const sendMessage = async () => {
    const text = draft.trim();

    if (!text || sending || chatClosed) return;

    try {
      setSending(true);
      setError("");
      setNotice("");

      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = (await response.json()) as SendResponse;

      if (!response.ok) {
        setError(data.error || "Unable to send message.");
        return;
      }

      setDraft("");
      await loadMessages(true);
      await askAssistant(text);
    } catch {
      setError("Something went wrong while sending message.");
    } finally {
      setSending(false);
    }
  };

  const closeChat = async (status: "RESOLVED" | "CLOSED") => {
    if (chatClosed || closing) return;

    const confirmed = window.confirm(
      status === "RESOLVED"
        ? "Mark this chat as resolved? It cannot be resumed after this."
        : "Close this chat? It cannot be resumed after this."
    );

    if (!confirmed) return;

    try {
      setClosing(true);
      setError("");
      setNotice("");

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as TicketResponse;

      if (!response.ok) {
        setError(data.error || "Unable to close chat.");
        return;
      }

      setNotice(
        data.message ||
          "Chat closed successfully. Start a new support request if you need more help."
      );

      await loadMessages(true);
    } catch {
      setError("Something went wrong while closing chat.");
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Loading live chat...</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
      <div className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Live support chat
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Fast near-live chat refreshes every 1.5 seconds. Closed chats are
              archived and cannot be resumed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                chatClosed
                  ? "bg-slate-200 text-slate-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {ticketStatus || "OPEN"}
            </span>

            {!chatClosed ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                {polling ? "Syncing..." : "Live polling"}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                Archived
              </span>
            )}
          </div>
        </div>

        {!chatClosed ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void closeChat("RESOLVED")}
              disabled={closing}
              className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-black text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {closing ? "Saving..." : "Mark resolved"}
            </button>

            <button
              type="button"
              onClick={() => void closeChat("CLOSED")}
              disabled={closing}
              className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Close chat
            </button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <div className="m-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="max-h-[520px] space-y-4 overflow-y-auto bg-slate-50/70 p-5">
        {messages.length === 0 && aiMessages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No replies yet. Send a message and support will respond here.
          </div>
        ) : null}

        {messages.map((item) => {
          const staff = isStaff(item);
          const own =
            currentUserEmail &&
            item.sender?.email?.toLowerCase() ===
              currentUserEmail.toLowerCase();

          return (
            <div
              key={item.id}
              className={`flex gap-3 ${own ? "justify-end" : "justify-start"}`}
            >
              {!own ? (
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    staff
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {staff ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    <UserCircle2 className="h-5 w-5" />
                  )}
                </div>
              ) : null}

              <div
                className={`max-w-[82%] rounded-[24px] px-5 py-4 shadow-sm ${
                  own
                    ? "bg-orange-600 text-white"
                    : staff
                      ? "bg-white text-slate-800 ring-1 ring-orange-100"
                      : "bg-white text-slate-800 ring-1 ring-slate-200"
                }`}
              >
                <div
                  className={`text-xs font-black ${
                    own
                      ? "text-white/75"
                      : staff
                        ? "text-orange-700"
                        : "text-slate-500"
                  }`}
                >
                  {own ? "You" : senderName(item)}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {item.message}
                </p>

                <div
                  className={`mt-2 text-[11px] ${
                    own ? "text-white/60" : "text-slate-400"
                  }`}
                >
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        {aiMessages.map((item) => (
          <div key={item.id} className="flex justify-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <Bot className="h-5 w-5" />
            </div>

            <div className="max-w-[82%] rounded-[24px] bg-white px-5 py-4 text-slate-800 shadow-sm ring-1 ring-orange-100">
              <div className="text-xs font-black text-orange-700">
                STN assistant suggestion
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {item.message}
              </p>

              <div className="mt-2 text-[11px] text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {assistantTyping ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <Bot className="h-5 w-5" />
            </div>

            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
              STN assistant is typing...
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          Assistant replies are helper suggestions, not final staff decisions.
          Once a chat is resolved or closed, it becomes read-only.
        </div>

        {chatClosed ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
            This chat is closed and cannot be resumed. Please start a new
            support request if you still need help.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <textarea
              className="min-h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
              placeholder="Type your message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={sending || !draft.trim()}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              <Send className="mr-2 h-4 w-4 text-white" />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}