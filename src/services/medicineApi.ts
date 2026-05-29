import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Medicine } from '@/types/medicine'

const client = createServiceClient('billing') // N3 manages medicines and billing

const useMock = import.meta.env.VITE_USE_MOCK_N3 === 'true'

export const medicineApi = {
  async getMedicines() {
    if (useMock) {
      const { medicinesMock } = await import('@/mocks/medicines.mock')
      return medicinesMock.getMedicines()
    }
    const response = await client.get('/api/Medicines')
    return readApiResponse<Medicine[]>(response.data)
  },

  async getMedicineById(medicineId: number) {
    if (useMock) {
      const { medicinesMock } = await import('@/mocks/medicines.mock')
      return medicinesMock.getMedicineById(medicineId)
    }
    const response = await client.get(`/api/Medicines/${medicineId}`)
    return readApiResponse<Medicine>(response.data)
  },

  async createMedicine(payload: Omit<Medicine, 'medicineId'>) {
    if (useMock) {
      const { medicinesMock } = await import('@/mocks/medicines.mock')
      return medicinesMock.createMedicine(payload)
    }
    const response = await client.post('/api/Medicines', payload)
    return readApiResponse<Medicine>(response.data)
  },

  async updateMedicine(medicineId: number, payload: Partial<Medicine>) {
    if (useMock) {
      const { medicinesMock } = await import('@/mocks/medicines.mock')
      return medicinesMock.updateMedicine(medicineId, payload)
    }
    const response = await client.put(`/api/Medicines/${medicineId}`, payload)
    return readApiResponse<Medicine>(response.data)
  },

  async updateStock(medicineId: number, quantity: number) {
    if (useMock) {
      const { medicinesMock } = await import('@/mocks/medicines.mock')
      return medicinesMock.updateStock(medicineId, quantity)
    }
    const response = await client.post(`/api/Medicines/${medicineId}/stock`, { quantity })
    return readApiResponse<Medicine>(response.data)
  },

  async deleteMedicine(medicineId: number) {
    if (useMock) {
      const { medicinesMock } = await import('@/mocks/medicines.mock')
      return medicinesMock.deleteMedicine(medicineId)
    }
    const response = await client.delete(`/api/Medicines/${medicineId}`)
    return readApiResponse<void>(response.data)
  },
}
