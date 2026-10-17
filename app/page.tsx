"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CandidateForm from "@/components/CandidateForm";
import KanbanBoard from "@/components/KanbanBoard";
import { STAGE_STYLES } from "@/components/stageStyles";
import { Candidate, Stage, STAGES, STAGE_LABELS } from "@/lib/types";

type ListResponse = {
  items: Candidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type View = "table" | "board";

export default function CandidatesPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [stage, setStage] = useState<"" | Stage>("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: view === "board" ? "1" : String(page),
        pageSize: view === "board" ? "50" : "10",
      });
      if (debouncedQ) params.set("q", debouncedQ);
      if (stage && view === "table") params.set("stage", stage);
      const res = await fetch(`/api/candidates?${params}`);
      if (!res.ok) throw new Error("Failed to load candidates");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, stage, view]);

  useEffect(() => {
    load();
  }, [load]);

  function switchView(next: View) {
    if (next === view) return;
    setData(null);
    setStage("");
    setPage(1);
    setView(next);
  }

  async function changeStage(id: string, newStage: Stage) {
    const previous = data;
    setError("");

    setData((d) => {
      if (!d) return d;
      if (stage && newStage !== stage) {
        return {
          ...d,
          items: d.items.filter((c) => c.id !== id),
          total: d.total - 1,
        };
      }
      return {
        ...d,
        items: d.items.map((c) => (c.id === id ? { ...c, stage: newStage } : c)),
      };
    });

    try {
      const res = await fetch(`/api/candidates/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setData(previous);
      setError("Could not update stage. Your change was undone.");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete candidate");
      return;
    }
    if (data && data.items.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      load();
    }
  }

  const th = "px-4 py-3 font-medium";
  const td = "px-4 py-3";
  const toggleBase = "px-3 py-1.5 text-sm font-medium";
    const exportParams = new URLSearchParams();
  if (debouncedQ) exportParams.set("q", debouncedQ);
  if (stage && view === "table") exportParams.set("stage", stage);
  const exportHref = `/api/candidates/export?${exportParams}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Candidates</h1>
          <p className="text-sm text-gray-500">
            {data ? `${data.total} total` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
                    <a
            href={exportHref}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </a>
          <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white">
            <button
              onClick={() => switchView("table")}
              className={`${toggleBase} ${
                view === "table"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => switchView("board")}
              className={`${toggleBase} ${
                view === "board"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Board
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add candidate
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or role"
          className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        {view === "table" && (
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value as "" | Stage);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {view === "board" ? (
        <>
          {!data ? (
            <p className="py-10 text-center text-gray-500">Loading...</p>
          ) : (
            <>
              <KanbanBoard candidates={data.items} onMove={changeStage} />
              {data.total > data.items.length && (
                <p className="mt-2 text-xs text-gray-500">
                  Showing the latest {data.items.length} of {data.total}{" "}
                  candidates. Use search to narrow the board.
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className={th}>Candidate</th>
                  <th className={th}>Role</th>
                  <th className={th}>Source</th>
                  <th className={th}>Stage</th>
                  <th className={th}>Added</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && !data ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : data && data.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No candidates found. Try a different search or add a new
                      one.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((c) => (
                    <tr key={c.id}>
                      <td className={td}>
                        <Link
                          href={`/candidates/${c.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-gray-500">{c.email}</div>
                      </td>
                      <td className={td}>{c.role}</td>
                      <td className={td}>{c.source ?? "-"}</td>
                      <td className={td}>
                        <select
                          value={c.stage}
                          onChange={(e) =>
                            changeStage(c.id, e.target.value as Stage)
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${STAGE_STYLES[c.stage]}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={td}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className={td}>
                        <button
                          onClick={() => remove(c.id, c.name)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                  className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <CandidateForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}