import { createGatewayClient, readApiResponse } from '@/services/apiClient'
import type { DashboardSummary } from '@/types/report'

const client = createGatewayClient()

function normalizeDashboardSummary(data: DashboardSummary & Record<string, any>): DashboardSummary {
  return {
    totalRevenue: Number(data.totalRevenue ?? data.TotalRevenue ?? 0),
    totalAppointments: Number(data.totalAppointments ?? data.TotalAppointments ?? 0),
    newPatientsCount: Number(data.newPatientsCount ?? data.NewPatientsCount ?? 0),
    dispatchedPrescriptions: Number(data.dispatchedPrescriptions ?? data.DispatchedPrescriptions ?? 0),
    revenueTrends: normalizeTrends(data.revenueTrends ?? data.RevenueTrends, 'amount'),
    appointmentTrends: normalizeTrends(data.appointmentTrends ?? data.AppointmentTrends, 'count'),
    specialtyDistribution: (data.specialtyDistribution ?? data.SpecialtyDistribution ?? []).map((item: any) => ({
      specialtyName: item.specialtyName ?? item.SpecialtyName ?? 'Chưa phân loại',
      appointmentCount: Number(item.appointmentCount ?? item.AppointmentCount ?? 0),
    })),
    appointmentStatusRatio: (data.appointmentStatusRatio ?? data.AppointmentStatusRatio ?? []).map((item: any) => ({
      status: item.status ?? item.Status ?? 'Unknown',
      count: Number(item.count ?? item.Count ?? 0),
    })),
  }
}

function normalizeTrends(items: unknown, metricKey: 'amount' | 'count') {
  const list = Array.isArray(items) ? items : []
  return list.map((item: any) => ({
    date: item.date ?? item.Date ?? '',
    [metricKey]: Number(item[metricKey] ?? item[metricKey === 'amount' ? 'Amount' : 'Count'] ?? 0),
  }))
}

export const reportApi = {
  async getDashboardSummary(params: { startDate?: string; endDate?: string } = {}) {
    const response = await client.get('/api/reports/dashboard-summary', { params })
    return normalizeDashboardSummary(readApiResponse<DashboardSummary>(response.data) as DashboardSummary & Record<string, any>)
  },
}
