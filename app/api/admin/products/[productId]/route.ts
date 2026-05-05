import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

type ProductBody = {
  name?: string;
  barcode?: string | null;
  section?: "FAST_FOOD" | "HARDWARE" | "ONLINE_STORE" | "EXCLUSIVE_STORE";
  category?: string | null;
  subCategory?: string | null;
  price?: string | number;
  stock?: string | number;
  status?: "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK" | "DELETED";
  description?: string | null;
  imageUrl?: string | null;
  sizes?: string[];
  colors?: string[];
  discountPercent?: string | number;
  brand?: string | null;
  warrantyMonths?: string | number | null;
  imageUrls?: string[];
  keyFeatures?: string[];
  packageItems?: string[];
  offerText?: string | null;
  specifications?: Record<string, string>;
};

function cleanProductId(value: string) {
  return decodeURIComponent(value).replace(/^ID:\s*/i, "").trim();
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter(Boolean).slice(0, 50);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const id = cleanProductId(productId);

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("ADMIN_PRODUCT_GET_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load product." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const id = cleanProductId(productId);
    const body = (await request.json()) as ProductBody;

    const updateData: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      const name = cleanText(body.name);
      if (!name) {
        return NextResponse.json(
          { error: "Product name is required." },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (body.barcode !== undefined) {
      updateData.barcode = cleanText(body.barcode) || null;
    }

    if (body.section !== undefined) {
      updateData.section = body.section;
    }

    if (body.category !== undefined) {
      updateData.category = cleanText(body.category) || null;
    }

    if (body.subCategory !== undefined) {
      updateData.subCategory = cleanText(body.subCategory) || null;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: "Enter a valid product price." },
          { status: 400 }
        );
      }
      updateData.price = price;
    }

    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          { error: "Enter a valid stock quantity." },
          { status: 400 }
        );
      }
      updateData.stock = stock;
      if (stock <= 0) updateData.status = "OUT_OF_STOCK";
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.description !== undefined) {
      updateData.description = cleanText(body.description) || null;
    }

    if (body.imageUrl !== undefined) {
      updateData.imageUrl = cleanText(body.imageUrl) || null;
    }

    if (body.sizes !== undefined) {
      updateData.sizes = cleanArray(body.sizes);
    }

    if (body.colors !== undefined) {
      updateData.colors = cleanArray(body.colors);
    }

    if (body.discountPercent !== undefined) {
      const discountPercent = Number(body.discountPercent);
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
      updateData.discountPercent = discountPercent;
    }

    if (body.brand !== undefined) {
      updateData.brand = cleanText(body.brand) || null;
    }

    if (body.warrantyMonths !== undefined) {
      const warranty =
        body.warrantyMonths === null || body.warrantyMonths === ""
          ? null
          : Number(body.warrantyMonths);

      if (warranty !== null && (!Number.isInteger(warranty) || warranty < 0)) {
        return NextResponse.json(
          { error: "Enter a valid warranty period." },
          { status: 400 }
        );
      }

      updateData.warrantyMonths = warranty;
    }

    if (body.imageUrls !== undefined) {
      updateData.imageUrls = cleanArray(body.imageUrls);
    }

    if (body.keyFeatures !== undefined) {
      updateData.keyFeatures = cleanArray(body.keyFeatures);
    }

    if (body.packageItems !== undefined) {
      updateData.packageItems = cleanArray(body.packageItems);
    }

    if (body.offerText !== undefined) {
      updateData.offerText = cleanText(body.offerText) || null;
    }

    if (body.specifications !== undefined) {
      updateData.specifications = body.specifications as Prisma.InputJsonValue;
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("ADMIN_PRODUCT_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 500 }
    );
  }
}