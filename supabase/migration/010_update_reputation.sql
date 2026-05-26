-- =============================================
-- 010_update_reputation.sql
-- Remove reputation update from accept_claim_by_samaritan
-- Add reputation update to finalize_resolution
-- =============================================


CREATE OR REPLACE FUNCTION accept_claim_by_samaritan(
  p_claim_id     UUID,
  p_samaritan_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_claim claims%ROWTYPE;
  v_item  items%ROWTYPE;
BEGIN
  SELECT * INTO v_claim FROM claims WHERE id = p_claim_id;
  SELECT * INTO v_item  FROM items  WHERE id = v_claim.item_id;

  IF v_item.reporter_id != p_samaritan_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the Samaritan can accept this claim.';
  END IF;

  -- Mark claim as accepted
  UPDATE claims
  SET status = 'accepted', reviewed_by = p_samaritan_id, reviewed_at = NOW()
  WHERE id = p_claim_id;

  -- Item enters negotiation (NOT resolved)
  UPDATE items
  SET status = 'negotiation'
  WHERE id = v_claim.item_id;

  -- ❌ REMOVED: Samaritan reputation increase (moved to finalize_resolution)
  -- UPDATE profiles SET reputation = LEAST(reputation + 10, 200) WHERE id = v_item.reporter_id;

  -- Notify winning claimant
  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  VALUES (
    v_claim.claimant_id,
    'claim_accepted',
    'Claim Accepted',
    'Claim ' || v_claim.ticket_number || ' for item ' || v_item.reference_number ||
    ' was verified. Contact the Samaritan.',
    v_item.id
  );

  -- Notify Samaritan
  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  VALUES (
    v_item.reporter_id,
    'item_resolved',
    'Claim Accepted',
    'You accepted claim ' || v_claim.ticket_number || ' for "' || v_item.title ||
    '". Arrange pickup then mark as resolved.',
    v_item.id
  );

  RETURN;
END;
$$;


-- =============================================

CREATE OR REPLACE FUNCTION finalize_resolution(
  p_item_id      UUID,
  p_samaritan_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item items%ROWTYPE;
BEGIN
  SELECT * INTO v_item FROM items WHERE id = p_item_id;

  IF v_item.reporter_id != p_samaritan_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Mark item as resolved
  UPDATE items
  SET status = 'resolved'
  WHERE id = p_item_id;

  -- ✅ Add +10 reputation to Samaritan (capped at 200)
  UPDATE profiles
  SET reputation = LEAST(reputation + 10, 200)
  WHERE id = v_item.reporter_id;

  -- Decline all remaining pending claims (no penalty)
  UPDATE claims
  SET status = 'declined',
      reviewed_by = p_samaritan_id,
      reviewed_at = NOW()
  WHERE item_id = p_item_id
    AND status = 'pending';

  -- Notify declined claimants
  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  SELECT
    claimant_id,
    'claim_declined',
    'Item Returned',
    'The item "' || v_item.title || '" (' ||
    v_item.reference_number || ') has been returned to its owner.',
    p_item_id
  FROM claims
  WHERE item_id = p_item_id
    AND status = 'declined';

  -- Notify Samaritan about reputation gain
  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  VALUES (
    v_item.reporter_id,
    'system',
    'Reputation +10',
    'You successfully completed a handover. Your reputation increased by 10 points.',
    p_item_id
  );

  RETURN;
END;
$$;