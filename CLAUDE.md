# CLAUDE.md

**CRITICAL: Update this file IMMEDIATELY when any feature is built, changed, or removed. Do NOT end a session with stale documentation. This includes: new routes, new pages, status changes (e.g. "omitted" → "built"), architecture changes, new tables, new endpoints, deployment state. Check this file before wrapping up.**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Standalone research instrument for Study 1: "Beneficial Friction: How AI Coaching Improves Goal Articulation and Readiness in Graduate-Educated Adults." This is a 2x2 between-subjects experiment (AI Coach x Emotional Anchoring) deployed on Prolific.

**Paper:** `Paper/paper.tex` (ACM CHI format, synced with Overleaf via git)

**This is NOT part of Edge Academia Portal.** It's an independent project with its own repo, deployment, and database.

## Current Status (as of 2026-04-08)

**Data collection complete.** N=128 completers (31-33 per cell), matching the power analysis target (G*Power: f=0.25, α=.05, power=.80, total N=128). Data is on Railway production. Analysis notebooks are in `analysis/`.

**Results section is fully drafted.** §4.1 (Sample/data quality), §4.2 (Overview), §4.3 (AI coaching effects), §4.4 (Anchoring effects), §4.5 (KGC interaction), and §4.6 (Inside the AI coaching loop) are all written, all in APA style with U/z/p/d for MWU and T/z/p/r for Wilcoxon. Every number in the Results section traces to a printed cell output in one of the four notebooks.

**Still TODO in the paper:** Abstract rewrite (still says N=400/NGSE/follow-up), Pilot study subsection, master results table at top of §4, demographics insertion in §4.1, full Discussion section, full Conclusion section.

### Outstanding paper TODOs

- Abstract still says N=400, NGSE, and 1-week follow-up — needs to match the actual study (N=128, single-item self-efficacy, no follow-up)
- Pilot study subsection (§3.x) is a TODO placeholder
- Discussion (§5) and Conclusion (§6) are TODO placeholders
- Master results table at top of §4 (TODO comment in §4.2)
- Demographics insertion in §4.1 (TODO comment)

## Study Design

Full design doc lives in the local Paper repo (see `CLAUDE.local.md`).

- **Factor A:** A1 (No AI) vs A2 (AI Coach with SMART refinement loop)
- **Factor B:** B1 (No Anchoring) vs B2 (Energy priming + pleasure/pain visioning)
- **N = 128** (32 per cell), recruited via Prolific (single study, server-side randomization)
- **Population:** Graduate-educated adults (bachelor's completed and above)
- **Session:** ~10-16 min single session, no follow-up
- **Measures:** All custom items on 1-7 scales (except KGC which is validated at 1-5)
  - Goal self-efficacy (single item, 1-7, pre/post)
  - KGC goal commitment (5 items, 1-5, pre/post) — Klein et al. 2001, items 1,2,4 reverse-coded
  - Energy (1-7, pre/post)
  - Goal clarity, readiness, helpfulness, frustration (1-7, post only)
  - Coach perception (A2 only): 3 direct 1-7 questions + 1 open-ended
  - Refinement process data (A2 only): per-round goal text, AI ratings, flagged dimensions, timestamps

## Statistical Conventions

These are the rules the paper follows. **Do not deviate without flagging it.**

- **Mann-Whitney U** for all main-effect tests (Shapiro-Wilk shows normality violated on most DVs).
- **2×2 ANOVA only for the KGC delta interaction test** (no nonparametric equivalent for an interaction term).
- **Benjamini-Hochberg FDR within families of conceptually related tests.** Families: F1 (psychological readiness × B, k=5), F3 (SMART subscales × A, k=5), F4 (LIWC goal-text × A, k=6; cogproc excluded because cause is its subcategory), F5 (vision LIWC × text type, k=3). Standalones (no correction): SMART composite, holistic, word count, frustration, session duration, self-efficacy, KGC interaction.
- **APA reporting:** MWU as `U, z, p, d`. Wilcoxon signed-rank as `T, z, p, r`. ANOVA as `F(df), p, η²ₚ`. Cohen's d (not rank-biserial). p-values capped at `p < .001`. No `+` signs on positive d values.
- KGC scale Cronbach's α: pre=.70, post=.71 (acceptable).

## Analysis

Jupyter notebooks in `analysis/` (gitignored — not in public repo). **Run in VS Code with `notebook.output.textLineLimit` set high (e.g. 500) to see full results.** Run in order: 01 → 02 → 03 → 04.

- `01_data_loading.ipynb` — Load SQLite, parse JSON, compute KGC composites, demographics, descriptives. Saves `data/analysis_clean.csv` and `data/ratings_clean.csv`.
- `02_inferential.ipynb` — Main effects on the survey DVs: psychological readiness (Family 1), standalones (frustration, word count, session duration, self-efficacy), and the 2×2 KGC interaction with simple-effect decomposition.
- `03_process_and_linguistic.ipynb` — A2 process data (rounds, exits, R1→R2 quality, dimension compliance, coach perception) and LIWC analyses (Family 4 goal-text × A, Family 5 vision manipulation check, Factor B null on goal text).
- `04_human_ratings.ipynb` — Independent human SMART ratings: inter-rater reliability, SMART composite × A, holistic × A, Family 3 subscales × A, AI vs human calibration, rounds × quality.

**Notebook convention.** Each notebook has a `## PRIMARY TEST` (or similar) markdown banner above the cell whose printed output is the paper's canonical source for that family or test. Per-DV ANOVA cells preceding the PRIMARY TEST are diagnostic only. **Numerical findings live in the notebook cell outputs, not in this file.** When the paper needs a number, read it from the executed `.ipynb` cell output, do not recompute it in a one-off script.

### LIWC Integration
Notebook 03 exports `data/goals_for_liwc.csv` (all goal texts + anchoring visions, tagged by condition and text type). Run through LIWC-22 externally, save output as `data/liwc_processed.csv`, then notebook 03 imports and analyzes. Categories analyzed: Analytic, Authentic, Tone, cogproc, achieve, focusfuture, cause, emo_pos, emo_neg.

### Data Issues
- PID 122: duplicate pre/post/goal records (page refresh). Handled by taking last per participant.
- PID 134: 1 refinement round despite mandatory revision — likely bypassed via race condition. Excluded from R1→R2 paired comparison.
- PID 138: 1 round, legitimately all-strong on first evaluation. Working as designed.

## Paper Plans

**Paper 1 (this study):** 2×2 factorial, beneficial friction concept. CHI/CSCW target. The quantitative story is the dissociation between cognitive (AI) and affective (anchoring) scaffolding. The qualitative story is the over-coaching problem and design implications for calibrating AI friction.

**Paper 2 (planned):** Iterative redesign of the AI coach based on Paper 1's qualitative findings. Lighter-touch coaching, possibly with Haiku for speed, better sense of "good enough." Could include 2-3 design iterations tested in separate studies.

## Paper (LaTeX / Overleaf)

The paper lives in `Paper/` (gitignored from this repo, has its own git tracking for Overleaf sync).

### Key Paper Files
- `Paper/paper.tex` — Main paper source (`\documentclass[manuscript,review,anonymous]{acmart}`)
- `Paper/references.bib` — Bibliography
- `Paper/docs/study1_design.md` — Full study design for Study 1
- `Paper/docs/study2_design.md` — Study 2 design (future paper)
- `Paper/context/` — Reference papers as markdown + LIWC-22 manual
- `Paper/context/CONTEXT_MAP.md` — Structured knowledge base of all cited references

### Paper Build
```bash
cd Paper && pdflatex paper.tex && bibtex paper && pdflatex paper.tex && pdflatex paper.tex
texcount Paper/paper.tex
```

### Paper Writing Style
- Target venue: **ACM CHI** (HCI community). Write for HCI researchers, not psychologists or CS theorists.
- **NEVER use em-dashes (---)** in paper text. No exceptions.
- **Avoid semicolons.** Use commas, colons, parentheses, or split into two sentences.
- Prefer simple, clear sentence structures.

### Overleaf Sync
Syncs via git. Do not force-push or rewrite history in the Paper/ folder. Only .tex and .bib files are committed to Overleaf. The `docs/`, `CLAUDE.md`, `.claude/`, and `context/` folders inside Paper/ are gitignored from Overleaf.

### Document Class Options
- **Camera-ready:** `\documentclass[sigconf]{acmart}`
- **Submission review:** `\documentclass[manuscript,review,anonymous]{acmart}` (current)
- **Author draft:** `\documentclass[sigconf,authordraft]{acmart}`

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + SurveyJS
- **Backend:** Express + better-sqlite3 + dotenv
- **AI:** OpenRouter -> Claude Sonnet 4.6 (temperature 0.3 for coaching)
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

`AiRefinementLoop` sends the goal text to `/api/ai/goal-coach`, which proxies to OpenRouter with the SMART coaching prompt from `server/ai-prompts.ts`. The AI returns structured JSON with per-dimension ratings (specific, measurable, achievable, relevant, timeBound) as strong/adequate/weak and Socratic coaching feedback. **First revision is mandatory** — participants must revise at least once before the exit option appears (exception: if all-strong on first evaluation, exit is immediate). From round 2 onward, they can exit freely. Every round is logged to `refinement_rounds`. If a participant exits before reaching "strong" overall, an `ExitReasonModal` captures why.

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
- `/followup?PROLIFIC_PID=xxx` — 1-week follow-up (built but not used in this study)
- `/complete` — Thank you + Prolific redirect (code: CGYZ74XJ)
- `/test` — Dev dashboard with condition links, follow-up launcher, admin tools
- `/api/health` — Health check
- `/api/admin/dash?password=xxx` — Data dashboard with charts and analysis variables
- `/api/admin/export?password=xxx` — Full data export (JSON)
- `/api/admin/download-db?password=xxx` — Download SQLite database file
- `/api/admin/stats?password=xxx` — Completion stats by condition
- `/api/admin/reset?password=xxx` — DELETE all data (POST, requires confirmation)
- `/api/rating/seed?password=xxx` — POST: seed rating batches from completed goals (initial/final versions)
- `/api/rating/batch?PROLIFIC_PID=xxx` — GET: get next unrated batch for a rater
- `/api/rating/submit` — POST: submit ratings for a batch

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

**CRITICAL: NEVER delete, overwrite, or modify any files in `data/`. This folder contains production study data and backups. Backup: `data/study-backup-20260405.db`.**

- **Download production DB locally:** `curl -o data/study.db "https://launchpad-study-production.up.railway.app/api/admin/download-db?password=launchpad-admin-2026"`
- **Download JSON export:** `curl -o data/production-export.json "https://launchpad-study-production.up.railway.app/api/admin/export?password=launchpad-admin-2026"`
- **Seed local DB with synthetic data:** `npx tsx server/seed-synthetic.ts`
- Production DB is SQLite at `/app/data/study.db` on Railway (persistent volume)
- For analysis: download DB to `data/study.db`, run notebooks in order (01 → 02 → 03)

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

SQLite via better-sqlite3. Tables: `participants`, `survey_responses`, `goals`, `refinement_rounds`, `anchoring`, `followup_responses`, `rating_batches`, `rating_batch_goals`, `rating_responses`. Schema in `server/db.ts`.

**Critical:** The `refinement_rounds` table logs every AI coaching iteration — goal text, AI feedback, dimension ratings (strong/adequate/weak), flagged dimension, timestamps. This is the primary process data for the paper.

## Deployment

Railway project "adorable-flexibility", service "launchpad-study". Docker two-stage build (node:20-alpine). Persistent volume mounted at `/app/data`. Auto-deploys from `main` branch on GitHub push. Port 8080 in production (Railway proxy handles HTTPS on 443).

## Prolific Integration

- **Single Prolific study** with server-side randomization — no need for separate studies per cell
- Prolific URL: `https://launchpad-study-production.up.railway.app/study?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}`
- Completion code: `CGYZ74XJ`
- Screeners: English primary language, 95-100% approval, 200+ submissions, UK/US/IE/AU/CA/NZ
- Education filter: undergraduate degree and above
- Follow-up is a separate Prolific study (not used in this study)

## GitHub

Public repo at `SHosio/launchpad-study` (research transparency — reviewers need to inspect the instrument).
