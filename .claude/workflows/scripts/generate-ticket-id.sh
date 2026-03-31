#!/bin/bash

# Generate next sequential ticket ID in format T{5 alphanumeric chars}
# Uses base36 encoding (0-9A-Z) for lexicographic sorting
# Example sequence: T00000, T00001, ..., T0000Z, T00010, ..., TZZZZZ

set -e

# Base36 conversion functions
base36_to_decimal() {
  local base36=$1
  local decimal=0
  local len=${#base36}

  for (( i=0; i<len; i++ )); do
    local char="${base36:$i:1}"
    local value

    if [[ "$char" =~ [0-9] ]]; then
      value=$char
    else
      # A=10, B=11, ..., Z=35
      value=$(printf "%d" "'$char")
      value=$((value - 55))  # 'A' is ASCII 65, 65-55=10
    fi

    decimal=$((decimal * 36 + value))
  done

  echo "$decimal"
}

decimal_to_base36() {
  local decimal=$1
  local base36=""
  local chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  if [ "$decimal" -eq 0 ]; then
    echo "00000"
    return
  fi

  while [ "$decimal" -gt 0 ]; do
    local remainder=$((decimal % 36))
    base36="${chars:$remainder:1}${base36}"
    decimal=$((decimal / 36))
  done

  # Pad to 5 characters
  printf "%05s" "$base36" | tr ' ' '0'
}

# Find all existing ticket IDs with pattern T[0-9A-Z]{5} at start of filename
TICKET_DIR=".claude/workflows/tickets"
EXISTING_IDS=$(find "$TICKET_DIR" -name "T[0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z]-*.md" -type f -exec basename {} \; 2>/dev/null | grep -oE '^T[0-9A-Z]{5}' | sort -r | head -1)

if [ -z "$EXISTING_IDS" ]; then
  # No existing tickets, start from T00000
  echo "T00000"
  exit 0
fi

# Extract the last ticket ID (highest in sort order)
LAST_ID="$EXISTING_IDS"

# Remove 'T' prefix to get the numeric part
LAST_NUM="${LAST_ID:1}"

# Convert base36 to decimal
DECIMAL=$(base36_to_decimal "$LAST_NUM")

# Increment
NEXT_DECIMAL=$((DECIMAL + 1))

# Convert back to base36
NEXT_BASE36=$(decimal_to_base36 "$NEXT_DECIMAL")

# Add prefix
echo "T${NEXT_BASE36}"
