"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  funnel: { stage: Stage; count: number }[];
  daily: { date: string; count: number }[];
  bySource: { source: string; count: number }[];
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

function dayLabel(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`}>
      <h2 className="mb-4 font-medium">{title}</h2>
      {children}
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

  const stageData = data.byStage.map((s) => ({
    ...s,
    label: STAGE_LABELS[s.stage],
  }));
  const dailyData = data.daily.map((d) => ({ ...d, label: dayLabel(d.date) }));
  const funnelBase = data.funnel[0]?.count || 1;
  const sourceMax = data.bySource[0]?.count || 1;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total candidates" value={data.total} />
        <StatCard label="New this week" value={data.newThisWeek} />
        <StatCard label="Active in pipeline" value={data.active} />
        <StatCard label="Hired" value={data.hired} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Candidates by stage" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stageData.map((d) => (
                    <Cell key={d.stage} fill={COLORS[d.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hiring funnel">
          <p className="-mt-2 mb-4 text-xs text-gray-500">
            Candidates who reached each stage
          </p>
          <div className="space-y-4">
            {data.funnel.map((f) => {
              const pct = Math.round((f.count / funnelBase) * 100);
              return (
                <div key={f.stage}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{STAGE_LABELS[f.stage]}</span>
                    <span className="text-gray-500">
                      {f.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded bg-gray-100">
                    <div
                      className="h-2 rounded"
                      style={{ width: `${pct}%`, background: COLORS[f.stage] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Applicants per day (last 14 days)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} interval={1} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Applicants"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Candidates by source">
          {data.bySource.length === 0 ? (
            <p className="text-sm text-gray-500">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {data.bySource.map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{s.source}</span>
                    <span className="text-gray-500">{s.count}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-100">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{ width: `${(s.count / sourceMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent activity">
        {data.recent.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
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
      </Card>
    </div>
  );
}