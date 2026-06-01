import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Invoice, Prescription } from '@/types/billing'

const client = createServiceClient('billing')

export const billingApi = {
  async getHealth() {
    const response = await client.get('/api/health')
    return response.data
  },
  async getInvoices(patientId?: number) {
    try {
      const response = patientId
        ? await client.get(`/api/invoices/patient/${patientId}`)
        : await client.get('/api/invoices')
      return readApiResponse<Invoice[]>(response.data)
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status === 403) return []
      throw error
    }
  },
  async getPrescriptions(patientId?: number) {
    try {
      const response = patientId
        ? await client.get(`/api/prescriptions/patient/${patientId}`)
        : await client.get('/api/prescriptions')
      return readApiResponse<Prescription[]>(response.data)
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status === 403) return []
      throw error
    }
  },
  async createPrescription(payload: Partial<Prescription> & Record<string, any>) {
    const response = await client.post('/api/prescriptions', payload)
    return readApiResponse<Prescription>(response.data)
  },
  async getAppointmentBillingInfo(appointmentId: number) {
    const response = await client.get(`/api/integration/appointments/${appointmentId}/billing-info`)
    return readApiResponse<Invoice>(response.data)
  },
  async createInvoiceFromAppointment(billingInfo: {
    appointmentId: number
    patientId?: number
    examFee?: number
    [key: string]: any
  }) {
    // In real N3, this maps to creating a manual bill or utilizing integration queues
    const response = await client.post('/api/invoices', {
      appointmentId: billingInfo.appointmentId,
      patientId: billingInfo.patientId,
      examinationFee: billingInfo.examFee,
      prescriptionId: billingInfo.prescriptionId || 1,
    })
    return readApiResponse<Invoice>(response.data)
  },
  async payInvoice(invoiceId: number) {
    const response = await client.post(`/api/invoices/${invoiceId}/pay`, { paymentMethod: 'Cash' })
    return readApiResponse<Invoice>(response.data)
  }
}
