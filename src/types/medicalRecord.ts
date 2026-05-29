export interface Patient {
  patientId: string
  fullName: string
  phone?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  medicalHistory?: string | null
  createdAt?: string
}

export interface MedicalRecord {
  medicalRecordId?: number
  recordId?: string
  patientId: string
  appointmentId?: string
  doctorId?: string | number
  doctorName?: string
  symptoms?: string
  diagnosis?: string
  doctorNotes?: string
  examDate?: string
  createdAt?: string
}
