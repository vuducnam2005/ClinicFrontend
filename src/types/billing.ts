export interface Invoice {
  invoiceId: number
  appointmentId?: number
  patientId: number
  amount: number
  status: 'Unpaid' | 'Paid' | 'Cancelled' | string
  createdAt: string
}

export interface Payment {
  paymentId: number
  invoiceId: number
  amount: number
  method: string
  paidAt?: string
}
