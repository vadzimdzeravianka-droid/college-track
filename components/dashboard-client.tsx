"use client";

import { useState } from "react";
import { CollegeCard } from "@/components/college-card";
import { DashboardFilters } from "@/components/dashboard-filters";
import { getUrgencyLevel } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

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

type FilterType = "all" | "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";

export function DashboardClient({ colleges }: { colleges: College[] }) {
  const [filter, setFilter] = useState<FilterType>("all");

  // Filter colleges
  const filteredColleges = filter === "all"
    ? colleges
    : colleges.filter((c) => c.status === filter);

  // Sort by urgency level (red → yellow → green) then by deadline
  const sortedColleges = [...filteredColleges].sort((a, b) => {
    const urgencyA = getUrgencyLevel(
      a.deadlineApp,
      a.status,
      a.checklist ?? null,
      a.checklist?.essayCount || 0
    );
    const urgencyB = getUrgencyLevel(
      b.deadlineApp,
      b.status,
      b.checklist ?? null,
      b.checklist?.essayCount || 0
    );

    // Urgency priority: red (3) > yellow (2) > green (1) > none (0)
    const urgencyWeight = { red: 3, yellow: 2, green: 1, none: 0 };
    const weightA = urgencyWeight[urgencyA];
    const weightB = urgencyWeight[urgencyB];

    // Sort by urgency first
    if (weightA !== weightB) {
      return weightB - weightA; // Higher weight first
    }

    // Within same urgency, sort by deadline (soonest first)
    if (a.deadlineApp && b.deadlineApp) {
      return a.deadlineApp.getTime() - b.deadlineApp.getTime();
    }
    if (a.deadlineApp) return -1;
    if (b.deadlineApp) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <DashboardFilters activeFilter={filter} onFilterChange={setFilter} />

      {filteredColleges.length === 0 && (
        <div className="text-center py-16">
          <div className="rounded-full bg-muted h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No colleges found
          </h3>
          <p className="text-muted-foreground">
            {filter === "all" ? "Add your first college to get started" : "No colleges match this filter"}
          </p>
        </div>
      )}

      {sortedColleges.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {sortedColleges.map((college) => (
            <CollegeCard key={college.id} college={college} />
          ))}
        </div>
      )}
    </div>
  );
}
