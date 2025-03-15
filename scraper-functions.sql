
-- Function to get scraper logs
CREATE OR REPLACE FUNCTION get_scraper_logs()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT row_to_json(t)
  FROM (
    SELECT * FROM scraper_logs
    ORDER BY created_at DESC
  ) t;
END;
$$ LANGUAGE plpgsql;

-- Function to get scraper settings
CREATE OR REPLACE FUNCTION get_scraper_settings()
RETURNS json AS $$
DECLARE
  settings_record json;
BEGIN
  SELECT row_to_json(t) INTO settings_record
  FROM (
    SELECT * FROM scraper_settings
    ORDER BY created_at DESC
    LIMIT 1
  ) t;
  
  RETURN settings_record;
END;
$$ LANGUAGE plpgsql;

-- Function to update scraper settings
CREATE OR REPLACE FUNCTION update_scraper_settings(settings_json json)
RETURNS json AS $$
DECLARE
  settings_id uuid;
  result json;
BEGIN
  -- Check if any settings exist
  SELECT id INTO settings_id
  FROM scraper_settings
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF settings_id IS NULL THEN
    -- No settings exist, insert new record
    INSERT INTO scraper_settings (
      auto_run_interval,
      is_running,
      enabled_sources,
      last_run_at
    )
    VALUES (
      COALESCE((settings_json->>'auto_run_interval')::int, 24),
      COALESCE((settings_json->>'is_running')::boolean, false),
      COALESCE(settings_json->'enabled_sources', '["USA Today Historical Events", "Rare Historical Photos", "Demilked Historical Pics"]'::jsonb),
      NULLIF(settings_json->>'last_run_at', '')::timestamp with time zone
    )
    RETURNING row_to_json(scraper_settings.*) INTO result;
  ELSE
    -- Update existing record
    UPDATE scraper_settings
    SET
      auto_run_interval = COALESCE((settings_json->>'auto_run_interval')::int, auto_run_interval),
      is_running = COALESCE((settings_json->>'is_running')::boolean, is_running),
      enabled_sources = COALESCE(settings_json->'enabled_sources', enabled_sources),
      last_run_at = COALESCE(NULLIF(settings_json->>'last_run_at', '')::timestamp with time zone, last_run_at),
      updated_at = now()
    WHERE id = settings_id
    RETURNING row_to_json(scraper_settings.*) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
