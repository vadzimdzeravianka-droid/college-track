"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CollegeSchema } from "@/schemas";
import { createCollege, updateCollege } from "@/actions/college";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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
import {
  Stepper,
  StepperHeader,
  StepIndicator,
  StepSeparator,
  StepContent,
} from "@/components/ui/stepper";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ArrowLeft, ArrowRight, Check, Pencil } from "lucide-react";
import { formatCurrency, calculateTotalCost } from "@/lib/utils";

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
  costTuition?: number | null;
  costRoomBoard?: number | null;
  costFees?: number | null;
  costBooks?: number | null;
  costPersonal?: number | null;
  costOther?: number | null;
  isInState?: boolean | null;
};

const STEPS = [
  { label: "Basics", fields: ["name", "category", "status", "strategy"] },
  { label: "Deadlines", fields: ["deadlineApp", "deadlineFinaid"] },
  { label: "Details", fields: ["location", "major"] },
  { label: "Cost", fields: ["costTuition", "costRoomBoard", "costFees", "costBooks", "costPersonal", "costOther", "isInState"] },
  { label: "Portal", fields: ["portalUrl", "portalUser", "portalPassword"] },
  { label: "Notes", fields: ["notes"] },
];

export function CollegeFormNew({
  college,
  onSuccess,
  variant = "default",
  className,
  size = "default"
}: {
  college?: College;
  onSuccess?: () => void;
  variant?: "default" | "fab";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
      costTuition: college?.costTuition ?? null,
      costRoomBoard: college?.costRoomBoard ?? null,
      costFees: college?.costFees ?? null,
      costBooks: college?.costBooks ?? null,
      costPersonal: college?.costPersonal ?? null,
      costOther: college?.costOther ?? null,
      isInState: college?.isInState ?? null,
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
        setCurrentStep(0);
        form.reset();
        onSuccess?.();
      }
    });
  };

  const handleNext = async () => {
    const currentFields = STEPS[currentStep].fields;
    const isValid = await form.trigger(currentFields as any);

    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentStep(0);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "fab" ? (
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all p-0"
          >
            <Plus className="h-7 w-7 stroke-[2.5]" />
            <span className="sr-only">Add College</span>
          </Button>
        ) : (
          <Button size={size} className={className}>
            {college ? (
              <Pencil className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {college ? "Edit" : "Add College"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{college ? "Edit College" : "Add New College"}</DialogTitle>
          <DialogDescription>
            Complete the information in {STEPS.length} easy steps
          </DialogDescription>
        </DialogHeader>

        <Stepper currentStep={currentStep} onStepChange={setCurrentStep}>
          <StepperHeader>
            {STEPS.map((step, index) => (
              <>
                <StepIndicator key={index} step={index} label={step.label} />
                {index < STEPS.length - 1 && <StepSeparator key={`sep-${index}`} />}
              </>
            ))}
          </StepperHeader>

          {/* Step 1: Basic Info */}
          <StepContent step={0}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-base">College Name *</Label>
                <Input
                  {...form.register("name")}
                  id="name"
                  placeholder="e.g., Stanford University"
                  disabled={isPending}
                  className="mt-2 h-11"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1.5">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-base">Category *</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) => form.setValue("category", value as any)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="mt-2 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REACH">Reach School</SelectItem>
                      <SelectItem value="MATCH">Match School</SelectItem>
                      <SelectItem value="SAFETY">Safety School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-base">Status *</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as any)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="mt-2 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="DECLINED">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="strategy" className="text-base">Application Strategy *</Label>
                <Select
                  value={form.watch("strategy")}
                  onValueChange={(value) => form.setValue("strategy", value as any)}
                  disabled={isPending}
                >
                  <SelectTrigger className="mt-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ED">Early Decision (ED)</SelectItem>
                    <SelectItem value="EA">Early Action (EA)</SelectItem>
                    <SelectItem value="RD">Regular Decision (RD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </StepContent>

          {/* Step 2: Deadlines */}
          <StepContent step={1}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="deadlineApp" className="text-base">Application Deadline</Label>
                <p className="text-sm text-muted-foreground mb-2">When is your application due?</p>
                <Controller
                  control={form.control}
                  name="deadlineApp"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value && field.value !== "" ? parseISO(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      placeholder="Select application deadline"
                      disabled={isPending}
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="deadlineFinaid" className="text-base">Financial Aid Deadline</Label>
                <p className="text-sm text-muted-foreground mb-2">When are financial aid documents due?</p>
                <Controller
                  control={form.control}
                  name="deadlineFinaid"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value && field.value !== "" ? parseISO(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      placeholder="Select financial aid deadline"
                      disabled={isPending}
                    />
                  )}
                />
              </div>

              <Separator className="my-4" />

              <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                <div className="p-4 text-sm text-blue-900 dark:text-blue-300">
                  <p className="font-medium mb-1">💡 Tip</p>
                  <p>Financial aid deadlines are often earlier than application deadlines. Check carefully!</p>
                </div>
              </Card>
            </div>
          </StepContent>

          {/* Step 3: Details */}
          <StepContent step={2}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="location" className="text-base">Location</Label>
                <p className="text-sm text-muted-foreground mb-2">City and state</p>
                <Input
                  {...form.register("location")}
                  id="location"
                  placeholder="e.g., Stanford, CA"
                  disabled={isPending}
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="major" className="text-base">Intended Major</Label>
                <p className="text-sm text-muted-foreground mb-2">What do you plan to study?</p>
                <Input
                  {...form.register("major")}
                  id="major"
                  placeholder="e.g., Computer Science"
                  disabled={isPending}
                  className="h-11"
                />
              </div>

              <Card className="bg-muted/50">
                <div className="p-4 text-sm text-muted-foreground">
                  <p>These fields are optional but helpful for organizing your applications.</p>
                </div>
              </Card>
            </div>
          </StepContent>

          {/* Step 4: Cost of Attendance */}
          <StepContent step={3}>
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium">Cost of Attendance (Optional)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter costs as published by the college. All fields are optional.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costTuition" className="text-base">Tuition</Label>
                  <p className="text-sm text-muted-foreground mb-2">Annual tuition cost</p>
                  <Input
                    {...form.register("costTuition", {
                      setValueAs: (v) => v === "" || v === null ? null : Number(v)
                    })}
                    id="costTuition"
                    type="number"
                    placeholder="50000"
                    disabled={isPending}
                    className="h-11"
                    min="0"
                    step="100"
                  />
                  {form.formState.errors.costTuition && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.costTuition.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costRoomBoard" className="text-base">Room & Board</Label>
                  <p className="text-sm text-muted-foreground mb-2">Housing and meals</p>
                  <Input
                    {...form.register("costRoomBoard", {
                      setValueAs: (v) => v === "" || v === null ? null : Number(v)
                    })}
                    id="costRoomBoard"
                    type="number"
                    placeholder="18000"
                    disabled={isPending}
                    className="h-11"
                    min="0"
                    step="100"
                  />
                  {form.formState.errors.costRoomBoard && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.costRoomBoard.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costFees" className="text-base">Fees</Label>
                  <p className="text-sm text-muted-foreground mb-2">Student fees, activity fees</p>
                  <Input
                    {...form.register("costFees", {
                      setValueAs: (v) => v === "" || v === null ? null : Number(v)
                    })}
                    id="costFees"
                    type="number"
                    placeholder="5000"
                    disabled={isPending}
                    className="h-11"
                    min="0"
                    step="100"
                  />
                  {form.formState.errors.costFees && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.costFees.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costBooks" className="text-base">Books & Supplies</Label>
                  <p className="text-sm text-muted-foreground mb-2">Textbooks and materials</p>
                  <Input
                    {...form.register("costBooks", {
                      setValueAs: (v) => v === "" || v === null ? null : Number(v)
                    })}
                    id="costBooks"
                    type="number"
                    placeholder="1200"
                    disabled={isPending}
                    className="h-11"
                    min="0"
                    step="100"
                  />
                  {form.formState.errors.costBooks && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.costBooks.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costPersonal" className="text-base">Personal Expenses</Label>
                  <p className="text-sm text-muted-foreground mb-2">Personal spending</p>
                  <Input
                    {...form.register("costPersonal", {
                      setValueAs: (v) => v === "" || v === null ? null : Number(v)
                    })}
                    id="costPersonal"
                    type="number"
                    placeholder="1500"
                    disabled={isPending}
                    className="h-11"
                    min="0"
                    step="100"
                  />
                  {form.formState.errors.costPersonal && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.costPersonal.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costOther" className="text-base">Other Costs</Label>
                  <p className="text-sm text-muted-foreground mb-2">Transportation, etc.</p>
                  <Input
                    {...form.register("costOther", {
                      setValueAs: (v) => v === "" || v === null ? null : Number(v)
                    })}
                    id="costOther"
                    type="number"
                    placeholder="500"
                    disabled={isPending}
                    className="h-11"
                    min="0"
                    step="100"
                  />
                  {form.formState.errors.costOther && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.costOther.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Controller
                  control={form.control}
                  name="isInState"
                  render={({ field }) => (
                    <Checkbox
                      id="isInState"
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true ? true : null)}
                      disabled={isPending}
                    />
                  )}
                />
                <Label
                  htmlFor="isInState"
                  className="text-base font-normal cursor-pointer"
                >
                  In-State Student
                </Label>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-1">Estimated Total Annual Cost</div>
                <div className="text-2xl font-bold text-primary">
                  {(() => {
                    const total = calculateTotalCost({
                      costTuition: form.watch("costTuition"),
                      costRoomBoard: form.watch("costRoomBoard"),
                      costFees: form.watch("costFees"),
                      costBooks: form.watch("costBooks"),
                      costPersonal: form.watch("costPersonal"),
                      costOther: form.watch("costOther"),
                    });
                    return total !== null ? formatCurrency(total) : "Not specified";
                  })()}
                </div>
              </div>

              <Card className="bg-muted/50">
                <div className="p-4 text-sm text-muted-foreground">
                  <p>Cost information helps you compare colleges financially. You can skip this section and add costs later.</p>
                </div>
              </Card>
            </div>
          </StepContent>

          {/* Step 5: Portal */}
          <StepContent step={4}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="portalUrl" className="text-base">Application Portal URL</Label>
                <p className="text-sm text-muted-foreground mb-2">Link to the college's application portal</p>
                <Input
                  {...form.register("portalUrl")}
                  id="portalUrl"
                  type="url"
                  placeholder="https://apply.college.edu"
                  disabled={isPending}
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="portalUser" className="text-base">Portal Username</Label>
                <p className="text-sm text-muted-foreground mb-2">Your login username or email</p>
                <Input
                  {...form.register("portalUser")}
                  id="portalUser"
                  placeholder="username@email.com"
                  disabled={isPending}
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="portalPassword" className="text-base">Portal Password</Label>
                <p className="text-sm text-muted-foreground mb-2">Optional - stored securely</p>
                <Input
                  {...form.register("portalPassword")}
                  id="portalPassword"
                  type="password"
                  placeholder="Leave blank if not storing"
                  disabled={isPending}
                  className="h-11"
                />
              </div>

              <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                <div className="p-4 text-sm text-amber-900 dark:text-amber-300">
                  <p className="font-medium mb-1">🔒 Privacy Note</p>
                  <p>Portal credentials are stored as plain text. Only store passwords you're comfortable saving.</p>
                </div>
              </Card>
            </div>
          </StepContent>

          {/* Step 6: Notes */}
          <StepContent step={5}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="notes" className="text-base">Additional Notes</Label>
                <p className="text-sm text-muted-foreground mb-2">Any other information about this college</p>
                <Textarea
                  {...form.register("notes")}
                  id="notes"
                  placeholder="Visited campus on..., spoke with..., interesting program features..."
                  disabled={isPending}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Card className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900">
                <div className="p-4 text-sm text-green-900 dark:text-green-300">
                  <p className="font-medium mb-1">✅ Almost Done!</p>
                  <p>Review your information and click "Submit" to save this college to your list.</p>
                </div>
              </Card>
            </div>
          </StepContent>
        </Stepper>

        {/* Navigation */}
        <Separator className="mt-8" />
        <div className="flex items-center justify-between gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isPending}
            className="h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isPending}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              className="h-11 min-w-24"
            >
              {isPending ? (
                "Saving..."
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
