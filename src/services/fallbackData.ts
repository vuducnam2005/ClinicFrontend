import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Doctor } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'

const today = new Date().toISOString().slice(0, 10)

export const fallbackSpecialties: Specialty[] = [
  { specialtyId: 1, specialtyName: 'Tim mạch' },
  { specialtyId: 2, specialtyName: 'Nhi khoa' },
  { specialtyId: 3, specialtyName: 'Da liễu' },
]

export const fallbackDoctors: Doctor[] = [
  {
    doctorId: 1,
    doctorName: 'Bác sĩ Nguyễn Văn A',
    specialtyId: 1,
    specialtyName: 'Tim mạch',
    degree: 'Thạc sĩ, Bác sĩ CKI',
    examFee: 150000,
    isActive: true,
  },
  {
    doctorId: 2,
    doctorName: 'Bác sĩ Trần Thị B',
    specialtyId: 2,
    specialtyName: 'Nhi khoa',
    degree: 'Bác sĩ CKII',
    examFee: 120000,
    isActive: true,
  },
  {
    doctorId: 3,
    doctorName: 'Bác sĩ Lê Văn C',
    specialtyId: 3,
    specialtyName: 'Da liễu',
    degree: 'Bác sĩ Da liễu',
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
    patientName: 'Nguyễn Văn D',
    doctorName: 'Bác sĩ Nguyễn Văn A',
    specialtyName: 'Tim mạch',
    status: 'Waiting',
    appointmentDate: today,
    slotTime: '08:00',
    reason: 'Đau ngực nhẹ',
  },
  {
    id: 2,
    appointmentId: 2202,
    patientId: 13,
    doctorId: 2,
    queueNumber: 2,
    patientName: 'Trần Thị M',
    doctorName: 'Bác sĩ Trần Thị B',
    specialtyName: 'Nhi khoa',
    status: 'InProgress',
    appointmentDate: today,
    slotTime: '09:00',
    reason: 'Sốt, ho',
  },
  {
    id: 3,
    appointmentId: 2203,
    patientId: 14,
    doctorId: 3,
    queueNumber: 3,
    patientName: 'Phạm Anh K',
    doctorName: 'Bác sĩ Lê Văn C',
    specialtyName: 'Da liễu',
    status: 'Waiting',
    appointmentDate: today,
    slotTime: '09:30',
    reason: 'Dị ứng da',
  },
]

export const fallbackAppointments: Appointment[] = [
  {
    appointmentId: 2201,
    patientId: 12,
    patientName: 'Nguyễn Văn D',
    patientPhone: '0900000000',
    doctorId: 1,
    doctorName: 'Bác sĩ Nguyễn Văn A',
    specialtyId: 1,
    specialtyName: 'Tim mạch',
    examFee: 150000,
    appointmentDate: today,
    slotTime: '08:00',
    status: 'Confirmed',
    queueNumber: 1,
    reason: 'Đau ngực nhẹ',
  },
  {
    appointmentId: 2202,
    patientId: 13,
    patientName: 'Trần Thị M',
    patientPhone: '0911111111',
    doctorId: 2,
    doctorName: 'Bác sĩ Trần Thị B',
    specialtyId: 2,
    specialtyName: 'Nhi khoa',
    examFee: 120000,
    appointmentDate: today,
    slotTime: '09:00',
    status: 'Confirmed',
    queueNumber: 2,
    reason: 'Sốt, ho',
  },
  {
    appointmentId: 2203,
    patientId: 14,
    patientName: 'Phạm Anh K',
    patientPhone: '0922222222',
    doctorId: 3,
    doctorName: 'Bác sĩ Lê Văn C',
    specialtyId: 3,
    specialtyName: 'Da liễu',
    examFee: 100000,
    appointmentDate: today,
    slotTime: '09:30',
    status: 'Pending',
    queueNumber: 3,
    reason: 'Dị ứng da',
  },
]
