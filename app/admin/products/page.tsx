"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";
import Link from "next/link";
import { Star } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  barcode?: string | null;
  section: "FAST_FOOD" | "HARDWARE" | "ONLINE_STORE" | "EXCLUSIVE_STORE";
  category?: string | null;
  subCategory?: string | null;
  stock: number;
  status: "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK" | "DELETED";
  sizes?: string[];
  colors?: string[];
  discountPercent?: number;
  reviews?: { rating: number }[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
};

type ProductsResponse = {
  products?: Product[];
  product?: Product;
  message?: string;
  error?: string;
};

const sections = [
  { value: "FAST_FOOD", label: "Fast Food" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "ONLINE_STORE", label: "Online Store" },
  { value: "EXCLUSIVE_STORE", label: "Exclusive Store" },
] as const;

const categoryPresets: Record<Product["section"], string[]> = {
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

const statuses = ["ACTIVE", "HIDDEN", "OUT_OF_STOCK", "DELETED"] as const;

function formatSection(section: string) {
  if (section === "FAST_FOOD") return "Fast Food";
  if (section === "HARDWARE") return "Hardware";
  if (section === "ONLINE_STORE") return "Online Store";
  if (section === "EXCLUSIVE_STORE") return "Exclusive Store";
  return section;
}

function cleanCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(value: string) {
    const rows = value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
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

function validateProductClassification({
  section,
  category,
  subCategory,
  brand,
}: {
  section: Product["section"];
  category: string;
  subCategory: string;
  brand: string;
}) {
  if (section !== "ONLINE_STORE") return true;

  if (category === "Phones") {
    if (!subCategory && !brand) {
      window.alert(
        "Phones require a brand/subcategory. Select or enter Tecno, Samsung, Infinix, iPhone, Oppo, Xiaomi, etc."
      );
      return false;
    }
  }

  if (category === "Appliances") {
    if (!subCategory) {
      window.alert(
        "Appliances require a subcategory. Select Fridges, Freezers, Dispensers, Washers/Dryers, Dishwashers, or Small Appliances."
      );
      return false;
    }
  }

  if (category === "Electronics") {
    if (!subCategory) {
      window.alert(
        "Electronics require a subcategory. Select TVs, Audio, Cameras, Computers, or Gaming."
      );
      return false;
    }
  }

  return true;
}

function renderMiniStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={index}
      className={`h-3.5 w-3.5 ${
        index < Math.round(rating)
          ? "fill-orange-500 text-orange-500"
          : "text-slate-300"
      }`}
    />
  ));
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [section, setSection] = useState<Product["section"]>("ONLINE_STORE");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");

  const [brand, setBrand] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [packageItems, setPackageItems] = useState("");
  const [offerText, setOfferText] = useState("");
  const [specificationsText, setSpecificationsText] = useState("");

  const [scanCode, setScanCode] = useState("");
  const [scanProduct, setScanProduct] = useState<Product | null>(null);

  const [filter, setFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    imageUrl: "",
});
  const [customRestock, setCustomRestock] = useState<Record<string, string>>({});
  const [customDiscounts, setCustomDiscounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const chosenCategory = customCategory.trim() || category;
  const chosenSubCategory = subCategory.trim();
  const showVariants =
    chosenCategory === "Clothing" ||
    chosenCategory === "Shoes" ||
    section === "EXCLUSIVE_STORE";

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/products");
      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load products.");
        return;
      }

      setProducts(data.products || []);
    } catch {
      setError("Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const productStats = useMemo(() => {
    const visible = products.filter((product) => product.status !== "DELETED");

    return {
      total: visible.length,
      active: visible.filter((product) => product.status === "ACTIVE").length,
      lowStock: visible.filter(
        (product) => product.stock > 0 && product.stock <= 5
      ).length,
      outOfStock: visible.filter(
        (product) => product.stock <= 0 || product.status === "OUT_OF_STOCK"
      ).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      if (product.status === "DELETED") return false;

      const matchesSection = filter === "ALL" || product.section === filter;

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW" && product.stock > 0 && product.stock <= 5) ||
        (stockFilter === "OUT" &&
          (product.stock <= 0 || product.status === "OUT_OF_STOCK")) ||
        (stockFilter === "ACTIVE" && product.status === "ACTIVE");

      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.barcode || "").toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term);

      return matchesSection && matchesStock && matchesSearch;
    });
  }, [filter, products, search, stockFilter]);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setSaving(true);

      const finalCategory = customCategory.trim() || category.trim();
      const finalSubCategory = subCategory.trim();

const classificationOk = validateProductClassification({
  section,
  category: finalCategory,
  subCategory: finalSubCategory,
  brand,
});

if (!classificationOk) {
  setSaving(false);
  return;
}
      const response = await fetch("/api/admin/products", {
        method: "POST",
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
          description,
          imageUrl,
          sizes: showVariants ? cleanCsv(sizes) : [],
          colors: showVariants ? cleanCsv(colors) : [],
          discountPercent,
          brand,
          warrantyMonths,
          imageUrls: cleanLines(imageUrls),
          keyFeatures: cleanLines(keyFeatures),
          packageItems: cleanLines(packageItems),
          offerText,
          specifications: parseSpecifications(specificationsText),
        }),
      });

      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to add product.");
        return;
      }

      setMessage(data.message || "Product added successfully.");
      setName("");
      setBarcode("");
      setCategory("");
      setCustomCategory("");
      setSubCategory("");
      setPrice("");
      setStock("0");
      setDescription("");
      setImageUrl("");
      setSizes("");
      setColors("");
      setDiscountPercent("0");
      setBrand("");
      setWarrantyMonths("");
      setKeyFeatures("");
      setPackageItems("");
      setOfferText("");
      setSpecificationsText("");

      await loadProducts();
    } catch {
      setError("Something went wrong while adding product.");
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (
    productId: string,
    input: {
      name?: string;
      price?: string | number;
      stock?: number;
      category?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      status?: Product["status"];
      section?: Product["section"];
      barcode?: string | null;
      discountPercent?: number;
    }
  ) => {
    try {
      setSavingId(productId);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          ...input,
        }),
      });

      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update product.");
        return;
      }

      setMessage(data.message || "Product updated successfully.");
      await loadProducts();
    } catch {
      setError("Something went wrong while updating product.");
    } finally {
      setSavingId("");
    }
  };

  const restockProduct = async (productId: string, quantity: number) => {
    try {
      setSavingId(productId);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/products/restock", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "Unable to restock product.");
        return;
      }

      setMessage(data.message || "Product restocked successfully.");
      setCustomRestock((current) => ({
        ...current,
        [productId]: "",
      }));

      await loadProducts();
    } catch {
      setError("Something went wrong while restocking product.");
    } finally {
      setSavingId("");
    }
  };

  const findProductByBarcode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setScanProduct(null);

    const code = scanCode.trim();

    if (!code) {
      setError("Enter or scan a barcode first.");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/products/barcode?barcode=${encodeURIComponent(code)}`
      );

      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        setError(data.error || "No product found for this barcode.");
        return;
      }

      setScanProduct(data.product || null);
      setMessage("Product found. You can now restock it.");
    } catch {
      setError("Unable to search barcode right now.");
    }
  };

  return (
    <ProtectedShell
      badge="Admin store"
      title="Store management"
      subtitle="Add products, set categories, control size/color options, scan barcodes, restock items, and manage inventory."
    >
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Add product
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Products marked active appear on customer-facing store pages.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleAddProduct}>
              <input
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Barcode / QR code optional"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />

              <select
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value as Product["section"]);
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
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
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
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Or type custom category optional"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />

              {(subCategoryPresets[chosenCategory]?.length || chosenCategory === "Phones") ? (
                <select
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                   <option value="">
                    {chosenCategory === "Phones"? "Select phone brand" : "Select subcategory"}
                   </option>

                   {(subCategoryPresets[chosenCategory] || []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                ) : (
                   <input
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                      placeholder="Subcategory optional"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                    />
                    )}

              {showVariants ? (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-black text-orange-800">
                    Product options enabled
                  </p>
                  <p className="mt-1 text-xs leading-5 text-orange-700">
                    Use comma-separated options. Example sizes: S,M,L,XL,XXL.
                    Example colors: Black,Blue,White.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                      className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:border-orange-600"
                      placeholder="Sizes e.g. S,M,L,XL"
                      value={sizes}
                      onChange={(e) => setSizes(e.target.value)}
                    />

                    <input
                      className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:border-orange-600"
                      placeholder="Colors e.g. Black,Blue,White"
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  Size/color options are hidden for this category. Choose
                  Clothing, Shoes, or Exclusive Store if the product needs
                  variants.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />

                <input
                  type="number"
                  min="0"
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Opening stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />

                <input
                  type="number"
                  min="0"
                  max="90"
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Discount % e.g. 18"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
              </div>

              <input
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Image URL optional"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-800">
                    Advanced product details
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                   Optional fields for product detail page. These stay hidden from inventory
                   cards so the admin page does not get crowded.
                </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Brand e.g. Tecno, Samsung, Hisense"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />

                <input
                  type="number"
                  min="0"
                  max="120"
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                  placeholder="Warranty months e.g. 12"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                />
             </div>

                <textarea
                  className="mt-4 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder={"Extra image URLs, one per line"}
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                />

                <textarea
                  className="mt-4 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder={"Key features, one per line\nExample:\n8GB RAM\n256GB storage\n5000mAh battery"}
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                />

                <textarea
                  className="mt-4 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder={"Specifications, one per line using key: value\nExample:\nRAM: 8GB\nStorage: 256GB\nBattery: 5000mAh"}
                  value={specificationsText}
                  onChange={(e) => setSpecificationsText(e.target.value)}
                />

                <textarea
                  className="mt-4 min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                  placeholder={"Package items, one per line\nExample:\nPhone\nCharger\nFree earbuds"}
                  value={packageItems}
                  onChange={(e) => setPackageItems(e.target.value)}
                />

                <input
                   className="mt-4 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                   placeholder="Offer text e.g. Free earbuds included while stock lasts"
                   value={offerText}
                   onChange={(e) => setOfferText(e.target.value)}
                 />
                </div>

              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
                placeholder="Description optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
              >
                {saving ? "Adding product..." : "Add product"}
              </button>
            </form>
          </div>

          <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Barcode / QR stock intake
            </h2>

            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={findProductByBarcode}
            >
              <input
                autoFocus
                className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Scan or type barcode, then press Enter"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
              />

              <button
                type="submit"
                className="h-12 rounded-2xl bg-orange-600 px-6 text-sm font-black text-white hover:bg-orange-700"
              >
                Find product
              </button>
            </form>

            {scanProduct ? (
              <div className="mt-5 rounded-[24px] border border-green-200 bg-green-50 p-5">
                <h3 className="text-lg font-black text-slate-950">
                  {scanProduct.name}
                </h3>
                <p className="mt-1 text-sm text-slate-700">
                  Barcode: {scanProduct.barcode || "Not set"} · Stock{" "}
                  {scanProduct.stock} · {scanProduct.status}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[1, 5, 10, 20].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      disabled={savingId === scanProduct.id}
                      onClick={() => restockProduct(scanProduct.id, qty)}
                      className="rounded-2xl bg-orange-600 px-4 py-2 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      Restock +{qty}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard title="Products" value={productStats.total} dark />
            <StatCard title="Active" value={productStats.active} />
            <StatCard title="Low stock" value={productStats.lowStock} warn />
            <StatCard title="Out of stock" value={productStats.outOfStock} danger />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Inventory
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Restock products quickly and monitor low-stock items.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadProducts()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <input
              className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
              placeholder="Search product/barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All sections</option>
              {sections.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="ALL">All stock</option>
              <option value="ACTIVE">Active only</option>
              <option value="LOW">Low stock ≤ 5</option>
              <option value="OUT">Out of stock</option>
            </select>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No products found.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
  {filteredProducts.map((product) => {
    const isLowStock = product.stock > 0 && product.stock <= 5;
    const isOut = product.stock <= 0 || product.status === "OUT_OF_STOCK";
    const customQty = Number(customRestock[product.id] || 0);
    const reviewCount =
      product.reviewCount ?? product.reviews?.length ?? 0;

const averageRating =
  product.averageRating ??
  (reviewCount > 0 && product.reviews
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviewCount
    : 0);

    return (
      <div
        key={product.id}
        className={`rounded-[24px] border p-4 shadow-sm ${
          isOut
            ? "border-red-200 bg-red-50"
            : isLowStock
              ? "border-orange-200 bg-orange-50"
              : "border-slate-200 bg-white"
        }`}
      >
        <div className="space-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {formatSection(product.section)}
              </span>

              {product.category ? (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  {product.category}
                </span>
              ) : null}

              {product.subCategory ? (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  {product.subCategory}
                </span>
              ) : null}

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {product.status}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isOut
                    ? "bg-red-100 text-red-700"
                    : isLowStock
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                Stock {product.stock}
              </span>

              {product.barcode ? (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  {product.barcode}
                </span>
              ) : null}

              {product.discountPercent && product.discountPercent > 0 ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                  {product.discountPercent}% OFF
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 line-clamp-1 text-lg font-black text-slate-950">
              {product.name}
            </h3>

            <p className="mt-1 text-sm font-bold text-slate-700">
              KES {Number(product.price).toLocaleString()}
            </p>

            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-0.5">
                {renderMiniStars(averageRating)}
              </span>

              <span className="ml-1">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </span>

              <span>({reviewCount})</span>
          </div>

            {product.description ? (
              <p className="mt-2 line-clamp-1 text-sm text-slate-500">
                {product.description}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <Link
                href={`/admin/products/${product.id}`}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-orange-600 px-3 text-xs font-black text-white hover:bg-orange-700"
              >
                Manage
              </Link>

              <Link
                href={`/admin/reviews?productId=${product.id}`}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700"
              >
                Reviews
              </Link>

              {[1, 5, 10].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  disabled={savingId === product.id}
                  onClick={() => restockProduct(product.id, qty)}
                  className="h-10 rounded-2xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  +{qty}
                </button>
              ))}
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <input
                type="number"
                min="1"
                className="h-10 rounded-2xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-600"
                placeholder="Custom stock"
                value={customRestock[product.id] || ""}
                onChange={(e) =>
                  setCustomRestock((current) => ({
                    ...current,
                    [product.id]: e.target.value,
                  }))
                }
              />

              <button
                type="button"
                disabled={
                  savingId === product.id ||
                  !Number.isInteger(customQty) ||
                  customQty < 1
                }
                onClick={() => restockProduct(product.id, customQty)}
                className="h-10 rounded-2xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Add stock
              </button>

              <button
                type="button"
                disabled={savingId === product.id}
                onClick={() =>
                  updateProduct(product.id, {
                    status: product.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
                  })
                }
                className="h-10 rounded-2xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {product.status === "ACTIVE" ? "Hide" : "Activate"}
              </button>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                type="number"
                min="0"
                max="90"
                className="h-10 rounded-2xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-600"
                placeholder={`Discount ${product.discountPercent || 0}%`}
                value={customDiscounts[product.id] ?? ""}
                onChange={(e) =>
                  setCustomDiscounts((current) => ({
                    ...current,
                    [product.id]: e.target.value,
                  }))
                }
              />

              <button
                type="button"
                disabled={savingId === product.id}
                onClick={() =>
                  updateProduct(product.id, {
                    discountPercent: Number(customDiscounts[product.id] || 0),
                  })
                }
                className="h-10 rounded-2xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Save discount
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
          )}
        </div>
      </section>
    </ProtectedShell>
  );
}

function StatCard({
  title,
  value,
  dark,
  warn,
  danger,
}: {
  title: string;
  value: number;
  dark?: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] p-5 ring-1 ${
        dark
          ? "bg-orange-600 text-white ring-slate-950"
          : warn
            ? "bg-orange-50 text-orange-800 ring-orange-200"
            : danger
              ? "bg-red-50 text-red-800 ring-red-200"
              : "bg-white text-slate-950 ring-slate-200"
      }`}
    >
      <p
        className={`text-sm ${
          dark ? "text-white/60" : warn || danger ? "" : "text-slate-500"
        }`}
      >
        {title}
      </p>
      <h3 className="mt-2 text-3xl font-black">{value}</h3>
    </div>
  );
}