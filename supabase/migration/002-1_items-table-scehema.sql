-- =============================================
-- 002_items-table-scehema.sql
-- Items table with reference number system and RLS
-- =============================================

-- Counter tables for unique reference numbers
CREATE TABLE IF NOT EXISTS item_reference_counter (
  id           SERIAL PRIMARY KEY,
  year         INTEGER NOT NULL,
  type_prefix  TEXT NOT NULL CHECK (type_prefix IN ('LOST', 'FND')),
  last_number  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(year, type_prefix)
);

-- Enable RLS and deny direct access
ALTER TABLE item_reference_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to item_reference_counter"
  ON item_reference_counter
  FOR ALL
  USING (false);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference_number  TEXT UNIQUE,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL CHECK (category IN (
                      'Electronics', 'Personal Accessories', 'Books & Stationery',
                      'Keys', 'Clothing', 'ID & Documents', 'Other'
                    )),
  type              TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'negotiation', 'resolved', 'expired')),
  location_lat      DOUBLE PRECISION,
  location_lng      DOUBLE PRECISION,
  location_name     TEXT,
  location_building TEXT,
  incident_date     DATE,
  incident_time     TIME,
  security_question TEXT,
  samaritan_notes   TEXT,     -- PRIVATE: never select in public queries
  image_url         TEXT,
  image_urls        TEXT[],
  matched_item_id   UUID REFERENCES items(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security for items
-- =============================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Public reads only active items (not negotiation, not resolved)
-- CREATE POLICY "Public read active items"
--   ON items FOR SELECT
--   USING (status = 'active');

-- Drop the old policy
DROP POLICY IF EXISTS "Public read active items" ON items;

-- Create a new policy that includes both active and negotiation
CREATE POLICY "Public read active and negotiation items"
  ON items FOR SELECT
  USING (status IN ('active', 'negotiation'));


-- Reporters see their own items regardless of status
CREATE POLICY "Reporters see own items"
  ON items FOR SELECT
  USING (auth.uid() = reporter_id);

-- Auth users can insert items
CREATE POLICY "Auth users report items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Reporters can update their own items
CREATE POLICY "Reporters update own items"
  ON items FOR UPDATE
  USING (auth.uid() = reporter_id);

-- Admin full access (uses auth_is_admin() function created in Phase 2)
CREATE POLICY "Admin full access items"
  ON items FOR ALL
  USING (auth_is_admin());

-- =============================================
-- Row Level Security for items
-- =============================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_reference   ON items (reference_number);
CREATE INDEX IF NOT EXISTS idx_items_location    ON items (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_items_category    ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_status      ON items (status);
CREATE INDEX IF NOT EXISTS idx_items_type        ON items (type);
CREATE INDEX IF NOT EXISTS idx_items_reporter    ON items (reporter_id);

-- Reference number generator
CREATE OR REPLACE FUNCTION generate_item_reference(p_type TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  prefix       TEXT;
  next_num     INTEGER;
BEGIN
  prefix := CASE WHEN p_type = 'lost' THEN 'LOST' ELSE 'FND' END;

  INSERT INTO item_reference_counter (year, type_prefix, last_number)
  VALUES (current_year, prefix, 1)
  ON CONFLICT (year, type_prefix) DO UPDATE
    SET last_number = item_reference_counter.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN prefix || '-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Trigger to set reference_number before insert
CREATE OR REPLACE FUNCTION trg_set_item_reference()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_item_reference(NEW.type);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_item_reference_trigger ON items;
CREATE TRIGGER set_item_reference_trigger
  BEFORE INSERT ON items
  FOR EACH ROW EXECUTE FUNCTION trg_set_item_reference();


