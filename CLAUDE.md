# CLAUDE.md

**CRITICAL: Update this file IMMEDIATELY when any feature is built, changed, or removed. Do NOT end a session with stale documentation. This includes: new routes, new pages, status changes (e.g. "omitted" → "built"), architecture changes, new tables, new endpoints, deployment state. Check this file before wrapping up.**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Standalone research instrument for Study 1: "Beneficial Friction: How AI Coaching Improves Goal Articulation and Readiness in Graduate-Educated Adults." This is a 2x2 between-subjects experiment (AI Coach x Emotional Anchoring) deployed on Prolific.

**Paper:** `Paper/paper.tex` (ACM CHI format, synced with Overleaf via git)

**This is NOT part of Edge Academia Portal.** It's an independent project with its own repo, deployment, and database.

## Current Status (as of April 2026)

**Data collection complete.** N=128 completers (31-33 per cell), matching the power analysis target (G*Power: f=0.25, α=.05, power=.80, total N=128). Data is on Railway production. Analysis notebooks are in `analysis/`.

### Key Decisions Made During This Session

1. **Population broadened** from "early-career academics" to "graduate-educated adults" (master's/doctorate enrolled or completed + bachelor's). Prolific screener: English primary language, 95-100% approval rate, 200+ submissions, anglophone countries.

2. **1-week follow-up omitted.** Self-efficacy was null at two time points; a third null measurement adds no value. Follow-up saved for Paper 2 (iterative AI coach redesign).

3. **Human goal quality rating system built and seeded on production.** Batched Prolific rating task (`server/routes/rating.ts`). 1-5 SMART rubric + holistic, batches of 8 goals, 5 raters per batch. Initial (A2 only) and final goals mixed in same batches — constraint ensures no rater sees both versions from the same participant. **Seeded:** 191 goals (128 final + 63 initial), 24 batches, 120 rater slots. **Remaining:** create Prolific study for raters, completion code `RATE_COMPLETE_2026`.

4. **Power analysis revised.** Original design doc said N=200 (50/cell), paper draft had N=400 (100/cell). Final: N=128 (32/cell) based on G*Power for medium effect f=0.25. Justified as minimum practically meaningful threshold for design implications.

5. **Coach perception items changed** from 1-5 agree/disagree statements to 1-7 direct questions to match all other custom scales. Dashboard labels updated to match.

6. **Priming compliance open-ended dropped** ("What did you do to prepare yourself?"). Only the energization scale remains. Reduces friction in the B2 flow.

7. **AI coaching prompt tightened.** Socratic tone, stricter rating calibration ("adequate" is the default for first drafts, "strong" reserved for genuinely precise goals). Mandatory first revision before exit option appears.

### Paper vs Code Discrepancies to Resolve

The paper.tex has several items that don't match the current implementation:

- **Abstract says N=400** — needs updating to N=128
- **Abstract mentions NGSE** — we use single-item self-efficacy, not the 8-item NGSE scale
- **Abstract mentions 1-week follow-up** — omitted from this study
- **Coach perception section says 5-point Likert agree/disagree** — code uses 1-7 direct questions
- **Participants section says "master's degree or currently enrolled in master's/doctoral"** — we also accept bachelor's completers
- **Pilot study section** is a TODO placeholder
- **Results/Discussion/Conclusion** are all TODO placeholders
- **Prolific completion code** is set to `CGYZ74XJ` in CompletePage.tsx

## Study Design

Full design doc: `/Users/simohosio/Documents/Academic/Papers/Launchpad/docs/study1_design.md`

- **Factor A:** A1 (No AI) vs A2 (AI Coach with SMART refinement loop)
- **Factor B:** B1 (No Anchoring) vs B2 (Energy priming + pleasure/pain visioning)
- **N = 128** (32 per cell), recruited via Prolific (single study, server-side randomization)
- **Population:** Graduate-educated adults (bachelor's completed and above)
- **Session:** ~10-16 min single session, no follow-up
- **Measures:** All custom items on 1-7 scales (except KGC which is validated at 1-5)
  - Goal self-efficacy (single item, 1-7, pre/post)
  - KGC goal commitment (5 items, 1-5, pre/post) — Klein et al. 2001, items 1,2,4 reverse-coded
  - Energy (1-7, pre/post)
  - Goal clarity (1-7, post only)
  - Readiness (1-7, post only)
  - Process helpfulness (1-7, post only)
  - Process frustration (1-7, post only)
  - Coach perception (A2 only): 3 direct 1-7 questions + 1 open-ended
  - Refinement process data (A2 only): per-round goal text, AI ratings, flagged dimensions, timestamps

## Significant Findings at N=128

### Factor A — AI Coaching:
- **Frustration:** F=19.10, p<.0001, d=0.77, η²=.13 (A2: 3.30 vs A1: 2.00)
- **Final word count:** F=25.67, p<.0001, d=0.90, η²=.17 (A2: 95 vs A1: 51 words)
- **Session duration:** F=15.14, p=.0002, d=0.78 (A2: 16 min vs A1: 10.5 min)
- **A2 word count doubles within-person:** 51→95, Wilcoxon p<.0001
- **All 5 SMART dimensions improve R1→R2** (all p<.015, n=61 paired)
- **Text features:** dates 40%→87% (χ²=28.8, p<.0001), numbers 69%→95% (χ²=13.0, p=.0003), deadline words 45%→86% (χ²=21.9, p<.0001)
- Self-efficacy: NULL (d=-0.13)

### Factor B — Anchoring:
- **Goal clarity:** F=6.34, p=.013, d=0.45 (B2: 6.34 vs B1: 5.92)
- **KGC commitment change:** F=5.05, p=.026, d=0.39 (B2: Δ=0.21 vs B1: Δ=0.06)
- **Energy change:** F=7.50, p=.007, d=0.48
- **Process helpfulness:** F=6.57, p=.012, d=0.45
- **Readiness:** F=3.90, p=.050, d=0.35 (marginal)
- **Priming manipulation check:** 5.09→5.63, Wilcoxon p<.0001
- Self-efficacy: NULL (d=0.11)

### Interaction:
- **KGC delta:** F=5.35, p=.022. AI alone flatlines commitment (Δ=0.00); AI+anchoring produces largest gain (Δ=0.31)

### Process Data (A2 only, n=63):
- Mean 5.7 rounds, median 5, max 24
- 52.5% dimension-specific compliance (targeted the flagged dimension)
- Exit reasons: 30 reached all-strong (48%, no exit prompt), 25 satisfied (40%), 6 enough_time (10%), 3 not_helpful (5%)
- Coach perception: useful 4.92/7, demanding 3.64/7, reuse 4.36/7

### Human-Rated Goal Quality (notebook 04):
- **AI coaching main effect:** F=45.99, p<.0001, η²=.27, d=1.21 (A2: 4.20 vs A1: 3.39 on 1-5 SMART composite)
- **Anchoring:** null (p=.54). No interaction.
- **Within-person (A2):** All 5 SMART dimensions improve initial→final (all p<.01). Time-Bound largest (+0.83), Achievable smallest (+0.27).
- **AI-human calibration:** Significant Spearman on Specific (ρ=.56), Time-Bound (.48), Measurable (.36), Achievable (.30), Relevant (.29). Overall: not significant (.23). AI is systematically stricter than humans.
- **Rounds × quality:** ρ=.32, p=.01 (more rounds → better quality, modest)
- **Inter-rater reliability:** Krippendorff's α = .24–.49 (low; rating on 1-5 is hard)

### LIWC Findings (notebook 03):
- **Authentic drops with AI coaching:** p=.023, d=-0.37 (structure-genuineness tradeoff)
- **focusfuture increases:** p=.024, d=+0.35 (more future-oriented language)
- **cause increases:** p=.002, d=+0.42 (more causal reasoning from explaining "why")
- **Analytic, cogproc, achieve:** all null between conditions
- **Vision manipulation check:** Tone 87 vs 49 (p<.0001), emo_pos 3.28 vs 0.76 (p<.0001), emo_neg 0.59 vs 2.81 (p=.0002). Anchoring exercise worked.

### Paper Narrative:
AI coaching and emotional anchoring target completely different mechanisms. AI coaching transforms goal *artifacts* (longer, more specific, dated, measurable) but increases frustration without improving psychological readiness. Anchoring transforms *psychological state* (clarity, commitment, energy, perceived helpfulness) without changing the goal text. The combination produces both better goals and better psychological readiness. Self-efficacy is null everywhere — a 10-minute intervention doesn't move self-reported confidence. Human ratings validate the AI telemetry with a very large effect (d=1.21). AI is well-calibrated on structural dimensions but over-rates difficulty on subjective ones, supporting lighter-touch coaching in Paper 2. LIWC shows coaching trades authenticity for structure. Only 5% of coached participants found feedback unhelpful; 48% persisted to all-strong — frustration is predominantly productive.

### Scale Reliability:
- KGC Cronbach's α: pre=.704, post=.712 (acceptable, ≥.70)

### Normality:
- Violated on all DVs (Shapiro-Wilk). Mann-Whitney U robustness checks confirm all ANOVA results.

### Randomization:
- Clean — no pre-measure differences on any variable.

## Analysis

Jupyter notebooks in `analysis/` (gitignored — not in public repo). **Run in VS Code with `notebook.output.textLineLimit` set high (e.g. 500) to see full results.** Run in order: 01 → 02 → 03 → 04.

- `01_data_loading.ipynb` — Load SQLite, parse JSON, compute KGC composites, build clean analysis dataframe, demographics, descriptives. Saves `data/analysis_clean.csv` and `data/ratings_clean.csv`.
- `02_inferential.ipynb` — **Main effects.** Cronbach's alpha, normality checks, randomization checks, 2x2 ANOVAs on all DVs (self-efficacy, KGC, energy, clarity, readiness, helpfulness, frustration), ANCOVAs controlling for baseline, Mann-Whitney robustness checks, word count analysis, summary table for paper.
- `03_process_and_linguistic.ipynb` — **Process data + LIWC.** Refinement round distribution, quality trajectory (AI ratings R1→R2 with Wilcoxon), dimension-specific compliance, exit reasons (30 reached all-strong, 25 satisfied, 6 enough_time, 3 not_helpful), word count comparisons, chi-square on text features, priming manipulation check, coach perception, **LIWC-22 analysis** (4 analyses: A1 vs A2 goals, A2 initial→final, B1 vs B2 goals, pleasure vs pain visions). Key LIWC findings: Authentic drops with AI coaching (d=-0.37), focusfuture and cause increase; vision manipulation check is strong (Tone 87 vs 49, emo_pos/emo_neg both significant).
- `04_human_ratings.ipynb` — **Independent human ratings.** Inter-rater reliability (Krippendorff's alpha), 2x2 ANOVA on human-rated goal quality (AI coaching: F=45.99, p<.0001, η²=.27, d=1.21; anchoring: null), within-person initial→final quality change (A2 only, all dims p<.01), AI vs human calibration (Spearman: Specific ρ=.56, Time-Bound ρ=.48; AI is systematically stricter), rounds × quality correlation (ρ=.32, p=.01), per-dimension ANOVAs.

### LIWC Integration
Notebook 03 exports `data/goals_for_liwc.csv` (all goal texts + anchoring visions, tagged by condition and text type). Run through LIWC-22 externally, save output as `data/liwc_processed.csv`, then notebook 03 imports and analyzes. Categories used: Analytic, Authentic, Tone, cogproc, achieve, focusfuture, certitude, tentat, need, want, fulfill, insight, cause, Affect, emo_pos, emo_neg, tone_pos, tone_neg, emotion.

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
