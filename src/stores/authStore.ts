import { defineStore } from 'pinia'
import { authApi, type LoginRequest } from '@/services/authApi'
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
  },
})
