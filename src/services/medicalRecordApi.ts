import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'

const client = createServiceClient('medicalRecord')

export interface PatientMedicalHistory {
  patient?: Patient
  visits: Array<Record<string, any>>
  medicalRecords: MedicalRecord[]
  prescriptions: Array<Record<string, any>>
}

function normalizeRecords(payload: unknown): MedicalRecord[] {
  const data = readApiResponse<any>(payload as any)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.medicalRecords)) {
    return data.medicalRecords.map((item: any) => ({
      medicalRecordId: item.medicalRecordId ?? item.id,
      recordId: item.recordId ?? item.medicalRecordCode,
      patientId: String(item.patientId ?? ''),
      appointmentId: item.appointmentId ? String(item.appointmentId) : undefined,
      doctorId: item.doctorId,
      doctorName: item.doctorName,
      symptoms: item.symptoms,
      diagnosis: item.diagnosis ?? item.diagnosisText,
      doctorNotes: item.doctorNotes ?? item.doctorNote ?? item.treatmentPlan,
      examDate: item.examDate ?? item.followUpDate ?? item.createdAt,
      createdAt: item.createdAt,
    }))
  }
  return []
}

function normalizeHistory(payload: unknown): PatientMedicalHistory {
  const data = readApiResponse<any>(payload as any)
  return {
    patient: data?.patient,
    visits: Array.isArray(data?.visits) ? data.visits : [],
    medicalRecords: normalizeRecords(data),
    prescriptions: Array.isArray(data?.prescriptions) ? data.prescriptions : [],
  }
}

function normalizePatients(payload: unknown): Patient[] {
  const data = readApiResponse<any>(payload as any)
  return Array.isArray(data) ? data : data?.items || data?.data || []
}

function patientKey(patient: Partial<Patient> & Record<string, any>) {
  return String(patient.patientId ?? patient.id ?? patient.userId ?? '')
}

function toMedicalRecordPayload(payload: Partial<MedicalRecord> & Record<string, any>) {
  const visitId = Number(payload.visitId)
  if (!Number.isFinite(visitId) || visitId <= 0) {
    throw new Error('N2 chưa có lượt khám hợp lệ cho lịch hẹn này.')
  }

  return {
    visitId,
    diagnosisCode: payload.diagnosisCode || undefined,
    diagnosisText: payload.diagnosisText || payload.diagnosis || '',
    doctorNote: payload.doctorNote || payload.doctorNotes || undefined,
    treatmentPlan: payload.treatmentPlan || payload.doctorNotes || undefined,
    followUpDate: payload.followUpDate || payload.recheckDate || undefined,
  }
}

function appointmentDateTime(payload: Record<string, any>) {
  const date = String(payload.appointmentDate || payload.scheduledAt || '').slice(0, 10)
  const time = String(payload.slotTime || '00:00').slice(0, 5)
  return date ? `${date}T${time}:00` : new Date().toISOString()
}

function eventBase(prefix: string, type: string) {
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
  return {
    eventCode: `${prefix}-${unique}`.slice(0, 30),
    eventType: type,
    source: 'ClinicFrontend',
    occurredAt: new Date().toISOString(),
  }
}

export const medicalRecordApi = {
  async getHealth() {
    const response = await client.get('/health')
    return response.data
  },
  async getPatients() {
    const response = await client.get('/api/v1/medical/patients')
    return normalizePatients(response.data)
  },
  async getPatient(id: string) {
    const response = await client.get(`/api/v1/medical/patients/${id}`)
    return readApiResponse<Patient>(response.data)
  },
  async createPatient(payload: Partial<Patient>) {
    const response = await client.post('/api/v1/medical/patients', payload)
    return readApiResponse<Patient>(response.data)
  },
  async updatePatient(id: string, payload: Partial<Patient>) {
    const response = await client.put(`/api/v1/medical/patients/${id}`, payload)
    return readApiResponse<Patient>(response.data)
  },
  async getMedicalRecords(patientId?: string): Promise<MedicalRecord[]> {
    if (patientId) {
      try {
        return (await this.getPatientHistory(patientId)).medicalRecords
      } catch (error: any) {
        if (error?.response?.status === 404) return []
        throw error
      }
    }

    const patients = await this.getPatients()
    const patientIds = patients.map(patientKey).filter(Boolean)
    const histories = await Promise.allSettled(patientIds.map((id) => this.getPatientHistory(id)))
    return histories.flatMap((result) => (result.status === 'fulfilled' ? result.value.medicalRecords : []))
  },
  async getPatientHistory(patientId: string | number): Promise<PatientMedicalHistory> {
    const response = await client.get(`/api/v1/medical/patients/${patientId}/history`)
    return normalizeHistory(response.data)
  },
  async syncAppointmentConfirmed(payload: Record<string, any>) {
    const appointmentId = Number(payload.appointmentId || payload.id)
    const response = await client.post('/api/v1/medical/events/appointment-confirmed', {
      ...eventBase(`AC${appointmentId}`, 'appointment.confirmed'),
      data: {
        appointmentId,
        patientName: payload.patientName || payload.patientNameSnapshot || '',
        dateOfBirth: payload.dateOfBirth || null,
        gender: payload.gender || null,
        phoneNumber: payload.patientPhone || payload.phoneNumber || payload.phone || null,
        citizenId: payload.citizenId || null,
        doctorId: Number(payload.doctorId || 0),
        doctorName: payload.doctorName || null,
        specialtyId: payload.specialtyId ? Number(payload.specialtyId) : null,
        specialtyName: payload.specialtyName || null,
        scheduledAt: appointmentDateTime(payload),
        queueNumber: payload.queueNumber ? Number(payload.queueNumber) : null,
        status: 'Confirmed',
      },
    })
    return readApiResponse(response.data)
  },
  async syncPatientCheckedIn(payload: Record<string, any>) {
    const appointmentId = Number(payload.appointmentId || payload.id)
    const response = await client.post('/api/v1/medical/events/patient-checked-in', {
      ...eventBase(`CI${appointmentId}`, 'patient.checked_in'),
      data: {
        appointmentId,
        doctorId: Number(payload.doctorId || 0),
        queueNumber: payload.queueNumber ? Number(payload.queueNumber) : null,
        checkedInAt: new Date().toISOString(),
        status: 'Confirmed',
      },
    })
    return readApiResponse(response.data)
  },
  async createMedicalRecord(payload: Partial<MedicalRecord> & Record<string, any>) {
    const response = await client.post('/api/v1/medical/records', toMedicalRecordPayload(payload))
    return readApiResponse<MedicalRecord>(response.data)
  },
  async updateMedicalRecord(id: string | number, payload: Partial<MedicalRecord>) {
    const response = await client.put(`/api/v1/medical/records/${id}`, payload)
    return readApiResponse<MedicalRecord>(response.data)
  },
}
