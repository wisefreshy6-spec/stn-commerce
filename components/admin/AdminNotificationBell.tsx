"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/notifications");
        const data = await res.json();

        if (res.ok) {
          setNotifications(data.notifications || []);
        }
      } catch {}
    };

    void load();

    const interval = setInterval(load, 10000); // auto refresh
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      {/* BELL */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-xl p-2 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5 text-slate-700" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600" />
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-black text-slate-900">
              Notifications
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  className="block border-b px-4 py-3 hover:bg-slate-50"
                  onClick={() => {
                    void fetch(`/api/admin/notifications/${n.id}`, {
                      method: "PATCH",
                 });
                }}
                >
                  <p className="text-sm font-bold text-slate-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    {n.message}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}