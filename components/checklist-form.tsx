"use client";

import { useState, useTransition } from "react";
import { updateChecklist } from "@/actions/college";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Checklist = {
  id: string;
  collegeId: string;
  lorTeacher: boolean;
  transcriptSent: boolean;
  testScoresSent: boolean;
  essayCount: number;
  finaidGreenLight: boolean;
};

export function ChecklistForm({ checklist, collegeId }: { checklist: Checklist | null; collegeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [essayCount, setEssayCount] = useState(checklist?.essayCount || 0);

  const handleCheckboxChange = (field: keyof Omit<Checklist, "id" | "collegeId" | "essayCount">, value: boolean) => {
    startTransition(async () => {
      const result = await updateChecklist(collegeId, { [field]: value });
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    });
  };

  const handleEssayCountChange = (value: number) => {
    setEssayCount(value);
    startTransition(async () => {
      const result = await updateChecklist(collegeId, { essayCount: value });
      if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="lorTeacher"
          checked={checklist?.lorTeacher || false}
          onCheckedChange={(checked) => handleCheckboxChange("lorTeacher", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="lorTeacher" className="cursor-pointer">
          Letter of Recommendation
        </Label>
      </div>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="transcriptSent"
          checked={checklist?.transcriptSent || false}
          onCheckedChange={(checked) => handleCheckboxChange("transcriptSent", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="transcriptSent" className="cursor-pointer">
          Transcript Sent
        </Label>
      </div>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="testScoresSent"
          checked={checklist?.testScoresSent || false}
          onCheckedChange={(checked) => handleCheckboxChange("testScoresSent", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="testScoresSent" className="cursor-pointer">
          Test Scores Sent
        </Label>
      </div>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="finaidGreenLight"
          checked={checklist?.finaidGreenLight || false}
          onCheckedChange={(checked) => handleCheckboxChange("finaidGreenLight", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="finaidGreenLight" className="cursor-pointer">
          Financial Aid Documents
        </Label>
      </div>

      <div className="pt-2">
        <Label htmlFor="essayCount">Supplemental Essays Required</Label>
        <Input
          id="essayCount"
          type="number"
          min="0"
          value={essayCount}
          onChange={(e) => handleEssayCountChange(parseInt(e.target.value) || 0)}
          disabled={isPending}
          className="mt-1 w-24"
        />
      </div>
    </div>
  );
}
