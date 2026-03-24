"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, CategoryBadge, StrategyBadge } from "@/components/status-badge";
import { cn, isDeadlineUrgent, formatDate, getDaysUntilDeadline } from "@/lib/utils";
import Link from "next/link";
import { Calendar, MapPin, GraduationCap, DollarSign, CheckCircle2, KeyRound } from "lucide-react";

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
  checklist?: {
    lorTeacher: boolean;
    transcriptSent: boolean;
    testScoresSent: boolean;
    essayCount: number;
    finaidGreenLight: boolean;
  } | null;
};

function getChecklistProgress(checklist?: College["checklist"]): { completed: number; total: number } {
  if (!checklist) return { completed: 0, total: 5 };

  const items = [
    checklist.lorTeacher,
    checklist.transcriptSent,
    checklist.testScoresSent,
    checklist.essayCount > 0,
    checklist.finaidGreenLight,
  ];

  return {
    completed: items.filter(Boolean).length,
    total: items.length,
  };
}

export function CollegeCard({ college }: { college: College }) {
  const isUrgent = isDeadlineUrgent(college.deadlineApp, college.status);
  const daysUntil = college.deadlineApp ? getDaysUntilDeadline(college.deadlineApp) : null;
  const hasPortalCredentials = !!(college.portalUrl || college.portalUser);
  const checklistProgress = getChecklistProgress(college.checklist);

  return (
    <Link href={`/college/${college.id}`}>
      <Card
        className={cn(
          "transition-all duration-300 hover:shadow-lg cursor-pointer h-full flex flex-col",
          isUrgent && "border-2 border-destructive animate-pulse"
        )}
      >
        <CardHeader>
          <CardTitle className="text-xl">{college.name}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={college.status} />
            <CategoryBadge category={college.category} />
            <StrategyBadge strategy={college.strategy} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
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
                    isUrgent ? "text-destructive font-semibold" : "text-muted-foreground"
                  )}>
                    App: {formatDate(college.deadlineApp)}
                  </span>
                  {daysUntil !== null && daysUntil >= 0 && (
                    <span className={cn(
                      "text-xs",
                      isUrgent ? "text-destructive font-medium" : "text-muted-foreground"
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
          </div>

          <div className="flex items-center justify-between pt-3 border-t mt-auto">
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
      </Card>
    </Link>
  );
}
