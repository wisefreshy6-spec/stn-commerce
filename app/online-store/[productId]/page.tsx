import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailActions from "@/components/store/ProductDetailActions";
import SiteBannerStrip from "@/components/store/SiteBannerStrip";
import MobileStoreTopBar from "@/components/store/MobileStoreTopBar";
import { db } from "@/lib/db";
import {
  ArrowLeft,
  Box,
  Gift,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

type Props = {
  params: Promise<{
    productId: string;
  }>;
};

function money(value: unknown) {
  return `KES ${Number(value ?? 0).toLocaleString()}`;
}

function discountedPrice(price: unknown, discountPercent?: number | null) {
  const original = Number(price);
  const discount = Number(discountPercent || 0);

  if (!Number.isFinite(original) || discount <= 0) return original;

  return Math.max(0, original - (original * discount) / 100);
}

function specsToEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>)
    .map(([key, val]) => [key, String(val || "")])
    .filter(([key, val]) => key && val);
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const filled = index < Math.floor(rating);

    return (
      <Star
        key={index}
        className={`h-3.5 w-3.5 ${
          filled ? "fill-orange-500 text-orange-500" : "text-slate-300"
        }`}
      />
    );
  });
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;

  if (!productId) notFound();

  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      reviews: {
        where: {
          isApproved: true,
        },
        select: {
          rating: true,
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

  const similarProducts = await db.product.findMany({
    where: {
      id: {
        not: product.id,
      },
      status: "ACTIVE",
      stock: {
        gt: 0,
      },
      section: product.section,
      ...(product.category ? { category: product.category } : {}),
      ...(product.subCategory ? { subCategory: product.subCategory } : {}),
    },
    take: 4,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      imageUrls: true,
      discountPercent: true,
      category: true,
      subCategory: true,
      brand: true,
    },
  });

  const finalPrice = discountedPrice(product.price, product.discountPercent);
  const hasDiscount =
    product.discountPercent && Number(product.discountPercent) > 0;

  const galleryImages = Array.from(
    new Set([
      ...(product.imageUrl ? [product.imageUrl] : []),
      ...(product.imageUrls || []),
    ])
  ).filter(Boolean);

  const specEntries = specsToEntries(product.specifications);

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 pb-28 sm:px-6 sm:py-8 lg:px-8">
      <MobileStoreTopBar />
      <SiteBannerStrip placement="PRODUCT_DETAIL" />

      <section className="mx-auto max-w-7xl space-y-3 sm:space-y-5">
        <Link
          href="/online-store"
          className="hidden items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 md:inline-flex"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to store
        </Link>

        <div className="rounded-[24px] bg-white p-3 shadow-md ring-1 ring-slate-200 sm:p-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-6 lg:rounded-[32px] lg:p-8">
          <div className="space-y-2">
            <div className="overflow-hidden rounded-[20px] bg-slate-50 sm:rounded-[28px]">
              {galleryImages.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={galleryImages[0]}
                  alt={product.name}
                  className="h-[220px] w-full object-cover sm:h-[420px]"
                />
              ) : (
                <div className="flex h-[220px] items-center justify-center sm:h-[420px]">
                  <ShoppingBag className="h-16 w-16 text-slate-300" />
                </div>
              )}
            </div>

            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {galleryImages.slice(0, 8).map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-14 w-full object-cover sm:h-20"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3 min-w-0 space-y-2.5 lg:mt-0">
            <div className="flex flex-wrap gap-1.5">
              {product.category ? (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                  {product.category}
                </span>
              ) : null}

              {product.subCategory ? (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  {product.subCategory}
                </span>
              ) : null}

              {product.brand ? (
                <Link
                  href={`/online-store?brand=${encodeURIComponent(
                    product.brand
                  )}`}
                  className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-200"
                >
                  {product.brand}
                </Link>
              ) : null}

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  product.stock <= 3
                    ? "bg-red-100 text-red-700"
                    : product.stock <= 10
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {product.stock <= 3
                  ? `Only ${product.stock} left`
                  : product.stock <= 10
                    ? `Low stock: ${product.stock}`
                    : `Stock ${product.stock}`}
              </span>

              {hasDiscount ? (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                  -{product.discountPercent}% OFF
                </span>
              ) : null}
            </div>

            <h1 className="text-lg font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 sm:text-xs">
              <span className="flex items-center gap-1">
                <span className="flex items-center gap-0.5">
                  {renderStars(averageRating)}
                </span>

                <span className="ml-1 text-slate-700">
                  {averageRating ? averageRating.toFixed(1) : "0.0"}
                </span>

                <span>({reviewCount})</span>

                <Link
                  href={`/online-store/${product.id}/reviews`}
                  className="ml-1 font-black text-orange-600 underline-offset-2 hover:underline"
                >
                  Reviews
                </Link>
              </span>

              <span>•</span>

              <span className="text-slate-600">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            <div className="mt-2">
              {hasDiscount ? (
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-black text-orange-700 sm:text-2xl">
                      {money(finalPrice)}
                    </p>

                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700 sm:px-3 sm:py-1 sm:text-xs">
                      You save {money(Number(product.price) - finalPrice)}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-400 line-through sm:text-sm">
                    {money(product.price)}
                  </p>
                </div>
              ) : (
                <p className="text-xl font-black text-slate-950 sm:text-2xl">
                  {money(product.price)}
                </p>
              )}
            </div>

            <ProductDetailActions
              product={{
                id: product.id,
                name: product.name,
                price: String(product.price),
                imageUrl: product.imageUrl,
                stock: product.stock,
                sizes: product.sizes || [],
                colors: product.colors || [],
              }}
            />

            {product.offerText ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-800">
                <Gift className="mb-2 h-5 w-5" />
                {product.offerText}
              </div>
            ) : null}

            {product.description ? (
              <details className="rounded-2xl bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-black text-slate-950">
                  Description
                </summary>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {product.description}
                </p>
              </details>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {product.warrantyMonths !== null &&
              product.warrantyMonths !== undefined ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <ShieldCheck className="h-5 w-5 text-green-700" />
                  <p className="mt-2 text-sm font-black text-slate-950">
                    Warranty
                  </p>
                  <p className="text-sm text-slate-600">
                    {product.warrantyMonths} month
                    {product.warrantyMonths === 1 ? "" : "s"}
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl bg-slate-50 p-4">
                <PackageCheck className="h-5 w-5 text-orange-700" />
                <p className="mt-2 text-sm font-black text-slate-950">
                  Availability
                </p>
                <p className="text-sm text-slate-600">
                  {product.stock > 0 ? "In stock" : "Out of stock"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {product.keyFeatures.length > 0 ? (
          <details className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[28px] sm:p-6">
            <summary className="flex cursor-pointer items-center gap-2 text-base font-black text-slate-950 sm:text-lg">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Key features
            </summary>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {product.keyFeatures.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700"
                >
                  {feature}
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {product.packageItems.length > 0 ? (
          <details className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[28px] sm:p-6">
            <summary className="flex cursor-pointer items-center gap-2 text-base font-black text-slate-950 sm:text-lg">
              <Box className="h-5 w-5 text-orange-600" />
              Package includes
            </summary>

            <div className="mt-4 flex flex-wrap gap-2">
              {product.packageItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </details>
        ) : null}

        {specEntries.length > 0 ? (
          <details className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[28px] sm:p-6">
            <summary className="cursor-pointer text-base font-black text-slate-950 sm:text-lg">
              Specifications
            </summary>

            <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
              {specEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-[120px_1fr] gap-3 bg-white px-4 py-3 text-sm sm:grid-cols-[180px_1fr]"
                >
                  <span className="font-black text-slate-600">{key}</span>
                  <span className="text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <Link
          href={`/online-store/${product.id}/reviews`}
          className="block rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[28px] sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-600" />
              <h2 className="text-base font-black text-slate-950 sm:text-lg">
                Reviews
              </h2>
            </div>

            <span className="text-xl font-black text-slate-400">›</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-0.5">
                {renderStars(averageRating)}
              </span>

              <span className="ml-1 text-sm font-black text-slate-700">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-500">
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </p>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {reviewCount > 0
              ? "Tap to read verified buyer reviews."
              : "No reviews yet. Verified buyers can review after delivery or pickup."}
          </p>
        </Link>

        {similarProducts.length > 0 ? (
          <section className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[28px] sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">
                Similar products
              </h2>
              <Link
                href="/online-store"
                className="text-xs font-black text-orange-600"
              >
                See all
              </Link>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
              {similarProducts.map((item) => {
                const itemFinalPrice = discountedPrice(
                  item.price,
                  item.discountPercent
                );
                const itemHasDiscount =
                  item.discountPercent && Number(item.discountPercent) > 0;

                return (
                  <Link
                    key={item.id}
                    href={`/online-store/${item.id}`}
                    className="min-w-[145px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.98] hover:shadow-md sm:min-w-0"
                  >
                    <div className="flex h-28 items-center justify-center bg-slate-100">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                      )}
                    </div>

                    <div className="p-3">
                      <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">
                        {item.name}
                      </p>

                      {itemHasDiscount ? (
                        <div className="mt-1">
                          <p className="text-sm font-black text-orange-700">
                            {money(itemFinalPrice)}
                          </p>
                          <p className="text-xs font-bold text-slate-400 line-through">
                            {money(item.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {money(item.price)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}