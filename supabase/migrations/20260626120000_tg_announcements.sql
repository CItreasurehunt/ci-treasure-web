-- I-018a: tg_announcements table
-- Tracks Telegram messages posted by Edge Functions.
-- entity_id is nullable to support future digest posts (I-029) with no single entity.

CREATE TABLE tg_announcements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text        NOT NULL,
  entity_id   uuid,
  chat_id     bigint      NOT NULL,
  thread_id   bigint,
  message_id  bigint      NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE INDEX ON tg_announcements (entity_type, entity_id);
