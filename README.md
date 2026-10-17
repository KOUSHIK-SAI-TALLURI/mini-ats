# Mini ATS

A small Applicant Tracking System for managing candidates through a hiring pipeline, with search and dashboard metrics.

**Live app:** YOUR-LIVE-LINK
**Repository:** https://github.com/KOUSHIK-SAI-TALLURI/mini-ats

## Features

- **Candidate management:** add candidates, view their details, record interview notes, and delete candidates.
- **Hiring stages:** Applied, Screening, Interview, Offer, Hired, Rejected. Change a candidate's stage from the list or the detail page, and every change is saved in a stage history timeline.
- **Search and filter:** search by name, email, or role (case-insensitive), filter by stage, and page through results.
- **Dashboard:** total candidates, new this week, active in pipeline, hired, a candidates-by-stage chart, and a recent activity feed.

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

- **Candidate:** name, email (unique), phone, role, source, resume link, notes, stage, timestamps.
- **StageChange:** candidate, from stage, to stage, timestamp. One row is written for every stage change, and one when a candidate is created.

## Design decisions

- **Applicant details are read-only after creation.** What the applicant submitted is the record. Interviewers can only change a candidate's stage and add notes. This is enforced on the server too: the update endpoint accepts only `notes` and rejects any other field.
- **Stage change and history are saved in one database write,** so a candidate can never change stage without a history entry.
- **Optimistic UI.** The stage dropdown updates instantly and rolls back with an error message if saving fails.
- **Server-side search and pagination,** with indexes on `stage` and `name`.
- **Input validation on every write** with Zod, and clear error responses: 400 (invalid input), 404 (not found), 409 (duplicate email).

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/candidates?q=&stage=&page=&pageSize=` | List, search, filter, paginate |
| POST | `/api/candidates` | Create a candidate |
| GET | `/api/candidates/:id` | Candidate with stage history |
| PATCH | `/api/candidates/:id` | Update notes only |
| DELETE | `/api/candidates/:id` | Delete a candidate |
| PATCH | `/api/candidates/:id/stage` | Change stage (writes history) |
| GET | `/api/dashboard` | Dashboard metrics |

### Creating candidates from another application

Another system (a careers page, a job-board webhook) can create candidates by sending JSON:

```bash
curl -X POST YOUR-LIVE-LINK/api/candidates \
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

## Run locally

Requires Node.js 18+ and a PostgreSQL database (a free Neon project works).

```bash
git clone https://github.com/KOUSHIK-SAI-TALLURI/mini-ats.git
cd mini-ats
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
# edit .env and add your database connection strings
npx prisma migrate deploy
npx tsx prisma/seed.ts      # optional sample data
npm run dev
```

Open http://localhost:3000.

## Known limitations and next steps

- There is no authentication, since this is a demo with sample data. A production version would add login, roles, and an API key for external intake.
- Resume links are stored as URLs. File upload and resume parsing would be natural additions.
- Next steps: Kanban board, richer dashboard charts, and CSV export.