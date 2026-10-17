import { PrismaClient, Stage } from "@prisma/client";

const prisma = new PrismaClient();

const PIPELINE: Stage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"];

function pathTo(stage: Stage): Stage[] {
  if (stage === "REJECTED") return ["APPLIED", "SCREENING", "REJECTED"];
  return PIPELINE.slice(0, PIPELINE.indexOf(stage) + 1);
}

const people: {
  name: string;
  email: string;
  role: string;
  source: string;
  stage: Stage;
  daysAgo: number;
}[] = [
  { name: "Priya Sharma", email: "priya.sharma@example.com", role: "Full Stack Developer", source: "LinkedIn", stage: "INTERVIEW", daysAgo: 6 },
  { name: "Rahul Verma", email: "rahul.verma@example.com", role: "Backend Engineer", source: "Referral", stage: "OFFER", daysAgo: 12 },
  { name: "Ananya Iyer", email: "ananya.iyer@example.com", role: "Frontend Developer", source: "Careers page", stage: "SCREENING", daysAgo: 3 },
  { name: "Karthik Reddy", email: "karthik.reddy@example.com", role: "DevOps Engineer", source: "LinkedIn", stage: "APPLIED", daysAgo: 1 },
  { name: "Sneha Patil", email: "sneha.patil@example.com", role: "Data Analyst", source: "Naukri", stage: "HIRED", daysAgo: 14 },
  { name: "Arjun Nair", email: "arjun.nair@example.com", role: "Full Stack Developer", source: "Referral", stage: "REJECTED", daysAgo: 9 },
  { name: "Meera Krishnan", email: "meera.krishnan@example.com", role: "QA Engineer", source: "Careers page", stage: "SCREENING", daysAgo: 4 },
  { name: "Vikram Singh", email: "vikram.singh@example.com", role: "Backend Engineer", source: "LinkedIn", stage: "INTERVIEW", daysAgo: 8 },
  { name: "Divya Menon", email: "divya.menon@example.com", role: "UI/UX Designer", source: "Instagram", stage: "APPLIED", daysAgo: 0 },
  { name: "Rohan Gupta", email: "rohan.gupta@example.com", role: "Frontend Developer", source: "Naukri", stage: "REJECTED", daysAgo: 11 },
  { name: "Isha Kapoor", email: "isha.kapoor@example.com", role: "Product Manager", source: "Referral", stage: "OFFER", daysAgo: 13 },
  { name: "Aditya Joshi", email: "aditya.joshi@example.com", role: "Full Stack Developer", source: "LinkedIn", stage: "APPLIED", daysAgo: 2 },
  { name: "Neha Bansal", email: "neha.bansal@example.com", role: "Data Analyst", source: "Careers page", stage: "SCREENING", daysAgo: 5 },
  { name: "Siddharth Rao", email: "siddharth.rao@example.com", role: "DevOps Engineer", source: "Referral", stage: "INTERVIEW", daysAgo: 7 },
];

async function main() {
  let added = 0;

  for (const p of people) {
    const exists = await prisma.candidate.findUnique({ where: { email: p.email } });
    if (exists) continue;

    const created = new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000);
    const path = pathTo(p.stage);

    await prisma.candidate.create({
      data: {
        name: p.name,
        email: p.email,
        role: p.role,
        source: p.source,
        stage: p.stage,
        createdAt: created,
        history: {
          create: path.map((s, i) => ({
            fromStage: i === 0 ? undefined : path[i - 1],
            toStage: s,
            changedAt: new Date(
              Math.min(Date.now(), created.getTime() + i * 6 * 60 * 60 * 1000)
            ),
          })),
        },
      },
    });
    added++;
  }

  console.log(`Seed complete. Added ${added} candidates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());