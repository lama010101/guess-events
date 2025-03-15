
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
  description: string;
  image_url: string | null;
  image_attribution: string | null;
  image_license: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  year: number;
  created_at: string;
  deleted: boolean;
  // Compatibility fields for the admin panel
  title?: string; 
  event_date?: string;
  source_name?: string;
  source_url?: string;
}
