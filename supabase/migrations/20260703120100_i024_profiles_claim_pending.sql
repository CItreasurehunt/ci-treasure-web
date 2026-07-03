-- I-024 Phase 2 — two-phase profile claim.
-- Holds the claimant in limbo until an admin approves. RLS on profiles only ever
-- checks user_id, so setting claim_pending_user_id grants NO access on its own;
-- the admin approve action moves it into user_id.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS claim_pending_user_id uuid REFERENCES auth.users(id);

-- One pending claim per user at a time (a user can't spam-claim many profiles).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_claim_pending_user_id_key
  ON profiles (claim_pending_user_id)
  WHERE claim_pending_user_id IS NOT NULL;
