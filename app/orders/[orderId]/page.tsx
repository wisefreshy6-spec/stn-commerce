"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Printer, XCircle } from "lucide-react";

type OrderItem = {
  id: string;
  name: string;
  price: string | number;
  quantity: number;
  lineTotal: string | number;
  size?: string | null;
  color?: string | null;
};

type OrderDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotal: string | number;
  deliveryFee: string | number;
  total?: string | number | null;
  totalAmount?: string | number | null;
  totalItems?: number | null;
  deliveryArea?: string | null;
  deliveryAddress?: string | null;
  createdAt: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  items: OrderItem[];
};

type OrderResponse = {
  order?: OrderDetail;
  error?: string;
};

type ActionResponse = {
  message?: string;
  error?: string;
};

function numberValue(value: string | number | null | undefined) {
  const num = Number(value ?? 0);
  return Number.isNaN(num) ? 0 : num;
}

function money(value: string | number | null | undefined) {
  return `KES ${numberValue(value).toLocaleString()}`;
}

function getOrderTotal(order: OrderDetail) {
  return order.totalAmount ?? order.total ?? 0;
}

function statusText(status: string) {
  return status.replaceAll("_", " ");
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/orders/${orderId}`);
      const data = (await response.json()) as OrderResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load order.");
        return;
      }

      setOrder(data.order || null);
    } catch {
      setError("Something went wrong while loading the order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      void loadOrder();
    }
  }, [orderId]);

  const cancelOrder = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      "Cancel this order? This is only allowed before processing starts."
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "PATCH",
      });

      const data = (await response.json()) as ActionResponse;

      if (!response.ok) {
        setError(data.error || "Unable to cancel order.");
        return;
      }

      setMessage(data.message || "Order cancelled.");
      await loadOrder();
    } catch {
      setError("Something went wrong while cancelling the order.");
    } finally {
      setCancelling(false);
    }
  };

  const downloadPdf = async () => {
    if (!order) return;

    try {
      setDownloading(true);
      setError("");

      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.default;
      const pdf = new jsPDF("p", "mm", "a4");

      const customerName =
        [order.user?.firstName, order.user?.lastName]
          .filter(Boolean)
          .join(" ") || "Customer";

      let y = 18;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("STN Commerce", 14, y);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      y += 7;
      pdf.text("Sales Receipt / Tax Invoice", 14, y);
      y += 6;
      pdf.text("STN Commerce Minimart", 14, y);
      y += 5;
      pdf.text("Nairobi, Kenya", 14, y);
      y += 5;
      pdf.text("support@stncommerce.com", 14, y);

      y = 18;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(order.invoiceNumber, 120, y);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      y += 7;
      pdf.text(new Date(order.createdAt).toLocaleString(), 120, y);
      y += 6;
      pdf.text(`Payment: ${order.paymentStatus}`, 120, y);
      y += 5;
      pdf.text(`Order: ${statusText(order.status)}`, 120, y);

      y = 55;
      pdf.setDrawColor(220);
      pdf.line(14, y, 196, y);

      y += 12;
      pdf.setFont("helvetica", "bold");
      pdf.text("BILL TO", 14, y);
      pdf.text("DELIVERY / SALE TYPE", 110, y);

      pdf.setFont("helvetica", "normal");
      y += 8;
      pdf.text(customerName, 14, y);
      pdf.text(order.deliveryArea || "Delivery area not set", 110, y);

      y += 6;
      pdf.text(order.user?.email || "Email not available", 14, y);
      pdf.text(order.deliveryAddress || "Delivery address not set", 110, y, {
        maxWidth: 80,
      });

      y += 6;
      pdf.text(order.user?.phone || "Phone not available", 14, y);
      pdf.text(`Payment method: ${order.paymentMethod || "N/A"}`, 110, y + 6);

      y += 22;
      pdf.setFillColor(15, 23, 42);
      pdf.rect(14, y, 182, 9, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.text("ITEM", 16, y + 6);
      pdf.text("QTY", 120, y + 6);
      pdf.text("PRICE", 145, y + 6);
      pdf.text("TOTAL", 175, y + 6);

      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");

      y += 14;

      for (const item of order.items) {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }

        const optionText = [
          item.size ? `Size: ${item.size}` : "",
          item.color ? `Color: ${item.color}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        pdf.setFontSize(10);
        pdf.text(item.name, 16, y);

        if (optionText) {
          y += 5;
          pdf.setFontSize(8);
          pdf.text(optionText, 16, y);
          pdf.setFontSize(10);
        }

        pdf.text(String(item.quantity), 122, y);
        pdf.text(money(item.price), 140, y);
        pdf.text(money(item.lineTotal), 170, y);
        y += 8;
      }

      y += 8;
      pdf.line(110, y, 196, y);

      y += 8;
      pdf.text("Subtotal", 125, y);
      pdf.text(money(order.subtotal), 170, y);

      y += 7;
      pdf.text("Delivery", 125, y);
      pdf.text(
        numberValue(order.deliveryFee) === 0 ? "Free" : money(order.deliveryFee),
        170,
        y
      );

      y += 9;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Grand total", 125, y);
      pdf.text(money(getOrderTotal(order)), 165, y);

      y += 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(
        "Refund policy: non-food items can be reviewed within 7 days. Food items are not refundable unless there is a verified issue.",
        14,
        y,
        { maxWidth: 180 }
      );

      y += 12;
      pdf.text(
        "If order is marked delivered/ready, please pick it within 3 business days.",
        14,
        y,
        { maxWidth: 180 }
      );

      pdf.save(`${order.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF_DOWNLOAD_ERROR", err);
      setError("PDF download failed. Please try again or use Print.");
    } finally {
      setDownloading(false);
    }
  };

  const customerName = order
    ? [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
      "Customer"
    : "Customer";

  const canCancel = order?.status === "PENDING";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to orders
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            {canCancel ? (
              <button
                type="button"
                onClick={() => void cancelOrder()}
                disabled={cancelling}
                className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {cancelling ? "Cancelling..." : "Cancel order"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={downloading || !order}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              <Download className="mr-2 h-4 w-4 text-white" />
              {downloading ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700 print:hidden">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 print:hidden">
            {error}
          </div>
        ) : null}

        <div className="rounded-[32px] bg-white p-8 shadow-xl ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0">
          {loading ? (
            <p className="text-sm text-slate-600">Loading invoice...</p>
          ) : !order ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Order not found.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-lg font-black text-white">
                      STN
                    </div>

                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-slate-950">
                        STN Commerce
                      </h1>
                      <p className="mt-1 text-sm text-slate-500">
                        Sales Receipt / Tax Invoice
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 text-sm leading-6 text-slate-600">
                    <p>STN Commerce Minimart</p>
                    <p>Nairobi, Kenya</p>
                    <p>support@stncommerce.com</p>
                  </div>
                </div>

                <div className="md:text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                    Invoice number
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {order.invoiceNumber}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                      {order.paymentMethod || "N/A"}
                    </span>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Payment {order.paymentStatus}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Order {statusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                    Bill to
                  </p>

                  <h2 className="mt-3 text-lg font-black text-slate-950">
                    {customerName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {order.user?.email || "Email not available"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {order.user?.phone || "Phone not available"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                    Delivery / sale type
                  </p>

                  <h2 className="mt-3 text-lg font-black text-slate-950">
                    {order.deliveryArea || "Delivery area not set"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {order.deliveryAddress || "Delivery address not set"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Payment method: {order.paymentMethod || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1fr_70px_110px_120px] bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white">
                  <div>Item</div>
                  <div className="text-center">Qty</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Total</div>
                </div>

                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_70px_110px_120px] border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
                  >
                    <div>
                      <div className="font-bold text-slate-950">
                        {item.name}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2">
                        {item.size ? (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                            Size: {item.size}
                          </span>
                        ) : null}

                        {item.color ? (
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                            Color: {item.color}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-center">{item.quantity}</div>
                    <div className="text-right">{money(item.price)}</div>
                    <div className="text-right font-bold text-slate-950">
                      {money(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-sm rounded-2xl bg-slate-50 p-5">
                  <div className="flex justify-between border-b border-slate-200 pb-3 text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-bold text-slate-950">
                      {money(order.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 py-3 text-sm">
                    <span className="text-slate-600">Delivery</span>
                    <span className="font-bold text-slate-950">
                      {numberValue(order.deliveryFee) === 0
                        ? "Free"
                        : money(order.deliveryFee)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm font-bold text-slate-600">
                      Grand total
                    </span>
                    <span className="text-2xl font-black text-slate-950">
                      {money(getOrderTotal(order))}
                    </span>
                  </div>
                </div>
              </div>

              {order.status === "DELIVERED" ? (
                <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                  This order is ready for pickup. Please collect it within 3
                  business days. Refund review for non-food items is available
                  within 7 days.
                </div>
              ) : null}

              <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
                Generated by STN Commerce System · {order.invoiceNumber}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}