-- 012_testing_smart_matching

-- Replace <user-a-id> and <user-b-id> with real profile UUIDs
INSERT INTO items (reporter_id, title, category, type, status,
                   location_lat, location_lng, location_building)
VALUES ('0c7544cf-4d1c-422a-a77b-185d7a1125f4', 'Test Lost Phone', 'Electronics', 'lost', 'active',
        10.6840, 124.7950, 'Main Library');

INSERT INTO items (reporter_id, title, category, type, status,
                   location_lat, location_lng, location_building, security_question)
VALUES ('11bddb6c-13ff-44b4-b673-fbbd28f82243', 'Test Found Phone', 'Electronics', 'found', 'active',
        10.6841, 124.7951, 'Main Library', 'What is the phone brand?');

SELECT * FROM notifications WHERE type = 'match_found' ORDER BY created_at DESC LIMIT 5;

-- 1. Delete notifications that reference the test items
DELETE FROM notifications 
WHERE related_item_id IN (
  SELECT id FROM items WHERE title IN ('Test Lost Phone', 'Test Found Phone')
);

-- 2. Delete the test items
DELETE FROM items WHERE title IN ('Test Lost Phone', 'Test Found Phone');