import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [orders, payments, orderItems, products, users] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: true,
        },
      }),
      db.payment.findMany({
        orderBy: { createdAt: "desc" },
      }),
      db.orderItem.findMany(),
      db.product.findMany(),
      db.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true },
      }),
    ]);

    const allOrders = await db.order.findMany();

    const paidOrders = allOrders.filter(
      (order) => order.paymentStatus === "PAID"
    );

    const paidRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const pendingOrders = allOrders.filter(
      (order) => order.status === "PENDING"
    ).length;

    const failedPayments = payments.filter(
      (payment) => payment.status === "FAILED"
    ).length;

    const productSalesMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const item of orderItems) {
      const current = productSalesMap.get(item.productId) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += item.quantity;
      current.revenue += Number(item.lineTotal);

      productSalesMap.set(item.productId, current);
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    const paymentSummary = payments.reduce<Record<string, number>>(
      (acc, payment) => {
        acc[payment.provider] = (acc[payment.provider] || 0) + 1;
        return acc;
      },
      {}
    );

    const stockSummary = {
      active: products.filter((product) => product.status === "ACTIVE").length,
      outOfStock: products.filter(
        (product) => product.status === "OUT_OF_STOCK"
      ).length,
      hidden: products.filter((product) => product.status === "HIDDEN").length,
    };

    return NextResponse.json({
      summary: {
        totalOrders: allOrders.length,
        paidRevenue,
        pendingOrders,
        failedPayments,
        customers: users.length,
        products: products.length,
      },
      paymentSummary,
      stockSummary,
      topProducts,
      recentOrders: orders,
    });
  } catch (error) {
    console.error("ADMIN_ANALYTICS_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load analytics." },
      { status: 500 }
    );
  }
}