-- I-024 Phase 2 — submit a claim on an unclaimed profile.
-- SECURITY DEFINER: the profile's user_id IS NULL, so the profiles_update_owner_or_admin
-- policy would block a normal UPDATE. This function runs as the DB owner and enforces the
-- business rules itself, then records the pending claim (admin still has to approve).
CREATE OR REPLACE FUNCTION submit_profile_claim(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- One pending claim per user at a time.
  IF EXISTS (SELECT 1 FROM profiles WHERE claim_pending_user_id = v_uid) THEN
    RAISE EXCEPTION 'You already have a pending claim. Wait for it to be reviewed.';
  END IF;

  -- Target must exist, be unclaimed, and have no claim already pending.
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profile_id
      AND user_id IS NULL
      AND claim_pending_user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Profile not found, already claimed, or a claim is already pending';
  END IF;

  UPDATE profiles
  SET claim_pending_user_id = v_uid,
      updated_at = now()
  WHERE id = p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION submit_profile_claim(uuid) FROM public;
GRANT EXECUTE ON FUNCTION submit_profile_claim(uuid) TO authenticated;
