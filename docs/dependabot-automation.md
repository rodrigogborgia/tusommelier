# Dependabot Automation Guide

## Overview

This repository uses GitHub Dependabot with automated workflows to manage dependency updates safely and efficiently. The system automatically detects, tests, and merges dependency updates according to predefined rules.

## How It Works

### 1. Automatic PR Detection & Creation
Dependabot runs on a scheduled basis (Mondays at 03:00 UTC for pip, 04:00 UTC for npm) and:
- Scans your `requirements.txt` (backend) and `package.json` (frontend) for outdated dependencies
- Creates pull requests for each update
- Limits to 10 open PRs at a time (configurable via `.github/dependabot.yml`)

### 2. CI/Test Execution
When a Dependabot PR is created:
1. **CI workflow** runs automatically (lint, pytest, coverage)
2. **E2E workflow** runs (Playwright tests for frontend)
3. **Security scan** runs (CodeQL, pip-audit, npm-audit)

### 3. Auto-Merge Logic
The `dependabot-auto-merge.yml` workflow:
- Waits for all CI checks to pass
- If tests pass ✅ → **Auto-merges** with squash strategy
- If tests fail ❌ → **Posts a comment** asking for manual review
- After merge → **Automatically deletes** the feature branch

### 4. Merge Strategy
- **Merge type**: Squash (keeps history clean)
- **Branch cleanup**: Automatic deletion after merge
- **Commit prefix**: `chore(deps):`

## Dependencies Configuration

### Python (`/backend`)
**Update types allowed to auto-merge:**
- Direct dependencies: `semver-patch`, `semver-minor`
- Indirect dependencies: `semver-patch`

**Example:** `requests 2.32.3` → `2.32.4` ✅ auto-merges

### JavaScript/TypeScript (`/my-tavus-app`)
**Update types allowed to auto-merge:**
- Direct dependencies: `semver-patch` only
- Indirect dependencies: `semver-patch` only

**Rationale:** Frontend updates can have breaking changes; patch-only auto-merge is safer. Minor/major updates require manual review.

**Example:** 
- `vite 5.0.0` → `5.0.1` ✅ auto-merges
- `vite 5.0.0` → `5.1.0` ⚠️ requires manual review

## Manual Workflow

### What to Do If CI Fails
If a Dependabot PR fails tests:
1. Check the failed workflow run in Actions
2. Review the specific failure (usually a breaking change or conflict)
3. Either:
   - Fix manually and push to the PR branch
   - Close and wait for Dependabot to re-run
   - Mark as draft while investigating

### How to Merge Manually
```bash
# If you want to merge a specific PR manually:
gh pr merge <PR_NUMBER> --squash --delete-branch
```

### How to Pause Auto-Merge
If you need to temporarily pause Dependabot:
1. Go to repository Settings > Code security and analysis
2. Disable Dependabot

Or add `@dependabot ignore this minor version` comment to pause specific package.

## Monitoring

### Check Open Dependabot PRs
```bash
# View all open Dependabot PRs
gh pr list --author=dependabot --state=open
```

### View Dependabot Activity
- Visit GitHub Actions tab → "Dependabot Updates" workflow (shows all runs)
- Visit Pull Requests tab and filter by `is:pr Author:dependabot`

## Best Practices

### ✅ Do's
- Keep auto-merge enabled for patch updates (low risk)
- Review major updates manually before merging
- Run tests locally before pushing changes that might conflict with Dependabot PRs
- Monitor the Actions tab for failed checks

### ❌ Don'ts
- Don't disable CI checks to speed up merges
- Don't merge Dependabot PRs without CI passing
- Don't auto-merge major version updates (breaking changes likely)

## Troubleshooting

### PR Not Merging Automatically
**Symptom:** Dependabot PR shows CI passed but didn't auto-merge.

**Check:**
1. Verify the PR was created by `@dependabot[bot]` (not a human)
2. Run `gh pr checks <PR_NUMBER>` to see if all checks truly passed
3. Check if branch protection rules require approvals

**Solution:**
- If branch protection requires approval, manually approve review (Settings > Branch protection)
- Or add Dependabot as an authorized reviewer in Settings

### Auto-Merge Enabled But Not Working
**Symptom:** Auto-merge is enabled on PR but merge button doesn't activate.

**Check:**
1. Repository Settings > Security > Dismiss stale PR approvals → uncheck if it's blocking
2. Verify no required reviews are pending
3. Check if "Require branches to be up to date" is enabled (may block squash merges)

## Configuration Files

### `.github/dependabot.yml`
Defines update schedule, version rules, and PR grouping.

Key settings:
- `schedule.interval`: "weekly"
- `schedule.day`: "monday"
- `allow[].update-types`: Controls which version bumps auto-merge

### `.github/workflows/dependabot-auto-merge.yml`
Implements the auto-merge logic. Triggers after CI passes.

Key jobs:
- `dependabot-metadata`: Fetches info about the PR
- `check-ci-status`: Verifies all checks passed
- `auto-merge`: Performs the actual merge & cleanup
- `notify-failure`: Comments if CI failed

## Future Enhancements

Possible improvements:
1. Add Slack/email notifications for merged updates
2. Configure auto-merge rules per package (e.g., pin express to patch-only)
3. Add automatic changelog generation from Dependabot PRs
4. Integrate with release notes to highlight security updates
