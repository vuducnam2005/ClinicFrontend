import { defineStore } from 'pinia'
import { authApi, type LoginRequest } from '@/services/authApi'
import { appointmentApi } from '@/services/appointmentApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { RoleId } from '@/types/user'
import type { User } from '@/types/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('cliniccare_token') || '',
    user: null as User | null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    roleId: (state) => state.user?.roleId,
    isAdmin: (state) => state.user?.roleId === 1,
    isDoctor: (state) => state.user?.roleId === 2,
    isReceptionist: (state) => state.user?.roleId === 3,
    isPatient: (state) => state.user?.roleId === 4,
  },
  actions: {
    async login(payload: LoginRequest) {
      this.loading = true
      try {
        const result = await authApi.login(payload)
        this.token = result.token
        this.user = result.user
        localStorage.setItem('cliniccare_token', result.token)
        await this.resolveDoctorProfile()
        await this.resolvePatientProfile()
      } finally {
        this.loading = false
      }
    },
    async loginWithGoogle(idToken: string) {
      this.loading = true
      try {
        const result = await authApi.loginWithGoogle(idToken)
        this.token = result.token
        this.user = result.user
        localStorage.setItem('cliniccare_token', result.token)
        await this.resolveDoctorProfile()
        await this.resolvePatientProfile()
      } finally {
        this.loading = false
      }
    },
    async loginWithToken(token: string) {
      this.loading = true
      try {
        this.token = token
        localStorage.setItem('cliniccare_token', token)
        this.user = await authApi.getMe()
        await this.resolveDoctorProfile()
        await this.resolvePatientProfile()
      } catch (error) {
        this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchMe() {
      if (!this.token) return
      try {
        const user = await authApi.getMe()
        this.user = user
        await this.resolveDoctorProfile()
        await this.resolvePatientProfile()
      } catch (error) {
        console.error('Failed to fetch user', error)
        this.logout()
      }
    },
    logout() {
      authApi.logout()
      this.token = ''
      this.user = null
    },
    async resolveDoctorProfile() {
      const userId = Number(this.user?.id)
      if (!this.user || this.user.roleId !== RoleId.Doctor || this.user.doctorId || !Number.isFinite(userId) || userId <= 0) return
      try {
        const doctor = await appointmentApi.getDoctorByUser(userId)
        this.user = {
          ...this.user,
          doctorId: Number(doctor.doctorId || 0) || undefined,
          specialtyId: doctor.specialtyId ?? this.user.specialtyId,
          specialtyName: doctor.specialtyName ?? this.user.specialtyName,
          degree: doctor.degree ?? this.user.degree,
          examFee: doctor.examFee ?? this.user.examFee,
          fullName: doctor.fullName || doctor.doctorName || this.user.fullName,
        }
      } catch (error) {
        console.warn('Failed to resolve doctor profile', error)
      }
    },
    async updateProfile(payload: { fullName: string; email: string; phoneNumber?: string }) {
      try {
        const updated = await authApi.updateProfile(payload)
        this.user = {
          ...updated,
          patientId: updated.patientId ?? this.user?.patientId,
        }
      } catch (error) {
        if (!isUnsupportedProfileUpdate(error) || !this.user) throw error
        this.user = {
          ...this.user,
          fullName: payload.fullName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
        }
      }
      await this.resolvePatientProfile()
      return this.user
    },
    async resolvePatientProfile() {
      if (!this.user || this.user.roleId !== RoleId.Patient) return
      try {
        const user = this.user
        const patient = await medicalRecordApi.getCurrentPatient()

        const patientId = Number(patient.id || patient.patientId)
        this.user = {
          ...user,
          patientId: Number.isFinite(patientId) && patientId > 0 ? patientId : user.patientId,
          fullName: patient.fullName || user.fullName,
          email: patient.email || user.email,
          phoneNumber: patient.phoneNumber || patient.phone || user.phoneNumber,
        }
      } catch (error) {
        const status = (error as any)?.response?.status
        if (status === 401 || status === 403) {
          console.warn('Patient profile is not accessible with current token. Please logout/login again.', error)
          return
        }
        console.warn('Failed to resolve patient profile', error)
      }
    },
  },
})

function isUnsupportedProfileUpdate(error: unknown) {
  return (error as any)?.response?.status === 404 || (error as any)?.response?.status === 405
}
