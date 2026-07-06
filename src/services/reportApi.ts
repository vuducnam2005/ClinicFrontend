import axios from 'axios'
import { appointmentApi } from '@/services/appointmentApi'
import { createGatewayClient, readApiResponse } from '@/services/apiClient'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import type { Appointment } from '@/types/appointment'
import type { Invoice, Prescription } from '@/types/billing'
import type { Patient } from '@/types/medicalRecord'
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
    try {
      const response = await client.get('/api/reports/dashboard-summary', { params })
      return normalizeDashboardSummary(readApiResponse<DashboardSummary>(response.data) as DashboardSummary & Record<string, any>)
    } catch (error) {
      if (!isMissingAggregatorEndpoint(error)) throw error
      return buildDashboardSummaryFallback(params)
    }
  },
}

function isMissingAggregatorEndpoint(error: unknown) {
  return axios.isAxiosError(error) && [404, 405].includes(Number(error.response?.status))
}

async function buildDashboardSummaryFallback(params: { startDate?: string; endDate?: string }): Promise<DashboardSummary> {
  const { startDate, endDate } = resolveDateRange(params)
  const [appointments, patients, invoices, prescriptions] = await Promise.all([
    appointmentApi.getAppointments().catch(() => [] as Appointment[]),
    medicalRecordApi.getPatients({ pageSize: 500 }).catch(() => [] as Patient[]),
    billingApi.getInvoices().catch(() => [] as Invoice[]),
    billingApi.getPrescriptions().catch(() => [] as Prescription[]),
  ])

  const appointmentsInRange = appointments.filter((item) => isDateInRange(item.appointmentDate || item.createdAt, startDate, endDate))
  const patientsInRange = patients.filter((item) => isDateInRange(item.createdAt, startDate, endDate))
  const paidInvoicesInRange = invoices.filter((item) => isPaidInvoice(item) && isDateInRange(item.paidAt || item.createdAt, startDate, endDate))
  const dispensedPrescriptions = prescriptions.filter((item) => isDispensedPrescription(item) && isDateInRange(item.dispensedAt || item.createdAt || item.sentToPharmacyAt, startDate, endDate))

  return {
    totalRevenue: paidInvoicesInRange.reduce((sum, item) => sum + invoiceRevenue(item), 0),
    totalAppointments: appointmentsInRange.length,
    newPatientsCount: patientsInRange.length,
    dispatchedPrescriptions: dispensedPrescriptions.length,
    revenueTrends: fillDateRange(startDate, endDate).map((date) => ({
      date,
      amount: paidInvoicesInRange
        .filter((item) => dateKey(item.paidAt || item.createdAt) === date)
        .reduce((sum, item) => sum + invoiceRevenue(item), 0),
    })),
    appointmentTrends: fillDateRange(startDate, endDate).map((date) => ({
      date,
      count: appointmentsInRange.filter((item) => dateKey(item.appointmentDate || item.createdAt) === date).length,
    })),
    specialtyDistribution: groupCounts(
      appointmentsInRange,
      (item) => item.specialtyName || (item as any).SpecialtyName || 'Chưa phân loại',
    ).map(([specialtyName, appointmentCount]) => ({ specialtyName, appointmentCount })),
    appointmentStatusRatio: groupCounts(
      appointmentsInRange,
      (item) => item.status || 'Unknown',
    ).map(([status, count]) => ({ status, count })),
  }
}

function resolveDateRange(params: { startDate?: string; endDate?: string }) {
  const end = params.endDate || new Date().toISOString().slice(0, 10)
  const start = params.startDate || addDays(end, -29)
  return start <= end ? { startDate: start, endDate: end } : { startDate: end, endDate: start }
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

function fillDateRange(startDate: string, endDate: string) {
  const dates: string[] = []
  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    dates.push(cursor)
  }
  return dates
}

function dateKey(value?: string) {
  return String(value || '').slice(0, 10)
}

function isDateInRange(value: unknown, startDate: string, endDate: string) {
  const key = dateKey(String(value || ''))
  return Boolean(key) && key >= startDate && key <= endDate
}

function isPaidInvoice(invoice: Invoice) {
  const status = String(invoice.status || '').toLowerCase()
  return status.includes('paid') && !status.includes('unpaid')
}

function invoiceRevenue(invoice: Invoice & Record<string, any>) {
  const paidAmount = Number(invoice.paidAmount ?? invoice.PaidAmount ?? 0)
  const refundedAmount = Number(invoice.refundedAmount ?? invoice.RefundedAmount ?? 0)
  if (paidAmount > 0) return Math.max(0, paidAmount - Math.max(0, refundedAmount))
  return Number(invoice.totalAmount ?? invoice.TotalAmount ?? invoice.amount ?? invoice.Amount ?? 0)
}

function isDispensedPrescription(prescription: Prescription) {
  const status = String(prescription.status || prescription.stockStatus || '').toLowerCase()
  return status.includes('dispensed') || status.includes('đã phát') || status.includes('da phat')
}

function groupCounts<T>(items: T[], keySelector: (item: T) => string) {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const key = keySelector(item).trim() || 'Chưa phân loại'
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
}
