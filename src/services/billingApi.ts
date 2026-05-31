import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Invoice } from '@/types/billing'

const client = createServiceClient('billing')

export const billingApi = {
  async getHealth() {
    const response = await client.get('/api/health')
    return response.data
  },
  async getInvoices(patientId?: number) {
    const response = await client.get('/api/billing/invoices', { params: { patientId } })
    return readApiResponse<Invoice[]>(response.data)
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
    const response = await client.post('/api/Bills/create-manual', {
      appointmentId: billingInfo.appointmentId,
      patientId: billingInfo.patientId,
      amount: billingInfo.examFee,
      status: 'Unpaid'
    })
    return readApiResponse<Invoice>(response.data)
  },
  async payInvoice(invoiceId: number) {
    const response = await client.post(`/api/Bills/${invoiceId}/pay`)
    return readApiResponse<Invoice>(response.data)
  }
}
