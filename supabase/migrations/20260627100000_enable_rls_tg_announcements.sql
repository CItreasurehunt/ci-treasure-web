-- tg_announcements is written/read only by the Edge Function (service role key),
-- which bypasses RLS. Anon key access is never needed, so enabling RLS with no
-- policies is the correct posture — it denies all anon requests.
ALTER TABLE tg_announcements ENABLE ROW LEVEL SECURITY;
