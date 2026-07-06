import axios from 'axios'
import { appointmentApi } from '@/services/appointmentApi'
import { createGatewayClient, readApiResponse } from '@/services/apiClient'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import type { Appointment } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { Patient } from '@/types/medicalRecord'
import type { DashboardSummary } from '@/types/report'

const client = createGatewayClient()
const fallbackRowLimit = 700
const fallbackTrendDayLimit = 62
const fallbackRequestTimeoutMs = 6500

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
      const response = await client.get('/api/reports/dashboard-summary', { params, timeout: 3500 })
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
  const [appointments, patients, invoices] = await Promise.all([
    withTimeout(appointmentApi.getAppointments(), [] as Appointment[]),
    withTimeout(medicalRecordApi.getPatients({ pageSize: 120 }), [] as Patient[]),
    withTimeout(billingApi.getInvoices(), [] as Invoice[]),
  ])

  const appointmentsInRange = capRows(appointments).filter((item) => isDateInRange(item.appointmentDate || item.createdAt, startDate, endDate))
  const patientsInRange = capRows(patients).filter((item) => isDateInRange(item.createdAt, startDate, endDate))
  const paidInvoicesInRange = capRows(invoices).filter((item) => isPaidInvoice(item) && isDateInRange(item.paidAt || item.createdAt, startDate, endDate))
  const trendDates = fillDateRange(startDate, endDate)
  const revenueByDate = sumByDate(paidInvoicesInRange, (item) => item.paidAt || item.createdAt, invoiceRevenue)
  const appointmentsByDate = countByDate(appointmentsInRange, (item) => item.appointmentDate || item.createdAt)

  return {
    totalRevenue: paidInvoicesInRange.reduce((sum, item) => sum + invoiceRevenue(item), 0),
    totalAppointments: appointmentsInRange.length,
    newPatientsCount: patientsInRange.length,
    dispatchedPrescriptions: paidInvoicesInRange.filter((item) => Number(item.prescriptionId || (item as any).PrescriptionId || 0) > 0).length,
    revenueTrends: trendDates.map((date) => ({
      date,
      amount: revenueByDate.get(date) || 0,
    })),
    appointmentTrends: trendDates.map((date) => ({
      date,
      count: appointmentsByDate.get(date) || 0,
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
  const value = parseDateOnly(date)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

function fillDateRange(startDate: string, endDate: string) {
  const dates: string[] = []
  let cursor = startDate
  for (let index = 0; cursor <= endDate && index < fallbackTrendDayLimit; index += 1) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return dates
}

function parseDateOnly(value: string) {
  const parsed = new Date(`${String(value || '').slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
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

function groupCounts<T>(items: T[], keySelector: (item: T) => string) {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const key = keySelector(item).trim() || 'Chưa phân loại'
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
}

function capRows<T>(items: T[]) {
  return items.length > fallbackRowLimit ? items.slice(0, fallbackRowLimit) : items
}

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), fallbackRequestTimeoutMs)),
  ])
}

function countByDate<T>(items: T[], dateSelector: (item: T) => string | undefined) {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const key = dateKey(dateSelector(item))
    if (key) counts.set(key, (counts.get(key) || 0) + 1)
  })
  return counts
}

function sumByDate<T>(items: T[], dateSelector: (item: T) => string | undefined, valueSelector: (item: T) => number) {
  const sums = new Map<string, number>()
  items.forEach((item) => {
    const key = dateKey(dateSelector(item))
    if (key) sums.set(key, (sums.get(key) || 0) + valueSelector(item))
  })
  return sums
}
