import type { Invoice } from '@/types/billing'

// Stateful in-memory mock invoices array
const mockInvoices: Invoice[] = [
  {
    invoiceId: 1001,
    appointmentId: 2201,
    patientId: 12,
    amount: 300000,
    status: 'Paid',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  },
  {
    invoiceId: 1002,
    appointmentId: 2202,
    patientId: 4, // maps to patient role account
    amount: 350000,
    status: 'Unpaid',
    createdAt: new Date().toISOString(), // Today
  },
  {
    invoiceId: 1003,
    appointmentId: 2203,
    patientId: 4, // maps to patient role account
    amount: 500000,
    status: 'Unpaid',
    createdAt: new Date().toISOString(), // Today
  },
]

export const billingMock = {
  async getInvoices(patientId?: number): Promise<Invoice[]> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    if (patientId !== undefined) {
      return mockInvoices.filter((inv) => inv.patientId === patientId)
    }
    return [...mockInvoices]
  },

  async getAppointmentBillingInfo(appointmentId: number): Promise<Invoice> {
    await new Promise((resolve) => setTimeout(resolve, 150))
    const invoice = mockInvoices.find((inv) => inv.appointmentId === appointmentId)
    if (invoice) return invoice

    // Generate dummy invoice on-the-fly if not found
    return {
      invoiceId: Math.floor(Math.random() * 9000) + 1000,
      appointmentId,
      patientId: 4,
      amount: 300000,
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
    }
  },

  // Dynamically create an invoice from N1 appointment billing-info
  async createInvoiceFromAppointment(billingInfo: {
    appointmentId: number
    patientId?: number
    examFee?: number
    [key: string]: any
  }): Promise<Invoice> {
    await new Promise((resolve) => setTimeout(resolve, 250))

    // Check if an invoice already exists for this appointment
    const existing = mockInvoices.find(inv => inv.appointmentId === billingInfo.appointmentId)
    if (existing) {
      return existing
    }

    const newInvoice: Invoice = {
      invoiceId: Math.floor(Math.random() * 9000) + 1000,
      appointmentId: billingInfo.appointmentId,
      patientId: billingInfo.patientId || 4, // Fallback to generic patient role ID
      amount: billingInfo.examFee || 300000,
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
    }

    mockInvoices.unshift(newInvoice) // Add to top of the list
    return newInvoice
  },

  async payInvoice(invoiceId: number): Promise<Invoice> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const invoice = mockInvoices.find((inv) => inv.invoiceId === invoiceId)
    if (!invoice) {
      throw new Error(`Không tìm thấy hóa đơn ID #${invoiceId}`)
    }
    invoice.status = 'Paid'
    return invoice
  },
}
