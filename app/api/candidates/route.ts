import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { candidateSchema, stageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const stageParam = sp.get("stage");
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(sp.get("pageSize")) || 10));

  const where: Prisma.CandidateWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { role: { contains: q, mode: "insensitive" } },
    ];
  }

  if (stageParam) {
    const parsed = stageSchema.safeParse(stageParam);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    where.stage = parsed.data;
  }

  const [items, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.candidate.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = candidateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const candidate = await prisma.candidate.create({
      data: {
        ...parsed.data,
        history: { create: { toStage: parsed.data.stage ?? "APPLIED" } },
      },
    });
    return NextResponse.json(candidate, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "A candidate with this email already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}