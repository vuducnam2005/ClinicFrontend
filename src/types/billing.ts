export interface Invoice {
  id?: number
  invoiceId: number
  invoiceCode?: string
  appointmentId?: number
  patientId: number | string
  amount: number
  totalAmount?: number
  examinationFee?: number
  examFee?: number
  paidAmount?: number
  paymentMethod?: string
  status: 'Unpaid' | 'Paid' | 'Cancelled' | string
  createdAt: string
  paidAt?: string
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
  patientId?: number | string
  doctorId?: number
  appointmentId?: number
  status?: string
  note?: string
  createdAt?: string
  sentToPharmacyAt?: string
  items?: PrescriptionItem[]
}
