"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";
import {
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Megaphone,
  RefreshCw,
  Trash2,
} from "lucide-react";

type Banner = {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  buttonText?: string | null;
  placement: string;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
};

type BannerResponse = {
  banners?: Banner[];
  banner?: Banner;
  message?: string;
  error?: string;
};

const placements = [
  { value: "HOME", label: "Home page" },
  { value: "CATEGORY_BROWSER", label: "Mobile categories" },
  { value: "LISTING", label: "Product listing" },
  { value: "CART", label: "Cart page" },
  { value: "PRODUCT_DETAIL", label: "Product detail" },
  { value: "STORE", label: "Store general" },
  { value: "DASHBOARD", label: "Dashboard" },
  { value: "CHECKOUT", label: "Checkout" },
];

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString();
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [placement, setPlacement] = useState("HOME");
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [placementFilter, setPlacementFilter] = useState("ALL");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredBanners = useMemo(() => {
    if (placementFilter === "ALL") return banners;

    return banners.filter((banner) => banner.placement === placementFilter);
  }, [banners, placementFilter]);

  const activeCount = banners.filter((banner) => banner.isActive).length;
  const inactiveCount = banners.length - activeCount;

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/banners");
      const data = (await response.json()) as BannerResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load banners.");
        return;
      }

      setBanners(data.banners || []);
    } catch {
      setError("Something went wrong while loading banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const resetForm = () => {
    setTitle("");
    setMessageText("");
    setImageUrl("");
    setLinkUrl("");
    setButtonText("");
    setPlacement("HOME");
    setIsActive(true);
    setStartsAt("");
    setEndsAt("");
  };

  const createBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setNotice("");
      setError("");

      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message: messageText,
          imageUrl,
          linkUrl,
          buttonText,
          placement,
          isActive,
          startsAt: startsAt || undefined,
          endsAt: endsAt || undefined,
        }),
      });

      const data = (await response.json()) as BannerResponse;

      if (!response.ok) {
        setError(data.error || "Unable to create banner.");
        return;
      }

      setNotice(data.message || "Banner created.");
      resetForm();
      await loadBanners();
    } catch {
      setError("Something went wrong while creating banner.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBanner = async (banner: Banner) => {
    try {
      setNotice("");
      setError("");

      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !banner.isActive,
        }),
      });

      const data = (await response.json()) as BannerResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update banner.");
        return;
      }

      setNotice(data.message || "Banner updated.");
      await loadBanners();
    } catch {
      setError("Something went wrong while updating banner.");
    }
  };

  const deleteBanner = async (banner: Banner) => {
    const confirmed = window.confirm(`Delete banner "${banner.title}"?`);
    if (!confirmed) return;

    try {
      setNotice("");
      setError("");

      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as BannerResponse;

      if (!response.ok) {
        setError(data.error || "Unable to delete banner.");
        return;
      }

      setNotice(data.message || "Banner deleted.");
      await loadBanners();
    } catch {
      setError("Something went wrong while deleting banner.");
    }
  };

  return (
    <ProtectedShell
      badge="Admin banners"
      title="Ads and announcements"
      subtitle="Create clickable banners for home, mobile categories, product listings, cart, product pages, checkout, and campaigns."
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Total banners
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {banners.length}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Active
            </p>
            <p className="mt-2 text-3xl font-black text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">
              Inactive
            </p>
            <p className="mt-2 text-3xl font-black text-slate-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-xl ring-1 ring-slate-200/70 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100">
              <Megaphone className="h-5 w-5 text-orange-700" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Create banner
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use placements to control where a banner appears. Keep the
                dashboard clean by creating focused banners for each location.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={createBanner}>
            <input
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
              placeholder="Banner title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-600"
              placeholder="Banner message"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Image URL optional"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />

              <input
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Link URL optional e.g. /online-store?deals=1"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
              />

              <input
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                placeholder="Button text optional e.g. Shop now"
                value={buttonText}
                onChange={(event) => setButtonText(event.target.value)}
              />

              <select
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                value={placement}
                onChange={(event) => setPlacement(event.target.value)}
              >
                {placements.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />

              <input
                type="datetime-local"
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-600"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </div>

            <label className="flex h-12 items-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                className="mr-3"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active immediately
            </label>

            {title || messageText || imageUrl ? (
              <div className="rounded-[24px] border border-orange-100 bg-orange-50 p-4">
                <p className="text-xs font-black uppercase text-orange-700">
                  Preview
                </p>

                <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-orange-100">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Banner preview"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-slate-100">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-base font-black text-slate-950">
                      {title || "Banner title preview"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {messageText || "Banner message preview will appear here."}
                    </p>

                    {buttonText ? (
                      <span className="mt-3 inline-flex rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white">
                        {buttonText}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "Creating..." : "Create banner"}
            </button>
          </form>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-xl ring-1 ring-slate-200/70 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Existing banners
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Toggle visibility, open target links, or delete banners that are
                no longer needed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadBanners()}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlacementFilter("ALL")}
              className={`rounded-xl px-4 py-2 text-xs font-black ${
                placementFilter === "ALL"
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              All
            </button>

            {placements.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPlacementFilter(item.value)}
                className={`rounded-xl px-4 py-2 text-xs font-black ${
                  placementFilter === item.value
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="mt-6 text-sm font-bold text-slate-600">
              Loading banners...
            </p>
          ) : banners.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No banners yet.
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No banners match this placement filter.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                          {banner.placement}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            banner.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-black text-slate-950">
                        {banner.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {banner.message}
                      </p>

                      <div className="mt-3 grid gap-1 text-xs font-bold text-slate-500">
                        <p>Starts: {formatDate(banner.startsAt)}</p>
                        <p>Ends: {formatDate(banner.endsAt)}</p>
                        {banner.linkUrl ? <p>Link: {banner.linkUrl}</p> : null}
                      </div>

                      {banner.buttonText ? (
                        <span className="mt-3 inline-flex rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white">
                          {banner.buttonText}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => void toggleBanner(banner)}
                      className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-black text-white ${
                        banner.isActive
                          ? "bg-slate-700 hover:bg-slate-800"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </button>

                    {banner.linkUrl ? (
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    <button
                      type="button"
                      onClick={() => void deleteBanner(banner)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
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