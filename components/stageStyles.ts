import type { Stage } from "@/lib/types";

export const STAGE_STYLES: Record<Stage, string> = {
  APPLIED: "bg-gray-100 text-gray-800 border-gray-300",
  SCREENING: "bg-blue-100 text-blue-800 border-blue-300",
  INTERVIEW: "bg-purple-100 text-purple-800 border-purple-300",
  OFFER: "bg-amber-100 text-amber-800 border-amber-300",
  HIRED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};