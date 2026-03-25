"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  const triggerButton = (
    <Button
      variant="outline"
      disabled={disabled}
      className={cn(
        "w-full justify-start text-left font-normal h-11",
        !value && "text-muted-foreground",
        className
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, "PPP") : <span>{placeholder}</span>}
    </Button>
  );

  // Mobile: Use fullscreen modal with calendar
  if (isMobile) {
    return (
      <>
        <div onClick={() => !disabled && setOpen(true)}>
          {triggerButton}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{placeholder}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center px-4 pb-6">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleSelect}
                initialFocus
                className="rounded-md border-0 [--cell-size:2.75rem]"
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Use Calendar popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  );
}
