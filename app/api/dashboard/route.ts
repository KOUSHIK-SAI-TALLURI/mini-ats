import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STAGES } from "@/lib/validation";

export const dynamic = "force-dynamic";

const PIPELINE: string[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"];
const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY);
  const start = new Date(now - 13 * DAY);
  start.setUTCHours(0, 0, 0, 0);

  const [total, newThisWeek, grouped, recent, visits, recentCandidates, sources] =
    await Promise.all([
      prisma.candidate.count(),
      prisma.candidate.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.candidate.groupBy({ by: ["stage"], _count: { _all: true } }),
      prisma.stageChange.findMany({
        take: 8,
        orderBy: { changedAt: "desc" },
        include: { candidate: { select: { name: true } } },
      }),
      prisma.stageChange.findMany({
        select: { candidateId: true, toStage: true },
        distinct: ["candidateId", "toStage"],
      }),
      prisma.candidate.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.candidate.groupBy({ by: ["source"], _count: { _all: true } }),
    ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.stage, g._count._all]));
  const byStage = STAGES.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
  const hired = counts.HIRED ?? 0;
  const rejected = counts.REJECTED ?? 0;

  // Funnel: how many candidates reached at least each pipeline stage
  const furthest = new Map<string, number>();
  for (const v of visits) {
    const idx = PIPELINE.indexOf(v.toStage);
    if (idx < 0) continue;
    furthest.set(v.candidateId, Math.max(furthest.get(v.candidateId) ?? -1, idx));
  }
  const furthestValues = Array.from(furthest.values());
  const funnel = PIPELINE.map((stage, i) => ({
    stage,
    count: furthestValues.filter((f) => f >= i).length,
  }));

  // Applicants per day for the last 14 days
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    dayKeys.push(new Date(now - i * DAY).toISOString().slice(0, 10));
  }
  const perDay = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  for (const c of recentCandidates) {
    const key = c.createdAt.toISOString().slice(0, 10);
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const daily = dayKeys.map((date) => ({ date, count: perDay.get(date) ?? 0 }));

  // Candidates by source (top 6)
  const bySource = sources
    .map((s) => ({ source: s.source ?? "Unknown", count: s._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return NextResponse.json({
    total,
    newThisWeek,
    active: total - hired - rejected,
    hired,
    byStage,
    funnel,
    daily,
    bySource,
    recent: recent.map((r) => ({
      id: r.id,
      name: r.candidate.name,
      fromStage: r.fromStage,
      toStage: r.toStage,
      changedAt: r.changedAt,
    })),
  });
}