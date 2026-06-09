export interface Invoice {
  id?: number
  invoiceId: number
  invoiceCode?: string
  invoiceIdCode?: string
  appointmentId?: number
  prescriptionId?: number
  patientId: number | string
  patientCode?: string
  patientIdCode?: string
  amount: number
  totalAmount?: number
  examinationFee?: number
  examFee?: number
  medicineTotal?: number
  paidAmount?: number
  refundedAmount?: number
  balanceDue?: number
  paymentMethod?: string
  status: 'Unpaid' | 'Paid' | 'Cancelled' | string
  createdAt: string
  paidAt?: string
  payments?: Payment[]
}

export interface Payment {
  paymentId: number
  invoiceId: number
  amount: number
  paymentMethod: string
  paymentStatus: string
  paidBy: number
  paidByName: string
  paidAt?: string
  note?: string
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

export interface PrescriptionStockItem extends PrescriptionItem {
  requiredQuantity?: number
  currentStock?: number
  shortageQuantity?: number
  isAvailable?: boolean
  isExpired?: boolean
  expiryDate?: string
}

export interface PrescriptionStockCheck {
  prescriptionId?: number
  prescriptionCode?: string
  invoiceId?: number
  invoiceStatus?: string
  status?: string
  canApprove?: boolean
  canDispense?: boolean
  items?: PrescriptionStockItem[]
  stockItems?: PrescriptionStockItem[]
  prescriptionItems?: PrescriptionStockItem[]
}

export interface Prescription {
  id?: number
  prescriptionId?: number
  prescriptionCode?: string
  prescriptionIdCode?: string
  medicalRecordId?: number
  medicalRecordCode?: string
  medicalRecordIdCode?: string
  patientId?: number | string
  patientCode?: string
  patientIdCode?: string
  doctorId?: number
  appointmentId?: number
  examDate?: string
  visitDate?: string
  status?: string
  note?: string
  createdAt?: string
  submittedAt?: string
  sentToPharmacyAt?: string
  items?: PrescriptionItem[]
  prescriptionItems?: PrescriptionItem[]
}
