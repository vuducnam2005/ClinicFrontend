import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { InventorySlip, CreateInventorySlip } from '@/types/inventorySlip'

const client = createServiceClient('billing') // N3 manages medicines and billing

export const inventorySlipApi = {
  async getSlips(params?: { status?: string; createdBy?: number }) {
    const response = await client.get('/api/inventory/slips', { params })
    return readApiResponse<InventorySlip[]>(response.data)
  },

  async getSlipById(slipId: number) {
    const response = await client.get(`/api/inventory/slips/${slipId}`)
    return readApiResponse<InventorySlip>(response.data)
  },

  async createSlip(payload: CreateInventorySlip) {
    const response = await client.post('/api/inventory/slips', payload)
    return readApiResponse<InventorySlip>(response.data)
  },

  async approveSlip(slipId: number, note?: string) {
    const response = await client.post(`/api/inventory/slips/${slipId}/approve`, { note })
    return readApiResponse<InventorySlip>(response.data)
  },

  async rejectSlip(slipId: number, rejectReason: string) {
    const response = await client.post(`/api/inventory/slips/${slipId}/reject`, { rejectReason })
    return readApiResponse<InventorySlip>(response.data)
  },

  async voidSlip(slipId: number) {
    const response = await client.post(`/api/inventory/slips/${slipId}/void`, {})
    return readApiResponse<InventorySlip>(response.data)
  },

  async getPendingSlips() {
    const response = await client.get('/api/inventory/slips/pending')
    return readApiResponse<InventorySlip[]>(response.data)
  }
}
