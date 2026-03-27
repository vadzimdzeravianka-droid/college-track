"use server";

import { db } from "@/lib/db";
import { CollegeSchema, ChecklistSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Helper to convert Decimal to number for Client Components
function serializeCollege(college: any): any {
  const serialized = { ...college };

  // Convert all Decimal fields to numbers
  if (serialized.costTuition instanceof Decimal) {
    serialized.costTuition = serialized.costTuition.toNumber();
  }
  if (serialized.costRoomBoard instanceof Decimal) {
    serialized.costRoomBoard = serialized.costRoomBoard.toNumber();
  }
  if (serialized.costFees instanceof Decimal) {
    serialized.costFees = serialized.costFees.toNumber();
  }
  if (serialized.costBooks instanceof Decimal) {
    serialized.costBooks = serialized.costBooks.toNumber();
  }
  if (serialized.costPersonal instanceof Decimal) {
    serialized.costPersonal = serialized.costPersonal.toNumber();
  }
  if (serialized.costOther instanceof Decimal) {
    serialized.costOther = serialized.costOther.toNumber();
  }

  return serialized;
}

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

    // Serialize Decimal fields to numbers for Client Components
    const serializedColleges = colleges.map(serializeCollege);

    return { colleges: serializedColleges };
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

    // Serialize Decimal fields to numbers for Client Components
    const serializedCollege = serializeCollege(college);

    return { college: serializedCollege };
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
