export interface Doctor {
  doctorId: number
  doctorName: string
  fullName?: string
  specialtyId: number
  specialtyName: string
  examFee: number
  degree?: string
  experienceYears?: number
  phone?: string
  email?: string
  gender?: string
  dateOfBirth?: string
  description?: string
  avatarUrl?: string
  roomNumber?: string
  userId?: string | number | null
  createdAt?: string
  updatedAt?: string | null
  isActive?: boolean
}

export interface DoctorSchedule {
  scheduleId: number
  doctorId: number
  doctorName: string
  workDate: string
  startTime: string
  endTime: string
  slotDurationMinutes?: number
  isAvailable?: boolean
}