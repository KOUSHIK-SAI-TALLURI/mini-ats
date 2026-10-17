"use client";

import { useState } from "react";
import Link from "next/link";
import { STAGE_STYLES } from "@/components/stageStyles";
import { Candidate, Stage, STAGES, STAGE_LABELS } from "@/lib/types";

type Props = {
  candidates: Candidate[];
  onMove: (id: string, stage: Stage) => void;
};

export default function KanbanBoard({ candidates, onMove }: Props) {
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((s) => {
        const items = candidates.filter((c) => c.stage === s);

        return (
          <div
            key={s}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(s);
            }}
            onDragLeave={() => setDragOver((cur) => (cur === s ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              setDragOver(null);
              setDraggingId(null);
              const card = candidates.find((c) => c.id === id);
              if (card && card.stage !== s) onMove(id, s);
            }}
            className={`w-64 shrink-0 rounded-lg border p-3 ${
              dragOver === s ? "border-blue-400 bg-blue-50" : "bg-gray-100"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[s]}`}
              >
                {STAGE_LABELS[s]}
              </span>
              <span className="text-xs text-gray-500">{items.length}</span>
            </div>

            <div className="min-h-[8rem] space-y-2">
              {items.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">
                  No candidates
                </p>
              )}

              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", c.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(c.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOver(null);
                  }}
                  className={`cursor-grab rounded-md border bg-white p-3 shadow-sm ${
                    draggingId === c.id ? "opacity-40" : ""
                  }`}
                >
                  <Link
                    href={`/candidates/${c.id}`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <div className="mt-0.5 text-xs text-gray-500">{c.role}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">
                      {c.source ?? "-"}
                    </span>
                    <select
                      value={c.stage}
                      onChange={(e) => onMove(c.id, e.target.value as Stage)}
                      aria-label={`Move ${c.name} to another stage`}
                      className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-600"
                    >
                      {STAGES.map((st) => (
                        <option key={st} value={st}>
                          {STAGE_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}