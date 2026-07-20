-- I-138 follow-up: react to an event's first transition to cancelled = true.
-- announce-event-cancelled posts a "CANCELLED:" message to the group thread (only if the event
-- was actually announced there before) and edits the TG channel post in place if one exists.
-- Third independent trigger alongside on-event-published (I-018a) and on-event-published-channel
-- (I-138 Part A) — same pattern, own function, own failure domain.
CREATE TRIGGER "on-event-cancelled"
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://ormttcjjsumbmvyennfx.supabase.co/functions/v1/announce-event-cancelled',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
