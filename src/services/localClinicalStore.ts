import type { Invoice, Prescription, PrescriptionItem } from '@/types/billing'
import type { MedicalRecord } from '@/types/medicalRecord'

const RECORDS_KEY = 'clinic_local_medical_records'
const PRESCRIPTIONS_KEY = 'clinic_local_prescriptions'
const INVOICES_KEY = 'clinic_local_invoices'

type AnyRow = Record<string, any>
type LocalRecord = MedicalRecord & AnyRow
type LocalPrescription = Prescription & AnyRow
type LocalInvoice = Invoice & AnyRow

function canStore() {
  return typeof localStorage !== 'undefined'
}

function readList<T>(key: string): T[] {
  if (!canStore()) return []
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeList<T>(key: string, items: T[]) {
  if (!canStore()) return
  localStorage.setItem(key, JSON.stringify(items))
}

function upsert<T extends AnyRow>(key: string, item: T, identity: (value: T) => string) {
  const items = readList<T>(key)
  const id = identity(item)
  const index = items.findIndex((value) => identity(value) === id)
  if (index >= 0) items[index] = { ...items[index], ...item }
  else items.unshift(item)
  writeList(key, items)
  return item
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return 0
}

function patientKeysOf(row: AnyRow) {
  return Array.from(new Set([
    row.patientId,
    row.PatientId,
    row.patientCode,
    row.PatientCode,
    row.patient?.patientId,
    row.patient?.patientCode,
    row.raw?.patientId,
    row.raw?.PatientId,
    row.raw?.patientCode,
    row.raw?.PatientCode,
  ].map(text).filter(Boolean)))
}

function matchesPatient(item: AnyRow, keys?: Array<string | number>) {
  if (!keys?.length) return true
  const normalizedKeys = new Set(keys.map(text).filter(Boolean))
  return patientKeysOf(item).some((key) => normalizedKeys.has(key))
}

function localId(prefix: string, appointmentId?: unknown) {
  return `${prefix}-${appointmentId || Date.now()}`
}

export const localClinicalStore = {
  saveMedicalRecord(input: {
    row: AnyRow
    symptoms: string
    diagnosis: string
    doctorNotes: string
    recheckDate?: string
  }) {
    const appointmentId = input.row.appointmentId || input.row.id
    const record: LocalRecord = {
      medicalRecordId: numberValue(appointmentId) || Date.now(),
      recordId: localId('MRL', appointmentId),
      appointmentId: text(appointmentId),
      patientId: text(input.row.patientId || input.row.PatientId || input.row.patientCode || input.row.PatientCode),
      patientCode: text(input.row.patientId || input.row.PatientId || input.row.patientCode || input.row.PatientCode),
      patientName: input.row.patientName || input.row.PatientName,
      patientPhone: input.row.patientPhone || input.row.PatientPhone,
      doctorId: input.row.doctorId || input.row.DoctorId,
      doctorName: input.row.doctorName || input.row.DoctorName,
      symptoms: input.symptoms,
      diagnosis: input.diagnosis,
      doctorNotes: input.doctorNotes,
      recheckDate: input.recheckDate,
      createdAt: new Date().toISOString(),
      source: 'local-clinical-sync',
    }
    return upsert(RECORDS_KEY, record, (value) => String(value.appointmentId || value.recordId || value.medicalRecordId))
  },

  savePrescription(input: {
    row: AnyRow
    record: MedicalRecord & AnyRow
    note: string
    items: PrescriptionItem[]
  }) {
    const appointmentId = input.row.appointmentId || input.row.id || input.record.appointmentId
    const prescription: LocalPrescription = {
      prescriptionId: numberValue(appointmentId) || Date.now(),
      prescriptionCode: localId('RXL', appointmentId),
      medicalRecordId: numberValue(input.record.medicalRecordId),
      medicalRecordCode: input.record.recordId,
      appointmentId: numberValue(appointmentId) || undefined,
      patientId: text(input.row.patientId || input.row.PatientId || input.row.patientCode || input.row.PatientCode),
      patientCode: text(input.row.patientId || input.row.PatientId || input.row.patientCode || input.row.PatientCode),
      patientName: input.row.patientName || input.row.PatientName,
      doctorId: numberValue(input.row.doctorId || input.row.DoctorId),
      status: 'Pending',
      note: input.note,
      items: input.items,
      createdAt: new Date().toISOString(),
      source: 'local-clinical-sync',
    }
    return upsert(PRESCRIPTIONS_KEY, prescription, (value) => String(value.appointmentId || value.prescriptionCode || value.prescriptionId))
  },

  saveInvoiceFromAppointment(row: AnyRow) {
    const appointmentId = row.appointmentId || row.id || row.AppointmentId
    const amount = numberValue(row.examFee, row.ExamFee, row.feeValue, row.raw?.examFee, row.raw?.ExamFee, row.raw?.doctor?.examFee, row.raw?.Doctor?.ExamFee)
    const invoice: LocalInvoice = {
      invoiceId: numberValue(appointmentId) || Date.now(),
      invoiceCode: localId('HDL', appointmentId),
      appointmentId: numberValue(appointmentId) || undefined,
      patientId: text(row.patientId || row.PatientId || row.patientCode || row.PatientCode || row.raw?.patientId || row.raw?.PatientId),
      patientCode: text(row.patientId || row.PatientId || row.patientCode || row.PatientCode || row.raw?.patientId || row.raw?.PatientId),
      patientName: row.patientName || row.PatientName || row.raw?.patientName || row.raw?.PatientName,
      amount,
      totalAmount: amount,
      examinationFee: amount,
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
      source: 'local-clinical-sync',
    }
    return upsert(INVOICES_KEY, invoice, (value) => String(value.appointmentId || value.invoiceCode || value.invoiceId))
  },

  getMedicalRecords(keys?: Array<string | number>) {
    return readList<LocalRecord>(RECORDS_KEY).filter((item) => matchesPatient(item, keys))
  },

  getPrescriptions(keys?: Array<string | number>) {
    return readList<LocalPrescription>(PRESCRIPTIONS_KEY).filter((item) => matchesPatient(item, keys))
  },

  getInvoices(keys?: Array<string | number>) {
    return readList<LocalInvoice>(INVOICES_KEY).filter((item) => matchesPatient(item, keys))
  },
}
