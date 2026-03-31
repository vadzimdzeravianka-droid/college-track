#!/bin/bash

# Generate a bcrypt hash for a passkey
# Usage: ./scripts/hash-passkey.sh <passkey>
# Example: ./scripts/hash-passkey.sh "mySecretPass123"

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <passkey>"
  echo "Example: $0 'mySecretPass123'"
  exit 1
fi

PASSKEY="$1"

# Check if PASSKEY_HASH_SECRET is set
if [ -z "$PASSKEY_HASH_SECRET" ]; then
  echo "❌ Error: PASSKEY_HASH_SECRET environment variable is not set"
  echo ""
  echo "Please set it in your shell:"
  echo "  export PASSKEY_HASH_SECRET='your-secret-here'"
  echo ""
  echo "Or source from .env.local:"
  echo "  source .env.local && export PASSKEY_HASH_SECRET"
  echo ""
  echo "Generate a secret with: openssl rand -hex 32"
  exit 1
fi

# Create a temporary Node.js script to hash the passkey
NODE_SCRIPT=$(cat << 'EOF'
const bcrypt = require('bcrypt');

const passkey = process.argv[1];
const secret = process.env.PASSKEY_HASH_SECRET;
const saltRounds = 10;

// Add pepper (secret) to passkey
const pepperedPasskey = passkey + secret;

// Generate bcrypt hash
bcrypt.hash(pepperedPasskey, saltRounds)
  .then(hash => {
    console.log(hash);
  })
  .catch(err => {
    console.error('❌ Error generating hash:', err.message);
    process.exit(1);
  });
EOF
)

echo "🔐 Generating bcrypt hash for passkey..."
echo ""

# Run Node.js script with passkey as argument
HASH=$(node -e "$NODE_SCRIPT" "$PASSKEY")

if [ -z "$HASH" ]; then
  echo "❌ Failed to generate hash"
  exit 1
fi

echo "✅ Hash generated successfully!"
echo ""
echo "Passkey: $PASSKEY"
echo "Hash:    $HASH"
echo ""
echo "📝 To add this user to the database:"
echo "   1. Open Prisma Studio: npx prisma studio"
echo "   2. Go to 'users' table"
echo "   3. Add new record with name and this hashed_passkey"
echo ""
echo "Or update lib/seed-users.ts and run: npm run seed-users"
