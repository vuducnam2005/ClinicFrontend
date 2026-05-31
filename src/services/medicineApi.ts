import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Medicine } from '@/types/medicine'

const client = createServiceClient('billing') // N3 manages medicines and billing

export const medicineApi = {
  async getMedicines() {
    const response = await client.get('/api/Medicines')
    return readApiResponse<Medicine[]>(response.data)
  },

  async getMedicineById(medicineId: number) {
    const response = await client.get(`/api/Medicines/${medicineId}`)
    return readApiResponse<Medicine>(response.data)
  },

  async createMedicine(payload: Omit<Medicine, 'medicineId'>) {
    const response = await client.post('/api/Medicines', payload)
    return readApiResponse<Medicine>(response.data)
  },

  async updateMedicine(medicineId: number, payload: Partial<Medicine>) {
    const response = await client.put(`/api/Medicines/${medicineId}`, payload)
    return readApiResponse<Medicine>(response.data)
  },

  async updateStock(medicineId: number, quantity: number) {
    const response = await client.post(`/api/Medicines/${medicineId}/stock`, { quantity })
    return readApiResponse<Medicine>(response.data)
  },

  async deleteMedicine(medicineId: number) {
    const response = await client.delete(`/api/Medicines/${medicineId}`)
    return readApiResponse<void>(response.data)
  },
}
