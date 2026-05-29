import { defineStore } from 'pinia'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackDoctors, fallbackSlots, fallbackSpecialties } from '@/services/fallbackData'
import type { Doctor } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'

export const useAppointmentStore = defineStore('appointment', {
  state: () => ({
    specialties: [] as Specialty[],
    doctors: [] as Doctor[],
    loading: false,
    error: '',
    usingFallback: false,
  }),
  actions: {
    async loadCatalog() {
      this.loading = true
      this.error = ''
      try {
        const [specialties, doctors] = await Promise.all([
          appointmentApi.getSpecialties(),
          appointmentApi.getDoctors(),
        ])
        this.specialties = specialties.length ? specialties : fallbackSpecialties
        this.doctors = doctors.length ? doctors : fallbackDoctors
        this.usingFallback = !specialties.length || !doctors.length
      } catch (error) {
        this.specialties = fallbackSpecialties
        this.doctors = fallbackDoctors
        this.usingFallback = true
        this.error = error instanceof Error ? error.message : 'Không thể tải danh mục'
      } finally {
        this.loading = false
      }
    },
    async loadSlots(doctorId: number, date: string) {
      try {
        const slots = await appointmentApi.getAvailableSlots(doctorId, date)
        this.usingFallback = false
        return slots
      } catch {
        this.usingFallback = true
        return fallbackSlots
      }
    },
  },
})
