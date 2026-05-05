"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Headset, Search, Send, ShoppingBag } from "lucide-react";

type TicketResponse = {
  message?: string;
  error?: string;
};

const helpTopics = [
  {
    keywords: ["cart", "basket", "add item", "remove item", "quantity"],
    title: "Basket and cart help",
    answer:
      "Open Basket from your dashboard or store page. You can increase quantity using +, reduce using -, or remove an item before checkout.",
  },
  {
    keywords: ["checkout", "delivery", "address", "g4s", "pickup"],
    title: "Checkout and delivery help",
    answer:
      "Checkout requires a delivery address, county, and supported G4S pickup station. Nairobi CBD pickup is free. Other supported stations are capped at KES 400.",
  },
  {
    keywords: ["order", "track", "invoice", "progress"],
    title: "Order tracking help",
    answer:
      "Use the Track Order page and enter your invoice number, for example STN-ORD-20260426-XXXXXX. You can also open My Orders when logged in.",
  },
  {
    keywords: ["payment", "mpesa", "cash", "card", "paypal"],
    title: "Payment help",
    answer:
      "Choose your payment method during checkout. Some methods may still require confirmation while the system is being finalized.",
  },
  {
    keywords: ["cancel", "refund", "return"],
    title: "Cancellation and refund help",
    answer:
      "You can cancel an order only before processing starts. Refund review for non-food items is available within 7 days. Food items are not refundable unless there is a verified issue.",
  },
  {
    keywords: ["login", "signup", "account", "password", "email"],
    title: "Account help",
    answer:
      "Use Login or Sign Up to access protected features. If you forget your password, use the password reset option when available.",
  },
];

const categories = [
  "GENERAL",
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "ACCOUNT",
  "REFUND",
  "TECHNICAL",
];

function findAutoAnswer(query: string) {
  const term = query.trim().toLowerCase();

  if (!term) return null;

  return (
    helpTopics.find((topic) =>
      topic.keywords.some((keyword) => term.includes(keyword))
    ) || null
  );
}

export default function SupportPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");

  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const autoAnswer = useMemo(() => findAutoAnswer(query), [query]);

  const createTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSending(true);
      setNotice("");
      setError("");

      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          category,
          subject,
          message: messageText,
        }),
      });

      const data = (await response.json()) as TicketResponse;

      if (!response.ok) {
        setError(data.error || "Unable to create ticket.");
        return;
      }

      setNotice(data.message || "Support ticket created.");
      setSubject("");
      setMessageText("");
    } catch {
      setError("Something went wrong while creating support ticket.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
          <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
            24/7 Help Center
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
            How can we help?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Search common issues first. If the automatic help does not solve it,
            send a support ticket and our team will follow up.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none focus:border-orange-600"
                placeholder="Example: how do I track my order?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Link
              href="/track-order"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white hover:bg-orange-700"
            >
              Track order
            </Link>
          </div>
        </div>

        {autoAnswer ? (
          <div className="rounded-[28px] border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                <Bot className="h-6 w-6 text-green-700" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {autoAnswer.title}
                </h2>

                <p className="mt-2 text-sm leading-7 text-green-900">
                  {autoAnswer.answer}
                </p>
              </div>
            </div>
          </div>
        ) : query.trim() ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
            I could not find a direct automatic answer. You can send a support
            ticket below and include your invoice number if it is about an order.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[28px] bg-white p-6 shadow ring-1 ring-slate-200">
            <Headset className="h-8 w-8 text-orange-700" />

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Quick links
            </h2>

            <div className="mt-5 space-y-3">
              <Link
                href="/online-store"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Online store <ShoppingBag className="h-4 w-4" />
              </Link>

              <Link
                href="/cart"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Basket <ShoppingBag className="h-4 w-4" />
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                My orders <ShoppingBag className="h-4 w-4" />
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Track order <ShoppingBag className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-xs leading-6 text-orange-900">
              Support may be offline sometimes, but automatic help is available
              anytime for common navigation, order, checkout, and account issues.
            </div>
          </div>

          <form
            onSubmit={createTicket}
            className="rounded-[28px] bg-white p-6 shadow ring-1 ring-slate-200"
          >
            <h2 className="text-2xl font-black text-slate-950">
              Send support ticket
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this if automatic help does not solve your issue.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none focus:border-orange-600"
                placeholder="Your name optional"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none focus:border-orange-600"
                placeholder="Email optional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <select
              className="mt-4 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-600"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              className="mt-4 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none focus:border-orange-600"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              className="mt-4 min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
              placeholder="Explain your issue. Include invoice number if it is about an order."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />

            {notice ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              <Send className="mr-2 h-4 w-4 text-white" />
              {sending ? "Sending..." : "Send ticket"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}