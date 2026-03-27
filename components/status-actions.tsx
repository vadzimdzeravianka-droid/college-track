"use client";

import { useTransition } from "react";
import { updateCollegeStatus } from "@/actions/college";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, Undo2 } from "lucide-react";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";

export function StatusActions({ collegeId, currentStatus }: { collegeId: string; currentStatus: Status }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: Status) => {
    startTransition(async () => {
      const result = await updateCollegeStatus(collegeId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    });
  };

  // Show decision buttons when SUBMITTED
  if (currentStatus === "SUBMITTED") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-3">
          Application submitted. Update status when you receive a response:
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            onClick={() => handleStatusChange("WAITLISTED")}
            disabled={isPending}
            className="w-full justify-start border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-700 dark:text-orange-400"
          >
            <Clock className="h-4 w-4 mr-2" />
            Waitlisted
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange("ACCEPTED")}
            disabled={isPending}
            className="w-full justify-start border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/30 text-green-700 dark:text-green-400"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepted
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange("DECLINED")}
            disabled={isPending}
            className="w-full justify-start border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Declined
          </Button>
        </div>
      </div>
    );
  }

  // Show Back button for final statuses (to revert misclick)
  if (currentStatus === "WAITLISTED" || currentStatus === "ACCEPTED" || currentStatus === "DECLINED") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Status set to <strong className="text-foreground">{currentStatus}</strong>. Click below if this was a mistake:
        </p>
        <Button
          variant="outline"
          onClick={() => handleStatusChange("SUBMITTED")}
          disabled={isPending}
          className="w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-400"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Back to Submitted
        </Button>
      </div>
    );
  }

  // No actions for NOT_STARTED or IN_PROGRESS (auto-managed)
  return null;
}
