"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Star, Video } from "lucide-react";

type Props = {
  productId: string;
};

export default function ProductReviewForm({ productId }: Props) {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.user?.id) {
          setUserId(data.user.id);
        }
      } catch {
        setUserId("");
      }
    };

    void loadUser();
  }, []);

  useEffect(() => {
  const checkEligibility = async () => {
    if (!userId) {
      setCheckingEligibility(false);
      setCanReview(false);
      setEligibilityMessage("Sign in to review this product after purchase.");
      return;
    }

    try {
      setCheckingEligibility(true);

      const res = await fetch(
        `/api/store/products/${productId}/reviews/eligibility?userId=${userId}`
      );

      const data = await res.json();

      setCanReview(Boolean(data.canReview));
      setEligibilityMessage(data.message || "");
    } catch {
      setCanReview(false);
      setEligibilityMessage("Unable to check review eligibility.");
    } finally {
      setCheckingEligibility(false);
    }
  };

  void checkEligibility();
}, [productId, userId]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const submitReview = async () => {
    setMessage("");
    setError("");

    if (!userId) {
      setError("Please sign in to review this product.");
      return;
    }

    if (rating < 1) {
      setError("Choose a star rating first.");
      return;
    }

    try {
      setSubmitting(true);

      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(uploadData.error || "Unable to upload image.");
          return;
        }

        imageUrl = uploadData.url;
      }

      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(uploadData.error || "Unable to upload video.");
          return;
        }

        videoUrl = uploadData.url;
      }

      const res = await fetch(`/api/store/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
          imageUrl,
          videoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to submit review.");
        return;
      }

      setMessage(
       data.message ||
         "Thanks, your review was submitted and is awaiting approval."
      );
      setCanReview(false);
      setEligibilityMessage("You have already reviewed this product.");
      setRating(0);
      setTitle("");
      setComment("");
      setImageFile(null);
      setVideoFile(null);
      router.refresh();
    } catch {
      setError("Something went wrong while submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

if (checkingEligibility) {
  return (
    <div className="rounded-[24px] bg-white p-4 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 sm:p-6">
      Checking review eligibility...
    </div>
  );
}

if (!canReview) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <p className="text-sm font-black text-slate-950">Review status</p>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
        {eligibilityMessage || "You are not eligible to review this product yet."}
      </p>
    </div>
  );
}
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-black text-slate-950">Write a review</h2>

      <p className="mt-1 text-xs font-bold text-slate-500">
        Only verified delivered/picked orders can review.
      </p>

      {message ? (
        <div className="mt-3 animate-slideDown rounded-2xl bg-blue-50 p-3 text-sm font-black text-blue-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-black text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="p-1"
            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
          >
            <Star
              className={`h-7 w-7 ${
                value <= rating
                  ? "fill-orange-500 text-orange-500"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title, e.g. Great product"
        maxLength={80}
        className="mt-4 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-orange-600"
      />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        maxLength={700}
        className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none focus:border-orange-600"
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-600">
          <span className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-orange-600" />
            Add image optional
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0] || null;

              if (file && file.size > 5 * 1024 * 1024) {
                setError("Image must be 5MB or smaller.");
                setImageFile(null);
                input.value = "";
                return;
              }

              setError("");
              setImageFile(file);
            }}
            className="mt-2 block w-full text-xs"
          />

          {imageFile && imagePreviewUrl ? (
            <div className="mt-3 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="Selected review image"
                className="h-24 w-24 rounded-2xl object-cover"
              />

              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-xs font-black text-green-700">
                  {imageFile.name}
                </p>

                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-xs font-black text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </label>

        <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-600">
          <span className="flex items-center gap-2">
            <Video className="h-4 w-4 text-orange-600" />
            Add video optional, max 30 sec
          </span>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0] || null;

              if (file && file.size > 30 * 1024 * 1024) {
                setError("Video must be 30MB or smaller.");
                setVideoFile(null);
                input.value = "";
                return;
              }

              if (file) {
                const video = document.createElement("video");
                video.preload = "metadata";

                video.onloadedmetadata = () => {
                  window.URL.revokeObjectURL(video.src);

                  if (video.duration > 30) {
                    setError("Video must be 30 seconds or shorter.");
                    setVideoFile(null);
                    input.value = "";
                    return;
                  }

                  setError("");
                  setVideoFile(file);
                };

                video.onerror = () => {
                  setError("Unable to read this video. Try another file.");
                  setVideoFile(null);
                  input.value = "";
                };

                video.src = URL.createObjectURL(file);
                return;
              }

              setError("");
              setVideoFile(null);
            }}
            className="mt-2 block w-full text-xs"
          />

          {videoFile && videoPreviewUrl ? (
            <div className="mt-3 space-y-2">
              <video
                src={videoPreviewUrl}
                controls
                className="h-24 w-full rounded-2xl object-cover"
              />

              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-xs font-black text-green-700">
                  {videoFile.name}
                </p>

                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  className="text-xs font-black text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </label>
      </div>

      <button
        type="button"
        onClick={() => void submitReview()}
        disabled={submitting}
        className="mt-4 h-12 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
}