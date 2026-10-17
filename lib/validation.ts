import { z } from "zod";

export const STAGES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

export const stageSchema = z.enum(STAGES);

const optionalText = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

export const candidateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  phone: optionalText,
  role: z.string().trim().min(1, "Role is required").max(100),
  source: optionalText,
  resumeUrl: optionalUrl,
  notes: optionalText,
  stage: stageSchema.optional(),
});

export const candidateUpdateSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .max(5000)
      .transform((v) => (v === "" ? null : v)),
  })
  .strict();