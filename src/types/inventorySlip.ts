export interface InventorySlipItem {
  slipItemId: number
  medicineId: number
  medicineName: string
  medicineUnit?: string
  batchNumber: string
  expiryDate?: string
  quantity: number
  importPrice?: number
  note?: string
}

export interface InventorySlip {
  slipId: number
  slipCode: string
  slipType: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Voided'
  supplierName?: string
  invoiceImageUrl?: string
  note?: string
  rejectReason?: string
  createdBy: number
  createdByName: string
  approvedBy?: number
  approvedByName?: string
  createdAt: string
  approvedAt?: string
  updatedAt?: string
  totalItems: number
  totalQuantity: number
  items: InventorySlipItem[]
}

export interface CreateInventorySlipItem {
  medicineId: number
  batchNumber: string
  expiryDate?: string
  quantity: number
  importPrice?: number
  note?: string
}

export interface CreateInventorySlip {
  supplierName?: string
  invoiceImageUrl?: string
  note?: string
  items: CreateInventorySlipItem[]
}
