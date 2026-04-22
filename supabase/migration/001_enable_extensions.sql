-- 1. Enable the PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enable the UUID generation extension (used for primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--- 3. verify both extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');