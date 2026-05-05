"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

type MobileSectionItem = {
  id: string;
  name: string;
  image?: string | null;
  targetType: string;
  targetValue: string;
  sortOrder: number;
  isActive: boolean;
};

type MobileSection = {
  id: string;
  title: string;
  type: string;
  sortOrder: number;
  isActive: boolean;
  items: MobileSectionItem[];
};

type ApiResponse = {
  sections?: MobileSection[];
  message?: string;
  error?: string;
};

const sectionTypes = ["FLASH", "DEALS", "RECOMMENDED", "NEW_ARRIVALS", "NORMAL"];
const targetTypes = ["CATEGORY", "SUBCATEGORY", "BRAND", "DEAL"];

export default function AdminMobileSectionsPage() {
  const [sections, setSections] = useState<MobileSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionType, setSectionType] = useState("NORMAL");
  const [sectionSort, setSectionSort] = useState("0");

  const [itemName, setItemName] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemTargetType, setItemTargetType] = useState("CATEGORY");
  const [itemTargetValue, setItemTargetValue] = useState("");
  const [itemSort, setItemSort] = useState("0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId),
    [sections, selectedSectionId]
  );

  const totalItems = sections.reduce(
    (sum, section) => sum + section.items.length,
    0
  );

  const loadSections = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/mobile-sections");
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setError(data.error || "Unable to load mobile sections.");
        return;
      }

      const nextSections = data.sections || [];
      setSections(nextSections);

      if (!selectedSectionId && nextSections[0]) {
        setSelectedSectionId(nextSections[0].id);
      }
    } catch {
      setError("Something went wrong while loading mobile sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving("section");
      setNotice("");
      setError("");

      const res = await fetch("/api/admin/mobile-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTitle,
          type: sectionType,
          sortOrder: Number(sectionSort || 0),
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to create section.");
        return;
      }

      setNotice(data.message || "Section created.");
      setSectionTitle("");
      setSectionType("NORMAL");
      setSectionSort("0");
      await loadSections();
    } catch {
      setError("Something went wrong while creating section.");
    } finally {
      setSaving("");
    }
  };

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSectionId) {
      setError("Select a section first.");
      return;
    }

    try {
      setSaving("item");
      setNotice("");
      setError("");

      const res = await fetch("/api/admin/mobile-sections/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedSectionId,
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
        setError(data.error || "Unable to create section item.");
        return;
      }

      setNotice(data.message || "Section item created.");
      setItemName("");
      setItemImage("");
      setItemTargetValue("");
      setItemSort("0");
      await loadSections();
    } catch {
      setError("Something went wrong while creating item.");
    } finally {
      setSaving("");
    }
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
      await loadSections();
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
      await loadSections();
    } catch {
      setError("Something went wrong while deleting.");
    }
  };

  return (
    <ProtectedShell
      badge="Mobile sections"
      title="Deals and discovery sections"
      subtitle="Control mobile Flash Sales, Top Deals, Recommended, New Arrivals, and promotional discovery blocks."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Sections
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {sections.length}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Items
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {totalItems}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Active sections
            </p>
            <p className="mt-2 text-3xl font-black text-green-700">
              {sections.filter((section) => section.isActive).length}
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

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={createSection}
            className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-black text-slate-950">
              Add mobile section
            </h2>

            <input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="e.g. Flash Sales"
              className="mt-4 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <select
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value)}
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            >
              {sectionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              value={sectionSort}
              onChange={(e) => setSectionSort(e.target.value)}
              placeholder="Sort order"
              type="number"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <button
              type="submit"
              disabled={saving === "section"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white disabled:bg-slate-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving === "section" ? "Adding..." : "Add section"}
            </button>
          </form>

          <form
            onSubmit={createItem}
            className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-black text-slate-950">
              Add section item
            </h2>

            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="mt-4 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>

            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item name e.g. Tecno Deals"
              className="mt-3 h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-600"
            />

            <input
              value={itemImage}
              onChange={(e) => setItemImage(e.target.value)}
              placeholder="Image/icon path e.g. /category-icons/deals.png"
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
              placeholder="Target value e.g. Phones, Samsung, deals"
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
                Current discovery sections
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                These will control Flash Sales, Top Deals, Recommended, and New
                Arrivals on mobile.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadSections()}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-5 text-sm font-bold text-slate-500">
              Loading sections...
            </p>
          ) : sections.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No mobile sections yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">
                        {section.title}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {section.type} · Sort {section.sortOrder} ·{" "}
                        {section.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void patch(
                            `/api/admin/mobile-sections/${section.id}`,
                            { isActive: !section.isActive }
                          )
                        }
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-800 px-3 text-xs font-black text-white"
                      >
                        {section.isActive ? (
                          <EyeOff className="mr-1 h-4 w-4" />
                        ) : (
                          <Eye className="mr-1 h-4 w-4" />
                        )}
                        {section.isActive ? "Hide" : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void remove(
                            `/api/admin/mobile-sections/${section.id}`,
                            section.title
                          )
                        }
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-black text-white"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"
                      >
                        <div className="flex h-14 items-center justify-center rounded-xl bg-slate-50">
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
                            onClick={() =>
                              void patch(
                                `/api/admin/mobile-sections/items/${item.id}`,
                                { isActive: !item.isActive }
                              )
                            }
                            className="flex-1 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-black text-white"
                          >
                            {item.isActive ? "Hide" : "Show"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void remove(
                                `/api/admin/mobile-sections/items/${item.id}`,
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

                    {section.items.length === 0 ? (
                      <div className="rounded-2xl bg-white p-4 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                        No items yet.
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