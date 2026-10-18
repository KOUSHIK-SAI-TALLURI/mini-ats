# Mini ATS

A small Applicant Tracking System for managing candidates through a hiring pipeline, with search, a Kanban board, and a metrics dashboard.

| | |
| --- | --- |
| **Live app** | https://mini-ats-six-ruddy.vercel.app/ |
| **Repository** | https://github.com/KOUSHIK-SAI-TALLURI/mini-ats |
| **Demo video** | https://drive.google.com/file/d/1gB3t_P3r7Q2Oyx8Ptf2MyCFVkSEnBpzw/view?usp=drive_link |

> The database runs on a free tier that sleeps when idle, so the very first request after a quiet period can take a couple of seconds.

## Features

- **Candidate management:** add candidates, view their details, record interview notes, and delete candidates.
- **Hiring stages:** Applied, Screening, Interview, Offer, Hired, Rejected. Change a stage from the list, the board, or the detail page. Every change is saved in a stage history timeline.
- **Search and filter:** search by name, email, or role (case-insensitive), filter by stage, and page through results.
- **Kanban board:** switch to Board view to see one column per stage, and drag cards between columns to change a candidate's stage. Each card also has a small dropdown for touch devices.
- **Dashboard:** total candidates, new this week, active in pipeline, hired, a candidates-by-stage chart, a hiring funnel (how many candidates reached each stage), applicants per day for the last 14 days, candidates by source, and a recent activity feed.
- **CSV export:** download the current search and stage-filtered list as a CSV file.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) with TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL on Neon |
| ORM | Prisma 5 |
| Validation | Zod |
| Charts | Recharts |
| Hosting | Vercel |

## Data model

- **Candidate:** name, email (unique), phone, role, source, resume link, notes, stage, created and updated timestamps. Indexed on `stage` and `name`.
- **StageChange:** candidate, from stage, to stage, timestamp. One row is written when a candidate is created and one for every stage change. Deleting a candidate deletes its history.

## Design decisions

- **Applicant details are read-only after creation.** What the applicant submitted is the record. Interviewers can only change a candidate's stage and add notes. This is enforced on the server too: the update endpoint accepts only `notes` and rejects any other field.
- **Stage change and history are saved in one database write,** so a candidate can never change stage without a history entry.
- **Optimistic UI.** Stage changes (from the dropdown, the board, or the detail page) update the screen instantly and roll back with an error message if saving fails.
- **Server-side search, filtering, and pagination,** so the list stays fast as data grows.
- **Validation on every write** with Zod, and clear error responses: `400` (invalid input), `404` (not found), `409` (duplicate email).
- **CSV export is spreadsheet-safe.** Values that start with `=`, `+`, `-`, or `@` are escaped so spreadsheet apps do not run them as formulas.
- **Hiring funnel counts the furthest stage reached.** A candidate who was later rejected still counts toward the stages they passed through.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/candidates?q=&stage=&page=&pageSize=` | List, search, filter, and paginate (page size up to 50) |
| POST | `/api/candidates` | Create a candidate |
| GET | `/api/candidates/:id` | Candidate with stage history |
| PATCH | `/api/candidates/:id` | Update notes only |
| DELETE | `/api/candidates/:id` | Delete a candidate |
| PATCH | `/api/candidates/:id/stage` | Change stage and write a history entry |
| GET | `/api/candidates/export?q=&stage=` | Download candidates as CSV |
| GET | `/api/dashboard` | Dashboard metrics |

Valid stages: `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`.

### Creating candidates from another application

Another system (a careers page, a job-board webhook) can create candidates by sending JSON:

```bash
curl -X POST https://mini-ats-six-ruddy.vercel.app/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Neha Sharma",
    "email": "neha@example.com",
    "role": "Full Stack Developer",
    "phone": "+91 98765 43210",
    "source": "Careers page",
    "resumeUrl": "https://example.com/neha-resume.pdf"
  }'
```

`name`, `email`, and `role` are required. Responses: `201` with the created candidate, `400` with field errors, `409` if the email already exists.

## Project structure

```
app/
  page.tsx                      Candidates page (table and board views)
  dashboard/page.tsx            Dashboard
  candidates/[id]/page.tsx      Candidate detail, notes, stage history
  api/
    candidates/route.ts         List/search and create
    candidates/export/route.ts  CSV export
    candidates/[id]/route.ts    Get, update notes, delete
    candidates/[id]/stage/      Stage change with history
    dashboard/route.ts          Dashboard metrics
components/                     CandidateForm, KanbanBoard, stage styles
lib/                            Prisma client, shared types, Zod schemas
prisma/                         schema.prisma, migrations, seed.ts
```

## Run locally

Requires Node.js 18+ and a PostgreSQL database (a free Neon project works).

```bash
git clone https://github.com/KOUSHIK-SAI-TALLURI/mini-ats.git
cd mini-ats
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
# edit .env and add your database connection strings
npx prisma migrate deploy
npx tsx prisma/seed.ts      # optional: adds 14 sample candidates
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled connection string, used by the app at runtime |
| `DIRECT_URL` | Direct connection string, used by Prisma migrations |

## Deployment

The app is deployed on Vercel with the two environment variables above. A `postinstall` script runs `prisma generate` so the Prisma client is built during deployment. Pushing to `main` redeploys automatically.

## Known limitations and next steps

- There is no authentication, since this is a demo with sample data. A production version would add login with roles, and an API-key-protected intake endpoint for other applications.
- Resume links are stored as URLs. File upload and resume parsing would be natural additions.
- The Kanban board loads up to 50 candidates at a time; use search to narrow it.
- No automated tests yet. API route tests and an end-to-end flow test would be the next addition.

https://mini-ats-six-ruddy.vercel.app/
