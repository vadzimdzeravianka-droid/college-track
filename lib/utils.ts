import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Milestone duration constants (in days)
const MILESTONE_DURATIONS = {
  mainEssay: 21,
  supplementalEssay: 10,
  lorRequest: 28,
  transcriptRequest: 14,
  testScoresSend: 14,
  finaidDocuments: 21,
  finalReview: 3,
  unexpectedDelay: 7,
};

const PARALLEL_ITEMS = {
  longestDuration: MILESTONE_DURATIONS.lorRequest,
};

type Checklist = {
  lorTeacher: boolean;
  transcriptSent: boolean;
  testScoresSent: boolean;
  essayCount: number;
  mainEssayComplete?: boolean;
  supplementalEssaysCompleted?: number;
  finaidGreenLight: boolean;
} | null;

export function calculateDaysNeeded(checklist: Checklist, essayCount: number = 0): number {
  let sequentialDays = 0;
  let needsParallelBlock = false;

  if (!checklist) {
    needsParallelBlock = true;
    sequentialDays = MILESTONE_DURATIONS.mainEssay;

    if (essayCount > 0) {
      sequentialDays += Math.ceil(essayCount * MILESTONE_DURATIONS.supplementalEssay * 0.7);
    }
  } else {
    const hasIncompleteAdmin =
      !checklist.lorTeacher ||
      !checklist.transcriptSent ||
      !checklist.testScoresSent ||
      !checklist.finaidGreenLight;

    if (hasIncompleteAdmin) {
      needsParallelBlock = true;
    }

    if (!checklist.mainEssayComplete) {
      sequentialDays += MILESTONE_DURATIONS.mainEssay;
    }

    const supplementalsCompleted = checklist.supplementalEssaysCompleted ?? 0;
    const totalSupplementals = checklist.essayCount || 0;
    const supplementalsRemaining = Math.max(0, totalSupplementals - supplementalsCompleted);

    if (supplementalsRemaining > 0) {
      sequentialDays += Math.ceil(supplementalsRemaining * MILESTONE_DURATIONS.supplementalEssay * 0.7);
    }
  }

  const parallelBlockDuration = needsParallelBlock ? PARALLEL_ITEMS.longestDuration : 0;
  const totalWorkDays = Math.max(parallelBlockDuration, sequentialDays);
  const totalDays = totalWorkDays + MILESTONE_DURATIONS.finalReview + MILESTONE_DURATIONS.unexpectedDelay;

  return totalDays;
}

export type UrgencyLevel = "red" | "yellow" | "green" | "none";

export function getUrgencyLevel(
  deadline: Date | null,
  status: string,
  checklist: Checklist,
  essayCount: number = 0
): UrgencyLevel {
  if (!deadline || status === "SUBMITTED" || status === "ACCEPTED" || status === "DECLINED") {
    return "none";
  }

  const now = new Date();
  const daysAvailable = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAvailable <= 0) {
    return "red";
  }

  const daysNeeded = calculateDaysNeeded(checklist, essayCount);

  if (daysNeeded <= 10) {
    return "green";
  }

  const bufferRatio = daysAvailable / daysNeeded;

  if (bufferRatio < 1.1) {
    return "red";
  }

  if (bufferRatio < 1.6) {
    return "yellow";
  }

  return "green";
}

export function isDeadlineUrgent(deadline: Date | null, status: string): boolean {
  if (!deadline || status === "SUBMITTED" || status === "ACCEPTED" || status === "DECLINED") {
    return false;
  }
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 7 && daysUntil >= 0;
}

export function getUrgencyMessage(
  deadline: Date | null,
  status: string,
  checklist: Checklist,
  essayCount: number = 0
): string {
  const urgency = getUrgencyLevel(deadline, status, checklist, essayCount);

  if (urgency === "none" || !deadline) {
    return "";
  }

  const daysAvailable = getDaysUntilDeadline(deadline);
  const daysNeeded = calculateDaysNeeded(checklist, essayCount);
  const bufferDays = daysAvailable - daysNeeded;

  if (urgency === "red") {
    if (daysAvailable <= 0) {
      return "Deadline passed";
    }
    if (bufferDays < 0) {
      return `Need ${daysNeeded} days, have ${daysAvailable} days — Short by ${Math.abs(bufferDays)} days`;
    }
    return `Critical: Less than 10% time buffer (${bufferDays} days)`;
  }

  if (urgency === "yellow") {
    return `Warning: Tight timeline (${bufferDays} days buffer)`;
  }

  return `On track (${bufferDays} days buffer)`;
}

export function formatDate(date: Date | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil;
}
