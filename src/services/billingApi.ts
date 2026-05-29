import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Invoice } from '@/types/billing'

const client = createServiceClient('billing')

const useMock = import.meta.env.VITE_USE_MOCK_N3 === 'true'

export const billingApi = {
  async getHealth() {
    if (useMock) {
      return { status: 'healthy', service: 'Mock Pharmacy & Billing Service (N3)' }
    }
    const response = await client.get('/api/health')
    return response.data
  },
  async getInvoices(patientId?: number) {
    if (useMock) {
      const { billingMock } = await import('@/mocks/billing.mock')
      return billingMock.getInvoices(patientId)
    }
    const response = await client.get('/api/billing/invoices', { params: { patientId } })
    return readApiResponse<Invoice[]>(response.data)
  },
  async getAppointmentBillingInfo(appointmentId: number) {
    if (useMock) {
      const { billingMock } = await import('@/mocks/billing.mock')
      return billingMock.getAppointmentBillingInfo(appointmentId)
    }
    const response = await client.get(`/api/integration/appointments/${appointmentId}/billing-info`)
    return readApiResponse<Invoice>(response.data)
  },
  async createInvoiceFromAppointment(billingInfo: {
    appointmentId: number
    patientId?: number
    examFee?: number
    [key: string]: any
  }) {
    if (useMock) {
      const { billingMock } = await import('@/mocks/billing.mock')
      return billingMock.createInvoiceFromAppointment(billingInfo)
    }
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
    if (useMock) {
      const { billingMock } = await import('@/mocks/billing.mock')
      return billingMock.payInvoice(invoiceId)
    }
    const response = await client.post(`/api/Bills/${invoiceId}/pay`)
    return readApiResponse<Invoice>(response.data)
  }
}
