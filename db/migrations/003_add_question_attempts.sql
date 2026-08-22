begin;

create table if not exists kids_learning.question_attempts (
  attempt_id uuid primary key,
  player_id text not null references kids_learning.players(player_id) on delete restrict,
  vocabulary_id text not null references kids_learning.vocabulary(vocabulary_id) on delete restrict,
  session_key text,
  mode text not null,
  submitted_answer text not null,
  correct boolean not null,
  response_time_ms integer,
  answered_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_kids_learning_attempts_player_time
  on kids_learning.question_attempts(player_id, answered_at desc);

create index if not exists idx_kids_learning_attempts_player_vocab
  on kids_learning.question_attempts(player_id, vocabulary_id, answered_at desc);

commit;
