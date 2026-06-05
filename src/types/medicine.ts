export interface Medicine {
  medicineId: number
  medicineName: string
  dosageForm: string // e.g., 'Viên nén', 'Siro', 'Bột'
  unitPrice: number
  stockQuantity: number
  description?: string
  isActive: boolean
}
