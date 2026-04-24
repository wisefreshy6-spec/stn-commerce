"use client";

import { useEffect, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type DataRequest = {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    country?: string | null;
    city?: string | null;
    authProvider: string;
    status: string;
  };
};

type DataRequestsResponse = {
  requests?: DataRequest[];
  error?: string;
};

type UpdateResponse = {
  message?: string;
  error?: string;
};

const statuses = ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"] as const;

export default function AdminDataRequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch("/api/admin/data-requests");
      const data = (await response.json()) as DataRequestsResponse;

      if (!response.ok) {
        setPageError(data.error || "Unable to load data requests.");
        return;
      }

      setRequests(data.requests || []);
    } catch {
      setPageError("Something went wrong while loading data requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const updateRequest = async (
    requestId: string,
    status: DataRequest["status"],
    notes?: string | null
  ) => {
    try {
      setSavingId(requestId);
      setMessage("");

      const response = await fetch("/api/admin/data-requests/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          status,
          notes: notes || "",
        }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setMessage(data.error || "Unable to update request.");
        return;
      }

      setMessage(data.message || "Request updated.");
      await loadRequests();
    } catch {
      setMessage("Something went wrong while updating request.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <ProtectedShell
      badge="Admin review"
      title="Data requests"
      subtitle="Review customer account data export requests and update their status."
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Customer data requests
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              These are created when users request a copy/export of their
              account data from settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRequests()}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {pageError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {message}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No data requests yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((item) => {
              const fullName =
                [item.user.firstName, item.user.lastName]
                  .filter(Boolean)
                  .join(" ") || "User";

              return (
                <div
                  key={item.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {item.status}
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-950">
                        {item.requestType}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        Requested by {fullName} — {item.user.email}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Phone:</span>{" "}
                          {item.user.phone || "Not added"}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Country:</span>{" "}
                          {item.user.country || "Not set"}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Provider:</span>{" "}
                          {item.user.authProvider}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">User status:</span>{" "}
                          {item.user.status}
                        </div>
                      </div>

                      {item.notes ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          {item.notes}
                        </div>
                      ) : null}

                      <p className="mt-3 text-xs text-slate-400">
                        Created: {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-2">
                      {statuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={savingId === item.id}
                          onClick={() =>
                            updateRequest(item.id, status, item.notes)
                          }
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Mark {status.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </ProtectedShell>
  );
}