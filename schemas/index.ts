import * as z from "zod";

export const PasskeySchema = z.object({
  passkey: z.string().min(1, "Passkey is required"),
});

export const CollegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  category: z.enum(["REACH", "MATCH", "SAFETY"]),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "WAITLISTED", "ACCEPTED", "DECLINED"]).default("NOT_STARTED"),
  strategy: z.enum(["ED", "EA", "RD"]),
  deadlineApp: z.string().optional().nullable(),
  deadlineFinaid: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  portalUrl: z.string().optional().nullable(),
  portalUser: z.string().optional().nullable(),
  portalPassword: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ChecklistSchema = z.object({
  lorTeacher: z.boolean().default(false),
  transcriptSent: z.boolean().default(false),
  testScoresSent: z.boolean().default(false),
  essayCount: z.number().int().min(0).default(0),
  finaidGreenLight: z.boolean().default(false),
});
