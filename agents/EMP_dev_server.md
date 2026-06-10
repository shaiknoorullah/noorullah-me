---
name: noorullah-me-dev-server
description: "noorullah.me — Astro dev server host (bun run dev) for live iteration, HMR, and visual-test target"
working_directory: ${REPO_ROOT}
launcher: bun
launcher_args:
  - run
  - dev
---

# NOORULLAH-ME DEV SERVER

**Project:** noorullah-me (personal site, `next-rewrite` branch)
**Launcher:** `bun run dev`
**Working directory:** `${REPO_ROOT}` (resolves to `~/code/noorullah-me/`)

## Mandate

Run the Astro dev server inside a dedicated `agent-noorullah-me-dev-server` tmux session so:

- Build/visual-test agents can hit a stable `http://localhost:4321` (or configured port) without owning the process.
- HMR + console + network logs remain reattachable across Claude Code sessions (`tmux attach -t agent-noorullah-me-dev-server`).
- The dev server survives orchestrator restarts and is observable via `tmux capture-pane`.

## Operating rules

- Bun-only. Never invoke `npm`, `yarn`, or `pnpm` from this agent — the launcher is hard-pinned to `bun`.
- Do not run typecheck, lint, or build from this agent. Those are separate gates in the workflow.
- Do not modify source files. This agent is a long-running process host, not an editor.
- Restart only via `agent-manager` (`stop` then `start`); never `--force kill` the tmux session unless explicitly instructed.
- The companion `EMP_visual_test_browser.md` agent depends on this server being up — start this one first.

## Usage

```bash
# Start (idempotent — agent-manager skips if running)
python3 ~/.claude/skills/agent-manager/scripts/main.py start noorullah-me-dev-server

# Observe
tmux attach -t agent-noorullah-me-dev-server
tmux capture-pane -p -t agent-noorullah-me-dev-server

# Stop
python3 ~/.claude/skills/agent-manager/scripts/main.py stop noorullah-me-dev-server
```
