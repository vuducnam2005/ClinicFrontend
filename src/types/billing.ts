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

export interface PrescriptionItem {
  id?: number
  prescriptionItemCode?: string
  medicineId?: number
  medicineNameSnapshot?: string
  medicineName?: string
  unitSnapshot?: string
  dosage?: string
  frequency?: string
  durationDays?: number
  quantity?: number
  usageInstruction?: string
}

export interface Prescription {
  id?: number
  prescriptionId?: number
  prescriptionCode?: string
  medicalRecordId?: number
  medicalRecordCode?: string
  patientId?: number
  doctorId?: number
  appointmentId?: number
  status?: string
  note?: string
  createdAt?: string
  sentToPharmacyAt?: string
  items?: PrescriptionItem[]
}
