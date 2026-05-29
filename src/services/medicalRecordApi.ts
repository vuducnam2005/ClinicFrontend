import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'

const client = createServiceClient('medicalRecord')

export const medicalRecordApi = {
  async getHealth() {
    const response = await client.get('/api/health')
    return response.data
  },
  async getPatients() {
    const response = await client.get('/api/patients')
    return readApiResponse<Patient[]>(response.data)
  },
  async getPatient(id: string) {
    const response = await client.get(`/api/patients/${id}`)
    return readApiResponse<Patient>(response.data)
  },
  async createPatient(payload: Partial<Patient>) {
    const response = await client.post('/api/patients', payload)
    return readApiResponse<Patient>(response.data)
  },
  async updatePatient(id: string, payload: Partial<Patient>) {
    const response = await client.put(`/api/patients/${id}`, payload)
    return readApiResponse<Patient>(response.data)
  },
  async getMedicalRecords(patientId?: string) {
    const response = await client.get('/api/medical-records', { params: { patientId } })
    return readApiResponse<MedicalRecord[]>(response.data)
  },
  async createMedicalRecord(payload: Partial<MedicalRecord>) {
    const response = await client.post('/api/medical-records', payload)
    return readApiResponse<MedicalRecord>(response.data)
  },
  async updateMedicalRecord(id: string | number, payload: Partial<MedicalRecord>) {
    const response = await client.put(`/api/medical-records/${id}`, payload)
    return readApiResponse<MedicalRecord>(response.data)
  },
}
