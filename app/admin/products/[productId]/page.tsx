"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Section = "FAST_FOOD" | "HARDWARE" | "ONLINE_STORE" | "EXCLUSIVE_STORE";
type Status = "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK" | "DELETED";

type Product = {
  id: string;
  name: string;
  barcode?: string | null;
  section: Section;
  category?: string | null;
  subCategory?: string | null;
  price: string;
  stock: number;
  status: Status;
  description?: string | null;
  imageUrl?: string | null;
  sizes?: string[];
  colors?: string[];
  discountPercent?: number;
  brand?: string | null;
  warrantyMonths?: number | null;
  imageUrls?: string[];
  keyFeatures?: string[];
  packageItems?: string[];
  offerText?: string | null;
  specifications?: Record<string, string> | null;
};

type ProductResponse = {
  product?: Product;
  message?: string;
  error?: string;
};

const sections: { value: Section; label: string }[] = [
  { value: "ONLINE_STORE", label: "Online Store" },
  { value: "FAST_FOOD", label: "Fast Food" },
  { value: "EXCLUSIVE_STORE", label: "Exclusive Store" },
  { value: "HARDWARE", label: "Hardware" },
];

const statuses: Status[] = ["ACTIVE", "HIDDEN", "OUT_OF_STOCK", "DELETED"];

const categoryPresets: Record<Section, string[]> = {
  ONLINE_STORE: [
    "Electronics",
    "Phones",
    "Accessories",
    "Clothing",
    "Shoes",
    "Beauty",
    "Household",
    "Stationery",
    "Appliances",
  ],
  FAST_FOOD: [
    "Meals",
    "Snacks",
    "Drinks",
    "Chicken",
    "Fries",
    "Breakfast",
    "Rice",
    "Chapati",
  ],
  HARDWARE: ["Tools", "Paint", "Plumbing", "Electrical", "Building Materials"],
  EXCLUSIVE_STORE: ["Premium", "Luxury", "Special Offers", "Limited Edition"],
};

const subCategoryPresets: Record<string, string[]> = {
  Phones: ["Tecno", "Samsung", "Infinix", "iPhone", "Oppo", "Xiaomi", "Nokia"],
  Appliances: [
    "Fridges",
    "Freezers",
    "Dispensers",
    "Washers/Dryers",
    "Dishwashers",
    "Small Appliances",
  ],
  Electronics: ["TVs", "Audio", "Cameras", "Computers", "Gaming"],
  Accessories: ["Earbuds", "Chargers", "Cables", "Cases", "Smart Watches"],
  "Small Appliances": [
    "Blenders",
    "Kettles",
    "Ironing & Laundry",
    "Toasters",
    "Microwave Ovens",
  ],
};

function cleanLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(value: string) {
  const rows = cleanLines(value);
  const specs: Record<string, string> = {};

  for (const row of rows) {
    const [key, ...rest] = row.split(":");
    const finalKey = key?.trim();
    const finalValue = rest.join(":").trim();

    if (finalKey && finalValue) {
      specs[finalKey] = finalValue;
    }
  }

  return specs;
}

function specsToText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  return Object.entries(value as Record<string, unknown>)
    .map(([key, val]) => `${key}: ${String(val || "")}`)
    .join("\n");
}

function validateProductClassification({
  section,
  category,
  subCategory,
  brand,
}: {
  section: Section;
  category: string;
  subCategory: string;
  brand: string;
}) {
  if (section !== "ONLINE_STORE") return true;

  if (category === "Phones" && !subCategory && !brand) {
    window.alert(
      "Phones require a brand/subcategory. Select or enter Tecno, Samsung, Infinix, iPhone, Oppo, Xiaomi, etc."
    );
    return false;
  }

  if (category === "Appliances" && !subCategory) {
    window.alert(
      "Appliances require a subcategory. Select Fridges, Freezers, Dispensers, Washers/Dryers, Dishwashers, or Small Appliances."
    );
    return false;
  }

  if (category === "Electronics" && !subCategory) {
    window.alert(
      "Electronics require a subcategory. Select TVs, Audio, Cameras, Computers, or Gaming."
    );
    return false;
  }

  return true;
}

export default function ManageProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = String(params.productId || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [section, setSection] = useState<Section>("ONLINE_STORE");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [discountPercent, setDiscountPercent] = useState("0");

  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [brand, setBrand] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [specificationsText, setSpecificationsText] = useState("");
  const [packageItems, setPackageItems] = useState("");
  const [offerText, setOfferText] = useState("");
  const [description, setDescription] = useState("");

  const finalCategory = customCategory.trim() || category.trim();

  const previewImages = useMemo(() => {
    return Array.from(
      new Set([imageUrl, ...cleanLines(imageUrls)].filter(Boolean))
    );
  }, [imageUrl, imageUrls]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/products/${productId}`);
      const data = (await response.json()) as ProductResponse;

      if (!response.ok || !data.product) {
        setError(data.error || "Unable to load product.");
        return;
      }

      const product = data.product;

      setName(product.name || "");
      setBarcode(product.barcode || "");
      setSection(product.section || "ONLINE_STORE");
      setCategory(product.category || "");
      setCustomCategory("");
      setSubCategory(product.subCategory || "");
      setPrice(String(product.price || ""));
      setStock(String(product.stock ?? ""));
      setStatus(product.status || "ACTIVE");
      setDiscountPercent(String(product.discountPercent || 0));

      setImageUrl(product.imageUrl || "");
      setImageUrls((product.imageUrls || []).join("\n"));
      setBrand(product.brand || "");
      setWarrantyMonths(
        product.warrantyMonths === null || product.warrantyMonths === undefined
          ? ""
          : String(product.warrantyMonths)
      );
      setSizes((product.sizes || []).join(", "));
      setColors((product.colors || []).join(", "));
      setKeyFeatures((product.keyFeatures || []).join("\n"));
      setSpecificationsText(specsToText(product.specifications));
      setPackageItems((product.packageItems || []).join("\n"));
      setOfferText(product.offerText || "");
      setDescription(product.description || "");
    } catch {
      setError("Something went wrong while loading product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) void loadProduct();
  }, [productId]);

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setSaving(true);

      const finalSubCategory = subCategory.trim();

      const classificationOk = validateProductClassification({
        section,
        category: finalCategory,
        subCategory: finalSubCategory,
        brand: brand.trim(),
      });

      if (!classificationOk) {
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          barcode,
          section,
          category: finalCategory,
          subCategory: finalSubCategory,
          price,
          stock,
          status,
          discountPercent,
          imageUrl,
          imageUrls: cleanLines(imageUrls),
          brand,
          warrantyMonths,
          sizes: cleanLines(sizes.replaceAll(",", "\n")),
          colors: cleanLines(colors.replaceAll(",", "\n")),
          keyFeatures: cleanLines(keyFeatures),
          specifications: parseSpecifications(specificationsText),
          packageItems: cleanLines(packageItems),
          offerText,
          description,
        }),
      });

      const data = (await response.json()) as ProductResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update product.");
        return;
      }

      setMessage(data.message || "Product updated successfully.");
      await loadProduct();
    } catch {
      setError("Something went wrong while saving product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell
      badge="Manage product"
      title="Product editor"
      subtitle="Edit product information, stock, category, images, warranty, offers, specifications, and customer-facing details."
    >
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <form
          onSubmit={saveProduct}
          className="rounded-[32px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Edit product
              </h2>
              <p className="mt-1 break-all text-xs text-slate-500">
                ID: {productId}
              </p>
            </div>

            <Link
              href="/admin/products"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Back to products
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm font-bold text-slate-600">
              Loading product...
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Barcode / QR code"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />

                <select
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value as Section);
                    setCategory("");
                    setCustomCategory("");
                    setSubCategory("");
                  }}
                >
                  {sections.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCustomCategory("");
                    setSubCategory("");
                  }}
                >
                  <option value="">Select category</option>
                  {categoryPresets[section].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600 md:col-span-2"
                  placeholder="Custom category optional"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />

                {subCategoryPresets[finalCategory]?.length ||
                finalCategory === "Phones" ? (
                  <select
                    className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600 md:col-span-2"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    <option value="">
                      {finalCategory === "Phones"
                        ? "Select phone brand"
                        : "Select subcategory"}
                    </option>
                    {(subCategoryPresets[finalCategory] || []).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600 md:col-span-2"
                    placeholder="Subcategory optional"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />

                <input
                  type="number"
                  min="0"
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />

                <input
                  type="number"
                  min="0"
                  max="90"
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Discount %"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />

                <select
                  className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-950">
                  Product media and details
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                    placeholder="Main image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />

                  <input
                    className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                    placeholder="Brand e.g. Tecno, Samsung"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />

                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                    placeholder="Warranty months"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                  />

                  <input
                    className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                    placeholder="Offer text"
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                  />
                </div>

                <textarea
                  className="mt-4 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder="Extra image URLs, one per line"
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <textarea
                  className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder="Sizes comma-separated e.g. S,M,L"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                />

                <textarea
                  className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder="Colors comma-separated e.g. Black,Blue"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />

                <textarea
                  className="min-h-32 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder="Key features, one per line"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                />

                <textarea
                  className="min-h-32 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder={
                    "Specifications using key: value\nRAM: 8GB\nStorage: 256GB"
                  }
                  value={specificationsText}
                  onChange={(e) => setSpecificationsText(e.target.value)}
                />

                <textarea
                  className="min-h-32 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder="Package items, one per line"
                  value={packageItems}
                  onChange={(e) => setPackageItems(e.target.value)}
                />

                <textarea
                  className="min-h-32 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder="Full product description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-2xl bg-orange-600 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {saving ? "Saving product..." : "Save product changes"}
              </button>
            </div>
          )}
        </form>

        <aside className="space-y-4">
          <div className="rounded-[32px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h3 className="text-xl font-black text-slate-950">Preview</h3>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="flex h-52 items-center justify-center bg-slate-100">
                {previewImages[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImages[0]}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-slate-400">
                    No image
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {finalCategory ? (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                      {finalCategory}
                    </span>
                  ) : null}

                  {subCategory ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                      {subCategory}
                    </span>
                  ) : null}

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    Stock {stock || 0}
                  </span>
                </div>

                <h4 className="mt-3 text-lg font-black text-slate-950">
                  {name || "Product name"}
                </h4>

                <p className="mt-1 text-xl font-black text-slate-950">
                  KES {Number(price || 0).toLocaleString()}
                </p>

                {brand ? (
                  <p className="mt-2 text-sm text-slate-500">Brand: {brand}</p>
                ) : null}

                {offerText ? (
                  <div className="mt-3 rounded-2xl bg-orange-50 p-3 text-xs font-bold text-orange-800">
                    {offerText}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h3 className="text-xl font-black text-slate-950">Next cleanup</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              After this page works, we can simplify the main inventory page to a
              compact list with only Restock, Visibility, and Manage.
            </p>
          </div>
        </aside>
      </section>
    </ProtectedShell>
  );
}