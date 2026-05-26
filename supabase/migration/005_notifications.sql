-- =============================================
-- 005_notifications.sql
-- In-app notification feed
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'match_found', 'claim_submitted', 'claim_accepted',
                    'claim_declined', 'item_resolved', 'message', 'system'
                  )),
  title           TEXT NOT NULL,
  body            TEXT,
  related_item_id UUID REFERENCES items(id),
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, is_read, created_at DESC);