import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";

type Props = {
  params: Promise<{
    brand: string;
  }>;
};

function money(value: number) {
  return `KES ${Number(value).toLocaleString()}`;
}

function discountedPrice(price: number, discountPercent?: number | null) {
  const discount = Number(discountPercent || 0);

  if (!Number.isFinite(price) || discount <= 0) return price;

  return Math.max(0, price - (price * discount) / 100);
}

function prettyBrand(value: string) {
  return decodeURIComponent(value).replace(/-/g, " ").trim();
}

export default async function BrandPage({ params }: Props) {
  const { brand } = await params;
  const brandName = prettyBrand(brand);

  const products = await db.product.findMany({
    where: {
      brand: {
        equals: brandName,
        mode: "insensitive",
      },
      status: "ACTIVE",
      stock: {
        gt: 0,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      category: true,
      subCategory: true,
      brand: true,
      stock: true,
      discountPercent: true,
      description: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/online-store"
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to store
        </Link>

        <div className="rounded-[32px] bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
          <p className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-black text-orange-700">
            Brand page
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {brandName}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {products.length} product(s) available from this brand.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-600">
            No active products found for this brand yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map((product) => {
              const price = Number(product.price);
              const finalPrice = discountedPrice(
                price,
                product.discountPercent
              );

              return (
                <Link
                  key={product.id}
                  href={`/online-store/${product.id}`}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-36 items-center justify-center bg-slate-100 sm:h-40">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-10 w-10 text-slate-300" />
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex flex-wrap gap-1">
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
                    </div>

                    <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">
                      {product.name}
                    </h2>

                    <p className="mt-1 text-sm font-black text-slate-950">
                      {money(finalPrice)}
                    </p>

                    {product.discountPercent && product.discountPercent > 0 ? (
                      <p className="mt-1 text-xs font-bold text-red-600">
                        {product.discountPercent}% OFF
                      </p>
                    ) : null}

                    <p className="mt-1 text-xs text-slate-500">
                      Stock {product.stock}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}