
export interface ScraperSourceDetail {
  sourceName: string;
  eventsFound: number;
  newEvents: number;
  existingEvents: number;
  status: string;
  error?: string;
}

export interface ScraperLog {
  id: string;
  created_at: string;
  sources_processed: number;
  total_events_found: number;
  new_events_added: number;
  failures: number;
  details: ScraperSourceDetail[];
}

export interface ScraperSettings {
  id: string;
  auto_run_interval: number;
  last_run_at: string | null;
  is_running: boolean;
  enabled_sources: string[];
  created_at: string;
  updated_at: string;
}

export interface HistoricalEventDB {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  event_date: string;
  source_name: string;
  source_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  deleted: boolean;
  location_name?: string;
}
