begin;

alter table kids_learning.players
  add column if not exists enabled boolean,
  add column if not exists source_created_at timestamptz;

alter table kids_learning.player_progress
  add column if not exists last_played_at timestamptz;

create table if not exists kids_learning.healing_questions (
  healing_id text primary key,
  word text not null,
  option1 text not null,
  option2 text not null,
  option3 text not null,
  option4 text not null,
  answer text not null,
  source_row integer,
  imported_at timestamptz not null default now()
);

create unique index if not exists uq_kids_learning_healing_content
  on kids_learning.healing_questions(lower(word), lower(answer));

commit;
