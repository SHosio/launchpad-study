# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Standalone research instrument for Study 1: "Beneficial Friction: How AI Coaching Improves Goal Articulation and Readiness in Early-Career Academics." This is a 2x2 between-subjects experiment (AI Coach x Emotional Anchoring) deployed on Prolific.

**This is NOT part of Edge Academia Portal.** It's an independent project with its own repo, deployment, and database. The production LaunchPad tool at portal.edgeacademia.com is a separate private project.

## Study Design

Full design doc: `/Users/simohosio/Documents/Academic/Papers/Launchpad/docs/study1_design.md`

- **Factor A:** A1 (No AI) vs A2 (AI Coach with SMART refinement loop)
- **Factor B:** B1 (No Anchoring) vs B2 (Energy priming + pleasure/pain visioning)
- **N = 200** (50 per cell), recruited via Prolific
- **Session:** ~15-25 min single session + separate 1-week follow-up study
- **Measures:** NGSE (self-efficacy), KGC (goal commitment), goal clarity, activation, objective goal quality (human-rated), refinement process data (A2 only), coach perception (A2 only)

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + SurveyJS
- **Backend:** Express + better-sqlite3
- **AI:** OpenRouter -> Claude Sonnet (temperature 0.3 for coaching)
- **Deploy:** Railway + Docker, persistent volume for SQLite at `/app/data`
- **Package manager:** bun

## Commands

```bash
bun install            # Install dependencies
bun run dev            # Start both Vite (3000) + Express (3001) concurrently
bun run dev:server     # Start Express only
bun run build          # Build frontend + compile server
bun run start          # Run production server (serves built frontend)
```

No test runner or linter is configured.

## Architecture

### Session Flow (StudyPage.tsx)

`StudyPage` is a state machine that orchestrates the entire participant session. The step sequence adapts based on condition assignment:

```
demographics -> pre_measure -> [priming -> priming_compliance]? -> goal_writing -> [coaching]? -> [anchoring]? -> post_measure -> /complete
                                       ^^ B2 only                                  ^^ A2 only     ^^ B2 only
```

Conditions are passed via URL params (`condition_a`, `condition_b`). Each step transition calls `api.updateStatus()` to track progress server-side.

### AI Coaching Loop (A2 conditions only)

`AiRefinementLoop` sends the goal text to `/api/ai/goal-coach`, which proxies to OpenRouter with the SMART coaching prompt from `server/ai-prompts.ts`. The AI returns structured JSON with per-dimension ratings (specific, measurable, achievable, relevant, timeBound) and coaching feedback. Participants can revise and re-submit indefinitely. Every round is logged to `refinement_rounds` — this is the primary process data for the paper. If a participant exits before reaching "strong" overall, an `ExitReasonModal` captures why.

### Data Flow

Frontend (`src/lib/api.ts`) -> Express routes (`server/routes/`) -> SQLite (`server/db.ts`). All survey data stored as JSON blobs in `responses_json` columns. The `survey_type` discriminator on `survey_responses` distinguishes pre/post/priming_compliance/followup.

### Dual TypeScript Configs

- `tsconfig.json` — frontend (Vite, `src/`), uses `@/*` path alias for `./src/*`
- `tsconfig.server.json` — backend (`server/`), outputs to `dist-server/`

Build command compiles both: `vite build && tsc -p tsconfig.server.json`.

## Routes

- `/study?PROLIFIC_PID=xxx&condition_a=A2&condition_b=B2` — Main session
- `/followup?PROLIFIC_PID=xxx` — 1-week follow-up (separate Prolific study)
- `/complete` — Thank you + Prolific redirect
- `/api/health` — Health check
- `/api/admin/export?password=xxx` — Full data export (JSON)
- `/api/admin/stats?password=xxx` — Completion stats by condition

### Local Dev Testing URLs

```
http://localhost:3000/study?PROLIFIC_PID=test1&condition_a=A1&condition_b=B1  # Control
http://localhost:3000/study?PROLIFIC_PID=test2&condition_a=A2&condition_b=B1  # AI only
http://localhost:3000/study?PROLIFIC_PID=test3&condition_a=A1&condition_b=B2  # Anchoring only
http://localhost:3000/study?PROLIFIC_PID=test4&condition_a=A2&condition_b=B2  # Both
```

## Environment Variables

```
OPENROUTER_API_KEY=     # Required for AI coaching (A2 conditions)
ADMIN_PASSWORD=         # Required for /api/admin/* routes
PORT=3001               # Express server port
DATABASE_PATH=./data/study.db
```

## Database

SQLite via better-sqlite3. Tables: `participants`, `survey_responses`, `goals`, `refinement_rounds`, `anchoring`, `followup_responses`. Schema in `server/db.ts`.

**Critical:** The `refinement_rounds` table logs every AI coaching iteration — goal text, AI feedback, dimension ratings, flagged dimension, timestamps. This is the primary process data for the paper.

## Deployment

Railway with Docker. The Dockerfile does a two-stage build (node:20-alpine). **Must** mount a persistent volume at `/app/data` or the SQLite DB is lost on redeploy.

## Prolific Integration

- Prolific passes `PROLIFIC_PID`, `STUDY_ID`, `SESSION_ID` via URL params automatically
- Condition assignment (`condition_a`, `condition_b`) is set in the Prolific study URL — one URL per cell
- Follow-up is a separate Prolific study, matched by `PROLIFIC_PID`
- `CompletePage.tsx` has a `STUDY_COMPLETION_CODE` placeholder — replace with actual Prolific code before launch

## GitHub

This will be a **public repo** (research transparency — reviewers need to inspect the instrument).
