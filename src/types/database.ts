export interface Frequency {
  id: number;
  frequency: number;
  transmit_frequency: number | null;
  name: string;
  description: string | null;
  alpha_tag: string | null;
  mode: string;
  tone_mode: string | null;
  tone_freq: string | null;
  county: string | null;
  state: string | null;
  agency: string | null;
  callsign: string | null;
  service_type: string | null;
  tags: string | null;
  duplex: string | null;
  offset: number | null;
  last_verified: string | null;
  notes: string | null;
  source: string | null;
  active: number;
  distance_from_kc: number | null;
  latitude: number | null;
  longitude: number | null;
  class_station_code: string | null;
  created_at: string;
  updated_at: string | null;
  export_chirp: number;
  export_uniden: number;
  export_sdrtrunk: number;
  export_sdrplus: number;
  export_opengd77: number;
}

export interface TrunkedSystem {
  id: number;
  system_id: string;
  name: string;
  type: string;
  system_class: string | null;
  business_type: string | null;
  business_owner: string | null;
  description: string | null;
  wacn: string | null;
  system_protocol: string | null;
  notes: string | null;
  active: number;
  created_at: string;
  updated_at: string | null;
}

export interface TrunkedSite {
  id: number;
  system_id: number;
  site_id: string;
  name: string;
  county: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  range_miles: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface Talkgroup {
  id: number;
  system_id: number;
  decimal_id: number;
  hex_id: string | null;
  alpha_tag: string;
  description: string | null;
  mode: string | null;
  category: string | null;
  tag: string | null;
  priority: number;
  active: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface County {
  id: number;
  name: string;
  state: string;
  region: string;
  distance_from_kc: number;
  created_at: string;
  updated_at: string | null;
}

export interface Radio {
  id: number;
  name: string;
  type: string;
  min_frequency: number;
  max_frequency: number;
  supported_modes: string;
  created_at: string;
  updated_at: string | null;
}

export interface ExportProfile {
  id: number;
  radio_id: number;
  name: string;
  filter_query: string;
  sort_order: string;
  created_at: string;
  updated_at: string | null;
}

export interface FrequencyFilter {
  mode?: string[];
  serviceType?: string[];
  county?: string[];
  state?: string[];
  active?: boolean;
  tagContains?: string;
  frequencyRange?: [number, number];
}

export interface TrunkedSystemFilter {
  type?: string[];
  systemClass?: string[];
  active?: boolean;
  protocol?: string[];
  region?: string[];
}

export interface FrequencyData {
  id: string;
  timestamp: Date;
  value: number;
  category: string;
  metadata: Record<string, any>;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface AnalysisResult {
  id: string;
  category: string;
  average: number;
  min: number;
  max: number;
  standardDeviation: number;
  timestamp: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
}

export interface ExportConfig {
  format: 'csv' | 'json' | 'excel';
  dateRange: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  includeMetadata?: boolean;
}

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
} 
