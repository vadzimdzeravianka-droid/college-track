"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = "all" | "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";

export function DashboardFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}) {
  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All Applications" },
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "ACCEPTED", label: "Accepted" },
  ];

  return (
    <>
      {/* Mobile: Native-looking dropdown */}
      <div className="md:hidden w-full">
        <Label htmlFor="status-filter" className="mb-2 block">
          Filter by Status
        </Label>
        <Select value={activeFilter} onValueChange={onFilterChange}>
          <SelectTrigger id="status-filter" className="w-full h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Button group */}
      <div className="hidden md:flex flex-wrap gap-2">
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
    </>
  );
}
