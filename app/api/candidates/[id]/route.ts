import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { candidateUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { history: { orderBy: { changedAt: "desc" } } },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  return NextResponse.json(candidate);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => null);
  const parsed = candidateUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(candidate);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
      }
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "A candidate with this email already exists" },
          { status: 409 }
        );
      }
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await prisma.candidate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    throw e;
  }
}