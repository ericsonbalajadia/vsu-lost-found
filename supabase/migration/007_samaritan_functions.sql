-- =============================================
-- 007_samaritan_functions.sql
-- Business logic functions for claim resolution
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

  UPDATE claims
  SET status = 'accepted', reviewed_by = p_samaritan_id, reviewed_at = NOW()
  WHERE id = p_claim_id;

  UPDATE items SET status = 'negotiation' WHERE id = v_claim.item_id;

  UPDATE profiles
  SET reputation = LEAST(reputation + 10, 200)
  WHERE id = v_item.reporter_id;

  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  VALUES
    (v_claim.claimant_id, 'claim_accepted', 'Claim Accepted',
     'Claim ' || v_claim.ticket_number || ' for ' || v_item.reference_number ||
     ' was verified. Contact the Samaritan.', v_item.id),
    (v_item.reporter_id, 'item_resolved', 'Claim Accepted (+10 rep)',
     'You accepted claim ' || v_claim.ticket_number || ' for "' || v_item.title ||
     '". Arrange pickup then mark as resolved.', v_item.id);
END;
$$;

CREATE OR REPLACE FUNCTION penalize_false_claim(
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
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE claims
  SET status = 'declined', reviewed_by = p_samaritan_id, reviewed_at = NOW()
  WHERE id = p_claim_id;

  UPDATE profiles
  SET reputation = GREATEST(reputation - 10, 0)
  WHERE id = v_claim.claimant_id;

  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  VALUES (
    v_claim.claimant_id, 'claim_declined', 'Claim Rejected',
    'Claim ' || v_claim.ticket_number || ' was rejected – false claim penalty applied (−10 reputation).',
    v_item.id
  );
END;
$$;

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

  UPDATE items SET status = 'resolved' WHERE id = p_item_id;

  UPDATE claims
  SET status = 'declined', reviewed_by = p_samaritan_id, reviewed_at = NOW()
  WHERE item_id = p_item_id AND status = 'pending';

  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  SELECT claimant_id, 'claim_declined', 'Item Returned',
    'The item "' || v_item.title || '" (' || v_item.reference_number ||
    ') has been returned to its owner.', p_item_id
  FROM claims WHERE item_id = p_item_id AND status = 'declined';
END;
$$;