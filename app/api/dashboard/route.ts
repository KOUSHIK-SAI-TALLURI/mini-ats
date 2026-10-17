import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STAGES } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, newThisWeek, grouped, recent] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.candidate.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.stageChange.findMany({
      take: 8,
      orderBy: { changedAt: "desc" },
      include: { candidate: { select: { name: true } } },
    }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.stage, g._count._all]));
  const byStage = STAGES.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
  const hired = counts.HIRED ?? 0;
  const rejected = counts.REJECTED ?? 0;

  return NextResponse.json({
    total,
    newThisWeek,
    active: total - hired - rejected,
    hired,
    byStage,
    recent: recent.map((r) => ({
      id: r.id,
      name: r.candidate.name,
      fromStage: r.fromStage,
      toStage: r.toStage,
      changedAt: r.changedAt,
    })),
  });
}