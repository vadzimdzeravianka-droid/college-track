"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
}

const StepperContext = React.createContext<StepperContextValue | undefined>(
  undefined
);

function useStepper() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
}

interface StepperProps {
  currentStep: number;
  onStepChange?: (step: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function Stepper({
  currentStep,
  onStepChange,
  children,
  className,
}: StepperProps) {
  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      onStepChange?.(step);
    }
  };

  return (
    <StepperContext.Provider value={{ currentStep, totalSteps, goToStep }}>
      <div className={cn("w-full", className)}>{children}</div>
    </StepperContext.Provider>
  );
}

export function StepperHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-1 sm:gap-4">
        {children}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  label?: string;
}

export function StepIndicator({ step, label }: StepIndicatorProps) {
  const { currentStep } = useStepper();
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-6 w-6 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all",
          isActive &&
            "border-primary bg-primary text-primary-foreground shadow-lg scale-110",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive && !isCompleted && "border-muted bg-background text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <Check className="h-3 w-3 sm:h-5 sm:w-5" />
        ) : (
          <span className="text-[10px] sm:text-sm font-semibold">{step + 1}</span>
        )}
      </div>
      {label && (
        <span
          className={cn(
            "text-xs sm:text-sm font-medium transition-colors hidden sm:block",
            isActive && "text-primary",
            !isActive && "text-muted-foreground"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function StepSeparator() {
  return (
    <div className="flex-1 h-0.5 bg-border min-w-2 sm:min-w-8 mt-3 sm:mt-5" />
  );
}

interface StepContentProps {
  step: number;
  children: React.ReactNode;
}

export function StepContent({ step, children }: StepContentProps) {
  const { currentStep } = useStepper();

  if (currentStep !== step) {
    return null;
  }

  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
      {children}
    </div>
  );
}
