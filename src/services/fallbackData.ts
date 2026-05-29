import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Doctor } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'

const today = new Date().toISOString().slice(0, 10)

export const fallbackSpecialties: Specialty[] = [
  { specialtyId: 1, specialtyName: 'Tim m?ch' },
  { specialtyId: 2, specialtyName: 'Nhi khoa' },
  { specialtyId: 3, specialtyName: 'Da li?u' },
]

export const fallbackDoctors: Doctor[] = [
  {
    doctorId: 1,
    doctorName: 'B?c s? Nguy?n V?n A',
    specialtyId: 1,
    specialtyName: 'Tim m?ch',
    degree: 'Th?c s?, B?c s? CKI',
    examFee: 150000,
    isActive: true,
  },
  {
    doctorId: 2,
    doctorName: 'B?c s? Tr?n Th? B',
    specialtyId: 2,
    specialtyName: 'Nhi khoa',
    degree: 'B?c s? CKII',
    examFee: 120000,
    isActive: true,
  },
  {
    doctorId: 3,
    doctorName: 'B?c s? L? V?n C',
    specialtyId: 3,
    specialtyName: 'Da li?u',
    degree: 'B?c s? Da li?u',
    examFee: 100000,
    isActive: true,
  },
]

export const fallbackSlots = ['08:00', '08:30', '09:00', '09:30', '10:00']

export const fallbackQueue: WaitingQueueItem[] = [
  {
    id: 1,
    appointmentId: 2201,
    patientId: 12,
    doctorId: 1,
    queueNumber: 1,
    patientName: 'Nguy?n V?n D',
    doctorName: 'B?c s? Nguy?n V?n A',
    specialtyName: 'Tim m?ch',
    status: 'Waiting',
    appointmentDate: today,
    slotTime: '08:00',
    reason: '?au ng?c nh?',
  },
  {
    id: 2,
    appointmentId: 2202,
    patientId: 13,
    doctorId: 2,
    queueNumber: 2,
    patientName: 'Tr?n Th? M',
    doctorName: 'B?c s? Tr?n Th? B',
    specialtyName: 'Nhi khoa',
    status: 'InProgress',
    appointmentDate: today,
    slotTime: '09:00',
    reason: 'S?t, ho',
  },
  {
    id: 3,
    appointmentId: 2203,
    patientId: 14,
    doctorId: 3,
    queueNumber: 3,
    patientName: 'Ph?m Anh K',
    doctorName: 'B?c s? L? V?n C',
    specialtyName: 'Da li?u',
    status: 'Waiting',
    appointmentDate: today,
    slotTime: '09:30',
    reason: 'D? ?ng da',
  },
]

export const fallbackAppointments: Appointment[] = [
  {
    appointmentId: 2201,
    patientId: 12,
    patientName: 'Nguy?n V?n D',
    patientPhone: '0900000000',
    doctorId: 1,
    doctorName: 'B?c s? Nguy?n V?n A',
    specialtyId: 1,
    specialtyName: 'Tim m?ch',
    examFee: 150000,
    appointmentDate: today,
    slotTime: '08:00',
    status: 'Confirmed',
    queueNumber: 1,
    reason: '?au ng?c nh?',
  },
  {
    appointmentId: 2202,
    patientId: 13,
    patientName: 'Tr?n Th? M',
    patientPhone: '0911111111',
    doctorId: 2,
    doctorName: 'B?c s? Tr?n Th? B',
    specialtyId: 2,
    specialtyName: 'Nhi khoa',
    examFee: 120000,
    appointmentDate: today,
    slotTime: '09:00',
    status: 'Confirmed',
    queueNumber: 2,
    reason: 'S?t, ho',
  },
  {
    appointmentId: 2203,
    patientId: 14,
    patientName: 'Ph?m Anh K',
    patientPhone: '0922222222',
    doctorId: 3,
    doctorName: 'B?c s? L? V?n C',
    specialtyId: 3,
    specialtyName: 'Da li?u',
    examFee: 100000,
    appointmentDate: today,
    slotTime: '09:30',
    status: 'Pending',
    queueNumber: 3,
    reason: 'D? ?ng da',
  },
]
