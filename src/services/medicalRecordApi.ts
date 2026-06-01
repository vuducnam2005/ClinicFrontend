import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'

const client = createServiceClient('medicalRecord')

export interface PatientMedicalHistory {
  patient?: Patient
  visits: Array<Record<string, any>>
  medicalRecords: MedicalRecord[]
  prescriptions: Array<Record<string, any>>
}

function arrayValue(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

function normalizeRecord(item: Record<string, any>, fallbackPatientId?: string): MedicalRecord {
  return {
    medicalRecordId: item.medicalRecordId ?? item.MedicalRecordId ?? item.id ?? item.Id,
    recordId: item.recordId ?? item.RecordId ?? item.medicalRecordCode ?? item.MedicalRecordCode ?? item.recordCode ?? item.RecordCode,
    patientId: String(item.patientId ?? item.PatientId ?? item.patientCode ?? item.PatientCode ?? fallbackPatientId ?? ''),
    appointmentId: item.appointmentId ?? item.AppointmentId ? String(item.appointmentId ?? item.AppointmentId) : undefined,
    doctorId: item.doctorId ?? item.DoctorId,
    doctorName: item.doctorName ?? item.DoctorName,
    symptoms: item.symptoms ?? item.Symptoms,
    diagnosis: item.diagnosis ?? item.Diagnosis ?? item.diagnosisText ?? item.DiagnosisText,
    doctorNotes: item.doctorNotes ?? item.DoctorNotes ?? item.doctorNote ?? item.DoctorNote ?? item.treatmentPlan ?? item.TreatmentPlan,
    examDate: item.examDate ?? item.ExamDate ?? item.followUpDate ?? item.FollowUpDate ?? item.createdAt ?? item.CreatedAt,
    createdAt: item.createdAt ?? item.CreatedAt,
  }
}

function normalizeRecords(payload: unknown, fallbackPatientId?: string): MedicalRecord[] {
  const data = readApiResponse<any>(payload as any)
  if (Array.isArray(data)) return data.map((item) => normalizeRecord(item, fallbackPatientId))

  const directRecords = arrayValue(data?.medicalRecords, data?.MedicalRecords, data?.records, data?.Records, data?.items, data?.Items)
  const visitRecords = arrayValue(data?.visits, data?.Visits).flatMap((visit: any) => {
    const nested = arrayValue(visit?.medicalRecords, visit?.MedicalRecords, visit?.records, visit?.Records)
    const single = visit?.medicalRecord ?? visit?.MedicalRecord ?? visit?.record ?? visit?.Record
    return nested.length ? nested : single ? [single] : []
  })
  const singleRecord = data?.medicalRecord ?? data?.MedicalRecord ?? data?.record ?? data?.Record
  const records = [...directRecords, ...visitRecords, ...(singleRecord ? [singleRecord] : [])]

  if (records.length) {
    const patientId = String(data?.patient?.patientId ?? data?.patient?.id ?? data?.patient?.patientCode ?? data?.Patient?.PatientId ?? data?.Patient?.Id ?? data?.Patient?.PatientCode ?? fallbackPatientId ?? '')
    return records.map((item: any) => normalizeRecord(item, patientId))
  }
  return []
}

function normalizeHistory(payload: unknown): PatientMedicalHistory {
  const data = readApiResponse<any>(payload as any)
  const patient = data?.patient ?? data?.Patient
  const fallbackPatientId = String(patient?.patientId ?? patient?.PatientId ?? patient?.id ?? patient?.Id ?? patient?.patientCode ?? patient?.PatientCode ?? '')
  return {
    patient,
    visits: arrayValue(data?.visits, data?.Visits),
    medicalRecords: normalizeRecords(data, fallbackPatientId),
    prescriptions: arrayValue(data?.prescriptions, data?.Prescriptions),
  }
}

function normalizePatients(payload: unknown): Patient[] {
  const data = readApiResponse<any>(payload as any)
  const patients = Array.isArray(data) ? data : data?.items || data?.Items || data?.data || data?.Data || data?.patients || data?.Patients || []
  return patients.map((patient: any) => ({
    patientId: String(patient.patientId ?? patient.PatientId ?? patient.patientCode ?? patient.PatientCode ?? patient.id ?? patient.Id ?? ''),
    id: patient.id ?? patient.Id,
    patientCode: patient.patientCode ?? patient.PatientCode,
    fullName: patient.fullName ?? patient.FullName ?? patient.name ?? patient.Name ?? '',
    phone: patient.phone ?? patient.Phone,
    phoneNumber: patient.phoneNumber ?? patient.PhoneNumber,
    dateOfBirth: patient.dateOfBirth ?? patient.DateOfBirth,
    gender: patient.gender ?? patient.Gender,
    medicalHistory: patient.medicalHistory ?? patient.MedicalHistory,
    createdAt: patient.createdAt ?? patient.CreatedAt,
  }))
}

function patientKey(patient: Partial<Patient> & Record<string, any>) {
  return String(patient.patientId ?? patient.patientCode ?? patient.id ?? patient.userId ?? patient.PatientId ?? patient.PatientCode ?? patient.Id ?? patient.UserId ?? '')
}

function patientKeys(patient: Partial<Patient> & Record<string, any>) {
  return Array.from(new Set([
    patient.patientId,
    patient.patientCode,
    patient.id,
    patient.userId,
    patient.PatientId,
    patient.PatientCode,
    patient.Id,
    patient.UserId,
  ].map((value) => String(value ?? '').trim()).filter(Boolean)))
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
    const patientIds = Array.from(new Set(patients.flatMap(patientKeys).filter(Boolean)))
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
