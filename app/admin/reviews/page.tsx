"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProtectedShell from "@/components/layout/ProtectedShell";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react";

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isApproved: boolean;
  verified: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
};

type ReviewFilter = "ALL" | "PENDING" | "APPROVED";

function getReviewSignals(review: Review) {
  const commentText = review.comment?.trim() || "";
  const normalizedComment = commentText.toLowerCase();

  const isLowRating = review.rating <= 2;
  const isShortReview = commentText.length > 0 && commentText.length < 15;
  const isEmptyReview = commentText.length === 0;
  const hasMedia = Boolean(review.imageUrl || review.videoUrl);

  const words = normalizedComment
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const repeatedWords = words.some(
    (word) => words.filter((item) => item === word).length > 3
  );

  const looksSpammy =
    repeatedWords ||
    normalizedComment.includes("good good good") ||
    normalizedComment.includes("nice nice nice");

  const dangerScore =
    (!review.isApproved ? 2 : 0) +
    (isLowRating ? 2 : 0) +
    (looksSpammy ? 2 : 0) +
    (isEmptyReview ? 1 : 0) +
    (isShortReview ? 1 : 0);

  return {
    commentText,
    isLowRating,
    isShortReview,
    isEmptyReview,
    hasMedia,
    looksSpammy,
    dangerScore,
  };
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${
        index < rating ? "fill-orange-500 text-orange-500" : "text-slate-300"
      }`}
    />
  ));
}

function AdminReviewsContent() {
  const searchParams = useSearchParams();
  const productFilter = searchParams.get("productId");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<ReviewFilter>("ALL");
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/reviews");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to load reviews.");
        return;
      }

      setReviews(data.reviews || []);
    } catch {
      setError("Something went wrong while loading reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((review) => review.isApproved).length;
    const pending = reviews.filter((review) => !review.isApproved).length;
    const verified = reviews.filter((review) => review.verified).length;

    return { total, approved, pending, verified };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let base = reviews;

    if (productFilter) {
      base = base.filter((review) => review.product.id === productFilter);
    }

    if (filter === "PENDING") {
      base = base.filter((review) => !review.isApproved);
    }

    if (filter === "APPROVED") {
      base = base.filter((review) => review.isApproved);
    }

    return [...base].sort((a, b) => {
      const aSignals = getReviewSignals(a);
      const bSignals = getReviewSignals(b);

      if (aSignals.dangerScore !== bSignals.dangerScore) {
        return bSignals.dangerScore - aSignals.dangerScore;
      }

      if (a.isApproved !== b.isApproved) {
        return a.isApproved ? 1 : -1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, filter, productFilter]);

  const updateReview = async (
    reviewId: string,
    action: "APPROVE" | "HIDE" | "DELETE"
  ) => {
    if (
      action === "DELETE" &&
      !window.confirm("Delete this review permanently?")
    ) {
      return;
    }

    try {
      setWorkingId(reviewId);
      setMessage("");
      setError("");

      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to update review.");
        return;
      }

      setMessage(data.message || "Review updated.");
      setActiveReview(null);
      await loadReviews();
    } catch {
      setError("Something went wrong while updating review.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <ProtectedShell
      title="Product Reviews"
      subtitle="Review customer feedback, approve, hide or delete reviews"
    >
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                  Admin
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                  Product Reviews
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Review customer feedback, approve verified reviews, hide
                  unsuitable content, or delete spam.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadReviews()}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total Reviews", stats.total],
              ["Approved", stats.approved],
              ["Needs Approval", stats.pending],
              ["Verified Buyers", stats.verified],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {productFilter ? (
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
              Showing reviews for one selected product.{" "}
              <Link href="/admin/reviews" className="font-black underline">
                Clear product filter
              </Link>
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {[
              ["ALL", "All"],
              ["PENDING", "Pending"],
              ["APPROVED", "Approved"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as ReviewFilter)}
                className={`rounded-xl px-4 py-2 text-xs font-black ${
                  filter === key
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-[28px] bg-white p-8 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-xl font-black text-slate-950">
                No reviews yet
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Customer product reviews will appear here.
              </p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-bold text-slate-600">
                No reviews match this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const customerName =
                  [review.user.firstName, review.user.lastName]
                    .filter(Boolean)
                    .join(" ") || review.user.email;

                const {
                  isLowRating,
                  isShortReview,
                  isEmptyReview,
                  hasMedia,
                  looksSpammy,
                  dangerScore,
                } = getReviewSignals(review);

                return (
                  <div
                    key={review.id}
                    onClick={() => setActiveReview(review)}
                    className={`cursor-pointer rounded-[28px] bg-white p-5 shadow-sm ring-1 transition hover:ring-2 hover:ring-orange-200 ${
                      dangerScore >= 3
                        ? "ring-red-200"
                        : isLowRating
                          ? "ring-amber-200"
                          : "ring-slate-200"
                    }`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              review.isApproved
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {review.isApproved ? "Approved" : "Needs approval"}
                          </span>

                          {dangerScore >= 3 ? (
                            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                              High priority
                            </span>
                          ) : null}

                          {isLowRating ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              Low rating
                            </span>
                          ) : null}

                          {looksSpammy ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              Possible spam
                            </span>
                          ) : null}

                          {isEmptyReview ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                              Empty review
                            </span>
                          ) : null}

                          {isShortReview ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                              Too short
                            </span>
                          ) : null}

                          {!hasMedia ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                              No media
                            </span>
                          ) : null}

                          {review.verified ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Verified buyer
                            </span>
                          ) : null}

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1">
                          {renderStars(review.rating)}

                          <span className="ml-2 text-sm font-black text-slate-700">
                            {review.rating}/5
                          </span>
                        </div>

                        {review.title ? (
                          <h3 className="mt-3 text-lg font-black text-slate-950">
                            {review.title}
                          </h3>
                        ) : null}

                        {review.comment ? (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm font-bold text-slate-400">
                            No written comment.
                          </p>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {review.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={review.imageUrl}
                              alt="Review media"
                              className="h-32 w-full rounded-2xl object-cover"
                            />
                          ) : null}

                          {review.videoUrl ? (
                            <video
                              src={review.videoUrl}
                              controls
                              className="h-32 w-full rounded-2xl object-cover"
                              onClick={(event) => event.stopPropagation()}
                            />
                          ) : null}
                        </div>

                        <div className="mt-4 text-xs font-bold text-slate-500">
                          <p>Customer: {customerName}</p>
                          <p>Email: {review.user.email}</p>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl bg-slate-50 p-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex gap-3">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                            {review.product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={review.product.imageUrl}
                                alt={review.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Star className="h-7 w-7 text-slate-300" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-black text-slate-950">
                              {review.product.name}
                            </p>
                            <Link
                              href={`/online-store/${review.product.id}`}
                              className="mt-2 inline-flex text-xs font-black text-orange-600"
                            >
                              View product
                            </Link>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {!review.isApproved ? (
                            <button
                              type="button"
                              onClick={() =>
                                void updateReview(review.id, "APPROVE")
                              }
                              disabled={workingId === review.id}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 text-xs font-black text-white disabled:bg-slate-300"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                void updateReview(review.id, "HIDE")
                              }
                              disabled={workingId === review.id}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 text-xs font-black text-white disabled:bg-slate-300"
                            >
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void updateReview(review.id, "DELETE")
                            }
                            disabled={workingId === review.id}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 text-xs font-black text-white disabled:bg-slate-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeReview ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-950">
                    Review details
                  </h2>

                  <button
                    type="button"
                    onClick={() => setActiveReview(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-1">
                    {renderStars(activeReview.rating)}
                    <span className="ml-2 text-sm font-black text-slate-700">
                      {activeReview.rating}/5
                    </span>
                  </div>

                  {activeReview.title ? (
                    <p className="text-lg font-black text-slate-950">
                      {activeReview.title}
                    </p>
                  ) : null}

                  {activeReview.comment ? (
                    <p className="text-sm leading-6 text-slate-600">
                      {activeReview.comment}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">
                      No written comment.
                    </p>
                  )}

                  {activeReview.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeReview.imageUrl}
                      alt="Review image"
                      className="max-h-80 w-full rounded-2xl object-cover"
                    />
                  ) : null}

                  {activeReview.videoUrl ? (
                    <video
                      src={activeReview.videoUrl}
                      controls
                      className="max-h-80 w-full rounded-2xl object-cover"
                    />
                  ) : null}

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                    <p className="font-black text-slate-950">
                      {activeReview.product.name}
                    </p>

                    <Link
                      href={`/online-store/${activeReview.product.id}`}
                      className="mt-2 inline-flex text-xs font-black text-orange-600"
                    >
                      View product
                    </Link>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {!activeReview.isApproved ? (
                      <button
                        type="button"
                        onClick={() =>
                          void updateReview(activeReview.id, "APPROVE")
                        }
                        disabled={workingId === activeReview.id}
                        className="rounded-xl bg-green-600 py-3 text-xs font-black text-white disabled:bg-slate-300"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void updateReview(activeReview.id, "HIDE")
                        }
                        disabled={workingId === activeReview.id}
                        className="rounded-xl bg-amber-600 py-3 text-xs font-black text-white disabled:bg-slate-300"
                      >
                        Hide
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        void updateReview(activeReview.id, "DELETE")
                      }
                      disabled={workingId === activeReview.id}
                      className="rounded-xl bg-red-600 py-3 text-xs font-black text-white disabled:bg-slate-300"
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveReview(null)}
                      className="rounded-xl bg-slate-100 py-3 text-xs font-black text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </ProtectedShell>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm font-bold text-slate-600">
          Loading reviews...
        </div>
      }
    >
      <AdminReviewsContent />
    </Suspense>
  );
}