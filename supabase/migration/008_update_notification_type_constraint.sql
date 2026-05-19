-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recreate it with the new value 'finder_found'
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'match_found', 'claim_submitted', 'claim_accepted', 'claim_declined',
    'item_resolved', 'message', 'system', 'finder_found'
  )
);