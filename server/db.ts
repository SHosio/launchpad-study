import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DATABASE_PATH || './data/study.db'
const db = new Database(path.resolve(DB_PATH))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prolific_pid TEXT UNIQUE NOT NULL,
    study_id TEXT,
    session_id TEXT,
    condition_a TEXT NOT NULL CHECK(condition_a IN ('A1', 'A2')),
    condition_b TEXT NOT NULL CHECK(condition_b IN ('B1', 'B2')),
    status TEXT NOT NULL DEFAULT 'started' CHECK(status IN ('started', 'consent', 'demographics', 'pre_measure', 'priming', 'goal_writing', 'coaching', 'anchoring', 'post_measure', 'debrief', 'completed', 'followup_completed', 'abandoned')),
    demographics_json TEXT,
    session_start_at TEXT NOT NULL DEFAULT (datetime('now')),
    session_end_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL REFERENCES participants(id),
    survey_type TEXT NOT NULL CHECK(survey_type IN ('pre_measure', 'post_measure', 'priming_compliance', 'followup')),
    responses_json TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL REFERENCES participants(id),
    initial_text TEXT NOT NULL,
    final_text TEXT,
    goal_writing_start_at TEXT,
    goal_writing_end_at TEXT,
    refinement_start_at TEXT,
    refinement_end_at TEXT,
    exit_reason TEXT,
    total_rounds INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS refinement_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL REFERENCES goals(id),
    round_number INTEGER NOT NULL,
    goal_text TEXT NOT NULL,
    ai_feedback TEXT NOT NULL,
    ai_suggestion TEXT,
    ai_overall TEXT NOT NULL,
    ai_dimensions_json TEXT NOT NULL,
    flagged_dimension TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    feedback_received_at TEXT,
    revision_submitted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS anchoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL REFERENCES participants(id),
    pleasure_vision TEXT NOT NULL,
    pain_vision TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rating_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_number INTEGER NOT NULL,
    goal_id INTEGER NOT NULL REFERENCES goals(id),
    goal_version TEXT NOT NULL CHECK(goal_version IN ('initial', 'final')),
    display_order INTEGER NOT NULL,
    goal_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rating_raters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prolific_pid TEXT UNIQUE NOT NULL,
    batch_number INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goal_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rater_id INTEGER NOT NULL REFERENCES rating_raters(id),
    batch_number INTEGER NOT NULL,
    goal_id INTEGER NOT NULL REFERENCES goals(id),
    goal_version TEXT NOT NULL CHECK(goal_version IN ('initial', 'final')),
    rating_specific INTEGER NOT NULL CHECK(rating_specific BETWEEN 1 AND 5),
    rating_measurable INTEGER NOT NULL CHECK(rating_measurable BETWEEN 1 AND 5),
    rating_achievable INTEGER NOT NULL CHECK(rating_achievable BETWEEN 1 AND 5),
    rating_relevant INTEGER NOT NULL CHECK(rating_relevant BETWEEN 1 AND 5),
    rating_timebound INTEGER NOT NULL CHECK(rating_timebound BETWEEN 1 AND 5),
    rating_holistic INTEGER NOT NULL CHECK(rating_holistic BETWEEN 1 AND 5),
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS followup_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL REFERENCES participants(id),
    recall_confidence INTEGER,
    recall_recognition INTEGER,
    goal_attainment TEXT,
    attainment_percentage INTEGER,
    responses_json TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export default db
