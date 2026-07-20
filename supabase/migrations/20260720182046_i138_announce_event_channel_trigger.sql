-- I-138: wire the new TG channel announcer (announce-event-channel) to the same
-- publish-transition event as the existing group announcer (on-event-published, I-018a).
-- Two independent triggers, two independent functions — a bug in one message format
-- can't take down the other.
CREATE TRIGGER "on-event-published-channel"
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://ormttcjjsumbmvyennfx.supabase.co/functions/v1/announce-event-channel',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
