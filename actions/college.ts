"use server";

import { db } from "@/lib/db";
import { CollegeSchema, ChecklistSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import * as z from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDecimalFieldsForClient(college: any): any {
  return {
    ...college,
    costTuition: college.costTuition ? Number(college.costTuition) : college.costTuition,
    costRoomBoard: college.costRoomBoard ? Number(college.costRoomBoard) : college.costRoomBoard,
    costFees: college.costFees ? Number(college.costFees) : college.costFees,
    costBooks: college.costBooks ? Number(college.costBooks) : college.costBooks,
    costPersonal: college.costPersonal ? Number(college.costPersonal) : college.costPersonal,
    costOther: college.costOther ? Number(college.costOther) : college.costOther,
  };
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

    const existing = await db.college.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return { error: "College not found or unauthorized" };
    }

    const { deadlineApp, deadlineFinaid, ...rest } = values;

    const college = await db.college.update({
      where: { id },
      data: {
        ...rest,
        deadlineApp: deadlineApp ? new Date(deadlineApp) : undefined,
        deadlineFinaid: deadlineFinaid ? new Date(deadlineFinaid) : undefined,
      },
      include: {
        checklist: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/college/${id}`);
    return { success: "College updated!", college };
  } catch (_error) {
    return { error: "Failed to update college" };
  }
}

export async function deleteCollege(id: string) {
  try {
    const userId = await requireAuth();

    const existing = await db.college.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return { error: "College not found or unauthorized" };
    }

    await db.college.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: "College deleted!" };
  } catch (_error) {
    return { error: "Failed to delete college" };
  }
}

export async function updateCollegeStatus(
  id: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED"
) {
  try {
    const userId = await requireAuth();

    const existing = await db.college.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return { error: "College not found or unauthorized" };
    }

    const college = await db.college.update({
      where: { id },
      data: { status },
      include: { checklist: true },
    });

    revalidatePath(`/college/${id}`);
    revalidatePath("/dashboard");
    return { success: "Status updated!", college };
  } catch (_error) {
    return { error: "Failed to update status" };
  }
}

export async function updateChecklist(
  collegeId: string,
  values: Partial<z.infer<typeof ChecklistSchema>>
) {
  try {
    const userId = await requireAuth();

    const college = await db.college.findFirst({
      where: { id: collegeId, userId },
      include: { checklist: true },
    });

    if (!college) {
      return { error: "College not found or unauthorized" };
    }

    let updatedChecklist;
    if (college.checklist) {
      updatedChecklist = await db.checklist.update({
        where: { collegeId },
        data: values,
      });
    } else {
      updatedChecklist = await db.checklist.create({
        data: {
          collegeId,
          ...values,
        },
      });
    }

    const merged = { ...college.checklist, ...updatedChecklist, ...values };

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
      await db.college.update({
        where: { id: collegeId },
        data: { status: newStatus },
      });
    }

    revalidatePath(`/college/${collegeId}`);
    revalidatePath("/dashboard");
    return { success: "Checklist updated!", checklist: updatedChecklist };
  } catch (error) {
    console.error("Update checklist error:", error);
    return { error: `Failed to update checklist: ${error instanceof Error ? error.message : String(error)}` };
  }
}
