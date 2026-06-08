export interface Medicine {
  medicineId: number
  medicineName: string
  activeIngredient?: string
  medicineType?: string
  unit?: string
  price?: number
  stockQuantity: number
  minStockLevel?: number
  expiryDate?: string
  status?: 'Active' | 'Inactive' | string
  createdAt?: string
  updatedAt?: string | null
  dosageForm?: string
  unitPrice?: number
  description?: string
  isActive?: boolean
}
