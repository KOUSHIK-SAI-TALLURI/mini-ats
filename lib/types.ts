export type Stage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export const STAGES: Stage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export const STAGE_LABELS: Record<Stage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  source: string | null;
  resumeUrl: string | null;
  notes: string | null;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
};