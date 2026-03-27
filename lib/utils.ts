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

  // Absolute day-based thresholds
  if (daysAvailable <= 7) {
    return "red";
  }

  if (daysAvailable <= 21) {
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

  if (urgency === "red") {
    if (daysAvailable <= 0) {
      return "Deadline passed";
    }
    if (daysNeeded > daysAvailable) {
      return `Critical: Need ${daysNeeded} days, only ${daysAvailable} days left`;
    }
    return `Critical: Less than 1 week until deadline`;
  }

  if (urgency === "yellow") {
    if (daysNeeded > daysAvailable) {
      return `Warning: Need ${daysNeeded} days, only ${daysAvailable} days left`;
    }
    return `Warning: 1-3 weeks until deadline`;
  }

  return `On track: ${daysAvailable} days until deadline`;
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

// Cost utility types
type CostValue = number | { toNumber: () => number } | null | undefined;

type CollegeWithCosts = {
  costTuition?: CostValue;
  costRoomBoard?: CostValue;
  costFees?: CostValue;
  costBooks?: CostValue;
  costPersonal?: CostValue;
  costOther?: CostValue;
};

/**
 * Convert a cost value (number or Decimal) to a number, handling null/undefined
 */
function toNumber(value: CostValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  // Handle Prisma Decimal type
  if (typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return null;
}

/**
 * Calculate total cost from all cost components (sum of non-null values)
 * @param college - College object with cost fields
 * @returns Total cost or null if all fields are null/undefined
 */
export function calculateTotalCost(college: CollegeWithCosts): number | null {
  const costs = [
    toNumber(college.costTuition),
    toNumber(college.costRoomBoard),
    toNumber(college.costFees),
    toNumber(college.costBooks),
    toNumber(college.costPersonal),
    toNumber(college.costOther),
  ].filter((cost): cost is number => cost !== null);

  if (costs.length === 0) return null;

  return costs.reduce((sum, cost) => sum + cost, 0);
}

/**
 * Format a cost value as USD currency
 * @param amount - Number or Decimal to format
 * @returns Formatted currency string or "Not specified" for null/undefined
 */
export function formatCurrency(amount: CostValue): string {
  const numValue = toNumber(amount);
  if (numValue === null) return "Not specified";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numValue);
}

/**
 * Calculate grouped costs for dashboard display
 * @param college - College object with cost fields
 * @returns Object with tuitionAndFees, roomAndBoard, other, and total
 */
export function getGroupedCosts(college: CollegeWithCosts): {
  tuitionAndFees: number | null;
  roomAndBoard: number | null;
  other: number | null;
  total: number | null;
} {
  const tuition = toNumber(college.costTuition);
  const fees = toNumber(college.costFees);
  const roomBoard = toNumber(college.costRoomBoard);
  const books = toNumber(college.costBooks);
  const personal = toNumber(college.costPersonal);
  const other = toNumber(college.costOther);

  // Calculate tuition + fees
  const tuitionAndFees =
    tuition !== null || fees !== null
      ? (tuition ?? 0) + (fees ?? 0)
      : null;

  // Room & board is standalone
  const roomAndBoard = roomBoard;

  // Other combines books + personal + other
  const otherGroup =
    books !== null || personal !== null || other !== null
      ? (books ?? 0) + (personal ?? 0) + (other ?? 0)
      : null;

  // Total is sum of all non-null components
  const total = calculateTotalCost(college);

  return {
    tuitionAndFees,
    roomAndBoard: roomAndBoard,
    other: otherGroup,
    total,
  };
}

/**
 * Check if a college has any cost data
 * @param college - College object with cost fields
 * @returns True if any cost field is non-null/undefined, false otherwise
 */
export function hasCostData(college: CollegeWithCosts): boolean {
  return (
    toNumber(college.costTuition) !== null ||
    toNumber(college.costRoomBoard) !== null ||
    toNumber(college.costFees) !== null ||
    toNumber(college.costBooks) !== null ||
    toNumber(college.costPersonal) !== null ||
    toNumber(college.costOther) !== null
  );
}
