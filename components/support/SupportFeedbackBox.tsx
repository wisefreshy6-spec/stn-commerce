"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Feedback = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

type FeedbackResponse = {
  feedback?: Feedback | null;
  message?: string;
  error?: string;
};

type SupportFeedbackBoxProps = {
  ticketId: string;
  ticketStatus: string;
};

function isClosedStatus(status: string) {
  return status === "RESOLVED" || status === "CLOSED";
}

export default function SupportFeedbackBox({
  ticketId,
  ticketStatus,
}: SupportFeedbackBoxProps) {
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(
    null
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const closed = isClosedStatus(ticketStatus);

  const loadFeedback = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/support/tickets/${ticketId}/feedback`);
      const data = (await response.json()) as FeedbackResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load feedback.");
        return;
      }

      setExistingFeedback(data.feedback || null);

      if (data.feedback) {
        setRating(data.feedback.rating);
        setComment(data.feedback.comment || "");
      }

      setError("");
    } catch {
      setError("Something went wrong while loading feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (closed) {
      void loadFeedback();
    } else {
      setLoading(false);
    }
  }, [closed, ticketId]);

  const submitFeedback = async () => {
    try {
      setSaving(true);
      setNotice("");
      setError("");

      const response = await fetch(`/api/support/tickets/${ticketId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = (await response.json()) as FeedbackResponse;

      if (!response.ok) {
        setError(data.error || "Unable to save feedback.");
        return;
      }

      setExistingFeedback(data.feedback || null);
      setNotice(data.message || "Feedback saved.");
    } catch {
      setError("Something went wrong while saving feedback.");
    } finally {
      setSaving(false);
    }
  };

  if (!closed) return null;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Rate this support chat
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Your feedback helps improve STN Commerce support.
          </p>
        </div>

        {existingFeedback ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
            Feedback submitted
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-600">Loading feedback...</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-black ${
                  rating === value
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700 ring-1 ring-orange-100"
                }`}
              >
                <Star className="mr-1 h-4 w-4" />
                {value}
              </button>
            ))}
          </div>

          <textarea
            className="mt-4 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
            placeholder="Optional comment about the support experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            type="button"
            onClick={() => void submitFeedback()}
            disabled={saving}
            className="mt-4 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving
              ? "Saving..."
              : existingFeedback
                ? "Update feedback"
                : "Submit feedback"}
          </button>

          {notice ? (
            <p className="mt-3 text-sm font-bold text-green-700">{notice}</p>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm font-bold text-red-700">{error}</p>
          ) : null}
        </>
      )}
    </section>
  );
}