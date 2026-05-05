"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SiteBanner = {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  buttonText?: string | null;
};

type BannerResponse = {
  banners?: SiteBanner[];
  error?: string;
};

type SiteBannerStripProps = {
  placement?: string;
};

export default function SiteBannerStrip({
  placement = "HOME",
}: SiteBannerStripProps) {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/public/banners?placement=${encodeURIComponent(placement)}`,
          { cache: "no-store" }
        );

        const data = (await response.json()) as BannerResponse;

        if (response.ok) {
          setBanners(data.banners || []);
          setActiveIndex(0);
        } else {
          setBanners([]);
        }
      } catch {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    void loadBanners();
  }, [placement]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  const trackClick = (banner: SiteBanner) => {
    fetch("/api/public/banners/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId: banner.id, placement }),
    }).catch(() => {});
  };

  if (loading || banners.length === 0) return null;

  return (
    <section className="w-full overflow-hidden">
      <div className="relative h-[92px] w-full overflow-hidden rounded-xl bg-slate-100 sm:h-[120px] md:h-[150px] md:rounded-[22px]">
        {banners.map((banner, index) => {
          const slide = (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {banner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-orange-100 to-yellow-50 px-5 text-center">
                  <div>
                    <p className="line-clamp-1 text-base font-black text-slate-950">
                      {banner.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-600">
                      {banner.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );

          return banner.linkUrl ? (
            <Link
              key={banner.id}
              href={banner.linkUrl}
              onClick={() => trackClick(banner)}
              className="absolute inset-0"
            >
              {slide}
            </Link>
          ) : (
            <div key={banner.id}>{slide}</div>
          );
        })}
      </div>

      {banners.length > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-5 bg-orange-500"
                  : "w-2 bg-slate-400"
              }`}
              aria-label={`Show banner ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}