-- =============================================
-- 003_get_location_insights.sql
-- Predictive insights RPC
-- Get Location Insights (7-Day Found Counts)
-- =============================================

CREATE OR REPLACE FUNCTION get_location_insights(p_building TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM items
  WHERE status = 'active'
    AND type = 'found'
    AND location_building ILIKE '%' || p_building || '%'
    AND created_at > NOW() - INTERVAL '7 days';

  RETURN json_build_object(
    'building',    p_building,
    'found_count', v_count,
    'message',     CASE WHEN v_count > 0
      THEN v_count || ' item(s) found near ' || p_building || ' this week. Check the gallery!'
      ELSE 'No recent found items near ' || p_building || '.' END
  );
END;
$$;