#!/bin/bash

# Git Branch Utilities for Feature Branch Workflow
# Source this file: source .claude/workflows/lib/git-branch-utils.sh

# Get current branch name
get_current_branch() {
  git branch --show-current
}

# Check if on main branch
is_on_main() {
  local branch=$(get_current_branch)
  [[ "$branch" == "main" ]] || [[ "$branch" == "master" ]]
}

# Create feature branch from ticket ID
create_feature_branch() {
  local ticket_id="$1"
  local branch_type="${2:-feature}" # feature, fix, config, refactor

  if [[ -z "$ticket_id" ]]; then
    echo "Error: Ticket ID required"
    return 1
  fi

  local branch_name="${branch_type}/${ticket_id}"

  echo "🌿 Creating feature branch: $branch_name"

  # Ensure we're on main and up to date
  git checkout main
  git pull --ff-only origin main 2>/dev/null || true

  # Create and checkout feature branch
  git checkout -b "$branch_name"

  echo "✅ Feature branch created: $branch_name"
  echo "   You can now implement on this isolated branch"
}

# Get ticket ID from current branch
get_ticket_from_branch() {
  local branch=$(get_current_branch)
  echo "$branch" | sed -E 's/^(feature|fix|config|refactor)\///'
}

# Determine branch type from ticket
get_branch_type() {
  local ticket_id="$1"

  # Parse ticket ID to determine type
  if [[ "$ticket_id" =~ ^CONFIG- ]]; then
    echo "config"
  elif [[ "$ticket_id" =~ ^FIX- ]] || [[ "$ticket_id" =~ ^BUGFIX- ]]; then
    echo "fix"
  elif [[ "$ticket_id" =~ ^REFACTOR- ]]; then
    echo "refactor"
  else
    echo "feature"
  fi
}
