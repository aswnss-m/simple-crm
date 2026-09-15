export type OverviewBreakdownItem = {
  label: string
  count: number
  href?: string
}

export type OverviewRecentLead = {
  id: string
  name: string
  mobile: string
  location: string | null
  source: string
  addedLabel: string
}

export type OverviewData = {
  total: number
  addedThisMonth: number
  addedLastMonth: number
  locationCount: number
  monthLabel: string
  locations: OverviewBreakdownItem[]
  sources: OverviewBreakdownItem[]
  recent: OverviewRecentLead[]
  invalidMobileCount: number
}
