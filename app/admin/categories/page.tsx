"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

type MobileCategoryItem = {
  id: string;
  name: string;
  image?: string | null;
  targetType: string;
  targetValue: string;
  sortOrder: number;
  isActive: boolean;
};

type MobileCategoryPanel = {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  items: MobileCategoryItem[];
};

type MobileCategory = {
  id: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  panels: MobileCategoryPanel[];
};

type ApiResponse = {
  categories?: MobileCategory[];
  message?: string;
  error?: string;
};

const targetTypes = ["CATEGORY", "SUBCATEGORY", "BRAND"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<MobileCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedPanelId, setSelectedPanelId] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categorySort, setCategorySort] = useState("0");

  const [panelTitle, setPanelTitle] = useState("");
  const [panelSort, setPanelSort] = useState("0");

  const [itemName, setItemName] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemTargetType, setItemTargetType] = useState("CATEGORY");
  const [itemTargetValue, setItemTargetValue] = useState("");
  const [itemSort, setItemSort] = useState("0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const selectedPanel = useMemo(
    () =>
      selectedCategory?.panels.find((panel) => panel.id === selectedPanelId) ||
      null,
    [selectedCategory, selectedPanelId]
  );

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/mobile-categories");
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setError(data.error || "Unable to load mobile categories.");
        return;
      }

      const nextCategories = data.categories || [];
      setCategories(nextCategories);

      if (!selectedCategoryId && nextCategories[0]) {
        setSelectedCategoryId(nextCategories[0].id);
        setSelectedPanelId(nextCategories[0].panels[0]?.id || "");
      }
    } catch {
      setError("Something went wrong while loading mobile categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving("category");
      setNotice("");
      setError("");

      const res = await fetch("/api/admin/mobile-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          icon: categoryIcon,
          sortOrder: Number(categorySort || 0),
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to create category.");
        return;
      }

      setNotice(data.message || "Category created.");
      setCategoryName("");
      setCategoryIcon("");
      setCategorySort("0");
      await loadCategories();
    } catch {
      setError("Something went wrong while creating category.");
    } finally {
      setSaving("");
    }
  };

  const createPanel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCategoryId) {
      setError("Select a category first.");
      return;
    }

    try {
      setSaving("panel");
      setNotice("");
      setError("");

      const res = await fetch("/api/admin/mobile-categories/panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          title: panelTitle,
          sortOrder: Number(panelSort || 0),
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to create panel.");
        return;
      }

      setNotice(data.message || "Panel created.");
      setPanelTitle("");
      setPanelSort("0");
      await loadCategories();
    } catch {
      setError("Something went wrong while creating panel.");
    } finally {
      setSaving("");
    }
  };

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPanelId) {
      setError("Select a panel first.");
      return;
    }

    try {
      setSaving("item");
      setNotice("");
      setError("");

      const res = await fetch("/api/admin/mobile-categories/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: selectedPanelId,
          name: itemName,
          image: itemImage,
          targetType: itemTargetType,
          targetValue: itemTargetValue,
          sortOrder: Number(itemSort || 0),
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to create item.");
        return;
      }

      setNotice(data.message || "Panel item created.");
      setItemName("");
      setItemImage("");
      setItemTargetValue("");
      setItemSort("0");
      await loadCategories();
    } catch {
      setError("Something went wrong while creating item.");
    } finally {
      setSaving("");
    }
  };

  const toggleCategory = async (category: MobileCategory) => {
    await patch(`/api/admin/mobile-categories/${category.id}`, {
      isActive: !category.isActive,
    });
  };

  const togglePanel = async (panel: MobileCategoryPanel) => {
    await patch(`/api/admin/mobile-categories/panels/${panel.id}`, {
      isActive: !panel.isActive,
    });
  };

  const toggleItem = async (item: MobileCategoryItem) => {
    await patch(`/api/admin/mobile-categories/items/${item.id}`, {
      isActive: !item.isActive,
    });
  };

  const patch = async (url: string, body: object) => {
    try {
      setNotice("");
      setError("");

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to update.");
        return;
      }

      setNotice(data.message || "Updated.");
      await loadCategories();
    } catch {
      setError("Something went wrong while updating.");
    }
  };

  const remove = async (url: string, label: string) => {
    if (!window.confirm(`Delete ${label}?`)) return;

    try {
      setNotice("");
      setError("");

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to delete.");
        return;
      }

      setNotice(data.message || "Deleted.");
      await loadCategories();
    } catch {
      setError("Something went wrong while deleting.");
    }
  };

  return (
    <ProtectedShell
      badge="Admin categories"
      title="Mobile category browser"
      subtitle="Control the Jumia-style mobile left rail, right panels, icons, brand tiles, and click targets."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Left rail categories
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {categories.length}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Right panels
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {categories.reduce(
                (sum, category) => sum + category.panels.length,
                0
              )}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Panel items
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {categories.reduce(
                (sum, category) =>
                  sum +
                  category.panels.reduce(
                    (panelSum, panel) => panelSum + panel.items.length,
                    0
                  ),
                0
              )}
            </p>
          </div>
        </div>

        {notice ? (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <form
            onSubmit={createCategory}
            className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-black text-slate-950">
              Add left rail category
            </h2>

            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Phones"
              className="mt-4 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <input
              value={categoryIcon}
              onChange={(e) => setCategoryIcon(e.target.value)}
              placeholder="Icon path e.g. /category-icons/phones.png"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <input
              value={categorySort}
              onChange={(e) => setCategorySort(e.target.value)}
              placeholder="Sort order"
              type="number"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <button
              type="submit"
              disabled={saving === "category"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white disabled:bg-slate-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving === "category" ? "Adding..." : "Add category"}
            </button>
          </form>

          <form
            onSubmit={createPanel}
            className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-black text-slate-950">
              Add right-side panel
            </h2>

            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                const next = categories.find((c) => c.id === e.target.value);
                setSelectedPanelId(next?.panels[0]?.id || "");
              }}
              className="mt-4 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              value={panelTitle}
              onChange={(e) => setPanelTitle(e.target.value)}
              placeholder="Panel title e.g. Top Brands"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <input
              value={panelSort}
              onChange={(e) => setPanelSort(e.target.value)}
              placeholder="Sort order"
              type="number"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <button
              type="submit"
              disabled={saving === "panel"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white disabled:bg-slate-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving === "panel" ? "Adding..." : "Add panel"}
            </button>
          </form>

          <form
            onSubmit={createItem}
            className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-black text-slate-950">
              Add panel item
            </h2>

            <select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              className="mt-4 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            >
              <option value="">Select panel</option>
              {categories.flatMap((category) =>
                category.panels.map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {category.name} / {panel.title}
                  </option>
                ))
              )}
            </select>

            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item name e.g. Tecno"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <input
              value={itemImage}
              onChange={(e) => setItemImage(e.target.value)}
              placeholder="Image/icon path e.g. /brand-logos/tecno.png"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <select
              value={itemTargetType}
              onChange={(e) => setItemTargetType(e.target.value)}
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            >
              {targetTypes.map((target) => (
                <option key={target} value={target}>
                  {target}
                </option>
              ))}
            </select>

            <input
              value={itemTargetValue}
              onChange={(e) => setItemTargetValue(e.target.value)}
              placeholder="Target value e.g. Tecno or Phones"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <input
              value={itemSort}
              onChange={(e) => setItemSort(e.target.value)}
              placeholder="Sort order"
              type="number"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <button
              type="submit"
              disabled={saving === "item"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white disabled:bg-slate-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving === "item" ? "Adding..." : "Add item"}
            </button>
          </form>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Current mobile category browser
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                These entries will later replace hardcoded mobile category
                panels when connected to the store page.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadCategories()}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-5 text-sm font-bold text-slate-500">
              Loading categories...
            </p>
          ) : categories.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No mobile categories yet. Add one above.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                        {category.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.icon}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Layers3 className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-950">
                          {category.name}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          Sort {category.sortOrder} ·{" "}
                          {category.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleCategory(category)}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-800 px-3 text-xs font-black text-white"
                      >
                        {category.isActive ? (
                          <EyeOff className="mr-1 h-4 w-4" />
                        ) : (
                          <Eye className="mr-1 h-4 w-4" />
                        )}
                        {category.isActive ? "Hide" : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void remove(
                            `/api/admin/mobile-categories/${category.id}`,
                            category.name
                          )
                        }
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-black text-white"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {category.panels.map((panel) => (
                      <div
                        key={panel.id}
                        className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-950">
                              {panel.title}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              Sort {panel.sortOrder} ·{" "}
                              {panel.isActive ? "Active" : "Inactive"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void togglePanel(panel)}
                              className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-white"
                            >
                              {panel.isActive ? "Hide" : "Show"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void remove(
                                  `/api/admin/mobile-categories/panels/${panel.id}`,
                                  panel.title
                                )
                              }
                              className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {panel.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"
                            >
                              <div className="flex h-12 items-center justify-center rounded-xl bg-white">
                                {item.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-slate-300" />
                                )}
                              </div>

                              <p className="mt-2 line-clamp-1 text-xs font-black text-slate-950">
                                {item.name}
                              </p>

                              <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-500">
                                {item.targetType}: {item.targetValue}
                              </p>

                              <div className="mt-2 flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => void toggleItem(item)}
                                  className="flex-1 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-black text-white"
                                >
                                  {item.isActive ? "Hide" : "Show"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void remove(
                                      `/api/admin/mobile-categories/items/${item.id}`,
                                      item.name
                                    )
                                  }
                                  className="flex-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}

                          {panel.items.length === 0 ? (
                            <div className="rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
                              No items yet.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}

                    {category.panels.length === 0 ? (
                      <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
                        No panels yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </ProtectedShell>
  );
}