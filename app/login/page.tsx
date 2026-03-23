"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasskeySchema } from "@/schemas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">College Track</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your passkey to access the application
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label htmlFor="passkey" className="block text-sm font-medium text-slate-700">
              Passkey
            </label>
            <input
              {...form.register("passkey")}
              id="passkey"
              type="password"
              disabled={isPending}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
              placeholder="Enter your passkey"
            />
            {form.formState.errors.passkey && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.passkey.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
