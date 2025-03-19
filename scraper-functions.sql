
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
      last_run_at,
      custom_sources,
      max_images_to_import
    )
    VALUES (
      COALESCE((settings_json->>'auto_run_interval')::int, 24),
      COALESCE((settings_json->>'is_running')::boolean, false),
      COALESCE(settings_json->'enabled_sources', '["USA Today Historical Events", "Rare Historical Photos", "Demilked Historical Pics"]'::jsonb),
      NULLIF(settings_json->>'last_run_at', '')::timestamp with time zone,
      COALESCE(settings_json->'custom_sources', '[]'::jsonb),
      COALESCE((settings_json->>'max_images_to_import')::int, 50)
    )
    RETURNING row_to_json(scraper_settings.*) INTO result;
  ELSE
    -- Update existing record
    UPDATE scraper_settings
    SET
      auto_run_interval = COALESCE((settings_json->>'auto_run_interval')::int, auto_run_interval),
      is_running = COALESCE((settings_json->>'is_running')::boolean, is_running),
      enabled_sources = COALESCE(settings_json->'enabled_sources', enabled_sources),
      custom_sources = COALESCE(settings_json->'custom_sources', custom_sources),
      max_images_to_import = COALESCE((settings_json->>'max_images_to_import')::int, max_images_to_import),
      last_run_at = COALESCE(NULLIF(settings_json->>'last_run_at', '')::timestamp with time zone, last_run_at),
      updated_at = now()
    WHERE id = settings_id
    RETURNING row_to_json(scraper_settings.*) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize an historical event image
CREATE OR REPLACE FUNCTION optimize_historical_event_image(event_id uuid)
RETURNS boolean AS $$
DECLARE
  image_url text;
  success boolean := false;
BEGIN
  -- Get the image URL for the event
  SELECT he.image_url INTO image_url
  FROM historical_events he
  WHERE he.id = event_id;
  
  -- If no image, return false
  IF image_url IS NULL THEN
    RETURN false;
  END IF;
  
  -- In a real implementation, we would call an external service to optimize
  -- the image and update the URL. For now, we'll just return true to simulate
  -- a successful optimization.
  success := true;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize all images in the historical_events table
CREATE OR REPLACE FUNCTION optimize_all_historical_event_images()
RETURNS TABLE(event_id uuid, success boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT he.id, optimize_historical_event_image(he.id)
  FROM historical_events he
  WHERE he.image_url IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
