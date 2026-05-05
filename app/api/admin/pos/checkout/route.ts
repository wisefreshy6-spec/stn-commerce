import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

type PosItem = {
  productId: string;
  quantity: number;
};

type PosBody = {
  items?: PosItem[];
  paymentMethod?: "CASH" | "MPESA" | "CARD" | "PAYPAL";
};

function createInvoiceNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `STN-POS-${y}${m}${d}-${random}`;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as PosBody;
    const items = body.items || [];
    const paymentMethod = body.paymentMethod || "CASH";

    if (!items.length) {
      return NextResponse.json(
        { error: "No items added to POS sale." },
        { status: 400 }
      );
    }

    const cleanedItems = items.map((item) => ({
      productId: String(item.productId || "").trim(),
      quantity: Number(item.quantity),
    }));

    for (const item of cleanedItems) {
      if (
        !item.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return NextResponse.json(
          { error: "One or more POS items are invalid." },
          { status: 400 }
        );
      }
    }

    const productIds = Array.from(
      new Set(cleanedItems.map((item) => item.productId))
    );

    const order = await db.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          status: "ACTIVE",
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("Some products are unavailable or inactive.");
      }

      for (const item of cleanedItems) {
        const product = products.find((p) => p.id === item.productId);

        if (!product) {
          throw new Error("Product not found.");
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `${product.name} has only ${product.stock} item(s) left.`
          );
        }
      }

      const orderItems = cleanedItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const price = Number(product.price);
        const lineTotal = price * item.quantity;

        return {
          product,
          quantity: item.quantity,
          price,
          lineTotal,
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = subtotal;
      const invoiceNumber = createInvoiceNumber();

      const createdOrder = await tx.order.create({
        data: {
          userId: session.userId,
          invoiceNumber,
          status: "DELIVERED",
          paymentStatus: "PAID",
          paymentMethod,
          subtotal,
          deliveryFee: 0,
          totalAmount,
          totalItems,
          deliveryArea: "POS Counter Sale",
          deliveryAddress: "Served at STN Commerce counter",
          items: {
            create: orderItems.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.price,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of orderItems) {
        const updatedProduct = await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.stock <= 0) {
          await tx.product.update({
            where: { id: item.product.id },
            data: {
              stock: 0,
              status: "OUT_OF_STOCK",
            },
          });
        }
      }

      return createdOrder;
    });

    return NextResponse.json({
      message: "POS sale completed successfully.",
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
    });
  } catch (error) {
    console.error("POS_CHECKOUT_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Unable to complete POS sale.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}