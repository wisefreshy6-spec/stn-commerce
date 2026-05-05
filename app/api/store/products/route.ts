import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get("limit");
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    const limit =
      parsedLimit && Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 50)
        : undefined;

    const section = searchParams.get("section")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const subCategory = searchParams.get("subCategory")?.trim() || "";
    const brand = searchParams.get("brand")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";

    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        stock: {
          gt: 0,
        },
        ...(section ? { section: section as any } : {}),
        ...(category
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
        ...(subCategory
          ? { subCategory: { equals: subCategory, mode: "insensitive" } }
          : {}),
        ...(brand
          ? { brand: { equals: brand, mode: "insensitive" } }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { subCategory: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
                { brand: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      ...(limit ? { take: limit } : {}),
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        imageUrls: true,
        barcode: true,
        section: true,
        category: true,
        subCategory: true,
        brand: true,
        warrantyMonths: true,
        stock: true,
        status: true,
        sizes: true,
        colors: true,
        discountPercent: true,
        offerText: true,
        keyFeatures: true,
        packageItems: true,
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

      const { reviews, ...safeProduct } = product;

      return {
        ...safeProduct,
        price: String(safeProduct.price),
        averageRating,
        reviewCount,
      };
    });

    const categoryRows = await db.product.findMany({
      where: {
        status: "ACTIVE",
        stock: {
          gt: 0,
        },
        ...(section ? { section: section as any } : {}),
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
    });

    const subCategoryRows = await db.product.findMany({
      where: {
        status: "ACTIVE",
        stock: {
          gt: 0,
        },
        ...(section ? { section: section as any } : {}),
        ...(category
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
        subCategory: {
          not: null,
        },
      },
      select: {
        subCategory: true,
      },
    });

    const brandRows = await db.product.findMany({
      where: {
        status: "ACTIVE",
        stock: {
          gt: 0,
        },
        ...(section ? { section: section as any } : {}),
        ...(category
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
        ...(subCategory
          ? { subCategory: { equals: subCategory, mode: "insensitive" } }
          : {}),
        brand: {
          not: null,
        },
      },
      select: {
        brand: true,
      },
    });

    const categories = Array.from(
      new Set(
        categoryRows
          .map((item) => item.category?.trim())
          .filter(Boolean) as string[]
      )
    ).sort();

    const subCategories = Array.from(
      new Set(
        subCategoryRows
          .map((item) => item.subCategory?.trim())
          .filter(Boolean) as string[]
      )
    ).sort();

    const brands = Array.from(
      new Set(
        brandRows.map((item) => item.brand?.trim()).filter(Boolean) as string[]
      )
    ).sort();

    return NextResponse.json({
      products: productsWithRatings,
      categories,
      subCategories,
      brands,
    });
  } catch (error) {
    console.error("STORE_PRODUCTS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load store products." },
      { status: 500 }
    );
  }
}