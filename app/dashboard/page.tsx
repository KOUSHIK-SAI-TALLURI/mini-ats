"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Stage, STAGE_LABELS } from "@/lib/types";

type DashboardData = {
  total: number;
  newThisWeek: number;
  active: number;
  hired: number;
  byStage: { stage: Stage; count: number }[];
  recent: {
    id: string;
    name: string;
    fromStage: Stage | null;
    toStage: Stage;
    changedAt: string;
  }[];
};

const COLORS: Record<Stage, string> = {
  APPLIED: "#9ca3af",
  SCREENING: "#3b82f6",
  INTERVIEW: "#8b5cf6",
  OFFER: "#f59e0b",
  HIRED: "#22c55e",
  REJECTED: "#ef4444",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load dashboard");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Loading...</p>;

  const chartData = data.byStage.map((s) => ({
    ...s,
    label: STAGE_LABELS[s.stage],
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total candidates" value={data.total} />
        <StatCard label="New this week" value={data.newThisWeek} />
        <StatCard label="Active in pipeline" value={data.active} />
        <StatCard label="Hired" value={data.hired} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="mb-4 font-medium">Candidates by stage</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.stage} fill={COLORS[d.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-medium">Recent activity</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recent.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="font-medium">{r.name}</span>{" "}
                  {r.fromStage
                    ? `moved from ${STAGE_LABELS[r.fromStage]} to ${STAGE_LABELS[r.toStage]}`
                    : `was added as ${STAGE_LABELS[r.toStage]}`}
                  <div className="text-xs text-gray-400">
                    {new Date(r.changedAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}