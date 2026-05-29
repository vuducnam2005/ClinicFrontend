import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { Appointment, CreateAppointmentRequest, WaitingQueueItem } from '@/types/appointment'
import type { Doctor, DoctorSchedule } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'

const client = createServiceClient('appointment')

function normalizeSlot(slot: unknown) {
  if (typeof slot === 'string') return slot.slice(0, 5)
  if (slot && typeof slot === 'object') {
    const value = (slot as any).slotTime || (slot as any).time || (slot as any).startTime || (slot as any).value
    if (typeof value === 'string') return value.slice(0, 5)
  }
  return String(slot || '').slice(0, 5)
}

function queueIdentity(item: WaitingQueueItem) {
  return item.id || item.queueId || item.appointmentId
}

export const appointmentApi = {
  async getSpecialties() {
    const response = await client.get('/api/specialties')
    return readApiResponse<Specialty[]>(response.data)
  },
  async getSpecialty(id: number) {
    const response = await client.get(`/api/specialties/${id}`)
    return readApiResponse<Specialty>(response.data)
  },
  async createSpecialty(payload: Partial<Specialty>) {
    const response = await client.post('/api/specialties', payload)
    return readApiResponse<Specialty>(response.data)
  },
  async updateSpecialty(id: number, payload: Partial<Specialty>) {
    const response = await client.put(`/api/specialties/${id}`, payload)
    return readApiResponse<Specialty>(response.data)
  },
  async deleteSpecialty(id: number) {
    const response = await client.delete(`/api/specialties/${id}`)
    return readApiResponse<void>(response.data)
  },
  async getDoctors() {
    const response = await client.get('/api/doctors')
    return readApiResponse<Doctor[]>(response.data)
  },
  async getDoctor(id: number) {
    const response = await client.get(`/api/doctors/${id}`)
    return readApiResponse<Doctor>(response.data)
  },
  async getDoctorsBySpecialty(specialtyId: number) {
    const response = await client.get(`/api/doctors/by-specialty/${specialtyId}`)
    return readApiResponse<Doctor[]>(response.data)
  },
  async createDoctor(payload: Partial<Doctor>) {
    const response = await client.post('/api/doctors', payload)
    return readApiResponse<Doctor>(response.data)
  },
  async updateDoctor(id: number, payload: Partial<Doctor>) {
    const response = await client.put(`/api/doctors/${id}`, payload)
    return readApiResponse<Doctor>(response.data)
  },
  async deleteDoctor(id: number) {
    const response = await client.delete(`/api/doctors/${id}`)
    return readApiResponse<void>(response.data)
  },
  async getDoctorSchedules() {
    const response = await client.get('/api/doctor-schedules')
    return readApiResponse<DoctorSchedule[]>(response.data)
  },
  async getDoctorSchedulesByDoctor(doctorId: number) {
    const response = await client.get(`/api/doctor-schedules/doctor/${doctorId}`)
    return readApiResponse<DoctorSchedule[]>(response.data)
  },
  async createDoctorSchedule(payload: Partial<DoctorSchedule>) {
    const response = await client.post('/api/doctor-schedules', payload)
    return readApiResponse<DoctorSchedule>(response.data)
  },
  async updateDoctorSchedule(id: number, payload: Partial<DoctorSchedule>) {
    const response = await client.put(`/api/doctor-schedules/${id}`, payload)
    return readApiResponse<DoctorSchedule>(response.data)
  },
  async deleteDoctorSchedule(id: number) {
    const response = await client.delete(`/api/doctor-schedules/${id}`)
    return readApiResponse<void>(response.data)
  },
  async getAvailableSlots(doctorId: number, date: string) {
    const response = await client.get(`/api/doctors/${doctorId}/available-slots`, { params: { date } })
    const data = readApiResponse<unknown[]>(response.data)
    return data.map(normalizeSlot).filter(Boolean)
  },
  async getAppointments() {
    const response = await client.get('/api/appointments')
    return readApiResponse<Appointment[]>(response.data)
  },
  async getConfirmedAppointments() {
    const response = await client.get('/api/appointments/confirmed')
    return readApiResponse<Appointment[]>(response.data)
  },
  async getAppointmentsByPatient(patientId: number) {
    const response = await client.get(`/api/appointments/patient/${patientId}`)
    return readApiResponse<Appointment[]>(response.data)
  },
  async getAppointmentsByDoctor(doctorId: number) {
    const response = await client.get(`/api/appointments/doctor/${doctorId}`)
    return readApiResponse<Appointment[]>(response.data)
  },
  async createAppointment(payload: CreateAppointmentRequest) {
    const response = await client.post('/api/appointments', payload)
    return readApiResponse<Appointment>(response.data)
  },
  async confirmAppointment(id: number) {
    const response = await client.put(`/api/appointments/${id}/confirm`)
    return readApiResponse<Appointment>(response.data)
  },
  async cancelAppointment(id: number) {
    const response = await client.put(`/api/appointments/${id}/cancel`)
    return readApiResponse<Appointment>(response.data)
  },
  async completeAppointment(id: number) {
    const response = await client.put(`/api/appointments/${id}/complete`)
    return readApiResponse<Appointment>(response.data)
  },
  async getWaitingQueue(date: string) {
    const response = await client.get('/api/waiting-queue', { params: { date } })
    return readApiResponse<WaitingQueueItem[]>(response.data)
  },
  async getWaitingQueueItem(id: number) {
    const response = await client.get(`/api/waiting-queue/${id}`)
    return readApiResponse<WaitingQueueItem>(response.data)
  },
  async setQueueInProgress(idOrItem: number | WaitingQueueItem) {
    const id = typeof idOrItem === 'number' ? idOrItem : queueIdentity(idOrItem)
    const response = await client.put(`/api/waiting-queue/${id}/in-progress`)
    return readApiResponse<WaitingQueueItem | Appointment>(response.data)
  },
  async setQueueDone(idOrItem: number | WaitingQueueItem) {
    const id = typeof idOrItem === 'number' ? idOrItem : queueIdentity(idOrItem)
    const response = await client.put(`/api/waiting-queue/${id}/done`)
    return readApiResponse<WaitingQueueItem | Appointment>(response.data)
  },
  async cancelQueueItem(idOrItem: number | WaitingQueueItem) {
    const id = typeof idOrItem === 'number' ? idOrItem : queueIdentity(idOrItem)
    const response = await client.put(`/api/waiting-queue/${id}/cancel`)
    return readApiResponse<WaitingQueueItem | Appointment>(response.data)
  },
  async getHealth() {
    const response = await client.get('/api/health')
    return response.data
  },
}