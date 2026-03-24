"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasskeySchema } from "@/schemas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof PasskeySchema>>({
    resolver: zodResolver(PasskeySchema),
    defaultValues: {
      passkey: "",
    },
  });

  const onSubmit = (values: z.infer<typeof PasskeySchema>) => {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          toast.error(data.error);
        } else if (data.success) {
          toast.success("Login successful!");
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err) {
        setError("Something went wrong!");
        toast.error("Something went wrong!");
      }
    });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-6 sm:p-8 shadow-xl border">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">College Application Tracker</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your passkey to access the application
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="passkey">Passkey</Label>
            <Input
              {...form.register("passkey")}
              id="passkey"
              type="password"
              disabled={isPending}
              placeholder="Enter your passkey"
              className="mt-1.5"
            />
            {form.formState.errors.passkey && (
              <p className="mt-1.5 text-sm text-red-600">
                {form.formState.errors.passkey.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
