import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";
type Category = "REACH" | "MATCH" | "SAFETY";
type Strategy = "ED" | "EA" | "RD";

const statusColors: Record<Status, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-900",
  SUBMITTED: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-900",
  WAITLISTED: "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-900",
  ACCEPTED: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-900",
  DECLINED: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-900",
};

const categoryColors: Record<Category, string> = {
  REACH: "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-900",
  MATCH: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-900",
  SAFETY: "bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-200 dark:hover:bg-teal-900",
};

const strategyColors: Record<Strategy, string> = {
  ED: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900 dark:text-rose-200 dark:hover:bg-rose-900",
  EA: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-900",
  RD: "bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800",
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
