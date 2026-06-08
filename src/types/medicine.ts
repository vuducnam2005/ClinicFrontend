export interface Medicine {
  medicineId: number
  medicineName: string
  medicineType?: string
  activeIngredient?: string
  unit?: string
  dosageForm?: string
  price?: number
  unitPrice?: number
  stockQuantity: number
  minStockLevel?: number
  expiryDate?: string
  status?: 'Active' | 'Inactive' | 'OutOfStock' | string
  createdAt?: string
  updatedAt?: string
  description?: string
  isActive?: boolean
}
