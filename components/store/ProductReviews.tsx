"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  verified?: boolean;
  createdAt: string;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
};

type ReviewResponse = {
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
  message?: string;
  error?: string;
};

type ProductReviewsProps = {
  productId: string;
};

function personName(review: Review) {
  return (
    [review.user.firstName, review.user.lastName].filter(Boolean).join(" ") ||
    review.user.email
  );
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/products/${productId}/reviews`);
      const data = (await response.json()) as ReviewResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load reviews.");
        return;
      }

      setReviews(data.reviews || []);
      setAverageRating(Number(data.averageRating || 0));
      setReviewCount(Number(data.reviewCount || 0));
    } catch {
      setError("Something went wrong while loading reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, [productId]);

  const submitReview = async () => {
    try {
      setSaving(true);
      setNotice("");
      setError("");

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = (await response.json()) as ReviewResponse;

      if (!response.ok) {
        setError(data.error || "Unable to save review.");
        return;
      }

      setNotice(data.message || "Review submitted.");
      setComment("");
      await loadReviews();
    } catch {
      setError("Something went wrong while saving review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Customer reviews
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Verified buyers can rate and review this product.
          </p>
        </div>

        <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">
          {averageRating.toFixed(1)} / 5 · {reviewCount} review
          {reviewCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
        <p className="text-sm font-black text-orange-800">
          Leave a verified review
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-black ${
                rating === value
                  ? "bg-orange-600 text-white"
                  : "bg-white text-orange-700 ring-1 ring-orange-200"
              }`}
            >
              <Star className="mr-1 h-4 w-4" />
              {value}
            </button>
          ))}
        </div>

        <textarea
          className="mt-3 min-h-24 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-orange-600"
          placeholder="Write your honest product experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          type="button"
          onClick={() => void submitReview()}
          disabled={saving}
          className="mt-3 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? "Saving..." : "Submit review"}
        </button>

        {notice ? (
          <p className="mt-3 text-sm font-bold text-green-700">{notice}</p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-bold text-red-700">{error}</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-600">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            No reviews yet.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">
                  {personName(review)}
                </p>

                {review.verified ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                    Verified purchase
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex gap-1 text-orange-600">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < review.rating
                        ? "fill-current"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>

              {review.comment ? (
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {review.comment}
                </p>
              ) : null}

              <p className="mt-2 text-xs text-slate-400">
                {new Date(review.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}