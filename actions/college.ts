"use server";

import { db } from "@/lib/db";
import { CollegeSchema, ChecklistSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import * as z from "zod";

export async function getColleges() {
  try {
    const colleges = await db.college.findMany({
      include: {
        checklist: true,
      },
      orderBy: {
        deadlineApp: "asc",
      },
    });
    return { colleges };
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
    const college = await db.college.findUnique({
      where: { id },
      include: {
        checklist: true,
      },
    });
    if (!college) {
      return { error: "College not found" };
    }
    return { college };
  } catch (error) {
    return { error: "Failed to fetch college" };
  }
}

export async function createCollege(values: z.infer<typeof CollegeSchema>) {
  const validatedFields = CollegeSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid data" };
  }

  try {
    const { deadlineApp, deadlineFinaid, ...rest } = validatedFields.data;

    const college = await db.college.create({
      data: {
        ...rest,
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
  } catch (error) {
    return { error: "Failed to update college" };
  }
}

export async function deleteCollege(id: string) {
  try {
    await db.college.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: "College deleted!" };
  } catch (error) {
    return { error: "Failed to delete college" };
  }
}

export async function updateCollegeStatus(
  id: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED"
) {
  try {
    const college = await db.college.update({
      where: { id },
      data: { status },
      include: { checklist: true },
    });

    revalidatePath(`/college/${id}`);
    revalidatePath("/dashboard");
    return { success: "Status updated!", college };
  } catch (error) {
    return { error: "Failed to update status" };
  }
}

export async function updateChecklist(
  collegeId: string,
  values: Partial<z.infer<typeof ChecklistSchema>>
) {
  try {
    const college = await db.college.findUnique({
      where: { id: collegeId },
      include: { checklist: true },
    });

    if (!college) {
      return { error: "College not found" };
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

    // Auto-transition status based on checklist state
    const merged = { ...college.checklist, ...updatedChecklist, ...values };

    // Check if all items are complete
    const allComplete =
      merged.lorTeacher &&
      merged.transcriptSent &&
      merged.testScoresSent &&
      merged.mainEssayComplete &&
      merged.finaidGreenLight &&
      (merged.essayCount === 0 || merged.supplementalEssaysCompleted >= merged.essayCount);

    let newStatus = college.status;

    // Auto-transition logic
    if (college.status === "NOT_STARTED") {
      // Any checkbox triggers IN_PROGRESS
      newStatus = "IN_PROGRESS";
    } else if (college.status === "IN_PROGRESS" && allComplete) {
      // All complete triggers SUBMITTED
      newStatus = "SUBMITTED";
    }

    // Update status if changed
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
