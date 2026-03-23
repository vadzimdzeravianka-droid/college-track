import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";
type Category = "REACH" | "MATCH" | "SAFETY";
type Strategy = "ED" | "EA" | "RD";

const statusColors: Record<Status, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  IN_PROGRESS: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  SUBMITTED: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  WAITLISTED: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  ACCEPTED: "bg-green-100 text-green-800 hover:bg-green-100",
  DECLINED: "bg-red-100 text-red-800 hover:bg-red-100",
};

const categoryColors: Record<Category, string> = {
  REACH: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  MATCH: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  SAFETY: "bg-teal-100 text-teal-800 hover:bg-teal-100",
};

const strategyColors: Record<Strategy, string> = {
  ED: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  EA: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  RD: "bg-slate-100 text-slate-800 hover:bg-slate-100",
};

const statusLabels: Record<Status, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  WAITLISTED: "Waitlisted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

const strategyLabels: Record<Strategy, string> = {
  ED: "Early Decision",
  EA: "Early Action",
  RD: "Regular Decision",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge className={cn(statusColors[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <Badge className={cn(categoryColors[category])}>
      {category}
    </Badge>
  );
}

export function StrategyBadge({ strategy }: { strategy: Strategy }) {
  return (
    <Badge className={cn(strategyColors[strategy])}>
      {strategyLabels[strategy]}
    </Badge>
  );
}
