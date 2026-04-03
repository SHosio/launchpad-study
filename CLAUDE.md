# CLAUDE.md

**Self-reminder: Update this file after any key changes to flow, measures, routes, or architecture.**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Standalone research instrument for Study 1: "Beneficial Friction: How AI Coaching Improves Goal Articulation and Readiness." This is a 2x2 between-subjects experiment (AI Coach x Emotional Anchoring) deployed on Prolific.

**This is NOT part of Edge Academia Portal.** It's an independent project with its own repo, deployment, and database. The production LaunchPad tool at portal.edgeacademia.com is a separate private project.

## Study Design

Full design doc: `/Users/simohosio/Documents/Academic/Papers/Launchpad/docs/study1_design.md`

- **Factor A:** A1 (No AI) vs A2 (AI Coach with SMART refinement loop)
- **Factor B:** B1 (No Anchoring) vs B2 (Energy priming + pleasure/pain visioning)
- **N = 200** (50 per cell), recruited via Prolific (single study, server-side randomization)
- **Population:** Master's/doctorate students and graduates (broadened from early-career academics)
- **Session:** ~15-25 min single session + separate 1-week follow-up study
- **Measures:** All custom items on 1-7 scales (except KGC which is validated at 1-5)
  - Goal self-efficacy (single item, 1-7, three time points)
  - KGC (goal commitment, 5 items, 1-5, three time points)
  - Energy (1-7), goal clarity (1-7), readiness (1-7) — post only
  - Process experience: helpfulness (1-7), frustration (1-7)
  - Coach perception (A2 only): 3 direct 1-7 questions + 1 open-ended
  - Refinement process data (A2 only): per-round goal text, AI ratings, flagged dimensions, timestamps
  - Goal recall (two-step numeric, follow-up only)

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + SurveyJS
- **Backend:** Express + better-sqlite3 + dotenv
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
npx tsx server/seed-synthetic.ts  # Seed local DB with synthetic data (for dashboard testing)
```

No test runner or linter is configured.

## Architecture

### Condition Assignment

Server-side balanced randomization in `server/routes/participants.ts`. When a new participant arrives without a `v` param, the server assigns them to the cell with fewest "active" participants (completed OR started within last 45 minutes). Abandoned sessions free up their slot. The `v` URL param overrides for manual testing.

### Session Flow (StudyPage.tsx)

`StudyPage` is a state machine that orchestrates the entire participant session. The step sequence adapts based on condition assignment:

```
demographics -> goal_readiness_gate -> pre_measure -> [priming -> priming_compliance]? -> goal_writing -> [coaching]? -> [anchoring]? -> post_measure -> /complete
                                                              ^^ B2 only                                  ^^ A2 only     ^^ B2 only
```

Pre-measure (self-efficacy + KGC + energy) comes after the goal readiness gate so participants have a goal in mind when answering commitment questions.

### AI Coaching Loop (A2 conditions only)

`AiRefinementLoop` sends the goal text to `/api/ai/goal-coach`, which proxies to OpenRouter with the SMART coaching prompt from `server/ai-prompts.ts`. The AI returns structured JSON with per-dimension ratings (specific, measurable, achievable, relevant, timeBound) as strong/adequate/weak and Socratic coaching feedback. **First revision is mandatory** — participants must revise at least once before the exit option appears. From round 2 onward, they can exit freely. Every round is logged to `refinement_rounds`. If a participant exits before reaching "strong" overall, an `ExitReasonModal` captures why.

### URL Param Obfuscation

Condition codes use opaque `v` parameter instead of `condition_a`/`condition_b`:
- `xR7qL` = A1×B1 (Control)
- `mK3wP` = A2×B1 (AI Only)
- `vN8jT` = A1×B2 (Anchoring Only)
- `pQ5cY` = A2×B2 (AI+Anchoring)

Mapping defined in `src/lib/conditions.ts`.

### Data Flow

Frontend (`src/lib/api.ts`) -> Express routes (`server/routes/`) -> SQLite (`server/db.ts`). All survey data stored as JSON blobs in `responses_json` columns. The `survey_type` discriminator on `survey_responses` distinguishes pre/post/priming_compliance/followup.

### Dual TypeScript Configs

- `tsconfig.json` — frontend (Vite, `src/`), uses `@/*` path alias for `./src/*`
- `tsconfig.server.json` — backend (`server/`), outputs to `dist-server/`

Build command compiles both: `vite build && tsc -p tsconfig.server.json`.

## Routes

- `/study` — Main session (server auto-assigns condition)
- `/study?v=xR7qL` — Main session with manual condition override
- `/followup?PROLIFIC_PID=xxx` — 1-week follow-up (separate Prolific study)
- `/complete` — Thank you + Prolific redirect
- `/test` — Dev dashboard with condition links, follow-up launcher, admin tools
- `/api/health` — Health check
- `/api/admin/dash?password=xxx` — Data dashboard with charts and analysis variables
- `/api/admin/export?password=xxx` — Full data export (JSON)
- `/api/admin/stats?password=xxx` — Completion stats by condition
- `/api/admin/reset?password=xxx` — DELETE all data (POST, requires confirmation)

### Production URLs

```
https://launchpad-study-production.up.railway.app/study              # Auto-randomized (Prolific URL)
https://launchpad-study-production.up.railway.app/test               # Test dashboard
https://launchpad-study-production.up.railway.app/api/admin/dash?password=launchpad-admin-2026   # Data dashboard
https://launchpad-study-production.up.railway.app/api/admin/stats?password=launchpad-admin-2026  # Quick stats
https://launchpad-study-production.up.railway.app/api/admin/export?password=launchpad-admin-2026 # Full JSON export
https://launchpad-study-production.up.railway.app/api/admin/download-db?password=launchpad-admin-2026  # Download SQLite DB
```

### Data Access

- **Download production DB locally:** `curl -o data/production-study.db "https://launchpad-study-production.up.railway.app/api/admin/download-db?password=launchpad-admin-2026"`
- **Download JSON export:** `curl -o data/production-export.json "https://launchpad-study-production.up.railway.app/api/admin/export?password=launchpad-admin-2026"`
- **Seed local DB with synthetic data:** `npx tsx server/seed-synthetic.ts`
- Production DB is SQLite at `/app/data/study.db` on Railway (persistent volume)

### Local Dev Testing URLs

```
http://localhost:3000/study                                          # Auto-randomized
http://localhost:3000/study?PROLIFIC_PID=test1&v=xR7qL              # Control
http://localhost:3000/study?PROLIFIC_PID=test2&v=mK3wP              # AI only
http://localhost:3000/study?PROLIFIC_PID=test3&v=vN8jT              # Anchoring only
http://localhost:3000/study?PROLIFIC_PID=test4&v=pQ5cY              # AI+Anchoring
http://localhost:3000/test                                          # Test dashboard
http://localhost:3000/api/admin/dash?password=launchpad-admin-2026  # Data dashboard
```

## Environment Variables

```
OPENROUTER_API_KEY=     # Required for AI coaching (A2 conditions)
ADMIN_PASSWORD=         # Required for /api/admin/* routes
PORT=3001               # Express server port (Railway uses 8080)
DATABASE_PATH=./data/study.db
```

## Database

SQLite via better-sqlite3. Tables: `participants`, `survey_responses`, `goals`, `refinement_rounds`, `anchoring`, `followup_responses`. Schema in `server/db.ts`.

**Critical:** The `refinement_rounds` table logs every AI coaching iteration — goal text, AI feedback, dimension ratings (strong/adequate/weak), flagged dimension, timestamps. This is the primary process data for the paper.

## Deployment

Railway project "adorable-flexibility", service "launchpad-study". Docker two-stage build (node:20-alpine). Persistent volume mounted at `/app/data`. Auto-deploys from `main` branch on GitHub push. Port 8080 in production (Railway proxy handles HTTPS on 443).

## Prolific Integration

- **Single Prolific study** with server-side randomization — no need for separate studies per cell
- Prolific URL: `https://launchpad-study-production.up.railway.app/study` (Prolific appends `PROLIFIC_PID`, `STUDY_ID`, `SESSION_ID` automatically)
- Follow-up is a separate Prolific study, matched by `PROLIFIC_PID`
- `CompletePage.tsx` has a `STUDY_COMPLETION_CODE` placeholder — replace with actual Prolific code before launch

## GitHub

Public repo at `SHosio/launchpad-study` (research transparency — reviewers need to inspect the instrument).
