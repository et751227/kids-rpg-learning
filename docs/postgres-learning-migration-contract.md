# Kids RPG Learning — Google Sheet → PostgreSQL migration contract

## Verified source roles

Spreadsheet: `English Words`

- `main`: vocabulary/content authoring source. Human editing remains useful; it is not required to remain the runtime database after cutover.
- `player_state`: preserved learner runtime/history source containing challenge records, per-question statistics, review queue and progress snapshots.
- `players`: player directory plus enabled state and source creation/update timestamps.
- `player_progress`: independent RPG progression source including level/EXP/stats and last-played timestamps; this must be preserved even when values overlap `player_state.progressJson`.
- `healing`: separate multiple-choice healing-question content.
- historical player progress must be preserved before any cutover.

## Target ownership

PostgreSQL schema: `kids_learning`

- `vocabulary`: runtime copy of enabled question content.
- `players`: stable player identity, enabled state and fixture classification.
- `player_state_snapshots`: lossless `player_state` source snapshot for rollback/parity.
- `challenge_sessions`: normalized challenge history.
- `question_stats`: normalized per-question learning statistics.
- `player_progress`: current RPG progression including last-played time.
- `healing_questions`: normalized healing-question content.
- `migration_runs`: explicit migration evidence.

## Fixture rule

Known QA/test player IDs must be marked `is_test_fixture=true`; they must not be merged into real learner history. Importers must never infer that all rows are production learners.

## Source precedence

- Player identity/status: `players` when present, otherwise preserved `player_state`/`player_progress` identity.
- Current RPG progress: `player_progress` is authoritative when a row exists; `player_state.progressJson` is retained as lossless evidence and fallback.
- Challenge history and question statistics: `player_state`.
- Vocabulary/healing content: their respective authoring tabs.

## Cutover order

1. Preserve current Sheet snapshot (already completed before this migration work).
2. Create PostgreSQL schema migrations 001–002.
3. Import all five source tabs without modifying the Sheet.
4. Validate vocabulary/healing counts, player identity set, session count, per-player question-stat count and progress parity.
5. Add API for vocabulary/runtime state.
6. Switch the application from hard-coded GAS/localStorage runtime reads/writes to the API.
7. Run cross-device regression for existing learners.
8. Stop player-state/progress writes to Google Sheets.
9. Remove public link-reader access from the operational Sheet as soon as the DB/API path is proven.
10. Keep `main`/`healing` only if human content authoring remains useful; otherwise migrate authoring too.
11. Delete/retire operational Sheet tabs/file only after parity + recovery proof. Do not delete the separate preserved historical snapshot.

## Non-goals

- no player reset or identity recreation;
- no flattening of real and QA data;
- no public exposure of learner history;
- no new PostgreSQL service: reuse the existing life-core PostgreSQL/control/backup boundary.
