"use client";

import { CollegeFormNew } from "@/components/college-form-new";
import { useRouter } from "next/navigation";

type College = {
  id: string;
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

export function CollegeEditButton({ college }: { college: College }) {
  const router = useRouter();

  return (
    <CollegeFormNew
      college={college}
      onSuccess={() => {
        router.refresh();
      }}
    />
  );
}
