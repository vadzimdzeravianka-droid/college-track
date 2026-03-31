/**
 * Data Migration Script: Add Users and Migrate Existing Colleges
 *
 * This script:
 * 1. Creates a default user with hashed APP_PASSKEY
 * 2. Assigns all existing colleges to that default user
 * 3. Prepares for making userId required
 *
 * Run AFTER schema is updated but BEFORE making userId required
 *
 * Usage: npx ts-node scripts/migrate-add-users.ts
 */

import { PrismaClient } from "@prisma/client";
import { hashPasskey } from "../lib/auth";

const prisma = new PrismaClient();

async function migrateAddUsers() {
  console.log("🔄 Starting data migration: Add Users");
  console.log("");

  // Step 1: Verify environment variables
  if (!process.env.APP_PASSKEY) {
    console.error("❌ Error: APP_PASSKEY environment variable is required");
    process.exit(1);
  }

  if (!process.env.PASSKEY_HASH_SECRET) {
    console.error("❌ Error: PASSKEY_HASH_SECRET environment variable is required");
    process.exit(1);
  }

  try {
    // Step 2: Create default user
    console.log("📝 Step 1: Creating default user...");
    const hashedPasskey = await hashPasskey(process.env.APP_PASSKEY);

    const defaultUser = await prisma.user.upsert({
      where: { hashedPasskey },
      update: {},
      create: {
        name: "Default User",
        hashedPasskey,
      },
    });

    console.log(`✅ Default user created: ${defaultUser.name} (ID: ${defaultUser.id})`);
    console.log("");

    // Step 3: Check all colleges
    const allColleges = await prisma.college.findMany({
      select: { id: true, userId: true },
    });

    const collegesWithoutUser = allColleges.filter((c) => !c.userId);

    console.log(`📊 Found ${allColleges.length} total colleges`);
    console.log(`📊 Found ${collegesWithoutUser.length} colleges without userId`);
    console.log("");

    if (collegesWithoutUser.length > 0) {
      // Step 4: Assign colleges to default user
      console.log("🔗 Step 2: Assigning colleges to default user...");

      for (const college of collegesWithoutUser) {
        await prisma.college.update({
          where: { id: college.id },
          data: { userId: defaultUser.id },
        });
      }

      console.log(`✅ Assigned ${collegesWithoutUser.length} colleges to default user`);
    } else {
      console.log("ℹ️  No colleges to migrate (all already have userId)");
    }

    console.log("");
    console.log("✅ Migration completed successfully!");
    console.log("");
    console.log("📝 Next steps:");
    console.log("   1. Verify data in Prisma Studio: npx prisma studio");
    console.log("   2. All existing colleges should be assigned to 'Default User'");
    console.log("   3. You can now make userId required in schema if needed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateAddUsers()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
