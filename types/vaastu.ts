export interface VaastuProperty {
  length: number
  breadth: number
  entrance_direction: string
  floor_level: string
}

export interface VaastuRoomDetails {
  kitchen_zone?: string | null
  toilet_zones?: string[] | null
  brahmasthan_status?: string | null
  slope_direction?: string | null
}

export interface VaastuHitResult {
  attacker: string
  victim: string
  angle: number
  type: 'killer' | 'dangerous' | 'obstacle' | 'best_support' | 'friend' | 'positive'
  direction: string
}

export interface VaastuZoneStatus {
  zone: string
  status: 'clear' | 'afflicted' | 'warning' | 'positive'
  planet: string | null
  hit_type: string | null
  devtas: { name: string; domain: string }[]
}

export interface VaastuRemedy {
  zone: string
  type: string
  remedy: string
  reason: string
}

export interface AayadiResult {
  aaya: number
  vyaya: number
  aaya_greater: boolean
  yoni: { type: string; value: number; interpretation: string }
  footprint_effects: { dimension: string; value: number; effect: string }[]
  overall_harmony: 'favorable' | 'neutral' | 'unfavorable'
  description: string
}

export interface VaastuSummary {
  dasha_lord: string
  total_zones: number
  afflicted_zones: number
  warning_zones: number
  positive_zones: number
  clear_zones: number
  aayadi_harmony: string
  spatial_overall_status: string
}

export interface VaastuHitsResponse {
  primary_hits: VaastuHitResult[]
  secondary_hits: VaastuHitResult[]
  positive_hits: VaastuHitResult[]
  dasha_lord: string
}

export interface VaastuDiagnosticResult {
  summary: VaastuSummary
  aayadi: AayadiResult
  hits: VaastuHitsResponse
  zone_map: VaastuZoneStatus[]
  spatial_findings: { rule: string; status: string; zone?: string; detail?: string; description: string; remedy?: string }[]
  remedies: VaastuRemedy[]
  plant_recommendations: { plant: string; zone: string; purpose: string }[]
  disclaimer: string
}
