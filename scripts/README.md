# User Management Scripts

## 🎯 Recommended Script: `create-user`

**The all-in-one solution for user management.**

### Usage

```bash
npm run create-user <username> <passkey> [env-file]
```

### Examples

```bash
# Create user with .env.local (default)
npm run create-user "arseni" "Arseni123"

# Create user with custom env file
npm run create-user "test-user" "test123" ".env"

# Passkey with special characters (use single quotes!)
npm run create-user 'arseni' 'Arseni123!'
npm run create-user 'mom' 'My$ecr3t!'

# Alternative: escape special characters
npm run create-user "arseni" "Arseni123\!"
```

**💡 Tip**: Use **single quotes** for passkeys with special characters (`!`, `$`, `\`, etc.) to prevent shell interpretation.

### What It Does

1. ✅ Takes username and passkey as arguments
2. ✅ Hashes passkey with bcrypt (salt + pepper)
3. ✅ Gets all existing users from database
4. ✅ Tries to verify passkey against each user (uniqueness check)
5. ✅ **FAILS if passkey already exists** (prevents duplicates)
6. ✅ Creates user if passkey is unique
7. ✅ Auto-loads from .env.local (or custom env file)

### Why This Script?

**Problem**: Bcrypt generates different hashes for the same passkey (due to unique salts), so `@unique` constraint on `hashedPasskey` doesn't prevent duplicate passkeys.

**Solution**: This script verifies the passkey against ALL existing users before creating a new one, ensuring true passkey uniqueness at the application level.

### Example Output

```bash
$ npm run create-user "arseni" "Arseni123"

👤 Creating user: arseni

📁 Loaded environment variables from .env.local
🔐 Hashing passkey...
✅ Passkey hashed successfully

📊 Checking for duplicate passkeys...
   Found 2 existing users
✅ Passkey is unique

💾 Creating new user in database...
✅ User created successfully!

📝 User Details:
   Name:     arseni
   ID:       abc-123-def
   Passkey:  Arseni123
   Created:  2026-03-31T10:30:00.000Z

🎉 You can now login with these credentials!
```

### Error Cases

**Duplicate passkey:**
```bash
❌ Error: Passkey already exists!

   A user with this passkey already exists: "test-user"
   Please choose a different passkey.

💡 Tip: Passkeys must be unique across all users for security.
```

**Duplicate username:**
```bash
⚠️  Warning: User "arseni" already exists
   Updating passkey for existing user...

✅ Updated user: arseni
```

---

## 🔧 Other Scripts (Optional/Legacy)

### `hash-passkey` - Generate Hash Only

**Use when:** You need to see what a hash looks like, or manually add users via Prisma Studio.

```bash
npm run hash-passkey "myPassword123"
```

**Does NOT:**
- Check for duplicates
- Create users in database

**Use `create-user` instead** for normal user creation.

---

### `seed-users` - Create 3 Default Users

**Use when:** Initial setup, development, or testing.

```bash
npm run seed-users
```

**Creates:**
- "Test User" with passkey "test123"
- "Arseni" with passkey "Arseni123"
- "Friend" with passkey "AnyOtherPasscode1"

**Warning:** Does NOT check for duplicate passkeys. May create users with duplicate passkeys if run multiple times with different usernames.

**Use `create-user` instead** for production.

---

### `migrate-add-users` - One-Time Migration

**Use when:** Upgrading from single-user to multi-user system.

```bash
npm run migrate-add-users
```

**Does:**
- Creates "Default User" with `APP_PASSKEY` from env
- Assigns all existing colleges to Default User

**Run ONCE** during migration. Not needed for fresh installations.

---

## 📋 Recommended Workflow

### Fresh Installation

```bash
# Create your first user
npm run create-user "arseni" "Arseni123"

# Create additional users as needed
npm run create-user "test-user" "test123"
npm run create-user "friend" "friend456"
```

### Migration from Single-User

```bash
# Step 1: Run one-time migration
npm run migrate-add-users

# Step 2: Create new users
npm run create-user "arseni" "Arseni123"
npm run create-user "mom" "mom123"
```

### Add New User Later

```bash
# Just use create-user!
npm run create-user "new-user" "newPass123"
```

---

## 🔒 Security Features

All scripts implement:
- ✅ Bcrypt hashing (salt rounds = 10)
- ✅ Automatic unique salting per password
- ✅ Pepper via `PASSKEY_HASH_SECRET` (additional security layer)
- ✅ Timing-safe password comparison
- ✅ Plain passkeys never stored or logged

**`create-user` also ensures:**
- ✅ **Passkey uniqueness** across all users (application-level check)
- ✅ Prevention of duplicate passkey vulnerabilities

---

## 🛠️ Environment Variables

All scripts auto-load from `.env.local` (or custom file):

**Required:**
- `POSTGRES_PRISMA_URL` - Database connection string
- `PASSKEY_HASH_SECRET` - Secret for password hashing

**Generate secret:**
```bash
openssl rand -hex 32
```

**Add to .env.local:**
```bash
PASSKEY_HASH_SECRET=your_generated_secret_here
```

---

## 🎯 Summary

| Script | Checks Duplicates | Creates User | Use Case |
|--------|------------------|--------------|----------|
| **create-user** ✅ | ✅ Yes | ✅ Yes | **Recommended for all user creation** |
| hash-passkey | ❌ No | ❌ No | Manual hash generation only |
| seed-users | ❌ No | ✅ Yes | Quick dev setup (3 hardcoded users) |
| migrate-add-users | ❌ No | ✅ Yes | One-time migration only |

**TL;DR: Use `create-user` for everything!** 🎉
