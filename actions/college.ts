"use server";

/**
 * College Server Actions
 *
 * All mutation operations (create, update, delete) use Prisma transactions
 * to ensure atomicity and data integrity. This prevents partial updates
 * where one operation succeeds while another fails, which could leave the
 * database in an inconsistent state.
 *
 * Transaction Protection:
 * - updateChecklist: Wraps checklist update + auto-status progression
 * - updateCollege: Single atomic update with ownership verification
 * - updateCollegeStatus: Single atomic status update
 * - deleteCollege: Atomic delete with cascade to checklist
 * - createCollege: Already atomic via Prisma nested write (no transaction needed)
 *
 * Note: Read operations (getColleges, getCollegeById) do not need transactions
 * as they are single operations with no mutation risk.
 */

import { db } from "@/lib/db";
import { CollegeSchema, ChecklistSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import * as z from "zod";

const COST_FIELDS = ['costTuition', 'costRoomBoard', 'costFees', 'costBooks', 'costPersonal', 'costOther'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDecimalFieldsForClient(college: any): any {
  const converted = { ...college };
  for (const field of COST_FIELDS) {
    if (converted[field] != null) {
      converted[field] = Number(converted[field]);
    }
  }
  return converted;
}

export async function getColleges() {
  try {
    const userId = await requireAuth();

    const colleges = await db.college.findMany({
      where: { userId },
      include: {
        checklist: true,
      },
      orderBy: {
        deadlineApp: "asc",
      },
    });

    return { colleges: colleges.map(convertDecimalFieldsForClient) };
  } catch (error) {
    console.error("Get colleges error:", error);
    return {
      error: "Failed to fetch colleges",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getCollegeById(id: string) {
  try {
    const userId = await requireAuth();

    const college = await db.college.findFirst({
      where: { id, userId },
      include: {
        checklist: true,
      },
    });

    if (!college) {
      return { error: "College not found" };
    }

    return { college: convertDecimalFieldsForClient(college) };
  } catch (_error) {
    return { error: "Failed to fetch college" };
  }
}

export async function createCollege(values: z.infer<typeof CollegeSchema>) {
  const validatedFields = CollegeSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid data" };
  }

  try {
    const userId = await requireAuth();
    const { deadlineApp, deadlineFinaid, ...rest } = validatedFields.data;

    const college = await db.college.create({
      data: {
        ...rest,
        userId,
        deadlineApp: deadlineApp ? new Date(deadlineApp) : null,
        deadlineFinaid: deadlineFinaid ? new Date(deadlineFinaid) : null,
        checklist: {
          create: {},
        },
      },
      include: {
        checklist: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: "College added!", college };
  } catch (error) {
    console.error("Create college error:", error);
    return {
      error: "Failed to create college",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function updateCollege(
  id: string,
  values: Partial<z.infer<typeof CollegeSchema>>
) {
  try {
    const userId = await requireAuth();
    const { deadlineApp, deadlineFinaid, ...rest } = values;

    // Wrap in transaction and use single update call (optimized from updateMany + findFirst)
    const college = await db.$transaction(async (tx) => {
      return await tx.college.update({
        where: { id, userId },
        data: {
          ...rest,
          deadlineApp: deadlineApp ? new Date(deadlineApp) : undefined,
          deadlineFinaid: deadlineFinaid ? new Date(deadlineFinaid) : undefined,
        },
        include: { checklist: true },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath(`/college/${id}`);
    return { success: "College updated!", college };
  } catch (error) {
    console.error("Update college error:", error);
    return { error: "Failed to update college" };
  }
}

export async function deleteCollege(id: string) {
  try {
    const userId = await requireAuth();

    // Wrap in transaction for consistency (also optimized to use delete instead of deleteMany)
    await db.$transaction(async (tx) => {
      return await tx.college.delete({
        where: { id, userId },
      });
    });

    revalidatePath("/dashboard");
    return { success: "College deleted!" };
  } catch (error) {
    console.error("Delete college error:", error);
    return { error: "Failed to delete college" };
  }
}

export async function updateCollegeStatus(
  id: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED"
) {
  try {
    const userId = await requireAuth();

    // Wrap in transaction and use single update call (optimized from updateMany + findFirst)
    const college = await db.$transaction(async (tx) => {
      return await tx.college.update({
        where: { id, userId },
        data: { status },
        include: { checklist: true },
      });
    });

    revalidatePath(`/college/${id}`);
    revalidatePath("/dashboard");
    return { success: "Status updated!", college };
  } catch (error) {
    console.error("Update status error:", error);
    return { error: "Failed to update status" };
  }
}

export async function updateChecklist(
  collegeId: string,
  values: Partial<z.infer<typeof ChecklistSchema>>
) {
  try {
    const userId = await requireAuth();

    // Wrap all database operations in a transaction for atomicity
    const updatedChecklist = await db.$transaction(async (tx) => {
      const college = await tx.college.findFirst({
        where: { id: collegeId, userId },
        include: { checklist: true },
      });

      if (!college) {
        throw new Error("College not found or unauthorized");
      }

      let checklist;
      if (college.checklist) {
        checklist = await tx.checklist.update({
          where: { collegeId },
          data: values,
        });
      } else {
        checklist = await tx.checklist.create({
          data: {
            collegeId,
            ...values,
          },
        });
      }

      const merged = { ...college.checklist, ...checklist, ...values };

      const allComplete =
        merged.lorTeacher &&
        merged.transcriptSent &&
        merged.testScoresSent &&
        merged.mainEssayComplete &&
        merged.finaidGreenLight &&
        (merged.essayCount === 0 || merged.supplementalEssaysCompleted >= merged.essayCount);

      let newStatus = college.status;

      if (college.status === "NOT_STARTED") {
        newStatus = "IN_PROGRESS";
      } else if (college.status === "IN_PROGRESS" && allComplete) {
        newStatus = "SUBMITTED";
      } else if (college.status === "SUBMITTED" && !allComplete) {
        newStatus = "IN_PROGRESS";
      }

      if (newStatus !== college.status) {
        await tx.college.update({
          where: { id: collegeId },
          data: { status: newStatus },
        });
      }

      return checklist;
    });

    revalidatePath(`/college/${collegeId}`);
    revalidatePath("/dashboard");
    return { success: "Checklist updated!", checklist: updatedChecklist };
  } catch (error) {
    console.error("Update checklist error:", error);
    return { error: `Failed to update checklist: ${error instanceof Error ? error.message : String(error)}` };
  }
}
