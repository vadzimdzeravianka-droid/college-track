import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDeadlineUrgent(deadline: Date | null, status: string): boolean {
  if (!deadline || status === "SUBMITTED" || status === "ACCEPTED" || status === "DECLINED") {
    return false;
  }
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 7 && daysUntil >= 0;
}

export function formatDate(date: Date | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
