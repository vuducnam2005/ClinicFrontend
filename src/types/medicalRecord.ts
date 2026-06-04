export interface Patient {
  patientId: string
  id?: number | string
  patientCode?: string
  fullName: string
  phone?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  allergies?: string
  medicalHistory?: string | null
  createdAt?: string
}

export interface MedicalRecord {
  id?: number
  medicalRecordId?: number
  recordId?: string
  medicalRecordCode?: string
  visitId?: number
  patientId: string
  patientCode?: string
  appointmentId?: string
  doctorId?: string | number
  doctorName?: string
  symptoms?: string
  diagnosis?: string
  diagnosisCode?: string
  diagnosisText?: string
  doctorNotes?: string
  doctorNote?: string
  treatmentPlan?: string
  followUpDate?: string
  status?: string
  examDate?: string
  createdAt?: string
  updatedAt?: string
  completedAt?: string
}
