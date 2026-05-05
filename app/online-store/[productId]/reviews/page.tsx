import Link from "next/link";
import { notFound } from "next/navigation";
import MobileStoreTopBar from "@/components/store/MobileStoreTopBar";
import ProductReviewForm from "@/components/store/ProductReviewForm";
import { db } from "@/lib/db";
import { ArrowLeft, CheckCircle2, ShoppingBag, Star } from "lucide-react";

type Props = {
  params: Promise<{
    productId: string;
  }>;
};

function money(value: unknown) {
  return `KES ${Number(value ?? 0).toLocaleString()}`;
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const filled = index < Math.floor(rating);

    return (
      <Star
        key={index}
        className={`h-4 w-4 ${
          filled ? "fill-orange-500 text-orange-500" : "text-slate-300"
        }`}
      />
    );
  });
}

export default async function ProductReviewsPage({ params }: Props) {
  const { productId } = await params;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          imageUrl: true,
          videoUrl: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!product || product.status === "DELETED") {
    notFound();
  }

  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 pb-24 sm:px-6 sm:py-8 lg:px-8">
      <MobileStoreTopBar />

      <section className="mx-auto max-w-5xl space-y-4">
        <Link
          href={`/online-store/${product.id}`}
          className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to product
        </Link>

        <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="grid grid-cols-[76px_1fr] gap-3">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-8 w-8 text-slate-300" />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="line-clamp-2 text-lg font-black text-slate-950 sm:text-2xl">
                Reviews
              </h1>

              <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-600">
                {product.name}
              </p>

              <p className="mt-1 text-sm font-black text-orange-700">
                {money(product.price)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-black text-slate-950">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </p>
              <div className="mt-1 flex items-center gap-0.5">
                {renderStars(averageRating)}
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-right text-xs font-bold text-slate-600">
              Reviews are allowed only after confirmed delivery or pickup.
            </div>
          </div>
        </div>
        
        <ProductReviewForm productId={product.id} />
        {reviewCount === 0 ? (
          <div className="rounded-[24px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <Star className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-3 text-xl font-black text-slate-950">
              No reviews yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Verified buyers will be able to review this product after
              successful delivery or pickup.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {product.reviews.map((review) => {
              const displayName =
                [review.user?.firstName, review.user?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                review.user?.email?.split("@")[0] ||
                "Verified buyer";

              return (
                <div
                  key={review.id}
                  className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-0.5">
                        {renderStars(review.rating)}
                      </div>

                      {review.title ? (
                        <h3 className="mt-2 text-sm font-black text-slate-950">
                          {review.title}
                        </h3>
                      ) : null}
                    </div>

                    <p className="text-xs font-bold text-slate-400">
                      {review.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {review.comment}
                    </p>
                  ) : null}

                  {review.imageUrl ? (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={review.imageUrl}
                        alt="Review image"
                        className="h-28 w-28 rounded-2xl object-cover shadow-sm"
                     />
                    </div>
                 ) : null}

                  {review.videoUrl ? (
                    <div className="mt-3">
                     <video
                       src={review.videoUrl}
                       controls
                       className="h-40 w-full rounded-2xl object-cover"
                    />
                   </div>
                 ) : null}

                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="truncate">by {displayName}</span>

                    <span className="inline-flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified purchase
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}