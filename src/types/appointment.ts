export type AppointmentStatus = 'Pending' | 'Confirmed' | 'CheckedIn' | 'InProgress' | 'Cancelled' | 'Completed' | 'NoShow' | 'Expired' | string

export interface Appointment {
  appointmentId: number
  appointmentCode?: string
  patientId: number | string
  patientName: string
  patientPhone: string
  doctorId: number
  doctorName: string
  specialtyId: number
  specialtyName: string
  examFee: number
  appointmentDate: string
  slotTime: string
  status: AppointmentStatus
  queueNumber?: number | null
  reason?: string
  cancelReason?: string
  createdAt?: string
  updatedAt?: string
  checkedInAt?: string
  startedAt?: string
  completedAt?: string
}

export interface CreateAppointmentRequest {
  patientId?: number
  patientNameSnapshot: string
  patientPhoneSnapshot: string
  doctorId: number
  appointmentDate: string
  slotTime: string
  reason?: string
}

export type QueueStatus = 'Waiting' | 'CheckedIn' | 'InProgress' | 'Done' | 'Cancelled' | string

export interface WaitingQueueItem {
  id?: number
  queueId?: number
  appointmentId: number
  patientId?: number | string
  doctorId?: number
  queueNumber: number
  patientName?: string
  patientPhone?: string
  doctorName?: string
  specialtyName?: string
  status: QueueStatus
  queueStatus?: QueueStatus
  appointmentStatus?: AppointmentStatus
  queueDate?: string
  appointmentDate: string
  slotTime?: string
  reason?: string
  createdAt?: string
}
