import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Prescription } from '@/types/billing'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'

const client = createServiceClient('medicalRecord')

export interface PatientMedicalHistory {
  patient?: Patient
  visits: MedicalVisit[]
  medicalRecords: MedicalRecord[]
  prescriptions: Prescription[]
}

export interface MedicalVisit extends Record<string, any> {
  visitId?: number
  id?: number
  appointmentId?: number
  patientId?: number
  patientName?: string
  doctorId?: number
  doctorName?: string
  chiefComplaint?: string
  symptoms?: string
  status?: string
  visitDate?: string
  createdAt?: string
}

export interface VisitVitalsPayload {
  temperature?: number | null
  bloodPressure?: string | null
  heartRate?: number | null
  weight?: number | null
  height?: number | null
  note?: string | null
}

export interface ClinicalOrderPayload {
  medicalRecordId: number
  orderType: string
  orderName: string
  reason?: string
}

export interface PrescriptionItemPayload {
  medicineId: number
  medicineNameSnapshot: string
  unitSnapshot?: string
  dosage: string
  frequency: string
  durationDays: number
  quantity: number
  usageInstruction?: string
  note?: string
}

function arrayValue(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

function toPositiveNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeRecord(item: Record<string, any>, fallbackPatientId?: string): MedicalRecord {
  return {
    ...item,
    medicalRecordId: item.medicalRecordId ?? item.MedicalRecordId ?? item.id ?? item.Id,
    recordId: item.recordId ?? item.RecordId ?? item.medicalRecordCode ?? item.MedicalRecordCode ?? item.recordCode ?? item.RecordCode,
    medicalRecordCode: item.medicalRecordCode ?? item.MedicalRecordCode,
    visitId: item.visitId ?? item.VisitId,
    patientId: String(item.patientId ?? item.PatientId ?? item.patientCode ?? item.PatientCode ?? fallbackPatientId ?? ''),
    appointmentId: item.appointmentId ?? item.AppointmentId ? String(item.appointmentId ?? item.AppointmentId) : undefined,
    doctorId: item.doctorId ?? item.DoctorId,
    doctorName: item.doctorName ?? item.DoctorName,
    symptoms: item.symptoms ?? item.Symptoms ?? item.visit?.symptoms ?? item.Visit?.Symptoms,
    diagnosis: item.diagnosis ?? item.Diagnosis ?? item.diagnosisText ?? item.DiagnosisText,
    diagnosisText: item.diagnosisText ?? item.DiagnosisText ?? item.diagnosis ?? item.Diagnosis,
    diagnosisCode: item.diagnosisCode ?? item.DiagnosisCode,
    doctorNotes: item.doctorNotes ?? item.DoctorNotes ?? item.doctorNote ?? item.DoctorNote,
    doctorNote: item.doctorNote ?? item.DoctorNote ?? item.doctorNotes ?? item.DoctorNotes,
    treatmentPlan: item.treatmentPlan ?? item.TreatmentPlan,
    followUpDate: item.followUpDate ?? item.FollowUpDate,
    status: item.status ?? item.Status,
    examDate: item.examDate ?? item.ExamDate ?? item.createdAt ?? item.CreatedAt,
    createdAt: item.createdAt ?? item.CreatedAt,
    completedAt: item.completedAt ?? item.CompletedAt,
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

function normalizeVisit(item: Record<string, any>): MedicalVisit {
  const patient = item.patient ?? item.Patient
  const doctor = item.doctor ?? item.Doctor
  return {
    ...item,
    visitId: item.visitId ?? item.VisitId ?? item.id ?? item.Id,
    id: item.id ?? item.Id ?? item.visitId ?? item.VisitId,
    appointmentId: item.appointmentId ?? item.AppointmentId,
    patientId: item.patientId ?? item.PatientId ?? patient?.patientId ?? patient?.PatientId,
    patientName: item.patientName ?? item.PatientName ?? patient?.fullName ?? patient?.FullName,
    doctorId: item.doctorId ?? item.DoctorId ?? doctor?.doctorId ?? doctor?.DoctorId,
    doctorName: item.doctorName ?? item.DoctorName ?? doctor?.fullName ?? doctor?.FullName,
    chiefComplaint: item.chiefComplaint ?? item.ChiefComplaint,
    symptoms: item.symptoms ?? item.Symptoms,
    status: item.status ?? item.Status,
    visitDate: item.visitDate ?? item.VisitDate ?? item.createdAt ?? item.CreatedAt,
    createdAt: item.createdAt ?? item.CreatedAt,
  }
}

function normalizeVisits(payload: unknown): MedicalVisit[] {
  const data = readApiResponse<any>(payload as any)
  const visits = Array.isArray(data) ? data : data?.items || data?.Items || data?.visits || data?.Visits || data?.data || data?.Data || []
  return visits.map(normalizeVisit)
}

function normalizeHistory(payload: unknown): PatientMedicalHistory {
  const data = readApiResponse<any>(payload as any)
  const patient = data?.patient ?? data?.Patient
  const fallbackPatientId = String(patient?.patientId ?? patient?.PatientId ?? patient?.id ?? patient?.Id ?? patient?.patientCode ?? patient?.PatientCode ?? '')
  return {
    patient,
    visits: arrayValue(data?.visits, data?.Visits).map(normalizeVisit),
    medicalRecords: normalizeRecords(data, fallbackPatientId),
    prescriptions: arrayValue(data?.prescriptions, data?.Prescriptions),
  }
}

function emptyHistory(): PatientMedicalHistory {
  return { visits: [], medicalRecords: [], prescriptions: [] }
}

function normalizePatients(payload: unknown): Patient[] {
  const data = readApiResponse<any>(payload as any)
  const patients = Array.isArray(data) ? data : data?.items || data?.Items || data?.data || data?.Data || data?.patients || data?.Patients || []
  return patients.map((patient: any) => ({
    ...patient,
    patientId: patient.patientId ?? patient.PatientId ?? patient.id ?? patient.Id ?? patient.patientCode ?? patient.PatientCode ?? '',
    id: patient.id ?? patient.Id ?? patient.patientId ?? patient.PatientId,
    patientCode: patient.patientCode ?? patient.PatientCode,
    fullName: patient.fullName ?? patient.FullName ?? patient.name ?? patient.Name ?? '',
    phone: patient.phone ?? patient.Phone ?? patient.phoneNumber ?? patient.PhoneNumber,
    phoneNumber: patient.phoneNumber ?? patient.PhoneNumber ?? patient.phone ?? patient.Phone,
    dateOfBirth: patient.dateOfBirth ?? patient.DateOfBirth,
    gender: patient.gender ?? patient.Gender,
    medicalHistory: patient.medicalHistory ?? patient.MedicalHistory,
    createdAt: patient.createdAt ?? patient.CreatedAt,
  }))
}

function patientKeys(patient: Partial<Patient> & Record<string, any>) {
  const numericKeys = [
    patient.patientId,
    patient.id,
    patient.PatientId,
    patient.Id,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => String(value))

  if (numericKeys.length) return Array.from(new Set(numericKeys))

  return Array.from(new Set([
    patient.patientId,
    patient.PatientId,
    patient.id,
    patient.Id,
  ].map((value) => String(value ?? '').trim()).filter(Boolean)))
}

function toMedicalRecordPayload(payload: Partial<MedicalRecord> & Record<string, any>) {
  const visitId = toPositiveNumber(payload.visitId)
  const diagnosisText = text(payload.diagnosisText || payload.diagnosis)
  if (!visitId) throw new Error('Cần có lượt khám N2 hợp lệ trước khi tạo bệnh án.')
  if (!diagnosisText) throw new Error('Vui lòng nhập chẩn đoán trước khi lưu bệnh án.')

  return {
    visitId,
    diagnosisCode: text(payload.diagnosisCode) || undefined,
    diagnosisText,
    doctorNote: text(payload.doctorNote || payload.doctorNotes) || undefined,
    treatmentPlan: text(payload.treatmentPlan) || undefined,
    followUpDate: payload.followUpDate || payload.recheckDate || undefined,
  }
}

function toMedicalRecordUpdatePayload(payload: Partial<MedicalRecord> & Record<string, any>) {
  const diagnosisText = text(payload.diagnosisText || payload.diagnosis)
  if (!diagnosisText) throw new Error('Vui lòng nhập chẩn đoán trước khi lưu bệnh án.')
  return {
    diagnosisCode: text(payload.diagnosisCode) || undefined,
    diagnosisText,
    doctorNote: text(payload.doctorNote || payload.doctorNotes) || undefined,
    treatmentPlan: text(payload.treatmentPlan) || undefined,
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
  async getPatients(params?: { keyword?: string; pageNumber?: number; pageSize?: number }) {
    const response = await client.get('/api/v1/medical/patients', { params })
    return normalizePatients(response.data)
  },
  async getPatient(id: string | number) {
    const response = await client.get(`/api/v1/medical/patients/${id}`)
    return readApiResponse<Patient>(response.data)
  },
  async createPatient(payload: Partial<Patient>) {
    const response = await client.post('/api/v1/medical/patients', payload)
    return readApiResponse<Patient>(response.data)
  },
  async updatePatient(id: string | number, payload: Partial<Patient>) {
    const response = await client.put(`/api/v1/medical/patients/${id}`, payload)
    return readApiResponse<Patient>(response.data)
  },
  async getPatientHistory(patientId: string | number): Promise<PatientMedicalHistory> {
    const id = Number(patientId)
    if (!Number.isFinite(id) || id <= 0) return emptyHistory()
    const response = await client.get(`/api/v1/medical/patients/${id}/history`)
    return normalizeHistory(response.data)
  },
  async getMedicalRecords(patientId?: string | number): Promise<MedicalRecord[]> {
    if (patientId) {
      try {
        return (await this.getPatientHistory(patientId)).medicalRecords
      } catch (error: any) {
        if (error?.response?.status === 404) return []
        throw error
      }
    }

    const patients = await this.getPatients({ pageSize: 100 })
    const patientIds = Array.from(new Set(patients.flatMap(patientKeys).filter(Boolean)))
    const histories = await Promise.allSettled(patientIds.map((id) => this.getPatientHistory(id)))
    return histories.flatMap((result) => (result.status === 'fulfilled' ? result.value.medicalRecords : []))
  },
  async getVisitsToday(doctorId?: number) {
    const response = await client.get('/api/v1/medical/visits/today', { params: doctorId ? { doctorId } : undefined })
    return normalizeVisits(response.data)
  },
  async getVisit(id: string | number) {
    const response = await client.get(`/api/v1/medical/visits/${id}`)
    return normalizeVisit(readApiResponse<Record<string, any>>(response.data))
  },
  async getVisitByAppointment(appointmentId: string | number) {
    const response = await client.get(`/api/v1/medical/visits/by-appointment/${appointmentId}`)
    return normalizeVisit(readApiResponse<Record<string, any>>(response.data))
  },
  async startVisit(id: string | number, payload: { doctorId: number; chiefComplaint: string }) {
    if (!text(payload.chiefComplaint)) throw new Error('Vui lòng nhập lý do khám trước khi bắt đầu lượt khám.')
    const response = await client.put(`/api/v1/medical/visits/${id}/start`, payload)
    return readApiResponse(response.data)
  },
  async updateVisitVitals(id: string | number, payload: VisitVitalsPayload) {
    const response = await client.put(`/api/v1/medical/visits/${id}/vitals`, payload)
    return readApiResponse(response.data)
  },
  async completeVisit(id: string | number) {
    const response = await client.put(`/api/v1/medical/visits/${id}/complete`)
    return readApiResponse(response.data)
  },
  async getMedicalRecordByVisit(visitId: string | number) {
    const response = await client.get(`/api/v1/medical/records/by-visit/${visitId}`)
    return normalizeRecord(readApiResponse<Record<string, any>>(response.data))
  },
  async createMedicalRecord(payload: Partial<MedicalRecord> & Record<string, any>) {
    const response = await client.post('/api/v1/medical/records', toMedicalRecordPayload(payload))
    return normalizeRecord(readApiResponse<Record<string, any>>(response.data))
  },
  async updateMedicalRecord(id: string | number, payload: Partial<MedicalRecord> & Record<string, any>) {
    const response = await client.put(`/api/v1/medical/records/${id}`, toMedicalRecordUpdatePayload(payload))
    return normalizeRecord(readApiResponse<Record<string, any>>(response.data))
  },
  async completeMedicalRecord(id: string | number) {
    const response = await client.put(`/api/v1/medical/records/${id}/complete`)
    return readApiResponse(response.data)
  },
  async getClinicalOrders(params: { medicalRecordId?: number; patientId?: number }) {
    const response = await client.get('/api/v1/medical/clinical-orders', { params })
    return readApiResponse<Array<Record<string, any>>>(response.data)
  },
  async createClinicalOrder(payload: ClinicalOrderPayload) {
    if (!toPositiveNumber(payload.medicalRecordId)) throw new Error('Cần lưu bệnh án trước khi tạo chỉ định lâm sàng.')
    if (!text(payload.orderType) || !text(payload.orderName)) throw new Error('Vui lòng nhập loại và tên chỉ định.')
    const response = await client.post('/api/v1/medical/clinical-orders', payload)
    return readApiResponse(response.data)
  },
  async getMedicines(params?: { name?: string; activeIngredient?: string; status?: string }) {
    const response = await client.get('/api/v1/medical/medicines', { params })
    return readApiResponse<Medicine[]>(response.data)
  },
  async createPrescription(payload: { medicalRecordId: number; note?: string }) {
    if (!toPositiveNumber(payload.medicalRecordId)) throw new Error('Cần lưu bệnh án trước khi kê đơn.')
    const response = await client.post('/api/v1/medical/prescriptions', payload)
    return readApiResponse<Prescription>(response.data)
  },
  async addPrescriptionItem(id: string | number, payload: PrescriptionItemPayload) {
    const response = await client.post(`/api/v1/medical/prescriptions/${id}/items`, payload)
    return readApiResponse(response.data)
  },
  async submitPrescription(id: string | number, payload: { medicalRecordId?: number; note?: string; items: PrescriptionItemPayload[] }) {
    if (!payload.items.length) throw new Error('Vui lòng chọn ít nhất một thuốc trước khi chốt đơn.')
    const response = await client.put(`/api/v1/medical/prescriptions/${id}/submit`, payload)
    return readApiResponse<Prescription>(response.data)
  },
  async getPrescription(id: string | number) {
    const response = await client.get(`/api/v1/medical/prescriptions/${id}`)
    return readApiResponse<Prescription>(response.data)
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
        status: 'CheckedIn',
      },
    })
    return readApiResponse(response.data)
  },
}
