/**
 * Create User Script
 *
 * Creates a new user with username and passkey, ensuring passkey uniqueness.
 *
 * Usage:
 *   npm run create-user <username> <passkey> [env-file]
 *   npx tsx scripts/create-user.ts <username> <passkey> [env-file]
 *
 * Examples:
 *   npm run create-user "arseni" "Arseni123"
 *   npm run create-user "test-user" "test123" ".env"
 *
 * What it does:
 *   1. Takes username and passkey as arguments
 *   2. Hashes the passkey with bcrypt
 *   3. Gets all existing users from database
 *   4. Tries to verify passkey against each user (checks for duplicates)
 *   5. Fails if passkey already exists
 *   6. Creates user if passkey is unique
 */

import { PrismaClient } from "@prisma/client";
import { hashPasskey, verifyPasskey } from "../lib/auth";
import * as dotenv from "dotenv";
import * as path from "path";

const prisma = new PrismaClient();

async function createUser() {
  // Parse arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("❌ Error: Missing required arguments");
    console.log("");
    console.log("Usage: npm run create-user <username> <passkey> [env-file]");
    console.log("");
    console.log("Examples:");
    console.log('  npm run create-user "arseni" "Arseni123"');
    console.log('  npm run create-user "test-user" "test123" ".env"');
    console.log("");
    process.exit(1);
  }

  const username = args[0];
  const passkey = args[1];
  const envFile = args[2] || ".env.local";

  console.log(`👤 Creating user: ${username}`);
  console.log("");

  // Load environment variables from specified file
  const envPath = path.resolve(process.cwd(), envFile);
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error(`❌ Error loading ${envFile}:`, result.error.message);
    console.log("");
    console.log(`Make sure ${envFile} exists and contains:`);
    console.log("  POSTGRES_PRISMA_URL=your_database_url");
    console.log("  PASSKEY_HASH_SECRET=your_secret");
    console.log("");
    process.exit(1);
  }

  console.log(`📁 Loaded environment variables from ${envFile}`);

  // Verify required environment variables
  if (!process.env.PASSKEY_HASH_SECRET) {
    console.error("❌ Error: PASSKEY_HASH_SECRET not found in environment");
    console.log("");
    console.log(`Add to ${envFile}:`);
    console.log("  PASSKEY_HASH_SECRET=$(openssl rand -hex 32)");
    console.log("");
    process.exit(1);
  }

  if (!process.env.POSTGRES_PRISMA_URL) {
    console.error("❌ Error: POSTGRES_PRISMA_URL not found in environment");
    console.log("");
    console.log(`Add to ${envFile}:`);
    console.log("  POSTGRES_PRISMA_URL=your_database_connection_string");
    console.log("");
    process.exit(1);
  }

  try {
    // Step 1: Hash the passkey
    console.log("🔐 Hashing passkey...");
    const hashedPasskey = await hashPasskey(passkey);
    console.log("✅ Passkey hashed successfully");
    console.log("");

    // Step 2: Get all existing users
    console.log("📊 Checking for duplicate passkeys...");
    const allUsers = await prisma.user.findMany();
    console.log(`   Found ${allUsers.length} existing users`);

    // Step 3: Try to verify passkey against each existing user
    let passkeyExists = false;
    let duplicateUser: string | null = null;

    for (const user of allUsers) {
      const isMatch = await verifyPasskey(passkey, user.hashedPasskey);
      if (isMatch) {
        passkeyExists = true;
        duplicateUser = user.name;
        break;
      }
    }

    // Step 4: Fail if passkey already exists
    if (passkeyExists) {
      console.log("");
      console.error(`❌ Error: Passkey already exists!`);
      console.log("");
      console.log(`   A user with this passkey already exists: "${duplicateUser}"`);
      console.log("   Please choose a different passkey.");
      console.log("");
      console.log("💡 Tip: Passkeys must be unique across all users for security.");
      console.log("");
      process.exit(1);
    }

    console.log("✅ Passkey is unique");
    console.log("");

    // Step 5: Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { name: username },
    });

    if (existingUsername) {
      console.log(`⚠️  Warning: User "${username}" already exists`);
      console.log("   Updating passkey for existing user...");
      console.log("");

      await prisma.user.update({
        where: { id: existingUsername.id },
        data: { hashedPasskey },
      });

      console.log(`✅ Updated user: ${username}`);
      console.log(`   User ID: ${existingUsername.id}`);
      console.log(`   Passkey: [REDACTED - use your passkey to login]`);
      console.log("");
      console.log("🎉 User updated successfully!");
    } else {
      // Create new user
      console.log("💾 Creating new user in database...");
      const newUser = await prisma.user.create({
        data: {
          name: username,
          hashedPasskey,
        },
      });

      console.log("✅ User created successfully!");
      console.log("");
      console.log("📝 User Details:");
      console.log(`   Name:     ${newUser.name}`);
      console.log(`   ID:       ${newUser.id}`);
      console.log(`   Passkey:  [REDACTED - use your passkey to login]`);
      console.log(`   Created:  ${newUser.createdAt.toISOString()}`);
      console.log("");
      console.log("🎉 You can now login with these credentials!");
    }

  } catch (error) {
    console.error("");
    console.error("❌ Error creating user:", error);
    console.log("");

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        console.log("💡 This might be a database constraint violation.");
        console.log("   The hashed passkey might already exist (rare case).");
      } else if (error.message.includes("connect")) {
        console.log("💡 Cannot connect to database.");
        console.log("   Check your POSTGRES_PRISMA_URL in .env.local");
      }
    }

    process.exit(1);
  }
}

createUser()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
