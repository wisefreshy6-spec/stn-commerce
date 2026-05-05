"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type AdminUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  role: "CUSTOMER" | "TEAM" | "SUPPORT" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";
  authProvider: "CREDENTIALS" | "GOOGLE";
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  users?: AdminUser[];
  error?: string;
};

type UpdateResponse = {
  message?: string;
  error?: string;
};

const roles = ["CUSTOMER", "TEAM", "SUPPORT", "ADMIN"] as const;
const statuses = ["PENDING", "ACTIVE", "SUSPENDED", "DELETED"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as UsersResponse;

      if (!response.ok) {
        setPageError(data.error || "Unable to load users.");
        return;
      }

      setUsers(data.users || []);
    } catch {
      setPageError("Something went wrong while loading users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        fullName.includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone || "").toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        user.status.toLowerCase().includes(term) ||
        (user.country || "").toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  const updateUser = async (
    userId: string,
    input: {
      role?: AdminUser["role"];
      status?: AdminUser["status"];
    }
  ) => {
    try {
      setSavingId(userId);
      setMessage("");
      setPageError("");

      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...input,
        }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (!response.ok) {
        setMessage(data.error || "Unable to update user.");
        return;
      }

      setMessage(data.message || "User updated successfully.");
      await loadUsers();
    } catch {
      setMessage("Something went wrong while updating user.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <ProtectedShell
      badge="Admin users"
      title="User management"
      subtitle="Review users, account status, roles, verification state, and control who can access admin/support tools."
    >
      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Users
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Promote users to support/team roles, suspend accounts, or review
              account details.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="h-10 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
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
          <p className="mt-6 text-sm text-slate-600">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No users found.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredUsers.map((user) => {
              const fullName =
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                "User";

              return (
                <div
                  key={user.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {user.role}
                        </span>

                        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                          {user.status}
                        </span>

                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {user.authProvider}
                        </span>

                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Email {user.emailVerified ? "verified" : "unverified"}
                        </span>

                        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          Phone {user.phoneVerified ? "verified" : "unverified"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-950">
                        {fullName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {user.email}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Phone:</span>{" "}
                          {user.phone || "Not added"}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Country:</span>{" "}
                          {user.country || "Not set"}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">City:</span>{" "}
                          {user.city || "Not set"}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Onboarding:</span>{" "}
                          {user.onboardingCompleted ? "Completed" : "Incomplete"}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Created:</span>{" "}
                          {new Date(user.createdAt).toLocaleString()}
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold">Updated:</span>{" "}
                          {new Date(user.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Change role
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {roles.map((role) => (
                            <button
                              key={role}
                              type="button"
                              disabled={savingId === user.id || user.role === role}
                              onClick={() => void updateUser(user.id, { role })}
                              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Change status
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={
                                savingId === user.id || user.status === status
                              }
                              onClick={() => void updateUser(user.id, { status })}
                              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
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