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
  mainEssayComplete: boolean;
  supplementalEssaysCompleted: number;
  finaidGreenLight: boolean;
};

export function ChecklistForm({ checklist, collegeId }: { checklist: Checklist | null; collegeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [essayCount, setEssayCount] = useState(checklist?.essayCount || 0);
  const [supplementalCompleted, setSupplementalCompleted] = useState(checklist?.supplementalEssaysCompleted || 0);

  const handleCheckboxChange = (field: keyof Omit<Checklist, "id" | "collegeId" | "essayCount" | "supplementalEssaysCompleted">, value: boolean) => {
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
    // Reset supplemental completed if it exceeds new total
    if (supplementalCompleted > value) {
      setSupplementalCompleted(value);
      startTransition(async () => {
        await updateChecklist(collegeId, { essayCount: value, supplementalEssaysCompleted: value });
      });
    } else {
      startTransition(async () => {
        const result = await updateChecklist(collegeId, { essayCount: value });
        if (result.error) {
          toast.error(result.error);
        }
      });
    }
  };

  const handleSupplementalCompletedChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(value, essayCount));
    setSupplementalCompleted(clampedValue);
    startTransition(async () => {
      const result = await updateChecklist(collegeId, { supplementalEssaysCompleted: clampedValue });
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
        <Label htmlFor="lorTeacher" className="cursor-pointer flex-1">
          Letter of Recommendation
          <span className="text-xs text-muted-foreground ml-2">(~4 weeks)</span>
        </Label>
      </div>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="transcriptSent"
          checked={checklist?.transcriptSent || false}
          onCheckedChange={(checked) => handleCheckboxChange("transcriptSent", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="transcriptSent" className="cursor-pointer flex-1">
          Transcript Sent
          <span className="text-xs text-muted-foreground ml-2">(~2 weeks)</span>
        </Label>
      </div>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="testScoresSent"
          checked={checklist?.testScoresSent || false}
          onCheckedChange={(checked) => handleCheckboxChange("testScoresSent", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="testScoresSent" className="cursor-pointer flex-1">
          Test Scores Sent
          <span className="text-xs text-muted-foreground ml-2">(~2 weeks)</span>
        </Label>
      </div>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="finaidGreenLight"
          checked={checklist?.finaidGreenLight || false}
          onCheckedChange={(checked) => handleCheckboxChange("finaidGreenLight", checked as boolean)}
          disabled={isPending}
        />
        <Label htmlFor="finaidGreenLight" className="cursor-pointer flex-1">
          Financial Aid Documents
          <span className="text-xs text-muted-foreground ml-2">(~3 weeks)</span>
        </Label>
      </div>

      {/* Essay Section */}
      <div className="pt-4 border-t">
        <Label className="text-sm font-semibold mb-3 block">Essays</Label>

        <div className="space-y-3">
          {/* Main Essay */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="mainEssayComplete"
              checked={checklist?.mainEssayComplete || false}
              onCheckedChange={(checked) => handleCheckboxChange("mainEssayComplete", checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="mainEssayComplete" className="cursor-pointer">
              Main Essay Complete
              <span className="text-xs text-muted-foreground ml-2">(~3 weeks)</span>
            </Label>
          </div>

          {/* Supplemental Essays */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label htmlFor="essayCount" className="text-sm">Total Supplemental Essays:</Label>
              <Input
                id="essayCount"
                type="number"
                min="0"
                max="10"
                value={essayCount}
                onChange={(e) => handleEssayCountChange(parseInt(e.target.value) || 0)}
                disabled={isPending}
                className="w-20 h-9"
              />
            </div>

            {essayCount > 0 && (
              <div className="flex items-center gap-3 ml-6">
                <Label htmlFor="supplementalCompleted" className="text-sm">Completed:</Label>
                <Input
                  id="supplementalCompleted"
                  type="number"
                  min="0"
                  max={essayCount}
                  value={supplementalCompleted}
                  onChange={(e) => handleSupplementalCompletedChange(parseInt(e.target.value) || 0)}
                  disabled={isPending}
                  className="w-20 h-9"
                />
                <span className="text-sm text-muted-foreground">
                  / {essayCount}
                  <span className="ml-2">(~{(essayCount - supplementalCompleted) * 10} days left)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
