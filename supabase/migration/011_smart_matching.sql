-- =============================================
-- 011_smart_matching.sql
-- match_notifications table + run_smart_matching trigger
-- =============================================

-- Stores each matched pair once — prevents duplicate notifications
-- on repeated inserts (e.g., if trigger fires more than once).
CREATE TABLE IF NOT EXISTS match_notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  found_item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  similarity_score REAL DEFAULT 0.8,
  notified_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lost_item_id, found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_match_lost  ON match_notifications (lost_item_id);
CREATE INDEX IF NOT EXISTS idx_match_found ON match_notifications (found_item_id);

-- RLS: only admin can query this table directly.
-- Users see match results via the notifications table.
ALTER TABLE match_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access match_notifications"
  ON match_notifications FOR ALL
  USING (auth_is_admin());

-- ──────────────────────────────────────────────────────────────────
-- run_smart_matching()
-- Fires AFTER INSERT on items.
-- Finds opposite-type items of the SAME category within ~500m.
-- Creates a match_notification record (idempotent via UNIQUE).
-- Inserts in-app notifications for each reporter that has
-- notif_matches = TRUE.
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION run_smart_matching()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  match_row items%ROWTYPE;
BEGIN
  -- Only process active items
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'found' THEN
    -- New FOUND item → search existing active LOST items
    FOR match_row IN
      SELECT * FROM items
       WHERE type     = 'lost'
         AND status   = 'active'
         AND category = NEW.category
         AND (
           -- If no location provided, skip proximity check
           NEW.location_lat IS NULL
           OR (
             ABS(location_lat - NEW.location_lat) < 0.005
             AND ABS(location_lng - NEW.location_lng) < 0.005
           )
         )
    LOOP
      -- Record the match pair (idempotent)
      INSERT INTO match_notifications (lost_item_id, found_item_id)
      VALUES (match_row.id, NEW.id)
      ON CONFLICT (lost_item_id, found_item_id) DO NOTHING;

      -- Notify the LOST item's reporter (respects notif_matches preference)
      IF (SELECT notif_matches FROM profiles WHERE id = match_row.reporter_id) THEN
        INSERT INTO notifications (user_id, type, title, body, related_item_id)
        VALUES (
          match_row.reporter_id,
          'match_found',
          'Possible match found!',
          'A found ' || NEW.category || ' was reported near ' ||
          COALESCE(NEW.location_building, NEW.location_name, 'campus') ||
          '. It may be your "' || match_row.title || '".',
          NEW.id
        );
      END IF;

      -- Notify the FOUND item's reporter (NEW.reporter_id)
      IF (SELECT notif_matches FROM profiles WHERE id = NEW.reporter_id) THEN
        INSERT INTO notifications (user_id, type, title, body, related_item_id)
        VALUES (
          NEW.reporter_id,
          'match_found',
          'Someone may be looking for this!',
          'A lost ' || NEW.category || ' report near ' ||
          COALESCE(match_row.location_building, match_row.location_name, 'campus') ||
          ' matches the item you found.',
          match_row.id
        );
      END IF;
    END LOOP;

  ELSIF NEW.type = 'lost' THEN
    -- New LOST item → search existing active FOUND items
    FOR match_row IN
      SELECT * FROM items
       WHERE type     = 'found'
         AND status   = 'active'
         AND category = NEW.category
         AND (
           NEW.location_lat IS NULL
           OR (
             ABS(location_lat - NEW.location_lat) < 0.005
             AND ABS(location_lng - NEW.location_lng) < 0.005
           )
         )
    LOOP
      INSERT INTO match_notifications (lost_item_id, found_item_id)
      VALUES (NEW.id, match_row.id)
      ON CONFLICT (lost_item_id, found_item_id) DO NOTHING;

      -- Notify the LOST item's reporter
      IF (SELECT notif_matches FROM profiles WHERE id = NEW.reporter_id) THEN
        INSERT INTO notifications (user_id, type, title, body, related_item_id)
        VALUES (
          NEW.reporter_id,
          'match_found',
          'We may have found it!',
          'A found ' || NEW.category || ' near ' ||
          COALESCE(match_row.location_building, match_row.location_name, 'campus') ||
          ' matches your lost item report.',
          match_row.id
        );
      END IF;

      -- Notify the FOUND item's reporter
      IF (SELECT notif_matches FROM profiles WHERE id = match_row.reporter_id) THEN
        INSERT INTO notifications (user_id, type, title, body, related_item_id)
        VALUES (
          match_row.reporter_id,
          'match_found',
          'Someone may be looking for this!',
          'A lost ' || NEW.category || ' report near ' ||
          COALESCE(NEW.location_building, NEW.location_name, 'campus') ||
          ' matches the item you found.',
          NEW.id
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger — fires once per row after insert
DROP TRIGGER IF EXISTS after_item_insert_matching ON items;
CREATE TRIGGER after_item_insert_matching
  AFTER INSERT ON items
  FOR EACH ROW EXECUTE FUNCTION run_smart_matching();