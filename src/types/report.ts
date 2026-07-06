export interface TrendPoint {
  date: string
  amount?: number
  count?: number
}

export interface SpecialtyDistributionPoint {
  specialtyName: string
  appointmentCount: number
}

export interface AppointmentStatusPoint {
  status: string
  count: number
}

export interface DashboardSummary {
  totalRevenue: number
  totalAppointments: number
  newPatientsCount: number
  dispatchedPrescriptions: number
  revenueTrends: TrendPoint[]
  appointmentTrends: TrendPoint[]
  specialtyDistribution: SpecialtyDistributionPoint[]
  appointmentStatusRatio: AppointmentStatusPoint[]
}
