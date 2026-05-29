import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord } from '@/types/medicalRecord'
import type { User } from '@/types/user'

function normalize(value?: string) {
  return String(value || '').trim().toLowerCase()
}

export function currentDoctorId(user?: User | null) {
  return Number(user?.doctorId || 0)
}

export function isCurrentDoctorName(user: User | null | undefined, value?: string) {
  return Boolean(user?.fullName && normalize(value) === normalize(user.fullName))
}

export function filterAppointmentsForDoctor(items: Appointment[], user?: User | null) {
  const doctorId = currentDoctorId(user)
  if (!doctorId) return items
  return items.filter((item) => Number(item.doctorId) === doctorId || isCurrentDoctorName(user, item.doctorName))
}

export function filterQueueForDoctor(items: WaitingQueueItem[], user?: User | null) {
  const doctorId = currentDoctorId(user)
  if (!doctorId) return items
  return items.filter((item) => Number(item.doctorId || 0) === doctorId || isCurrentDoctorName(user, item.doctorName))
}

export function filterSchedulesForDoctor(items: DoctorSchedule[], user?: User | null) {
  const doctorId = currentDoctorId(user)
  if (!doctorId) return items
  return items.filter((item) => Number(item.doctorId) === doctorId || isCurrentDoctorName(user, item.doctorName))
}

export function filterRecordsForDoctor(items: MedicalRecord[], user?: User | null) {
  const doctorId = currentDoctorId(user)
  if (!doctorId) return items
  return items.filter((item) => !item.doctorId || Number(item.doctorId) === doctorId || isCurrentDoctorName(user, item.doctorName))
}
