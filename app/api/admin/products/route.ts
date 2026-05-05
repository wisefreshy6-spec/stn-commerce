import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type ProductBody = {
  name?: string;
  barcode?: string;
  section?: "FAST_FOOD" | "HARDWARE" | "ONLINE_STORE" | "EXCLUSIVE_STORE";
  category?: string;
  subCategory?: string;
  price?: string | number;
  stock?: string | number;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  discountPercent?: string | number;
  brand?: string;
  warrantyMonths?: string | number;
  keyFeatures?: string[];
  specifications?: Record<string, string>;
  packageItems?: string[];
  offerText?: string;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = rawSession ? parseSessionValue(rawSession) : null;

  if (!session || session.role !== "ADMIN") {
    return null;
  }

  return session;
}

function cleanText(value: unknown, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function cleanOptions(value: unknown, maxItems = 30) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanUrlList(value: unknown) {
  return cleanOptions(value, 10).filter((item) => /^https?:\/\//i.test(item));
}

function cleanSpecifications(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, val]) => [cleanText(key, 80), cleanText(val, 200)])
    .filter(([key, val]) => key && val)
    .slice(0, 40);

  if (entries.length === 0) return null;

  return Object.fromEntries(entries);
}

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

const products = await db.product.findMany({
  orderBy: {
    createdAt: "desc",
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

const productsWithRatings = products.map((product) => {
  const reviewCount = product.reviews.length;

  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : 0;

  return {
    ...product,
    price: String(product.price),
    averageRating,
    reviewCount,
  };
});

return NextResponse.json({ products: productsWithRatings });
  } catch (error) {
    console.error("ADMIN_PRODUCTS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as ProductBody;

    const name = cleanText(body.name, 160);
    const barcode = cleanText(body.barcode, 80);
    const section = body.section || "ONLINE_STORE";
    const category = cleanText(body.category, 80);
    const subCategory = cleanText(body.subCategory, 80);
    const price = Number(body.price);
    const stock = Number(body.stock);
    const description = cleanText(body.description, 5000);
    const imageUrl = cleanText(body.imageUrl, 1000);
    const imageUrls = cleanUrlList(body.imageUrls);
    const sizes = cleanOptions(body.sizes, 20);
    const colors = cleanOptions(body.colors, 20);
    const discountPercent = Number(body.discountPercent || 0);

    const brand = cleanText(body.brand, 80);
    const warrantyMonthsRaw = body.warrantyMonths;
    const warrantyMonths =
      warrantyMonthsRaw === undefined ||
      warrantyMonthsRaw === null ||
      warrantyMonthsRaw === ""
        ? null
        : Number(warrantyMonthsRaw);

    const keyFeatures = cleanOptions(body.keyFeatures, 30);
    const specifications = cleanSpecifications(body.specifications);
    const packageItems = cleanOptions(body.packageItems, 30);
    const offerText = cleanText(body.offerText, 300);

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Enter a valid product price." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Enter a valid opening stock quantity." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 90
    ) {
      return NextResponse.json(
        { error: "Discount must be between 0 and 90." },
        { status: 400 }
      );
    }

    if (
      warrantyMonths !== null &&
      (!Number.isInteger(warrantyMonths) ||
        warrantyMonths < 0 ||
        warrantyMonths > 120)
    ) {
      return NextResponse.json(
        { error: "Warranty months must be between 0 and 120." },
        { status: 400 }
      );
    }

    const allowedSections = [
      "FAST_FOOD",
      "HARDWARE",
      "ONLINE_STORE",
      "EXCLUSIVE_STORE",
    ];

    if (!allowedSections.includes(section)) {
      return NextResponse.json(
        { error: "Invalid store section." },
        { status: 400 }
      );
    }

    if (barcode) {
      const existingBarcode = await db.product.findFirst({
        where: {
          barcode,
          status: {
            not: "DELETED",
          },
        },
        select: {
          id: true,
        },
      });

      if (existingBarcode) {
        return NextResponse.json(
          { error: "Another product already uses this barcode." },
          { status: 409 }
        );
      }
    }

    const finalImageUrls =
      imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];

    const product = await db.product.create({
      data: {
        name,
        barcode: barcode || null,
        section,
        category: category || null,
        subCategory: subCategory || null,
        price,
        stock,
        description: description || null,
        imageUrl: imageUrl || finalImageUrls[0] || null,
        imageUrls: finalImageUrls,
        sizes,
        colors,
        discountPercent,
        brand: brand || null,
        warrantyMonths,
        keyFeatures,
        specifications,
        packageItems,
        offerText: offerText || null,
        status: stock <= 0 ? "OUT_OF_STOCK" : "ACTIVE",
      },
    });

    return NextResponse.json({
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("ADMIN_PRODUCTS_POST_ERROR", error);

    return NextResponse.json(
      { error: "Unable to add product." },
      { status: 500 }
    );
  }
}