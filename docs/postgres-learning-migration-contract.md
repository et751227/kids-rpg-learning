# Kids RPG Learning — Google Sheet → PostgreSQL migration contract

## Verified source roles

Spreadsheet: `English Words`

- `main`: vocabulary/content authoring source. Human editing remains useful; it is not required to remain the runtime database after cutover.
- `player_state`: authoritative preserved learner runtime/history source for migration. It contains real player state plus QA fixture rows.
- historical player progress must be preserved before any cutover.

## Target ownership

PostgreSQL schema: `kids_learning`

- `vocabulary`: runtime copy of enabled question content.
- `players`: stable player identity and fixture classification.
- `player_state_snapshots`: lossless source snapshot for rollback/parity.
- `challenge_sessions`: normalized challenge history.
- `question_stats`: normalized per-question learning statistics.
- `player_progress`: current RPG progression.
- `migration_runs`: explicit migration evidence.

## Fixture rule

Known QA/test player IDs must be marked `is_test_fixture=true`; they must not be merged into real learner history. Importers must never infer that all rows are production learners.

## Cutover order

1. Preserve current Sheet snapshot (already completed before this migration work).
2. Create PostgreSQL schema.
3. Import `main` and `player_state` without modifying the Sheet.
4. Validate player count, session count, per-player question-stat count and progress parity.
5. Add API for vocabulary/runtime state.
6. Switch the application from hard-coded GAS/localStorage runtime reads/writes to the API.
7. Run cross-device regression for existing learners.
8. Stop player-state writes to Google Sheets.
9. Keep `main` only if human vocabulary authoring remains useful; otherwise migrate authoring too.
10. Delete/retire runtime Sheet tabs only after parity + recovery proof. Do not delete the preserved historical snapshot.

## Non-goals

- no player reset or identity recreation;
- no flattening of real and QA data;
- no public exposure of learner history;
- no new PostgreSQL service: reuse the existing life-core PostgreSQL/control/backup boundary.
