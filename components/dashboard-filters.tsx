"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FilterType = "all" | "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";

export function DashboardFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}) {
  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "ACCEPTED", label: "Accepted" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
