import { PrismaClient } from "@prisma/client";
import { hashPasskey } from "./auth";
import * as dotenv from "dotenv";

// Load .env.local if not already loaded
if (!process.env.PASSKEY_HASH_SECRET) {
  const result = dotenv.config({ path: ".env.local" });
  if (result.parsed) {
    console.log("📁 Loaded environment variables from .env.local");
  }
}

const prisma = new PrismaClient();

/**
 * Seed initial users with hashed passkeys
 * Usage: npm run seed-users
 */
async function seedUsers() {
  console.log("🌱 Seeding users...");

  // Check if PASSKEY_HASH_SECRET is set
  if (!process.env.PASSKEY_HASH_SECRET) {
    console.error("❌ Error: PASSKEY_HASH_SECRET environment variable is required");
    console.log("   Add it to .env.local:");
    console.log("   echo \"PASSKEY_HASH_SECRET=$(openssl rand -hex 32)\" >> .env.local");
    process.exit(1);
  }

  const users = [
    { name: "Test User", passkey: "test123" },
    { name: "Arseni", passkey: "Arseni123" },
    { name: "Friend", passkey: "AnyOtherPasscode1" },
  ];

  for (const userData of users) {
    try {
      // Hash the passkey
      const hashedPasskey = await hashPasskey(userData.passkey);

      // Upsert user (create or update)
      const user = await prisma.user.upsert({
        where: { hashedPasskey },
        update: { name: userData.name },
        create: {
          name: userData.name,
          hashedPasskey,
        },
      });

      console.log(`✅ User created/updated: ${user.name} (ID: ${user.id})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.name}:`, error);
    }
  }

  console.log("🎉 Seeding complete!");
}

seedUsers()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
