-- =============================================
-- 009_lost_item_finders.sql
-- Table to track finders who reported a lost item
-- =============================================

-- 1. Update notifications check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'match_found', 'claim_submitted', 'claim_accepted', 'claim_declined',
    'item_resolved', 'message', 'system', 'finder_found'
  )
);

-- 2. Create lost_item_finders table
CREATE TABLE IF NOT EXISTS lost_item_finders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  finder_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lost_item_id, finder_id)
);

-- 3. RLS policies
ALTER TABLE lost_item_finders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finders can insert their own report"
  ON lost_item_finders FOR INSERT
  WITH CHECK (auth.uid() = finder_id);

CREATE POLICY "Owners can read finders for their lost items"
  ON lost_item_finders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = lost_item_finders.lost_item_id
        AND items.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Finders can read own reports"
  ON lost_item_finders FOR SELECT
  USING (auth.uid() = finder_id);

-- 4. Trigger to notify owner when a finder reports
CREATE OR REPLACE FUNCTION notify_owner_on_finder_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner_id UUID;
  v_item_title TEXT;
BEGIN
  SELECT reporter_id, title INTO v_owner_id, v_item_title
  FROM items WHERE id = NEW.lost_item_id;
  
  INSERT INTO notifications (user_id, type, title, body, related_item_id)
  VALUES (
    v_owner_id,
    'finder_found',
    'Potential match for your lost item',
    'Someone reported finding "' || v_item_title || '". Check the item page for details.',
    NEW.lost_item_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_lost_item_finder_insert
  AFTER INSERT ON lost_item_finders
  FOR EACH ROW EXECUTE FUNCTION notify_owner_on_finder_report();