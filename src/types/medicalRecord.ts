export interface Patient {
  patientId: string
  id?: number | string
  patientCode?: string
  patientIdCode?: string
  fullName: string
  email?: string
  phone?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  citizenId?: string
  bloodType?: string
  allergyNote?: string | null
  allergies?: string
  medicalHistory?: string | null
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface MedicalRecord {
  id?: number
  medicalRecordId?: number
  recordId?: string
  medicalRecordCode?: string
  medicalRecordIdCode?: string
  recordIdCode?: string
  visitId?: number
  patientId: string
  patientCode?: string
  patientIdCode?: string
  patientName?: string
  appointmentId?: string
  doctorId?: string | number
  doctorName?: string
  chiefComplaint?: string
  symptoms?: string
  vitalSignsJson?: string
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
