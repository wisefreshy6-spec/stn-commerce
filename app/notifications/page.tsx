"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/components/layout/ProtectedShell";
import { Bell, CheckCircle2 } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/user/notifications");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Unable to load notifications.");
          return;
        }

        setNotifications(data.notifications || []);
      } catch {
        setError("Something went wrong while loading notifications.");
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  return (
    <ProtectedShell
      badge="Notifications"
      title="Notifications"
      subtitle="Track order updates, payments, delivery, reviews, and account alerts."
    >
      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <p className="text-sm font-bold text-slate-500">
            Loading notifications...
          </p>
        ) : error ? (
          <p className="text-sm font-bold text-red-600">{error}</p>
        ) : notifications.length === 0 ? (
          <div className="text-center">
            <Bell className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-xl font-black text-slate-950">
              No notifications yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Updates about your orders, payments, and account will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const content = (
                <div
                  className={`rounded-2xl border p-4 ${
                    notification.isRead
                      ? "border-slate-200 bg-slate-50"
                      : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!notification.isRead ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-orange-600 px-2 py-1 text-[10px] font-black text-white">
                        New
                      </span>
                    ) : (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                    )}
                  </div>
                </div>
              );

              return notification.link ? (
                <Link key={notification.id} href={notification.link}>
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        )}
      </section>
    </ProtectedShell>
  );
}