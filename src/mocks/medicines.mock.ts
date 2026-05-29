import type { Medicine } from '@/types/medicine'

// Stateful in-memory mock medicines array
const mockMedicines: Medicine[] = [
  {
    medicineId: 1,
    medicineName: 'Paracetamol 500mg',
    dosageForm: 'Viên nén',
    unitPrice: 1500,
    stockQuantity: 200,
    description: 'Giảm đau, hạ sốt nhanh chóng',
    isActive: true,
  },
  {
    medicineId: 2,
    medicineName: 'Amoxicillin 500mg',
    dosageForm: 'Viên nang',
    unitPrice: 3500,
    stockQuantity: 150,
    description: 'Kháng sinh điều trị nhiễm khuẩn đường hô hấp',
    isActive: true,
  },
  {
    medicineId: 3,
    medicineName: 'Decolgen Forte',
    dosageForm: 'Viên nén',
    unitPrice: 2000,
    stockQuantity: 10, // low stock warning test
    description: 'Điều trị các triệu chứng cảm cúm, nghẹt mũi',
    isActive: true,
  },
  {
    medicineId: 4,
    medicineName: 'Siro Ho Eugica 100ml',
    dosageForm: 'Siro',
    unitPrice: 45000,
    stockQuantity: 35,
    description: 'Giảm ho, long đờm, đau rát cổ họng',
    isActive: true,
  },
  {
    medicineId: 5,
    medicineName: 'Panadol Extra',
    dosageForm: 'Viên nén',
    unitPrice: 2500,
    stockQuantity: 0, // out of stock test
    description: 'Giảm các cơn đau nhẹ đến vừa và hạ sốt',
    isActive: true,
  },
]

export const medicinesMock = {
  async getMedicines(): Promise<Medicine[]> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return [...mockMedicines]
  },

  async getMedicineById(medicineId: number): Promise<Medicine> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const med = mockMedicines.find((m) => m.medicineId === medicineId)
    if (!med) {
      throw new Error(`Không tìm thấy thuốc với ID #${medicineId}`)
    }
    return med
  },

  async createMedicine(payload: Omit<Medicine, 'medicineId'>): Promise<Medicine> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const newMed: Medicine = {
      medicineId: mockMedicines.length > 0 ? Math.max(...mockMedicines.map((m) => m.medicineId)) + 1 : 1,
      ...payload,
    }
    mockMedicines.push(newMed)
    return newMed
  },

  async updateMedicine(medicineId: number, payload: Partial<Medicine>): Promise<Medicine> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const medIndex = mockMedicines.findIndex((m) => m.medicineId === medicineId)
    if (medIndex === -1) {
      throw new Error(`Không tìm thấy thuốc với ID #${medicineId}`)
    }
    const updatedMed = {
      ...mockMedicines[medIndex],
      ...payload,
    }
    mockMedicines[medIndex] = updatedMed
    return updatedMed
  },

  async updateStock(medicineId: number, quantity: number): Promise<Medicine> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const med = mockMedicines.find((m) => m.medicineId === medicineId)
    if (!med) {
      throw new Error(`Không tìm thấy thuốc với ID #${medicineId}`)
    }
    med.stockQuantity = quantity
    return med
  },

  async deleteMedicine(medicineId: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const medIndex = mockMedicines.findIndex((m) => m.medicineId === medicineId)
    if (medIndex === -1) {
      throw new Error(`Không tìm thấy thuốc với ID #${medicineId}`)
    }
    mockMedicines.splice(medIndex, 1)
  },
}
