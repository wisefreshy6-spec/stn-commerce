"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import SiteBannerStrip from "@/components/store/SiteBannerStrip";
import MobileStoreTopBar from "@/components/store/MobileStoreTopBar";
import MobileBottomNav from "@/components/store/MobileBottomNav";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Heart,
  Search,
  ShoppingBag,
  Store,
  Wrench,
  Utensils,
  Sparkles,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  barcode?: string | null;
  section: string;
  category?: string | null;
  subCategory?: string | null;
  brand?: string | null;
  stock: number;
  status: string;
  sizes?: string[];
  colors?: string[];
  averageRating?: number;
  reviewCount?: number;
  discountPercent?: number;
};

type MobileCategoryItem = {
  id: string;
  name: string;
  image?: string | null;
  targetType: "CATEGORY" | "SUBCATEGORY" | "BRAND";
  targetValue: string;
};

type MobileCategoryPanel = {
  id: string;
  title: string;
  items: MobileCategoryItem[];
};

type StoreResponse = {
  products?: Product[];
  categories?: string[];
  subCategories?: string[];
  brands?: string[];
  error?: string;
};

type CartItem = {
  productId: string;
  variantKey: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  quantity: number;
  stock: number;
  size?: string;
  color?: string;
};

type AdminMobileCategoryItem = {
  id: string;
  name: string;
  image?: string | null;
  targetType: string;
  targetValue: string;
  sortOrder: number;
  isActive: boolean;
};

type AdminMobileCategoryPanel = {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  items: AdminMobileCategoryItem[];
};

type AdminMobileCategory = {
  id: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  panels: AdminMobileCategoryPanel[];
};

const sections = [
  {
    label: "Online Store",
    value: "ONLINE_STORE",
    description: "Electronics, clothing, accessories, household, and more.",
    icon: Store,
  },
  {
    label: "Fast Food",
    value: "FAST_FOOD",
    description: "Meals, snacks, drinks, chicken, fries, and breakfast.",
    icon: Utensils,
  },
  {
    label: "Exclusive Store",
    value: "EXCLUSIVE_STORE",
    description: "Premium, luxury, limited, and special products.",
    icon: Sparkles,
  },
  {
    label: "Hardware",
    value: "HARDWARE",
    description: "Hardware section is coming soon.",
    icon: Wrench,
  },
];

const defaultCategories: Record<string, string[]> = {
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
  EXCLUSIVE_STORE: ["Premium", "Luxury", "Special Offers", "Limited Edition"],
  HARDWARE: ["Tools", "Paint", "Plumbing", "Electrical", "Building Materials"],
};

const trendingSearches = [
  "phones",
  "appliances",
  "beauty",
  "shoes",
  "tv",
  "headphones",
  "fridge",
  "fast food",
];

const fallbackBrands = [
  "Tecno",
  "Samsung",
  "Infinix",
  "iPhone",
  "Oppo",
  "Xiaomi",
  "Hisense",
  "Vitron",
  "TCL",
  "LG",
  "Sony",
];

const mobileCategorySections = [
  {
    title: "Flash Sales",
    items: ["Flash Deals", "New Arrivals", "Recommended", "Top Deals"],
  },
  {
    title: "Phones & Accessories",
    items: ["Phones", "Chargers", "Power Banks", "Earphones", "Covers", "Cables"],
  },
  {
    title: "Television & Video",
    items: ["Smart TVs", "Digital TVs", "TV Stands", "Projectors", "Speakers", "Sound Bars"],
  },
  {
    title: "Appliances",
    items: ["Fridges", "Freezers", "Microwaves", "Kettles", "Blenders", "Ironing"],
  },
  {
    title: "Fashion",
    items: ["Clothing", "Shoes", "Watches", "Bags", "Jewellery", "Beauty"],
  },
  {
    title: "Home & Kitchen",
    items: ["Household", "Kitchen", "Cleaning", "Furniture", "Beddings", "Decor"],
  },
];

const mobileCategorySectionsByCategory: Record<
  string,
  { title: string; items: string[] }[]
> = {
  Electronics: [
    {
      title: "Television & Video",
      items: ["Smart TVs", "Digital TVs", "TV Stands", "Projectors", "Sound Bars", "Speakers"],
    },
    {
      title: "Audio & Accessories",
      items: ["Earphones", "Headphones", "Bluetooth Speakers", "Home Theater", "Cables", "Adapters"],
    },
  ],

  Phones: [
    {
      title: "Mobile Phones",
      items: ["Tecno", "Samsung", "Infinix", "iPhone", "Oppo", "Xiaomi"],
    },
    {
      title: "Phone Accessories",
      items: ["Chargers", "Power Banks", "Covers", "Screen Protectors", "Earphones", "Cables"],
    },
  ],

  Appliances: [
    {
      title: "Large Appliances",
      items: ["Fridges", "Freezers", "Washers", "Cookers", "Dispensers", "Microwaves"],
    },
    {
      title: "Small Appliances",
      items: ["Kettles", "Blenders", "Toasters", "Irons", "Air Fryers", "Rice Cookers"],
    },
  ],

  Clothing: [
    {
      title: "Fashion",
      items: ["Men Clothing", "Women Clothing", "Kids Clothing", "Jackets", "T-Shirts", "Dresses"],
    },
    {
      title: "Fashion Accessories",
      items: ["Watches", "Bags", "Belts", "Jewellery", "Caps", "Sunglasses"],
    },
  ],

  Shoes: [
    {
      title: "Shoes",
      items: ["Men Shoes", "Women Shoes", "Sneakers", "Sandals", "Official Shoes", "Sports Shoes"],
    },
  ],

  Beauty: [
    {
      title: "Beauty & Personal Care",
      items: ["Skincare", "Hair Care", "Perfumes", "Makeup", "Body Care", "Grooming"],
    },
  ],

  Household: [
    {
      title: "Home & Living",
      items: ["Kitchen", "Cleaning", "Beddings", "Furniture", "Decor", "Storage"],
    },
  ],

  Accessories: [
    {
      title: "Accessories",
      items: ["Bags", "Watches", "Jewellery", "Phone Accessories", "Computer Accessories", "Cables"],
    },
  ],

  Stationery: [
    {
      title: "Stationery",
      items: ["Books", "Pens", "Files", "Notebooks", "Office Supplies", "School Supplies"],
    },
  ],
};

function money(value: string | number) {
  return `KES ${Number(value).toLocaleString()}`;
}

function discountedPrice(price: string | number, discountPercent?: number) {
  const original = Number(price);
  const discount = Number(discountPercent || 0);

  if (!Number.isFinite(original) || discount <= 0) return original;

  return Math.max(0, original - (original * discount) / 100);
}

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("stn_cart");
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  window.localStorage.setItem("stn_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("stn_cart_updated"));
}

function makeVariantKey(productId: string, size?: string, color?: string) {
  return `${productId}::${size || "NO_SIZE"}::${color || "NO_COLOR"}`;
}

function isValidSection(value: string | null) {
  return sections.some((item) => item.value === value);
}

function getSubCategoryIcon(category: string, sub: string) {
  const value = `${category} ${sub}`.toLowerCase();

  if (value.includes("phone") || value.includes("tecno") || value.includes("samsung") || value.includes("iphone")) return "📱";
  if (value.includes("tv")) return "📺";
  if (value.includes("audio") || value.includes("earbuds") || value.includes("headphones")) return "🎧";
  if (value.includes("fridge") || value.includes("freezer")) return "🧊";
  if (value.includes("kettle") || value.includes("blender") || value.includes("microwave") || value.includes("toaster")) return "🍽️";
  if (value.includes("washer") || value.includes("laundry") || value.includes("iron")) return "🧺";
  if (value.includes("gaming")) return "🎮";
  if (value.includes("camera")) return "📷";
  if (value.includes("computer")) return "💻";

  return "🛒";
}

function getBrandLogo(brand: string) {
  const key = brand.toLowerCase().trim();

  const logos: Record<string, string> = {
    tecno: "/brand-logos/tecno.png",
    samsung: "/brand-logos/samsung.png",
    infinix: "/brand-logos/infinix.png",
    iphone: "/brand-logos/apple.png",
    apple: "/brand-logos/apple.png",
    oppo: "/brand-logos/oppo.png",
    xiaomi: "/brand-logos/xiaomi.png",
    hisense: "/brand-logos/hisense.png",
    vitron: "/brand-logos/vitron.png",
    tcl: "/brand-logos/tcl.png",
    lg: "/brand-logos/lg.png",
    sony: "/brand-logos/sony.png",
  };

  return logos[key] || "";
}

function getCategoryTileIcon(title: string, item: string) {
  const value = `${title} ${item}`.toLowerCase();

  if (value.includes("flash") || value.includes("deal")) return "⚡";
  if (value.includes("phone") || value.includes("tecno") || value.includes("samsung") || value.includes("iphone")) return "📱";
  if (value.includes("tv") || value.includes("video")) return "📺";
  if (value.includes("sound") || value.includes("audio") || value.includes("speaker") || value.includes("earphone")) return "🎧";
  if (value.includes("fridge") || value.includes("freezer")) return "🧊";
  if (value.includes("kettle") || value.includes("blender") || value.includes("microwave") || value.includes("toaster")) return "🍽️";
  if (value.includes("fashion") || value.includes("clothing") || value.includes("dress")) return "👕";
  if (value.includes("shoe") || value.includes("sneaker")) return "👟";
  if (value.includes("beauty") || value.includes("skincare") || value.includes("makeup")) return "💄";
  if (value.includes("home") || value.includes("kitchen") || value.includes("furniture")) return "🏠";
  if (value.includes("stationery") || value.includes("book") || value.includes("pen")) return "📚";

  return "🛍️";
}

function getCategoryTileImage(title: string, item: string) {
  const key = item.toLowerCase().trim();

  const images: Record<string, string> = {
    phones: "/category-icons/phones.png",
    chargers: "/category-icons/chargers.png",
    "power banks": "/category-icons/power-banks.png",
    earphones: "/category-icons/earphones.png",
    covers: "/category-icons/covers.png",
    cables: "/category-icons/cables.png",
    "smart tvs": "/category-icons/smart-tvs.png",
    fridges: "/category-icons/fridges.png",
    freezers: "/category-icons/freezers.png",
    kettles: "/category-icons/kettles.png",
    blenders: "/category-icons/blenders.png",
    clothing: "/category-icons/clothing.png",
    shoes: "/category-icons/shoes.png",
    beauty: "/category-icons/beauty.png",
    household: "/category-icons/household.png",
  };

  return images[key] || "";
}

function OnlineStoreContent() {
  const searchParams = useSearchParams();
  const urlSection = searchParams.get("section");
  const urlCategory = searchParams.get("category");
  const urlBrand = searchParams.get("brand");
  const urlDeals = searchParams.get("deals");

  const [section, setSection] = useState(
    isValidSection(urlSection) ? String(urlSection) : "ONLINE_STORE"
  );
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [search, setSearch] = useState("");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSearchUI, setShowSearchUI] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [mobileProductMode, setMobileProductMode] = useState(false);
  const [adminMobileCategories, setAdminMobileCategories] = useState<AdminMobileCategory[]>([]);
  const [adminMobileSections, setAdminMobileSections] = useState<any[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>(
    {}
  );

  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const selectedSection = sections.find((item) => item.value === section);
  const hasAdminMobileCategories = adminMobileCategories.length > 0;

const activeAdminMobileCategory =
  adminMobileCategories.find((item) => item.name === category) ||
  adminMobileCategories[0] ||
  null;

useEffect(() => {
  if (!loading) return;

  const timer = window.setTimeout(() => {
    setLoading(false);
  }, 8000);

  return () => window.clearTimeout(timer);
}, [loading]);

useEffect(() => {
  if (!toast) return;

  const timer = window.setTimeout(() => {
    setToast("");
  }, 2200);

  return () => window.clearTimeout(timer);
}, [toast]);

useEffect(() => {
  const loadAdminMobileCategories = async () => {
    try {
      const res = await fetch("/api/public/mobile-categories", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data.categories)) {
        setAdminMobileCategories(data.categories);
      }
    } catch {
      setAdminMobileCategories([]);
    }
  };

  void loadAdminMobileCategories();
}, []);

useEffect(() => {
  if (isValidSection(urlSection)) {
    setSection(String(urlSection));
  }

  if (urlCategory) {
    setCategory(urlCategory);
    setSelectedSubCategory("");
    setMobileProductMode(true);
  }

  if (urlBrand) {
    setSelectedBrand(urlBrand);
    setMobileProductMode(true);
  }

  if (urlDeals === "1") {
    setShowDiscounted(true);
    setMobileProductMode(true);
  }

  setSearch("");
  setQuery("");
  setMessage("");
  setError("");
}, [urlSection, urlCategory, urlBrand, urlDeals]);

  useEffect(() => {
  try {
    const stored = window.localStorage.getItem("recent_searches");

    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
    }
  } catch {
    setRecentSearches([]);
  }
}, []);

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query.trim());
  }, 300); // 300ms delay

  return () => clearTimeout(timer);
}, [query]);

useEffect(() => {
    const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;

    if (!target?.closest(".store-search-container")) {
      setShowSearchUI(false);
    }
  };

  document.addEventListener("click", handleClick);

  return () => {
    document.removeEventListener("click", handleClick);
  };
}, []);

  const allCategories = useMemo(() => {
    const defaults = defaultCategories[section] || [];
    return Array.from(new Set([...defaults, ...categories])).filter(Boolean);
  }, [categories, section]);

  const activeMobileSections = useMemo(() => {
  if (!category) return mobileCategorySections;

  return mobileCategorySectionsByCategory[category] || [
    {
      title: category,
      items: subCategories.length > 0 ? subCategories : [category],
    },
  ];
}, [category, subCategories]);

const mobileBrands = useMemo(() => {
  return Array.from(new Set([...brands, ...fallbackBrands])).filter(Boolean);
}, [brands]);

  const saveSearch = (value: string) => {
  const cleanValue = value.trim();

  if (!cleanValue) return;

  const updated = [
    cleanValue,
    ...recentSearches.filter(
      (item) => item.toLowerCase() !== cleanValue.toLowerCase()
    ),
  ].slice(0, 3);

  setRecentSearches(updated);
  window.localStorage.setItem("recent_searches", JSON.stringify(updated));
};

  const applySearch = (value: string) => {
  const cleanValue = value.trim();

  setQuery(cleanValue);
  saveSearch(cleanValue);
  setMobileProductMode(true);
  setShowSearchUI(false);
  setMessage("");
  setError("");
};

  const loadCartCount = () => {
    const items = getCart();
    setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
  };

  const loadProducts = async (signal?: AbortSignal) => {
  try {
    setLoading(true);
    setError("");

    if (section === "HARDWARE") {
      setProducts([]);
      setCategories([]);
      setSubCategories([]);
      setBrands([]);
      return;
    }

    const params = new URLSearchParams();
    params.set("section", section);

    if (category) params.set("category", category);
    if (selectedSubCategory) params.set("subCategory", selectedSubCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

    const response = await fetch(`/api/store/products?${params.toString()}`, {
      signal,
    });

    const data = (await response.json()) as StoreResponse;

    if (signal?.aborted) return;

    if (!response.ok) {
      setError(data.error || "Unable to load products.");
      setProducts([]);
      return;
    }

    let items = data.products || [];

    if (showDiscounted) {
      items = items.filter((p) => p.discountPercent && p.discountPercent > 0);
    }

    setProducts(items);
    setCategories(data.categories || []);
    setSubCategories(data.subCategories || []);
    setBrands(data.brands || []);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;

    setProducts([]);
    setError("Something went wrong while loading products.");
  } finally {
    if (!signal?.aborted) {
      setLoading(false);
    }
  }
};

  useEffect(() => {
  const controller = new AbortController();

  setLoading(true);
  if (mobileProductMode) {
  setProducts([]);
}

  void loadProducts(controller.signal);

  return () => {
    controller.abort();
  };
}, [section, category, selectedSubCategory, selectedBrand, debouncedQuery, showDiscounted, mobileProductMode]);

  useEffect(() => {
  const cleanQuery = debouncedQuery.toLowerCase();

  if (!cleanQuery) {
    setSuggestions([]);
    return;
  }

  const filtered = products.filter((item) => {
    const searchableText = [
      item.name,
      item.description,
      item.category,
      item.subCategory,
      item.brand,
      item.barcode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(cleanQuery);
  });

  setSuggestions(filtered.slice(0, 8));
}, [debouncedQuery, products]);

useEffect(() => {
  const loadSections = async () => {
    try {
      const res = await fetch("/api/public/mobile-sections", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data.sections)) {
        setAdminMobileSections(data.sections);
      }
    } catch {
      setAdminMobileSections([]);
    }
  };

  void loadSections();
}, []);

  useEffect(() => {
    loadCartCount();

    const handler = () => loadCartCount();
    window.addEventListener("stn_cart_updated", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("stn_cart_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
  try {
    const raw = window.localStorage.getItem("stn_saved_products");
    const saved = raw ? (JSON.parse(raw) as string[]) : [];

    setSavedProductIds(Array.isArray(saved) ? saved : []);
  } catch {
    setSavedProductIds([]);
  }
  }, []);

  const totalVisibleStock = useMemo(
    () => products.reduce((sum, product) => sum + product.stock, 0),
    [products]
  );

  const displayedProducts = useMemo(() => {
  const cleanSearch = debouncedQuery.toLowerCase();

  if (!cleanSearch) return products;

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.description,
      product.category,
      product.subCategory,
      product.brand,
      product.barcode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(cleanSearch);
  });
}, [products, debouncedQuery]);

  const setQuantity = (productId: string, value: number, stock: number) => {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, Math.min(value, stock)),
    }));
  };

  const toggleSavedProduct = (productId: string) => {
  const exists = savedProductIds.includes(productId);

  const next = exists
    ? savedProductIds.filter((id) => id !== productId)
    : [...savedProductIds, productId];

  setSavedProductIds(next);
  window.localStorage.setItem("stn_saved_products", JSON.stringify(next));
  window.dispatchEvent(new Event("stn_saved_products_updated"));
  setToast(exists ? "Removed from saved items." : "Saved for later.");
};

  const addToCart = (product: Product) => {
    setMessage("");
    setError("");

    if (product.stock <= 0) {
      setError("This product is out of stock.");
      return;
    }

    const sizes = product.sizes || [];
    const colors = product.colors || [];
    const size = selectedSizes[product.id] || "";
    const color = selectedColors[product.id] || "";

    if (sizes.length > 0 && !size) {
      setError(`Choose a size for ${product.name}.`);
      return;
    }

    if (colors.length > 0 && !color) {
      setError(`Choose a color for ${product.name}.`);
      return;
    }

    const qty = quantities[product.id] || 1;
    const variantKey = makeVariantKey(product.id, size, color);

    const currentCart = getCart();
    const existing = currentCart.find((item) => item.variantKey === variantKey);

    let nextCart: CartItem[];

    if (existing) {
      nextCart = currentCart.map((item) =>
        item.variantKey === variantKey
          ? {
              ...item,
              quantity: Math.min(item.quantity + qty, product.stock),
              stock: product.stock,
            }
          : item
      );
    } else {
      nextCart = [
        ...currentCart,
        {
          productId: product.id,
          variantKey,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: qty,
          stock: product.stock,
          size: size || undefined,
          color: color || undefined,
        },
      ];
    }

    saveCart(nextCart);
    loadCartCount();
    setMessage(`${product.name} added to basket.`);
  };

const handleAdminMobileItemClick = (item: AdminMobileCategoryItem) => {
  setLoading(true);
  setProducts([]);
  setSearch("");
  setQuery("");
  setShowDiscounted(false);

  const targetType = item.targetType.toUpperCase();

  if (targetType === "BRAND") {
    setSelectedBrand(item.targetValue);
    setSelectedSubCategory("");
    setCategory("");
  } else if (targetType === "SUBCATEGORY") {
    setSelectedBrand("");
    setSelectedSubCategory(item.targetValue);
  } else {
    setSelectedBrand("");
    setSelectedSubCategory("");
    setCategory(item.targetValue);
  }

  setMobileProductMode(true);
};

const hasAdminSections = adminMobileSections.length > 0;
  
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4 pb-24 sm:px-6 sm:py-8 lg:px-8">

  {toast ? (
  <div className="fixed left-3 right-3 top-3 z-[80] mx-auto max-w-md">
    <div className="flex animate-slideDown items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl">
      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
      <span>{toast}</span>
    </div>
  </div>
) : null}

      <MobileStoreTopBar
  showBack={false}
  searchSlot={
    <form
      className="store-search-container relative"
      onSubmit={(e) => {
        e.preventDefault();
        applySearch(query);
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-slate-400" />

        <input
          className="h-10 w-full rounded-full bg-slate-100 pl-10 pr-9 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
          placeholder="Search..."
          value={query}
          onFocus={() => setShowSearchUI(true)}
          onChange={(e) => {
           const value = e.target.value;

           setQuery(value);
           setShowSearchUI(true);

           if (value.trim()) {
            setLoading(true);
            setProducts([]);
            setCategory("");
            setSelectedSubCategory("");
            setSelectedBrand("");
            setShowDiscounted(false);
            setMobileProductMode(true);
            setShowSearchUI(false);
           }
         }}
        />
        <div className="md:hidden px-2 pt-2">
          <SiteBannerStrip placement="STORE" />
        </div>

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSearch("");
              setSuggestions([]);
              setShowSearchUI(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400"
          >
            ×
          </button>
        ) : null}
      </div>

      {showSearchUI ? (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[420px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-4 shadow-2xl">
          {!query.trim() ? (
            <>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                Recent searches
              </p>

              {recentSearches.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSearches.slice(0, 3).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => applySearch(item)}
                      className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs font-semibold text-slate-400">
                  Your last searches will appear here.
                </p>
              )}

              <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-slate-500">
                Trending searches
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {trendingSearches.slice(0, 6).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => applySearch(item)}
                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          ) : suggestions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
 {suggestions.slice(0, 8).map((item) => (
  <button
    key={item.id}
    type="button"
    onClick={() => {
     window.location.href = `/online-store/${item.id}`;
    }}
    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 hover:bg-slate-50 active:bg-slate-100"
  >
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <ShoppingBag className="h-6 w-6 text-slate-300" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className="line-clamp-1 text-sm font-black text-slate-900">
        {item.name}
      </p>

      <p className="mt-0.5 text-xs font-black text-orange-700">
        {money(item.price)}
      </p>
    </div>

    <span className="text-xs font-black text-orange-600">›</span>
  </button>
))}

{debouncedQuery ? (
  <button
    type="button"
    onClick={() => {
      setMobileProductMode(true);
      setShowSearchUI(false);
    }}
    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-black text-orange-600 hover:bg-orange-50"
  >
    <span>Search all results for “{debouncedQuery}”</span>
    <span>›</span>
  </button>
) : null}

            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              No matching products found.
            </div>
          )}
        </div>
      ) : null}
    </form>
  }
/>

      <section className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <SiteBannerStrip placement="STORE" />
        <div className="hidden overflow-hidden rounded-[24px] border border-white/50 bg-white/90 shadow-xl ring-1 ring-slate-200/70 md:block lg:rounded-[32px]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-orange-700">
                STN Store
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                Shop easily and safely.
              </h1>

              <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm lg:leading-7">
                Browse by section, choose category, select options only when
                required, and add items to your basket before checkout.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
                >
                  Basket ({cartCount}){" "}
                  <ShoppingBag className="ml-2 h-4 w-4 text-white" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-8 text-white sm:block sm:p-10">
              <h2 className="text-2xl font-black">Simple shopping steps</h2>

              <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
                <div className="rounded-2xl bg-white/10 p-4">
                  Pick a store section and category.
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  Choose size/color only when the product has options.
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  Checkout requires delivery address and pickup station.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
          {sections.map((item) => {
            const Icon = item.icon;
            const active = section === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setSection(item.value);
                  setCategory("");
                  setSubCategory("");
                  setSearch("");
                  setMessage("");
                  setError("");
                }}
                className={`min-w-[140px] rounded-2xl border p-3 text-left transition shadow-sm hover:shadow-md active:scale-[0.97] hover:-translate-y-1 hover:shadow-lg md:min-w-0 md:rounded-[24px] md:p-5 ${
                  active
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
              >
                <Icon className="h-6 w-6" />
                <h3 className="mt-2 text-sm font-black md:text-lg">{item.label}</h3>
                <p
                  className={`mt-1 line-clamp-2 text-xs leading-5 md:text-sm md:leading-6 ${
                    active ? "text-white/80" : "text-slate-600"
                  }`}
                >
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        <div id="store-search" className="-mx-4 border-0 bg-transparent p-0 shadow-none ring-0 md:mx-0 md:rounded-[32px] md:border md:border-white/50 md:bg-white/90 md:p-6 md:shadow-xl md:ring-1 md:ring-slate-200/70">
        
        {/* 🔥 FILTER CHIPS */}
<div className="mt-3 hidden gap-2 overflow-x-auto pb-1 md:flex md:flex-wrap">
  {/* Category */}
  {category && (
    <button
      onClick={() => setCategory("")}
      className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white"
    >
      {category} ✕
    </button>
  )}

  {/* Subcategory */}
  {selectedSubCategory && (
    <button
      onClick={() => setSelectedSubCategory("")}
      className="rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white"
    >
      {selectedSubCategory} ✕
    </button>
  )}

  {/* Brand */}
  {selectedBrand && (
    <button
      onClick={() => setSelectedBrand("")}
      className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white"
    >
      {selectedBrand} ✕
    </button>
  )}

  {/* Discount toggle */}
  <button
    onClick={() => setShowDiscounted(!showDiscounted)}
    className={`rounded-full px-3 py-1 text-xs font-black ${
      showDiscounted
        ? "bg-red-600 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    Deals
  </button>

  {/* Clear all */}
  {(category || selectedSubCategory || selectedBrand || showDiscounted) && (
    <button
      onClick={() => {
        setCategory("");
        setSelectedSubCategory("");
        setSelectedBrand("");
        setShowDiscounted(false);
      }}
      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700"
    >
      Clear all
    </button>
  )}
</div>

          <div className="hidden flex-col gap-4 md:flex lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {selectedSection?.label}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {section === "HARDWARE"
                  ? "This section is not active yet."
                  : `${products.length} product(s), ${totalVisibleStock} item(s) available${category ? ` · ${category}` : "" }${selectedSubCategory ? ` · ${selectedSubCategory}` : ""}.`}
              </p>
            </div>

{section !== "HARDWARE" ? (
  <form
    className="store-search-container relative hidden w-full md:block lg:w-auto"
    onSubmit={(e) => {
      e.preventDefault();
      applySearch(query);
    }}
  >
    <div id="store-search-box" className="relative">
      <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />

      <input
        className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-950 outline-none focus:border-orange-600 lg:w-80"
        placeholder="Search products, brands, categories..."
        value={query}
        onFocus={() => setShowSearchUI(true)}
        onChange={(e) => {
          const value = e.target.value;

          setQuery(value);
          setShowSearchUI(true);

          if (value.trim()) {
            setLoading(true);
            setProducts([]);
            setCategory("");
            setSelectedSubCategory("");
            setSelectedBrand("");
            setShowDiscounted(false);
            setMobileProductMode(true);
            setShowSearchUI(false);
          }
        }}
      />

      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setSearch("");
            setDebouncedQuery("");
            setSuggestions([]);
            setCategory("");
            setSelectedSubCategory("");
            setSelectedBrand("");
            setShowDiscounted(false);
            setMobileProductMode(false);
            setShowSearchUI(true);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400"
        >
          ×
        </button>
      ) : null}
    </div>

    {showSearchUI ? (
  <div className="absolute left-0 right-0 top-14 z-40 max-h-[420px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-4 shadow-2xl">
    {!query.trim() ? (
      <>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Recent searches
          </p>

          {recentSearches.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setRecentSearches([]);
                window.localStorage.removeItem("recent_searches");
              }}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-orange-600"
            >
              Clear
            </button>
          ) : null}
        </div>

        {recentSearches.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.slice(0, 3).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => applySearch(item)}
                className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold text-slate-400">
            Your last searches will appear here.
          </p>
        )}

        <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-slate-500">
          Trending searches
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {trendingSearches.slice(0, 6).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => applySearch(item)}
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 active:scale-95"
            >
              {item}
            </button>
          ))}
        </div>
      </>
    ) : suggestions.length > 0 ? (
      <div className="overflow-hidden rounded-2xl border border-slate-100">
{suggestions.slice(0, 8).map((item) => (
  <button
    key={item.id}
    type="button"
    onClick={() => {
     window.location.href = `/online-store/${item.id}`;
    }}
    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 hover:bg-slate-50 active:bg-slate-100"
  >
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <ShoppingBag className="h-6 w-6 text-slate-300" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className="line-clamp-1 text-sm font-black text-slate-900">
        {item.name}
      </p>

      <p className="mt-0.5 text-xs font-black text-orange-700">
        {money(item.price)}
      </p>
    </div>

    <span className="text-xs font-black text-orange-600">›</span>
  </button>
))}

{debouncedQuery ? (
  <button
    type="button"
    onClick={() => {
      setMobileProductMode(true);
      setShowSearchUI(false);
    }}
    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-black text-orange-600 hover:bg-orange-50"
  >
    <span>Search all results for “{debouncedQuery}”</span>
    <span>›</span>
  </button>
) : null}

      </div>
    ) : (
      <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        No matching products found.
      </div>
    )}
  </div>
) : null}

    <button
      type="submit"
      className="mt-3 h-11 w-full rounded-2xl bg-orange-600 px-5 text-sm font-black text-white hover:bg-orange-700 lg:hidden"
    >
      Search
    </button>
  </form>
) : null}

          </div>

          {section === "HARDWARE" ? (
            <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-center">
              <Wrench className="mx-auto h-10 w-10 text-amber-700" />
              <h3 className="mt-4 text-2xl font-black text-slate-950">
                Hardware Store Coming Soon!
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-900">
                This section is reserved for future hardware inventory, tools,
                building supplies, and shop stock.
              </p>
            </div>
          ) : (
            <>

{/* MOBILE JUMIA-STYLE CATEGORY BROWSER */}
<div className="md:hidden">
  {!mobileProductMode ? (
    <div className="mb-3">
      <SiteBannerStrip placement="CATEGORY_BROWSER" />
    </div>
  ) : null}

  {!mobileProductMode ? (
    <div className="-mx-3 mt-2 grid h-[calc(100vh-74px)] w-screen max-w-[100vw] grid-cols-[118px_minmax(0,1fr)] overflow-hidden bg-slate-100">
      {/* LEFT FULL-HEIGHT CATEGORY RAIL */}
      <div className="h-full overflow-y-auto border-r border-slate-200 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => {
            setCategory("");
            setSelectedSubCategory("");
            setSelectedBrand("");
            setSearch("");
            setQuery("");
            setShowDiscounted(false);
            setMobileProductMode(false);
          }}
          className={`flex min-h-[72px] w-full items-center justify-center border-l-4 px-2 text-center text-[12px] font-bold leading-tight transition-colors ${
            category === ""
              ? "border-orange-600 bg-orange-50 text-orange-700"
              : "border-transparent text-slate-700"
          }`}
        >
          All
        </button>

        {(hasAdminMobileCategories
          ? adminMobileCategories.map((item) => item.name)
          : allCategories
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setSelectedSubCategory("");
              setSelectedBrand("");
              setSearch("");
              setQuery("");
              setShowDiscounted(false);
              setMobileProductMode(false);

              setTimeout(() => {
                const el = document.getElementById(
                  `section-${item.replace(/\s+/g, "-").toLowerCase()}`
                );
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className={`flex min-h-[72px] w-full items-center justify-center border-l-4 px-2 text-center text-[12px] font-bold leading-tight transition-colors ${
              category === item
                ? "border-orange-600 bg-orange-50 text-orange-700"
                : "border-transparent text-slate-700"
            }`}
          >
            <span className="line-clamp-2 break-words">{item}</span>
          </button>
        ))}
      </div>

      {/* RIGHT SCROLLABLE CATEGORY SECTIONS */}
      <div
        id="right-scroll-container"
        className="h-full min-w-0 space-y-3 overflow-y-auto p-3 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {hasAdminMobileCategories ? (
          adminMobileCategories.map((adminCategory) => (
            <div
              key={adminCategory.id}
              data-section={adminCategory.name}
              id={`section-${adminCategory.name
                .replace(/\s+/g, "-")
                .toLowerCase()}`}
              className="space-y-3"
            >
              {adminCategory.panels.map((panel) => (
                <div
                  key={panel.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="text-[15px] font-black tracking-wide text-slate-900">
                      {panel.title}
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        setProducts([]);
                        setSelectedSubCategory("");
                        setSelectedBrand("");
                        setSearch("");
                        setQuery("");
                        setShowDiscounted(false);
                        setCategory(adminCategory.name);
                        setMobileProductMode(true);
                      }}
                      className="text-sm font-black text-orange-600"
                    >
                      See All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-x-3 gap-y-5 p-4">
                    {panel.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAdminMobileItemClick(item)}
                        className="min-w-0 text-center transition active:scale-95"
                      >
                        <div className="mx-auto flex h-[74px] w-full items-center justify-center rounded-xl bg-slate-50 p-2">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 max-w-[76px] object-contain"
                            />
                          ) : (
                            <span className="text-xl font-black text-slate-800">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-tight text-slate-700">
                          {item.name}
                        </p>
                      </button>
                    ))}

                    {panel.items.length === 0 ? (
                      <div className="col-span-3 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
                        No items in this panel yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {adminCategory.panels.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                  No panels added for {adminCategory.name}.
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <>
            {mobileBrands.length > 0 ? (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="text-[15px] font-black tracking-wide text-slate-900">
                    Official Brands
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand("");
                      setSelectedSubCategory("");
                      setShowDiscounted(false);
                      setMobileProductMode(true);
                    }}
                    className="text-sm font-black text-orange-600"
                  >
                    See All
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-x-3 gap-y-5 p-4">
                  {mobileBrands.slice(0, 9).map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        setProducts([]);
                        setSelectedBrand(brand);
                        setSelectedSubCategory("");
                        setSearch("");
                        setQuery("");
                        setShowDiscounted(false);
                        setMobileProductMode(true);
                      }}
                      className="min-w-0 text-center transition active:scale-95"
                    >
                      <div className="mx-auto flex h-[74px] w-full items-center justify-center rounded-xl bg-slate-50 p-2">
                        {getBrandLogo(brand) ? (
                          <img
                            src={getBrandLogo(brand)}
                            alt={brand}
                            className="h-12 max-w-[76px] object-contain"
                          />
                        ) : (
                          <span className="text-xl font-black text-slate-800">
                            {brand.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-tight text-slate-700">
                        {brand}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {hasAdminSections
              ? adminMobileSections.map((section) => (
                  <div
                    key={section.id}
                    id={`section-${section.title
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <h3 className="text-[15px] font-black tracking-wide text-slate-900">
                        {section.title}
                      </h3>

                      <button
                        type="button"
                        onClick={() => {
                          setLoading(true);
                          setProducts([]);
                          setSelectedBrand("");
                          setSelectedSubCategory("");
                          setSearch("");
                          setQuery("");

                          if (section.type === "FLASH" || section.type === "DEALS") {
                            setShowDiscounted(true);
                            setCategory("");
                          } else {
                            setShowDiscounted(false);
                            setCategory(section.title);
                          }

                          setMobileProductMode(true);
                        }}
                        className="text-sm font-black text-orange-600"
                      >
                        See All
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-x-3 gap-y-5 p-4">
                      {section.items.map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setLoading(true);
                            setProducts([]);
                            setSearch("");
                            setQuery("");

                            const type = item.targetType;

                            if (type === "DEAL") {
                              setShowDiscounted(true);
                              setCategory("");
                              setSelectedSubCategory("");
                              setSelectedBrand("");
                            } else if (type === "BRAND") {
                              setSelectedBrand(item.targetValue);
                              setCategory("");
                              setSelectedSubCategory("");
                            } else if (type === "SUBCATEGORY") {
                              setSelectedSubCategory(item.targetValue);
                            } else {
                              setCategory(item.targetValue);
                              setSelectedSubCategory("");
                            }

                            setMobileProductMode(true);
                          }}
                          className="min-w-0 text-center transition active:scale-95"
                        >
                          <div className="mx-auto flex h-[74px] w-full items-center justify-center rounded-xl bg-slate-50 p-2">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-12 max-w-[76px] object-contain"
                              />
                            ) : (
                              <span className="text-2xl">⚡</span>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-tight text-slate-700">
                            {item.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              : activeMobileSections.map((group) => (
                  <div
                    key={group.title}
                    data-section={group.title}
                    id={`section-${group.title
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <h3 className="text-[15px] font-black tracking-wide text-slate-900">
                        {group.title}
                      </h3>

                      <button
                        type="button"
                        onClick={() => {
                          setLoading(true);
                          setProducts([]);
                          setSelectedSubCategory("");
                          setSelectedBrand("");
                          setSearch("");
                          setQuery("");

                          if (group.title === "Flash Sales") {
                            setShowDiscounted(true);
                            setCategory("");
                          } else {
                            setShowDiscounted(false);
                            if (!category) setCategory(group.title);
                          }

                          setMobileProductMode(true);
                        }}
                        className="text-sm font-black text-orange-600"
                      >
                        See All
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-x-3 gap-y-5 p-4">
                      {group.items.map((item) => (
                        <button
                          key={`${group.title}-${item}`}
                          type="button"
                          onClick={() => {
                            setLoading(true);
                            setProducts([]);
                            setSelectedBrand("");
                            setSearch("");
                            setQuery("");

                            const lower = item.toLowerCase();
                            const isBrand = [
                              "tecno",
                              "samsung",
                              "infinix",
                              "iphone",
                              "oppo",
                              "xiaomi",
                              "hisense",
                              "vitron",
                              "tcl",
                              "lg",
                              "sony",
                            ].includes(lower);

                            if (group.title === "Flash Sales" || lower.includes("deal")) {
                              setShowDiscounted(true);
                              setCategory("");
                              setSelectedSubCategory("");
                            } else if (isBrand) {
                              setSelectedBrand(item);
                              setCategory("Phones");
                              setSelectedSubCategory("");
                              setShowDiscounted(false);
                            } else if (!category) {
                              setCategory(item);
                              setSelectedSubCategory("");
                              setShowDiscounted(false);
                            } else {
                              setSelectedSubCategory(item);
                              setShowDiscounted(false);
                            }

                            setMobileProductMode(true);
                          }}
                          className="min-w-0 text-center transition active:scale-95"
                        >
                          <div className="mx-auto flex h-[74px] w-full items-center justify-center rounded-xl bg-slate-50 p-2">
                            {getCategoryTileImage(group.title, item) ? (
                              <img
                                src={getCategoryTileImage(group.title, item)}
                                alt={item}
                                className="h-12 max-w-[76px] object-contain"
                              />
                            ) : (
                              <span className="text-2xl">
                                {getCategoryTileIcon(group.title, item)}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-tight text-slate-700">
                            {item}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
          </>
        )}
      </div>
    </div>
  ) : (
    <div className="mx-3 mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setMobileProductMode(false);
            setSearch("");
            setQuery("");
            setSelectedSubCategory("");
            setSelectedBrand("");
            setShowDiscounted(false);
          }}
          className="shrink-0 text-xs font-black text-orange-600"
        >
          ← Categories
        </button>

        <p className="min-w-0 flex-1 truncate text-center text-xs font-bold text-slate-500">
          {debouncedQuery
            ? `Results for "${debouncedQuery}"`
            : showDiscounted
              ? "Flash Deals"
              : selectedBrand
                ? `${selectedBrand} Products`
                : selectedSubCategory
                  ? selectedSubCategory
                  : category || "Products"}
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <Link href="/saved-items" className="text-xs font-black text-red-600">
            Saved {savedProductIds.length}
          </Link>

          <Link href="/cart" className="text-xs font-black text-slate-700">
            Cart
          </Link>
        </div>
      </div>
    </div>
  )}
</div>


{/* DESKTOP CATEGORY CHIPS - unchanged */}
<div className="mt-6 hidden flex-wrap gap-2 md:flex">
  <button
    type="button"
    onClick={() => {
      setCategory("");
      setSubCategory("");
      setSelectedSubCategory("");
      setSelectedBrand("");
      setSearch("");
      setQuery("");
      setShowDiscounted(false);
    }}
    className={`rounded-full px-3 py-1.5 text-xs font-black sm:text-sm ${
      category === ""
        ? "bg-orange-600 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    All
  </button>

  {allCategories.map((item) => (
    <button
      key={item}
      type="button"
      onClick={() => {
        setCategory(item);
        setSelectedSubCategory("");
        setSelectedBrand("");
        setSearch("");
        setQuery("");
        setShowDiscounted(false);
      }}
      className={`rounded-full px-3 py-1.5 text-xs font-black sm:text-sm ${
        category === item
          ? "bg-orange-600 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {item}
    </button>
  ))}
</div>

{subCategories.length > 0 ? (
  <div className="mt-6 hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4 md:block">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
        {category === "Phones" ? "Shop phone brands" : "Shop subcategories"}
      </h3>

      {selectedSubCategory ? (
        <button
          type="button"
          onClick={() => setSelectedSubCategory("")}
          className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
        >
          Clear
        </button>
      ) : null}
    </div>

    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {subCategories.map((sub) => (
        <button
          key={sub}
          type="button"
          onClick={() => setSelectedSubCategory(sub)}
          className={`rounded-xl border p-3 text-left transition hover:-translate-y-1 hover:shadow-md ${
            selectedSubCategory === sub
              ? "border-orange-600 bg-orange-600 text-white"
              : "border-slate-200 bg-white text-slate-950"
          }`}
        >
          <div
            className={`mb-3 flex h-16 items-center justify-center rounded-2xl text-2xl ${
              selectedSubCategory === sub ? "bg-white/15" : "bg-slate-100"
            }`}
          >
            {getSubCategoryIcon(category, sub)}
          </div>

          <p className="line-clamp-2 text-sm font-black">{sub}</p>
        </button>
      ))}
    </div>
  </div>
) : null}

{brands.length > 0 && (
  <div className="mt-4 hidden flex-wrap gap-2 md:flex">
    <button
      onClick={() => setSelectedBrand("")}
      className={`rounded-full px-4 py-2 text-xs font-black ${
        selectedBrand === ""
          ? "bg-orange-600 text-white"
          : "bg-orange-100 text-orange-700"
      }`}
    >
      All Brands
    </button>

    {brands.map((brand) => (
      <button
        key={brand}
        onClick={() => setSelectedBrand(brand)}
        className={`rounded-full px-4 py-2 text-xs font-black ${
          selectedBrand === brand
            ? "bg-orange-600 text-white"
            : "bg-orange-100 text-orange-700"
        }`}
      >
        {brand}
      </button>
    ))}
  </div>
)}


              <div className={`${mobileProductMode ? "block" : "hidden"} md:block`}>
                <div className="mb-3">
                  <SiteBannerStrip placement="LISTING" />
                </div>
                {message ? (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {message}{" "}
                  <Link href="/cart" className="font-bold underline">
                    View basket
                  </Link>
                </div>
              ) : null}

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
  {[1,2,3,4,5,6].map((i) => (
    <div
      key={i}
      className="animate-pulse rounded-2xl border bg-white p-3"
    >
      <div className="h-28 rounded-lg bg-slate-200" />
      <div className="mt-2 h-3 w-3/4 rounded bg-slate-200" />
      <div className="mt-1 h-3 w-1/2 rounded bg-slate-200" />
    </div>
  ))}
</div>
              ) : displayedProducts.length === 0 ? (
  <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">

    <p className="font-bold text-slate-700">
      {debouncedQuery
        ? `No results for "${debouncedQuery}".`
        : "No products found in this category."}
    </p>

    {debouncedQuery ? (
      <div>
        <p className="text-xs font-black text-slate-500">Try searching for:</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {trendingSearches.slice(0, 6).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                setMobileProductMode(true);
                setLoading(true);
              }}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    ) : null}

    <button
      type="button"
      onClick={() => {
        setQuery("");
        setDebouncedQuery("");
        setCategory("");
        setSelectedBrand("");
        setSelectedSubCategory("");
        setMobileProductMode(false);
      }}
      className="mt-3 text-xs font-black text-orange-600"
    >
      ← Browse all categories
    </button>
  </div>
              ) : (
<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
  {displayedProducts.map((product) => {
    const qty = quantities[product.id] || 1;
    const sizes = product.sizes || [];
    const colors = product.colors || [];
    const finalPrice = discountedPrice(product.price, product.discountPercent);
    const hasDiscount =
      product.discountPercent && product.discountPercent > 0;

    return (
      <div
        key={product.id}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 active:scale-[0.97] hover:-translate-y-1 hover:shadow-xl"
      >
        <Link href={`/online-store/${product.id}`}>
          <div className="relative flex h-28 items-center justify-center overflow-hidden bg-slate-100 sm:h-36">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <ShoppingBag className="h-9 w-9 text-slate-300" />
            )}
            
            {hasDiscount ? (
              <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-white">
                 -{product.discountPercent}% OFF
              </span>
            ) : null}
          </div>
        </Link>

<button
  type="button"
  onClick={(event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSavedProduct(product.id);
  }}
  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition active:scale-90 ${
    savedProductIds.includes(product.id)
      ? "bg-red-600 text-white"
      : "bg-white/90 text-slate-700"
  }`}
  aria-label={
    savedProductIds.includes(product.id)
      ? "Remove from saved items"
      : "Save item"
  }
>
  <Heart
    className={`h-4 w-4 transition ${
      savedProductIds.includes(product.id)
        ? "fill-white text-white scale-110"
        : "text-slate-600"

    }`}
  />
</button>

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
 </div>

          <Link href={`/online-store/${product.id}`}>
            <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950 hover:text-orange-700">
              {product.name}
            </h3>
          </Link>

          {hasDiscount ? (
  <div className="mt-1 space-y-1">
    <div className="flex items-center gap-2">
      <p className="text-sm font-black text-orange-700">
        {money(finalPrice)}
      </p>

      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
        -{product.discountPercent}%
      </span>
    </div>

    <p className="text-xs font-bold text-slate-400 line-through">
      {money(product.price)}
    </p>

    <p className="text-[10px] font-bold text-green-600">
      You save {money(Number(product.price) - finalPrice)}
    </p>
  </div>
) : (
            <p className="mt-1 text-sm font-black text-slate-950">
              {money(product.price)}
            </p>
          )}

          {product.reviewCount && product.reviewCount > 0 ? (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <span className="font-black text-orange-600">
                ★ {Number(product.averageRating || 0).toFixed(1)}
              </span>
              <span className="text-slate-500">({product.reviewCount})</span>
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-400">No reviews</div>
          )}

          {sizes.length > 0 ? (
            <select
              className="mt-2 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs outline-none focus:border-orange-600"
              value={selectedSizes[product.id] || ""}
              onChange={(e) =>
                setSelectedSizes((current) => ({
                  ...current,
                  [product.id]: e.target.value,
                }))
              }
            >
              <option value="">Size</option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          ) : null}

          {colors.length > 0 ? (
            <select
              className="mt-2 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs outline-none focus:border-orange-600"
              value={selectedColors[product.id] || ""}
              onChange={(e) =>
                setSelectedColors((current) => ({
                  ...current,
                  [product.id]: e.target.value,
                }))
              }
            >
              <option value="">Color</option>
              {colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          ) : null}

          <div className="mt-3 space-y-2">
            <div className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setQuantity(product.id, qty - 1, product.stock)}
                className="h-9 w-8 text-sm font-black text-slate-950"
              >
                -
              </button>

              <div className="flex h-9 min-w-7 items-center justify-center text-xs font-black text-slate-950">
                {qty}
              </div>

              <button
                type="button"
                onClick={() => setQuantity(product.id, qty + 1, product.stock)}
                className="h-9 w-8 text-sm font-black text-slate-950"
              >
                +
              </button>
            </div>

<button
  type="button"
  onClick={() => addToCart(product)}
  disabled={product.stock <= 0}
  className={`inline-flex h-9 w-full items-center justify-center rounded-xl px-3 text-xs font-black ${
    product.stock <= 0
      ? "cursor-not-allowed bg-slate-200 text-slate-500"
      : "bg-orange-600 text-white hover:bg-orange-700"
  }`}
>
  {product.stock <= 0 ? "Out of stock" : "Add"}
  {product.stock > 0 ? (
    <ArrowRight className="ml-1 h-3 w-3 text-white" />
  ) : null}
</button>
</div>

          <Link
            href={`/online-store/${product.id}`}
            className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            View details
          </Link>
        </div>
      </div>
    );
  })}
</div>
                
              )}
              </div>
            </>
          )}
        </div>
      </section>

      <MobileBottomNav />
    </main>
  );
}

export default function OnlineStorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-4 pb-24 sm:px-6 sm:py-8 lg:px-8">
          <section className="mx-auto max-w-7xl">
            <div className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200">
              <p className="text-sm font-bold text-slate-700">
                Loading store...
              </p>
            </div>
          </section>        
        </main>
      }
    >
      <OnlineStoreContent />
    </Suspense>
  );
}