"use client";

import { useEffect, useState } from "react";
import ProtectedShell from "@/components/layout/ProtectedShell";

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/expenses");
    const data = await res.json();

    setExpenses(data.expenses || []);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    void load();
  }, []);

  const addExpense = async () => {
    if (!title || !amount) return;

    await fetch("/api/admin/expenses", {
      method: "POST",
      body: JSON.stringify({
        title,
        amount,
        category,
      }),
    });

    setTitle("");
    setAmount("");
    setCategory("");

    load();
  };

  return (
    <ProtectedShell
      title="Expenses"
      subtitle="Track your business expenses"
    >
      <div className="space-y-6">

        {/* ADD EXPENSE */}
        <div className="bg-white p-6 rounded-xl border space-y-3">
          <h2 className="font-bold">Add Expense</h2>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 w-full"
          />

          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 w-full"
          />

          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 w-full"
          />

          <button
            onClick={addExpense}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Expense
          </button>
        </div>

        {/* TOTAL */}
        <div className="bg-red-50 p-6 rounded-xl border">
          <h2 className="font-bold text-red-700">
            Total Expenses: KES {total.toLocaleString()}
          </h2>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {expenses.map((e) => (
            <div key={e.id} className="bg-white p-4 rounded border">
              <p className="font-bold">{e.title}</p>
              <p>KES {e.amount}</p>
              <p className="text-xs text-gray-500">{e.category}</p>
            </div>
          ))}
        </div>

      </div>
    </ProtectedShell>
  );
}