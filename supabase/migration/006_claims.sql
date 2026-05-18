-- =============================================
-- 006_claims.sql
-- Claims table with ticket number system & claim RLS
-- =============================================

CREATE TABLE IF NOT EXISTS claim_ticket_counter (
  id          SERIAL PRIMARY KEY,
  year        INTEGER NOT NULL UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Add this after the CREATE TABLE claim_ticket_counter block
ALTER TABLE claim_ticket_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to claim_ticket_counter"
  ON claim_ticket_counter FOR ALL USING (false);

CREATE TABLE IF NOT EXISTS claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE,
  answer        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined')),
  reviewed_by   UUID REFERENCES profiles(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, claimant_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_ticket      ON claims (ticket_number);
CREATE INDEX IF NOT EXISTS idx_claims_item        ON claims (item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant    ON claims (claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status      ON claims (status);
CREATE INDEX IF NOT EXISTS idx_claims_item_status ON claims (item_id, status);

CREATE OR REPLACE FUNCTION generate_claim_ticket()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  next_num     INTEGER;
BEGIN
  INSERT INTO claim_ticket_counter (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_number = claim_ticket_counter.last_number + 1
  RETURNING last_number INTO next_num;
  RETURN 'CLM-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_claim_ticket()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_claim_ticket();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_claim_ticket_trigger ON claims;
CREATE TRIGGER set_claim_ticket_trigger
  BEFORE INSERT ON claims
  FOR EACH ROW EXECUTE FUNCTION trg_set_claim_ticket();


-- =============================================
-- claims rls
-- Row Level Security for claims and notifications
-- =============================================

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimants see own claims"
  ON claims FOR SELECT USING (auth.uid() = claimant_id);

CREATE POLICY "Samaritan sees claims on own items"
  ON claims FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = claims.item_id
        AND items.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Auth users submit claims"
  ON claims FOR INSERT WITH CHECK (
    auth.uid() = claimant_id
    AND auth.uid() != (SELECT reporter_id FROM items WHERE id = item_id)
  );

CREATE POLICY "Samaritan updates claims on own items"
  ON claims FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = claims.item_id
        AND items.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access claims"
  ON claims FOR ALL USING (auth_is_admin());

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin full access notifications"
  ON notifications FOR ALL USING (auth_is_admin());