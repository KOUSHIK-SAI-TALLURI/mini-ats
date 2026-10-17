"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { STAGE_STYLES } from "@/components/stageStyles";
import { Candidate, Stage, STAGES, STAGE_LABELS } from "@/lib/types";

type HistoryItem = {
  id: string;
  fromStage: Stage | null;
  toStage: Stage;
  changedAt: string;
};

type Detail = Candidate & { history: HistoryItem[] };

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [candidate, setCandidate] = useState<Detail | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notesMessage, setNotesMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(
    async (initial: boolean) => {
      const res = await fetch(`/api/candidates/${id}`);
      if (res.status === 404) {
        setLoadError("Candidate not found");
        return;
      }
      if (!res.ok) {
        setLoadError("Failed to load candidate");
        return;
      }
      const c: Detail = await res.json();
      setCandidate(c);
      if (initial) setNotes(c.notes ?? "");
    },
    [id]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  async function saveNotes() {
    setSavingNotes(true);
    setNotesMessage("");

    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const body = await res.json().catch(() => ({}));
    setSavingNotes(false);

    if (res.ok) {
      setCandidate((c) => (c ? { ...c, notes: body.notes } : c));
      setNotesMessage("Notes saved");
      return;
    }
    setNotesMessage("Could not save notes");
  }

  async function changeStage(newStage: Stage) {
    if (!candidate) return;
    const previous = candidate;
    setError("");
    setCandidate({ ...candidate, stage: newStage });

    const res = await fetch(`/api/candidates/${id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });

    if (!res.ok) {
      setCandidate(previous);
      setError("Could not update stage. Your change was undone.");
      return;
    }
    load(false);
  }

  async function remove() {
    if (!candidate) return;
    if (!confirm(`Delete ${candidate.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete candidate");
      return;
    }
    router.push("/");
  }

  if (loadError) {
    return (
      <div>
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          &larr; Back to candidates
        </Link>
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  if (!candidate) return <p className="text-gray-500">Loading...</p>;

  const rows: [string, React.ReactNode][] = [
    ["Email", candidate.email],
    ["Phone", candidate.phone ?? "-"],
    ["Role applied for", candidate.role],
    ["Source", candidate.source ?? "-"],
    [
      "Resume",
      candidate.resumeUrl ? (
        <a
          href={candidate.resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-700 hover:underline"
        >
          Open resume
        </a>
      ) : (
        "-"
      ),
    ],
  ];

  return (
    <div>
      <Link href="/" className="text-sm text-blue-700 hover:underline">
        &larr; Back to candidates
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{candidate.name}</h1>
          <p className="text-sm text-gray-500">
            Applied {new Date(candidate.createdAt).toLocaleDateString()}
          </p>
        </div>
        <select
          value={candidate.stage}
          onChange={(e) => changeStage(e.target.value as Stage)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${STAGE_STYLES[candidate.stage]}`}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-4 font-medium">Applicant details</h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase text-gray-500">{label}</dt>
                  <dd className="mt-0.5 text-sm">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 border-t pt-4">
              <button
                onClick={remove}
                className="text-sm text-red-600 hover:underline"
              >
                Delete candidate
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-medium">Interview notes</h2>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesMessage("");
              }}
              placeholder="Add interview feedback or observations..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <div className="mt-3 flex items-center justify-end gap-3">
              {notesMessage && (
                <span className="text-sm text-gray-500">{notesMessage}</span>
              )}
              <button
                onClick={saveNotes}
                disabled={savingNotes || notes === (candidate.notes ?? "")}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save notes"}
              </button>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-medium">Stage history</h2>
          {candidate.history.length === 0 ? (
            <p className="text-sm text-gray-500">No history yet.</p>
          ) : (
            <ul className="space-y-4 border-l pl-4">
              {candidate.history.map((h) => (
                <li key={h.id} className="text-sm">
                  <div className="font-medium">
                    {h.fromStage
                      ? `${STAGE_LABELS[h.fromStage]} \u2192 ${STAGE_LABELS[h.toStage]}`
                      : `Added as ${STAGE_LABELS[h.toStage]}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(h.changedAt).toLocaleString()}
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