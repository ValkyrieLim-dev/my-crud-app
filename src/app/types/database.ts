export type Area = {
  id: string
  area_name: string
  last_harvest_date: string | null
  next_harvest_date: string | null
  cycle_months: number
  created_at: string
}

export type CoprasRecord = {
  id: string
  date: string
  area_id: string
  sales: number
  expenses: number
  net_income: number
  weight: number
  price_per_kilo: number
  farmer: string
  created_at: string
  areas?: Area // join result
}
