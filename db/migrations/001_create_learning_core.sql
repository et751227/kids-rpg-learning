begin;

create schema if not exists kids_learning;

create table if not exists kids_learning.vocabulary (
  vocabulary_id text primary key,
  chinese text not null,
  english text not null,
  category text,
  difficulty text,
  enabled boolean not null default true,
  note text,
  source_row integer,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

create unique index if not exists uq_kids_learning_vocabulary_pair
  on kids_learning.vocabulary(lower(chinese), lower(english));

create table if not exists kids_learning.players (
  player_id text primary key,
  player_name text not null,
  is_test_fixture boolean not null default false,
  source text not null default 'GOOGLE_SHEET_PLAYER_STATE',
  source_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

create table if not exists kids_learning.player_state_snapshots (
  player_id text primary key references kids_learning.players(player_id) on delete restrict,
  records_json jsonb not null default '[]'::jsonb,
  question_stats_json jsonb not null default '{}'::jsonb,
  review_queue_json jsonb not null default '[]'::jsonb,
  progress_json jsonb,
  state_updated_at timestamptz,
  progress_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

create table if not exists kids_learning.challenge_sessions (
  session_key text primary key,
  player_id text not null references kids_learning.players(player_id) on delete restrict,
  mode text not null,
  occurred_at timestamptz,
  display_time text,
  accuracy numeric(5,2),
  coins_earned integer,
  time_taken_seconds integer,
  wrong_items jsonb not null default '[]'::jsonb,
  raw_record jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists idx_kids_learning_sessions_player_time
  on kids_learning.challenge_sessions(player_id, occurred_at desc);

create table if not exists kids_learning.question_stats (
  player_id text not null references kids_learning.players(player_id) on delete restrict,
  question_id text not null,
  question_text text,
  answer text,
  total_attempts integer,
  total_correct integer,
  village_attempts integer,
  village_correct integer,
  forest_attempts integer,
  forest_correct integer,
  last_mode text,
  last_answered_at timestamptz,
  last_correct boolean,
  last_response_time_ms integer,
  raw_stat jsonb not null,
  imported_at timestamptz not null default now(),
  primary key (player_id, question_id)
);

create table if not exists kids_learning.player_progress (
  player_id text primary key references kids_learning.players(player_id) on delete restrict,
  level integer,
  exp integer,
  strength integer,
  vitality integer,
  agility integer,
  progress_updated_at timestamptz,
  raw_progress jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists kids_learning.migration_runs (
  run_id uuid primary key,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null,
  vocabulary_rows integer not null default 0,
  player_rows integer not null default 0,
  session_rows integer not null default 0,
  question_stat_rows integer not null default 0,
  source_snapshot text,
  notes text
);

commit;
