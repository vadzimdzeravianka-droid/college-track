"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, CategoryBadge, StrategyBadge } from "@/components/status-badge";
import { cn, isDeadlineUrgent, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Calendar, MapPin, GraduationCap } from "lucide-react";

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
};

export function CollegeCard({ college }: { college: College }) {
  const isUrgent = isDeadlineUrgent(college.deadlineApp, college.status);

  return (
    <Link href={`/college/${college.id}`}>
      <Card
        className={cn(
          "transition-all duration-300 hover:shadow-lg cursor-pointer h-full",
          isUrgent && "border-2 border-red-500 shadow-red-200 animate-pulse"
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
        <CardContent className="space-y-3">
          {college.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              {college.location}
            </div>
          )}
          {college.major && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <GraduationCap className="h-4 w-4" />
              {college.major}
            </div>
          )}
          {college.deadlineApp && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className={cn(isUrgent && "text-red-600 font-semibold")}>
                {formatDate(college.deadlineApp)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
