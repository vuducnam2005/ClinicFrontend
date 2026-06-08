import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Medicine } from '@/types/medicine'

const client = createServiceClient('billing') // N3 manages medicines and billing

export const medicineApi = {
  async getMedicines(params?: { name?: string; activeIngredient?: string; medicineType?: string; status?: string; page?: number; pageSize?: number }) {
    const response = await client.get('/api/medicines', { params })
    return readApiResponse<Medicine[]>(response.data)
  },

  async getMedicineById(medicineId: number) {
    const response = await client.get(`/api/medicines/${medicineId}`)
    return readApiResponse<Medicine>(response.data)
  },

  async createMedicine(payload: Partial<Medicine>) {
    const response = await client.post('/api/medicines', payload)
    return readApiResponse<Medicine>(response.data)
  },

  async updateMedicine(medicineId: number, payload: Partial<Medicine>) {
    const response = await client.put(`/api/medicines/${medicineId}`, payload)
    return readApiResponse<Medicine>(response.data)
  },

  async updateStock(medicineId: number, quantity: number) {
    const response = await client.post('/api/inventory/adjust', { medicineId, newQuantity: quantity, reason: 'Frontend stock update' })
    return readApiResponse<Medicine>(response.data)
  },

  async deleteMedicine(medicineId: number) {
    const response = await client.delete(`/api/medicines/${medicineId}`)
    return readApiResponse<void>(response.data)
  },
}
