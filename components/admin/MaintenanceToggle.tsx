"use client";

import { useEffect, useState } from "react";

type MaintenanceResponse = {
  enabled?: boolean;
  message?: string;
  error?: string;
};

export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings/maintenance");
      const data = (await response.json()) as MaintenanceResponse;

      if (!response.ok) {
        setError(data.error || "Unable to load maintenance mode.");
        return;
      }

      setEnabled(Boolean(data.enabled));
    } catch {
      setError("Something went wrong loading maintenance mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const toggleMaintenance = async () => {
    const nextValue = !enabled;

    const confirmed = window.confirm(
      nextValue
        ? "Turn ON maintenance mode? Customers will be blocked from using the site."
        : "Turn OFF maintenance mode? Customers will regain access."
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/settings/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextValue }),
      });

      const data = (await response.json()) as MaintenanceResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update maintenance mode.");
        return;
      }

      setEnabled(Boolean(data.enabled));
      setMessage(data.message || "Maintenance mode updated.");
    } catch {
      setError("Something went wrong updating maintenance mode.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/70">
      <p className="text-xs font-black uppercase tracking-wide text-orange-700">
        Site control
      </p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Maintenance mode
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Use this when updating or testing the platform. Admin access remains
        open, while customer actions are blocked.
      </p>

      <div
        className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${
          enabled
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-700"
        }`}
      >
        Current status: {enabled ? "Maintenance ON" : "Maintenance OFF"}
      </div>

      <button
        type="button"
        onClick={() => void toggleMaintenance()}
        disabled={loading || saving}
        className={`mt-5 w-full rounded-2xl px-6 py-4 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
          enabled
            ? "bg-red-600 shadow-red-600/20 hover:bg-red-700"
            : "bg-green-600 shadow-green-600/20 hover:bg-green-700"
        }`}
      >
        {loading
          ? "Checking..."
          : saving
            ? "Saving..."
            : enabled
              ? "Turn OFF maintenance mode"
              : "Turn ON maintenance mode"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}