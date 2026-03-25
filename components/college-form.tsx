"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CollegeSchema } from "@/schemas";
import { createCollege, updateCollege } from "@/actions/college";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type College = {
  id?: string;
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
  portalPassword: string | null;
  notes: string | null;
};

export function CollegeForm({ college, onSuccess }: { college?: College; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof CollegeSchema>>({
    resolver: zodResolver(CollegeSchema),
    defaultValues: {
      name: college?.name || "",
      category: college?.category || "MATCH",
      status: college?.status || "NOT_STARTED",
      strategy: college?.strategy || "RD",
      deadlineApp: college?.deadlineApp ? college.deadlineApp.toISOString().split("T")[0] : "",
      deadlineFinaid: college?.deadlineFinaid ? college.deadlineFinaid.toISOString().split("T")[0] : "",
      location: college?.location || "",
      major: college?.major || "",
      portalUrl: college?.portalUrl || "",
      portalUser: college?.portalUser || "",
      portalPassword: college?.portalPassword || "",
      notes: college?.notes || "",
    },
  });

  const onSubmit = (values: z.infer<typeof CollegeSchema>) => {
    startTransition(async () => {
      const result = college?.id
        ? await updateCollege(college.id, values)
        : await createCollege(values);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        setOpen(false);
        form.reset();
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add College
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{college ? "Edit College" : "Add New College"}</DialogTitle>
          <DialogDescription>
            Enter the college details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">College Name *</Label>
              <Input
                {...form.register("name")}
                id="name"
                placeholder="e.g., Stanford University"
                disabled={isPending}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value as any)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REACH">Reach</SelectItem>
                  <SelectItem value="MATCH">Match</SelectItem>
                  <SelectItem value="SAFETY">Safety</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="strategy">Strategy *</Label>
              <Select
                value={form.watch("strategy")}
                onValueChange={(value) => form.setValue("strategy", value as any)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ED">Early Decision (ED)</SelectItem>
                  <SelectItem value="EA">Early Action (EA)</SelectItem>
                  <SelectItem value="RD">Regular Decision (RD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadlineApp">Application Deadline</Label>
              <Input
                {...form.register("deadlineApp")}
                id="deadlineApp"
                type="date"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="deadlineFinaid">Financial Aid Deadline</Label>
              <Input
                {...form.register("deadlineFinaid")}
                id="deadlineFinaid"
                type="date"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                {...form.register("location")}
                id="location"
                placeholder="e.g., Stanford, CA"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="major">Intended Major</Label>
              <Input
                {...form.register("major")}
                id="major"
                placeholder="e.g., Computer Science"
                disabled={isPending}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="portalUrl">Portal URL</Label>
              <Input
                {...form.register("portalUrl")}
                id="portalUrl"
                placeholder="https://apply.college.edu"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="portalUser">Portal Username</Label>
              <Input
                {...form.register("portalUser")}
                id="portalUser"
                placeholder="username@email.com"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="portalPassword">Portal Password (Optional)</Label>
              <Input
                {...form.register("portalPassword")}
                id="portalPassword"
                type="password"
                placeholder="Leave blank if not storing"
                disabled={isPending}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...form.register("notes")}
                id="notes"
                placeholder="Any additional notes..."
                disabled={isPending}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : college ? "Update" : "Add College"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
