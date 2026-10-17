import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = z.object({ stage: stageSchema }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const existing = await prisma.candidate.findUnique({
    where: { id: params.id },
    select: { stage: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  if (existing.stage === parsed.data.stage) {
    return NextResponse.json({ id: params.id, stage: existing.stage });
  }

  const updated = await prisma.candidate.update({
    where: { id: params.id },
    data: {
      stage: parsed.data.stage,
      history: {
        create: { fromStage: existing.stage, toStage: parsed.data.stage },
      },
    },
  });

  return NextResponse.json(updated);
}