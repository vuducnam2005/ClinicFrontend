import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Invoice, Prescription, PrescriptionStockCheck } from '@/types/billing'

const client = createServiceClient('billing')

function normalizeList<T>(payload: unknown): T[] {
  const data = readApiResponse<any>(payload as any)
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data?.prescriptions)
            ? data.prescriptions
            : []
  return items.map(normalizeBillingItem) as T[]
}

function normalizeBillingItem(item: Record<string, any>) {
  const invoiceCode = item.invoiceCode ?? item.InvoiceCode ?? item.invoiceIdCode ?? item.InvoiceIdCode
  const invoiceId = item.invoiceId ?? item.InvoiceId ?? item.id ?? item.Id
  const prescriptionCode = item.prescriptionCode ?? item.PrescriptionCode ?? item.prescriptionIdCode ?? item.PrescriptionIdCode
  const medicalRecordCode = item.medicalRecordCode ?? item.MedicalRecordCode ?? item.medicalRecordIdCode ?? item.MedicalRecordIdCode
  const patientCode = item.patientCode ?? item.PatientCode ?? item.patientIdCode ?? item.PatientIdCode
  const amount = amountValue(item)
  return {
    ...item,
    id: item.id ?? item.Id ?? invoiceId ?? item.prescriptionId ?? item.PrescriptionId,
    invoiceId,
    invoiceCode,
    invoiceIdCode: item.invoiceIdCode ?? item.InvoiceIdCode ?? invoiceCode,
    appointmentId: item.appointmentId ?? item.AppointmentId,
    prescriptionId: item.prescriptionId ?? item.PrescriptionId,
    prescriptionCode,
    prescriptionIdCode: item.prescriptionIdCode ?? item.PrescriptionIdCode ?? prescriptionCode,
    medicalRecordCode,
    medicalRecordIdCode: item.medicalRecordIdCode ?? item.MedicalRecordIdCode ?? medicalRecordCode,
    patientId: item.patientId ?? item.PatientId,
    patientCode,
    patientIdCode: item.patientIdCode ?? item.PatientIdCode ?? patientCode,
    amount,
    totalAmount: Number(item.totalAmount ?? item.TotalAmount ?? amount),
    examinationFee: Number(item.examinationFee ?? item.ExaminationFee ?? item.examFee ?? item.ExamFee ?? 0),
    examFee: Number(item.examFee ?? item.ExamFee ?? item.examinationFee ?? item.ExaminationFee ?? 0),
    medicineTotal: Number(item.medicineTotal ?? item.MedicineTotal ?? 0),
    paidAmount: Number(item.paidAmount ?? item.PaidAmount ?? 0),
    refundedAmount: Number(item.refundedAmount ?? item.RefundedAmount ?? 0),
    balanceDue: Number(item.balanceDue ?? item.BalanceDue ?? 0),
    status: item.status ?? item.Status,
    createdAt: item.createdAt ?? item.CreatedAt,
    paidAt: item.paidAt ?? item.PaidAt,
    payments: item.payments ?? item.Payments,
  }
}

function amountValue(data: Record<string, any>) {
  return Number(data.amount ?? data.Amount ?? data.totalAmount ?? data.TotalAmount ?? data.examinationFee ?? data.ExaminationFee ?? data.examFee ?? data.ExamFee ?? 0)
}

async function tryGet<T>(paths: string[]) {
  let lastError: unknown
  for (const path of paths) {
    try {
      const response = await client.get(path)
      return readApiResponse<T>(response.data)
    } catch (error: any) {
      if (![404, 405].includes(Number(error?.response?.status))) lastError = error
    }
  }
  throw lastError || new Error('Không tìm thấy endpoint phù hợp.')
}

async function tryPost<T>(paths: string[], payload: Record<string, any>) {
  let lastError: unknown
  for (const path of paths) {
    try {
      const response = await client.post(path, payload)
      return readApiResponse<T>(response.data)
    } catch (error: any) {
      lastError = error
      if ([401, 403].includes(Number(error?.response?.status))) break
    }
  }
  throw lastError || new Error('Không tìm thấy endpoint phù hợp.')
}

export const billingApi = {
  async getHealth() {
    const response = await client.get('/api/health')
    return response.data
  },
  async getInvoices(patientId?: number | string) {
    try {
      const paths = patientId
        ? [`/api/invoices/patient/${patientId}`, `/api/billing/invoices/patient/${patientId}`]
        : ['/api/invoices', '/api/billing/invoices']
      const data = await tryGet<unknown>(paths)
      return normalizeList<Invoice>(data)
    } catch (error: any) {
      if (error?.response?.status === 404) return []
      throw error
    }
  },
  async getPrescriptions(patientId?: number | string) {
    try {
      const paths = patientId
        ? [`/api/prescriptions/patient/${patientId}`, `/api/billing/prescriptions/patient/${patientId}`]
        : ['/api/prescriptions', '/api/billing/prescriptions']
      const data = await tryGet<unknown>(paths)
      return normalizeList<Prescription>(data)
    } catch (error: any) {
      if (error?.response?.status === 404) return []
      throw error
    }
  },
  async createPrescription(payload: Partial<Prescription> & Record<string, any>) {
    return tryPost<Prescription>(['/api/prescriptions', '/api/billing/prescriptions'], payload)
  },
  async getPrescriptionStockCheck(prescriptionId: number | string) {
    return tryGet<PrescriptionStockCheck>([
      `/api/prescriptions/${prescriptionId}/stock-check`,
      `/api/billing/prescriptions/${prescriptionId}/stock-check`,
    ])
  },
  async approvePrescription(prescriptionId: number | string) {
    return tryPost<PrescriptionStockCheck>([
      `/api/prescriptions/${prescriptionId}/approve`,
      `/api/billing/prescriptions/${prescriptionId}/approve`,
    ], {})
  },
  async dispensePrescription(prescriptionId: number | string) {
    return tryPost<PrescriptionStockCheck>([
      `/api/prescriptions/${prescriptionId}/dispense`,
      `/api/billing/prescriptions/${prescriptionId}/dispense`,
    ], {})
  },
  async getAppointmentBillingInfo(appointmentId: number) {
    return tryGet<Invoice>([
      `/api/integration/appointments/${appointmentId}/billing-info`,
      `/api/billing/integration/appointments/${appointmentId}/billing-info`,
    ])
  },
  async createInvoiceFromAppointment(billingInfo: {
    appointmentId: number
    patientId?: number | string
    examFee?: number
    [key: string]: any
  }) {
    const integrationInfo = await this.getAppointmentBillingInfo(billingInfo.appointmentId).catch(() => ({} as Invoice))
    const merged = { ...integrationInfo, ...billingInfo } as Record<string, any>
    const amount = amountValue(merged)
    const payload = {
      appointmentId: billingInfo.appointmentId,
      patientId: merged.patientId ?? merged.PatientId ?? undefined,
      doctorId: Number(merged.doctorId ?? merged.DoctorId ?? 0) || undefined,
      examinationFee: amount,
      examFee: amount,
      amount,
      totalAmount: amount,
      prescriptionId: merged.prescriptionId ?? merged.PrescriptionId ?? undefined,
      status: merged.status || 'Unpaid',
      note: merged.note || 'Hóa đơn tạo từ lịch hẹn khám',
    }
    return tryPost<Invoice>([
      '/api/invoices',
      '/api/billing/invoices',
      '/api/invoices/from-appointment',
      '/api/billing/invoices/from-appointment',
    ], payload)
  },
  async createInvoiceFromPrescription(billingInfo: {
    prescriptionId: number
    medicalRecordId?: number
    appointmentId?: number
    patientId?: number | string
    doctorId?: number
    medicineTotal?: number
    examFee?: number
    items?: Array<Record<string, any>>
    note?: string
    [key: string]: any
  }) {
    const medicineTotal = Number(billingInfo.medicineTotal ?? 0)
    const examFee = Number(billingInfo.examFee ?? billingInfo.examinationFee ?? 0)
    const totalAmount = Number.isFinite(medicineTotal + examFee) ? medicineTotal + examFee : 0
    const payload = {
      prescriptionId: billingInfo.prescriptionId,
      medicalRecordId: billingInfo.medicalRecordId,
      appointmentId: billingInfo.appointmentId,
      patientId: billingInfo.patientId,
      doctorId: billingInfo.doctorId,
      medicineTotal,
      examinationFee: examFee,
      examFee,
      amount: totalAmount,
      totalAmount,
      items: billingInfo.items || [],
      status: billingInfo.status || 'Unpaid',
      note: billingInfo.note || 'Hóa đơn thuốc tạo từ đơn thuốc đã chốt qua N2',
    }
    return tryPost<Invoice>([
      '/api/invoices/from-prescription',
      '/api/billing/invoices/from-prescription',
      '/api/invoices',
      '/api/billing/invoices',
    ], payload)
  },
  async payInvoice(invoiceId: number, amount?: number, method = 'Cash', extra: Record<string, any> = {}) {
    const payload = { paymentMethod: method, method, amount, ...extra }
    return tryPost<Invoice>([`/api/invoices/${invoiceId}/pay`], { invoiceId, ...payload })
  }
}
