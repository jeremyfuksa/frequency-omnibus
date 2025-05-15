// Conventional Frequencies
export interface Frequency {
  id: number
  frequency: number
  transmit_frequency: number | null
  name: string
  description: string | null
  alpha_tag: string | null
  mode: string
  tone_mode: string | null
  tone_freq: string | null
  county: string | null
  state: string | null
  agency: string | null
  callsign: string | null
  service_type: string | null
  tags: string | null
  duplex: string | null
  offset: number | null
  last_verified: string | null
  notes: string | null
  source: string | null
  active: number
  distance_from_kc: number | null
  latitude: number | null
  longitude: number | null
  class_station_code: string | null
  created_at: string
  updated_at: string | null
  export_chirp: number
  export_uniden: number
  export_sdrtrunk: number
  export_sdrplus: number
  export_opengd77: number
}

// Trunked Systems
export interface TrunkedSystem {
  id: number
  system_id: string
  name: string
  type: string
  system_class: string | null
  business_type: string | null
  business_owner: string | null
  description: string | null
  wacn: string | null
  system_protocol: string | null
  notes: string | null
  active: number
  created_at: string
  updated_at: string | null
}

// Trunked Sites
export interface TrunkedSite {
  id: number
  system_id: number
  site_id: string
  name: string
  description: string | null
  county: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  range_miles: number | null
  nac: string | null
  active: number
  distance_from_kc: number | null
  created_at: string
  updated_at: string | null
}

// Trunked Frequencies
export interface TrunkedFrequency {
  id: number
  site_id: number
  frequency: number
  channel_type: string
  primary_control: number
  notes: string | null
  created_at: string
  updated_at: string | null
}

// Talkgroups
export interface Talkgroup {
  id: number
  system_id: number
  decimal_id: number
  hex_id: string | null
  alpha_tag: string
  description: string | null
  mode: string | null
  category: string | null
  tag: string | null
  priority: number
  active: number
  notes: string | null
  created_at: string
  updated_at: string | null
}

// Radios
export interface Radio {
  id: number
  name: string
  type: string
  min_frequency: number | null
  max_frequency: number | null
  supported_modes: string | null
  channel_capacity: number | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

// Export Profiles
export interface ExportProfile {
  id: number
  radio_id: number
  name: string
  description: string | null
  filter_query: string | null
  sort_order: string | null
  created_at: string
  updated_at: string | null
}

// Counties
export interface County {
  id: number
  name: string
  state: string
  fips_code: string | null
  region: string | null
  distance_from_kc: number | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

// Filter Types
export interface FrequencyFilter {
  mode?: string[]
  service_type?: string[]
  county?: string[]
  state?: string[]
  active?: boolean
  distance_from_kc?: number
  search?: string
}

export interface TrunkedSystemFilter {
  type?: string[]
  system_class?: string[]
  active?: boolean
  search?: string
}

export interface TalkgroupFilter {
  category?: string[]
  mode?: string[]
  active?: boolean
  search?: string
}

// Constants
export const MODES = ['FM', 'NFM', 'AM', 'DMR', 'P25', 'NXDN'] as const
export const SERVICE_TYPES = ['Ham', 'Public Safety', 'Business', 'Railroad', 'Aircraft', 'Marine'] as const
export const TONE_MODES = ['CTCSS', 'DCS'] as const
export const REGIONS = ['KC Core', 'KC Metro', 'Regional'] as const
export const SYSTEM_CLASSES = ['Public Safety', 'Business', 'Mixed'] as const
export const SYSTEM_PROTOCOLS = ['P25', 'LTR', 'MPT-1327', 'DMR'] as const 
