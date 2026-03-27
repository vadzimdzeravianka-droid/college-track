"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, CategoryBadge, StrategyBadge } from "@/components/status-badge";
import { cn, getUrgencyLevel, getUrgencyMessage, formatDate, getDaysUntilDeadline, formatCurrency, getGroupedCosts, hasCostData } from "@/lib/utils";
import Link from "next/link";
import { Calendar, MapPin, GraduationCap, DollarSign, CheckCircle2, KeyRound, AlertTriangle, AlertCircle } from "lucide-react";

type College = {
  id: string;
  name: string;
  category: "REACH" | "MATCH" | "SAFETY";
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";
  strategy: "ED" | "EA" | "RD";
  deadlineApp: Date | null;
  deadlineFinaid: Date | null;
  location: string | null;
  major: string | null;
  portalUrl: string | null;
  portalUser: string | null;
  costTuition?: number | { toNumber: () => number } | null;
  costRoomBoard?: number | { toNumber: () => number } | null;
  costFees?: number | { toNumber: () => number } | null;
  costBooks?: number | { toNumber: () => number } | null;
  costPersonal?: number | { toNumber: () => number } | null;
  costOther?: number | { toNumber: () => number } | null;
  isInState?: boolean | null;
  checklist?: {
    lorTeacher: boolean;
    transcriptSent: boolean;
    testScoresSent: boolean;
    essayCount: number;
    mainEssayComplete?: boolean;
    supplementalEssaysCompleted?: number;
    finaidGreenLight: boolean;
  } | null;
};

function getChecklistProgress(checklist?: College["checklist"]): { completed: number; total: number } {
  if (!checklist) return { completed: 0, total: 0 };

  let completed = 0;
  let total = 5;

  if (checklist.lorTeacher) completed++;
  if (checklist.transcriptSent) completed++;
  if (checklist.testScoresSent) completed++;
  if (checklist.mainEssayComplete) completed++;
  if (checklist.finaidGreenLight) completed++;

  const supplementalTotal = checklist.essayCount || 0;
  const supplementalCompleted = checklist.supplementalEssaysCompleted || 0;
  total += supplementalTotal;
  completed += supplementalCompleted;

  return { completed, total };
}

export function CollegeCard({ college }: { college: College }) {
  const urgencyLevel = getUrgencyLevel(
    college.deadlineApp,
    college.status,
    college.checklist ?? null,
    college.checklist?.essayCount || 0
  );
  const urgencyMessage = getUrgencyMessage(
    college.deadlineApp,
    college.status,
    college.checklist ?? null,
    college.checklist?.essayCount || 0
  );
  const daysUntil = college.deadlineApp ? getDaysUntilDeadline(college.deadlineApp) : null;
  const hasPortalCredentials = !!(college.portalUrl || college.portalUser);
  const checklistProgress = getChecklistProgress(college.checklist);
  const costData = hasCostData(college) ? getGroupedCosts(college) : null;

  const getBorderClass = () => {
    if (urgencyLevel === "red") return "border-2 border-destructive";
    if (urgencyLevel === "yellow") return "border-2 border-yellow-500";
    return "border";
  };

  const getUrgencyBadge = () => {
    if (urgencyLevel === "red") {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-md text-xs font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          CRITICAL
        </div>
      );
    }
    if (urgencyLevel === "yellow") {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500 rounded-md text-xs font-medium">
          <AlertTriangle className="h-3.5 w-3.5" />
          WARNING
        </div>
      );
    }
    return null;
  };

  return (
    <Link href={`/college/${college.id}`}>
      <Card
        className={cn(
          "transition-all duration-300 hover:shadow-lg cursor-pointer h-full",
          getBorderClass(),
          urgencyLevel === "red" && "animate-pulse"
        )}
      >
        {/* Mobile: Vertical Layout */}
        <div className="md:hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-xl flex-1">{college.name}</CardTitle>
              {getUrgencyBadge()}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={college.status} />
              <CategoryBadge category={college.category} />
              <StrategyBadge strategy={college.strategy} />
            </div>
            {urgencyMessage && (
              <div className={cn(
                "mt-3 text-xs p-2 rounded",
                urgencyLevel === "red" && "bg-destructive/10 text-destructive",
                urgencyLevel === "yellow" && "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500"
              )}>
                {urgencyMessage}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {college.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{college.location}</span>
                </div>
              )}
              {college.major && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{college.major}</span>
                </div>
              )}
              {college.deadlineApp && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className={cn(
                      urgencyLevel === "red" && "text-destructive font-semibold",
                      urgencyLevel === "yellow" && "text-yellow-700 dark:text-yellow-500 font-semibold",
                      urgencyLevel === "green" && "text-muted-foreground"
                    )}>
                      App: {formatDate(college.deadlineApp)}
                    </span>
                    {daysUntil !== null && daysUntil >= 0 && (
                      <span className={cn(
                        "text-xs",
                        urgencyLevel === "red" && "text-destructive font-medium",
                        urgencyLevel === "yellow" && "text-yellow-700 dark:text-yellow-500 font-medium",
                        urgencyLevel === "green" && "text-muted-foreground"
                      )}>
                        {daysUntil === 0 ? "Due today!" : `${daysUntil} days left`}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {college.deadlineFinaid && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  <span>FinAid: {formatDate(college.deadlineFinaid)}</span>
                </div>
              )}
              {costData && (
                <div className="pt-3 border-t space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1.5">Cost of Attendance</div>
                  {costData.tuitionAndFees !== null && (
                    <div className="text-xs text-muted-foreground">
                      Tuition + Fees: <span className="font-medium text-foreground">{formatCurrency(costData.tuitionAndFees)}</span>
                    </div>
                  )}
                  {costData.roomAndBoard !== null && (
                    <div className="text-xs text-muted-foreground">
                      Room & Board: <span className="font-medium text-foreground">{formatCurrency(costData.roomAndBoard)}</span>
                    </div>
                  )}
                  {costData.other !== null && (
                    <div className="text-xs text-muted-foreground">
                      Other: <span className="font-medium text-foreground">{formatCurrency(costData.other)}</span>
                    </div>
                  )}
                  {costData.total !== null && (
                    <div className="text-sm font-semibold pt-1">
                      Total: {formatCurrency(costData.total)}
                      {college.isInState && <span className="text-xs font-normal text-muted-foreground ml-1">(In-State)</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {checklistProgress.completed}/{checklistProgress.total}
                </span>
              </div>
              {hasPortalCredentials && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Portal saved</span>
                </div>
              )}
            </div>
          </CardContent>
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex items-stretch">
          {/* Left: Name & Badges */}
          <div className="flex-shrink-0 w-2/5 p-6 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <CardTitle className="text-lg flex-1">{college.name}</CardTitle>
              {getUrgencyBadge()}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <StatusBadge status={college.status} />
              <CategoryBadge category={college.category} />
              <StrategyBadge strategy={college.strategy} />
            </div>
            {urgencyMessage && (
              <div className={cn(
                "text-xs p-2 rounded mt-auto",
                urgencyLevel === "red" && "bg-destructive/10 text-destructive",
                urgencyLevel === "yellow" && "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500"
              )}>
                {urgencyMessage}
              </div>
            )}
          </div>

          {/* Middle: Details */}
          <div className="flex-shrink-0 w-64 p-6 border-l space-y-2">
            {college.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{college.location}</span>
              </div>
            )}
            {college.major && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{college.major}</span>
              </div>
            )}
            {college.deadlineApp && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span className={cn(
                    urgencyLevel === "red" && "text-destructive font-semibold",
                    urgencyLevel === "yellow" && "text-yellow-700 dark:text-yellow-500 font-semibold",
                    urgencyLevel === "green" && "text-muted-foreground"
                  )}>
                    App: {formatDate(college.deadlineApp)}
                  </span>
                  {daysUntil !== null && daysUntil >= 0 && (
                    <span className={cn(
                      "text-xs ml-2",
                      urgencyLevel === "red" && "text-destructive font-medium",
                      urgencyLevel === "yellow" && "text-yellow-700 dark:text-yellow-500 font-medium",
                      urgencyLevel === "green" && "text-muted-foreground"
                    )}>
                      ({daysUntil === 0 ? "Due today!" : `${daysUntil} days left`})
                    </span>
                  )}
                </div>
              </div>
            )}
            {college.deadlineFinaid && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>FinAid: {formatDate(college.deadlineFinaid)}</span>
              </div>
            )}
          </div>

          {/* Middle-Right: Cost */}
          {costData ? (
            <div className="flex-shrink-0 w-56 p-6 border-l flex flex-col justify-center space-y-1.5">
              {costData.tuitionAndFees !== null && (
                <div className="flex justify-between items-baseline text-xs gap-2">
                  <span className="text-muted-foreground">Tuition + Fees:</span>
                  <span className="font-medium">{formatCurrency(costData.tuitionAndFees)}</span>
                </div>
              )}
              {costData.roomAndBoard !== null && (
                <div className="flex justify-between items-baseline text-xs gap-2">
                  <span className="text-muted-foreground">Room & Board:</span>
                  <span className="font-medium">{formatCurrency(costData.roomAndBoard)}</span>
                </div>
              )}
              {costData.other !== null && (
                <div className="flex justify-between items-baseline text-xs gap-2">
                  <span className="text-muted-foreground">Other:</span>
                  <span className="font-medium">{formatCurrency(costData.other)}</span>
                </div>
              )}
              {costData.total !== null && (
                <div className="flex justify-between items-baseline text-sm font-semibold pt-1.5 border-t gap-2">
                  <span>Total:</span>
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(costData.total)}</span>
                    {college.isInState && <span className="text-xs font-normal text-muted-foreground">(In-State)</span>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-shrink-0 w-56 p-6 border-l flex flex-col justify-center items-center">
              <div className="text-xs text-muted-foreground text-center">Cost N/A</div>
            </div>
          )}

          {/* Right: Progress */}
          <div className="flex-shrink-0 w-32 p-6 border-l flex flex-col justify-center items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
              <span className="text-xs text-muted-foreground">complete</span>
            </div>
            {hasPortalCredentials && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Portal</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
