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
    return { error: "Failed to fetch colleges" };
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
    return { error: "Failed to create college" };
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

    if (college.checklist) {
      const checklist = await db.checklist.update({
        where: { collegeId },
        data: values,
      });
      revalidatePath(`/college/${collegeId}`);
      return { success: "Checklist updated!", checklist };
    } else {
      const checklist = await db.checklist.create({
        data: {
          collegeId,
          ...values,
        },
      });
      revalidatePath(`/college/${collegeId}`);
      return { success: "Checklist created!", checklist };
    }
  } catch (error) {
    return { error: "Failed to update checklist" };
  }
}
