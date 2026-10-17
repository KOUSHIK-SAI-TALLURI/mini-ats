import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function cell(value: string | null | undefined): string {
  let v = value ?? "";
  // Stop spreadsheet apps from running text that starts like a formula
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const stageParam = sp.get("stage");

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

  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "Name",
    "Email",
    "Phone",
    "Role",
    "Source",
    "Stage",
    "Resume link",
    "Notes",
    "Applied on",
  ];

  const rows = candidates.map((c) =>
    [
      cell(c.name),
      cell(c.email),
      cell(c.phone),
      cell(c.role),
      cell(c.source),
      cell(c.stage),
      cell(c.resumeUrl),
      cell(c.notes),
      cell(c.createdAt.toISOString().slice(0, 10)),
    ].join(",")
  );

  const csv = "\uFEFF" + [header.map((h) => cell(h)).join(","), ...rows].join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidates-${today}.csv"`,
    },
  });
}