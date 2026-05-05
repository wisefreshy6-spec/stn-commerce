import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shortDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
  });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = rawSession ? parseSessionValue(rawSession) : null;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const todayStart = startOfToday();
    const weekStart = daysAgo(7);
    const monthStart = daysAgo(30);

    const [
      allOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      recentOrders,
      orderItems,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      expenses,
    ] = await Promise.all([
      db.order.findMany({
        where: { paymentStatus: "PAID" },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          paymentMethod: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      db.order.findMany({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: todayStart },
        },
        select: { totalAmount: true },
      }),

      db.order.findMany({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: weekStart },
        },
        select: { totalAmount: true },
      }),

      db.order.findMany({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: monthStart },
        },
        select: { totalAmount: true },
      }),

      db.order.findMany({
        where: { paymentStatus: "PAID" },
        orderBy: { createdAt: "desc" },
        take: 8,
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

      db.orderItem.findMany({
        include: {
          product: {
            select: {
              id: true,
              section: true,
              category: true,
              stock: true,
              status: true,
            },
          },
        },
      }),

      db.product.count({
        where: { status: "ACTIVE" },
      }),

      db.product.findMany({
        where: {
          stock: { lte: 5 },
          status: { not: "DELETED" },
        },
        orderBy: { stock: "asc" },
        take: 10,
      }),

      db.product.count({
        where: {
          OR: [{ status: "OUT_OF_STOCK" }, { stock: 0 }],
        },
      }),

      db.expense.findMany(),
    ]);

    const sumOrders = (orders: { totalAmount: unknown }[]) =>
      orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const totalRevenue = sumOrders(allOrders);

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const profit = totalRevenue - totalExpenses;
    const trendStart = daysAgo(13);

    const trendMap = new Map<
      string,
      {
        date: string;
        label: string;
        revenue: number;
        orders: number;
      }
    >();

    for (let i = 13; i >= 0; i--) {
      const day = daysAgo(i);
      const key = dateKey(day);

      trendMap.set(key, {
        date: key,
        label: shortDateLabel(key),
        revenue: 0,
        orders: 0,
      });
    }

    for (const order of allOrders) {
      if (order.createdAt < trendStart) continue;

      const key = dateKey(order.createdAt);
      const current = trendMap.get(key);

      if (current) {
        current.revenue += Number(order.totalAmount);
        current.orders += 1;
      }
    }

    const revenueTrend = Array.from(trendMap.values());

    const paymentMethodMap = new Map<
      string,
      { method: string; revenue: number; orders: number }
    >();

    for (const order of allOrders) {
      const method = String(order.paymentMethod || "UNKNOWN");
      const current = paymentMethodMap.get(method);

      if (current) {
        current.revenue += Number(order.totalAmount);
        current.orders += 1;
      } else {
        paymentMethodMap.set(method, {
          method,
          revenue: Number(order.totalAmount),
          orders: 1,
        });
      }
    }

    const paymentBreakdown = Array.from(paymentMethodMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    const productMap = new Map<
      string,
      {
        productId: string;
        name: string;
        quantitySold: number;
        revenue: number;
        section: string;
        category: string | null;
        currentStock: number;
      }
    >();

    for (const item of orderItems) {
      if (!item.product) continue;

      const current = productMap.get(item.productId);

      if (current) {
        current.quantitySold += item.quantity;
        current.revenue += Number(item.lineTotal);
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          quantitySold: item.quantity,
          revenue: Number(item.lineTotal),
          section: item.product.section,
          category: item.product.category,
          currentStock: item.product.stock,
        });
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 8);

    const bestDay =
      revenueTrend.length > 0
        ? [...revenueTrend].sort((a, b) => b.revenue - a.revenue)[0]
        : null;

    const worstDay =
      revenueTrend.length > 0
        ? [...revenueTrend]
            .filter((d) => d.orders > 0)
            .sort((a, b) => a.revenue - b.revenue)[0] || null
        : null;

    const bestPaymentMethod =
      paymentBreakdown.length > 0 ? paymentBreakdown[0] : null;

    const topProductInsight = topProducts.length > 0 ? topProducts[0] : null;

    let recommendation =
      "Keep tracking your business performance for better insights.";

    if (profit < 0) {
      recommendation =
        "You're operating at a loss. Reduce expenses or improve sales.";
    } else if (lowStockProducts.length > 0) {
      recommendation =
        "Some products are low in stock. Restock to avoid losing sales.";
    } else if (topProductInsight) {
      recommendation =
        "Your top product is performing well. Consider promoting similar items.";
    }

    return NextResponse.json({
      summary: {
        totalRevenue,
        todayRevenue: sumOrders(todayOrders),
        weekRevenue: sumOrders(weekOrders),
        monthRevenue: sumOrders(monthOrders),

        totalExpenses,
        profit,

        totalOrders: allOrders.length,
        todayOrders: todayOrders.length,
        weekOrders: weekOrders.length,
        monthOrders: monthOrders.length,

        activeProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockProducts,
      },
      revenueTrend,
      paymentBreakdown,
      topProducts,
      lowStockProducts,
      recentOrders,
      insights: {
        bestDay,
        worstDay,
        topProduct: topProductInsight,
        bestPaymentMethod,
        profitStatus: profit >= 0 ? "PROFIT" : "LOSS",
        recommendation,
      },
    });
  } catch (error) {
    console.error("ADMIN_SALES_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load sales dashboard." },
      { status: 500 }
    );
  }
}