import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Milestone duration constants (in days)
const MILESTONE_DURATIONS = {
  mainEssay: 21,              // 3 weeks for main essay
  supplementalEssay: 10,      // 10 days per supplemental essay
  lorRequest: 28,             // 4 weeks for letter of recommendation
  transcriptRequest: 14,      // 2 weeks for transcript processing
  testScoresSend: 14,         // 2 weeks to send test scores
  finaidDocuments: 21,        // 3 weeks for financial aid docs
  finalReview: 3,             // 3 days final review buffer
  unexpectedDelay: 7,         // 1 week buffer for unexpected issues
};

// Parallel items (administrative tasks that can be done simultaneously)
// These run concurrently, so we only count the longest duration
const PARALLEL_ITEMS = {
  longestDuration: MILESTONE_DURATIONS.lorRequest, // LOR takes longest (28 days)
  // Other parallel items: transcriptRequest (14), testScoresSend (14), finaidDocuments (21)
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

// Calculate days needed based on incomplete checklist items (accounting for parallel work)
export function calculateDaysNeeded(checklist: Checklist, essayCount: number = 0): number {
  let sequentialDays = 0;
  let needsParallelBlock = false;

  if (!checklist) {
    // If no checklist, assume everything needs to be done
    // Administrative items run in parallel (take longest = LOR 28 days)
    needsParallelBlock = true;

    // Essays are sequential (main + supplementals with overlap)
    sequentialDays = MILESTONE_DURATIONS.mainEssay;

    // Supplemental essays with 30% overlap (not fully sequential)
    if (essayCount > 0) {
      sequentialDays += Math.ceil(essayCount * MILESTONE_DURATIONS.supplementalEssay * 0.7);
    }
  } else {
    // Check if any parallel administrative tasks are incomplete
    const hasIncompleteAdmin =
      !checklist.lorTeacher ||
      !checklist.transcriptSent ||
      !checklist.testScoresSent ||
      !checklist.finaidGreenLight;

    if (hasIncompleteAdmin) {
      needsParallelBlock = true;
    }

    // Essays (sequential work)
    if (!checklist.mainEssayComplete) {
      sequentialDays += MILESTONE_DURATIONS.mainEssay;
    }

    // Supplemental essays - with 30% overlap factor
    const supplementalsCompleted = checklist.supplementalEssaysCompleted ?? 0;
    const totalSupplementals = checklist.essayCount || 0;
    const supplementalsRemaining = Math.max(0, totalSupplementals - supplementalsCompleted);

    if (supplementalsRemaining > 0) {
      sequentialDays += Math.ceil(supplementalsRemaining * MILESTONE_DURATIONS.supplementalEssay * 0.7);
    }
  }

  // Calculate total: MAX(parallel block, sequential essays)
  const parallelBlockDuration = needsParallelBlock ? PARALLEL_ITEMS.longestDuration : 0;
  const totalWorkDays = Math.max(parallelBlockDuration, sequentialDays);

  // Add mandatory buffers
  const totalDays = totalWorkDays + MILESTONE_DURATIONS.finalReview + MILESTONE_DURATIONS.unexpectedDelay;

  return totalDays;
}

// Calculate urgency level based on buffer ratio
export type UrgencyLevel = "red" | "yellow" | "green" | "none";

export function getUrgencyLevel(
  deadline: Date | null,
  status: string,
  checklist: Checklist,
  essayCount: number = 0
): UrgencyLevel {
  // No urgency for submitted/completed applications
  if (!deadline || status === "SUBMITTED" || status === "ACCEPTED" || status === "DECLINED") {
    return "none";
  }

  const now = new Date();
  const daysAvailable = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Past deadline or very close
  if (daysAvailable <= 0) {
    return "red";
  }

  const daysNeeded = calculateDaysNeeded(checklist, essayCount);

  // If everything is complete, no urgency
  if (daysNeeded <= 10) { // Only buffers remain
    return "green";
  }

  // Calculate buffer ratio
  const bufferRatio = daysAvailable / daysNeeded;

  // Less than 10% buffer → RED (critical)
  if (bufferRatio < 1.1) {
    return "red";
  }

  // Less than 30% buffer → YELLOW (warning)
  if (bufferRatio < 1.3) {
    return "yellow";
  }

  // 30%+ buffer → GREEN (on track)
  return "green";
}

// Legacy function - kept for backward compatibility, now uses predictive logic
export function isDeadlineUrgent(deadline: Date | null, status: string): boolean {
  if (!deadline || status === "SUBMITTED" || status === "ACCEPTED" || status === "DECLINED") {
    return false;
  }
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 7 && daysUntil >= 0;
}

// Get urgency message for display
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
