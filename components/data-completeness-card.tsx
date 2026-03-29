"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataCompleteness, type DataCompleteness } from "@/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Calendar,
  KeyRound,
  DollarSign,
  FileText,
  ExternalLink,
} from "lucide-react";

type College = {
  id: string;
  location: string | null;
  major: string | null;
  deadlineApp: Date | null;
  deadlineFinaid: Date | null;
  portalUrl: string | null;
  portalUser: string | null;
  portalPassword: string | null;
  costTuition?: number | { toNumber: () => number } | null;
  costRoomBoard?: number | { toNumber: () => number } | null;
  costFees?: number | { toNumber: () => number } | null;
  costBooks?: number | { toNumber: () => number } | null;
  costPersonal?: number | { toNumber: () => number } | null;
  costOther?: number | { toNumber: () => number } | null;
  isInState?: boolean | null;
  notes: string | null;
};

interface DataCompletenessCardProps {
  college: College;
}

const iconMap = {
  MapPin,
  Calendar,
  KeyRound,
  DollarSign,
  FileText,
};

function getStatusIcon(status: DataCompleteness["status"]) {
  switch (status) {
    case "complete":
    case "good":
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    case "alert":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

export function DataCompletenessCard({ college }: DataCompletenessCardProps) {
  const dataCompleteness = useMemo(
    () => getDataCompleteness(college),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      college.location,
      college.major,
      college.deadlineApp,
      college.deadlineFinaid,
      college.portalUrl,
      college.portalUser,
      college.portalPassword,
      college.costTuition,
      college.costRoomBoard,
      college.costFees,
      college.costBooks,
      college.costPersonal,
      college.costOther,
      college.isInState,
      college.notes,
    ]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Completeness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="flex items-center justify-between pb-3 border-b">
            <span className="font-medium">Overall Progress</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(dataCompleteness.status)}
              <span className="font-semibold">
                {dataCompleteness.overall.completed}/{dataCompleteness.overall.total} (
                {dataCompleteness.overall.percentage}%)
              </span>
            </div>
          </div>

          {/* Per-category breakdown */}
          {dataCompleteness.categories.map((category) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap];
            const isPortalCategory = category.name === "Portal Access";

            return (
              <div key={category.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(category.status)}
                    <span className="text-sm">
                      {category.completed}/{category.total} ({category.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Missing fields hint */}
                {category.missingFields.length > 0 && (
                  <div className="text-xs text-muted-foreground ml-6">
                    Missing: {category.missingFields.join(", ")}
                  </div>
                )}

                {/* Portal link (if Portal Access category and URL exists) */}
                {isPortalCategory && college.portalUrl && (
                  <a
                    href={college.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline ml-6 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Portal
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
