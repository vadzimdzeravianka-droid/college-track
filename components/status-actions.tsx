"use client";

import { useState, useTransition } from "react";
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
            className="w-full justify-start"
          >
            <Clock className="h-4 w-4 mr-2" />
            Waitlisted
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange("ACCEPTED")}
            disabled={isPending}
            className="w-full justify-start text-green-700 dark:text-green-400 hover:text-green-700 dark:hover:text-green-400"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepted
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange("DECLINED")}
            disabled={isPending}
            className="w-full justify-start text-red-700 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400"
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
          Status set to <strong>{currentStatus}</strong>. Click below if this was a mistake:
        </p>
        <Button
          variant="outline"
          onClick={() => handleStatusChange("SUBMITTED")}
          disabled={isPending}
          className="w-full"
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
