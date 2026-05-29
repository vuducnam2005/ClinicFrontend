export type AppointmentStatus = 'Pending' | 'Confirmed' | 'InProgress' | 'Cancelled' | 'Completed' | string

export interface Appointment {
  appointmentId: number
  patientId: number
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
  queueNumber: number
  reason?: string
}

export interface CreateAppointmentRequest {
  patientId: number
  patientNameSnapshot: string
  patientPhoneSnapshot: string
  doctorId: number
  appointmentDate: string
  slotTime: string
  reason?: string
}

export type QueueStatus = 'Waiting' | 'InProgress' | 'Done' | 'Cancelled' | string

export interface WaitingQueueItem {
  id?: number
  queueId?: number
  appointmentId: number
  patientId?: number
  doctorId?: number
  queueNumber: number
  patientName?: string
  patientPhone?: string
  doctorName?: string
  specialtyName?: string
  status: QueueStatus
  appointmentDate: string
  slotTime?: string
  reason?: string
}