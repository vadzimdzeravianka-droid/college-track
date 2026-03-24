"use client";

import { useState } from "react";
import { CollegeCard } from "@/components/college-card";
import { DashboardFilters } from "@/components/dashboard-filters";
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

  const filteredColleges = filter === "all"
    ? colleges
    : colleges.filter((c) => c.status === filter);

  return (
    <div className="space-y-6">
      <DashboardFilters activeFilter={filter} onFilterChange={setFilter} />

      {filteredColleges.length === 0 && (
        <div className="text-center py-16">
          <div className="rounded-full bg-slate-100 h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No colleges found
          </h3>
          <p className="text-slate-600">
            {filter === "all" ? "Add your first college to get started" : "No colleges match this filter"}
          </p>
        </div>
      )}

      {filteredColleges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college) => (
            <CollegeCard key={college.id} college={college} />
          ))}
        </div>
      )}
    </div>
  );
}
