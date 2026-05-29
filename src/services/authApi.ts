import { createServiceClient, readApiResponse } from '@/services/apiClient'
import type { User, RoleId } from '@/types/user'

const client = createServiceClient('billing')
const useMock = import.meta.env.VITE_USE_MOCK_N3 === 'true'

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  username: string
  password?: string
  fullName: string
  email?: string
  phoneNumber?: string
  roleId: RoleId
}

export const authApi = {
  async login(payload: LoginRequest) {
    if (useMock) {
      const { authMock } = await import('@/mocks/auth.mock')
      return authMock.login(payload.identifier, payload.password)
    }
    const response = await client.post('/api/auth/login', {
      username: payload.identifier,
      password: payload.password,
    })
    return readApiResponse<LoginResponse>(response.data)
  },

  async register(payload: RegisterRequest) {
    if (useMock) {
      const { authMock } = await import('@/mocks/auth.mock')
      return authMock.register(payload)
    }
    const response = await client.post('/api/auth/register', payload)
    return readApiResponse<User>(response.data)
  },

  async getMe() {
    if (useMock) {
      const { authMock } = await import('@/mocks/auth.mock')
      const token = localStorage.getItem('cliniccare_token') || ''
      return authMock.getMe(token)
    }
    const response = await client.get('/api/auth/me')
    return readApiResponse<User>(response.data)
  },

  async getUsers() {
    if (useMock) {
      const { authMock } = await import('@/mocks/auth.mock')
      return authMock.getUsers()
    }
    const response = await client.get('/api/users')
    return readApiResponse<User[]>(response.data)
  },

  logout() {
    localStorage.removeItem('cliniccare_token')
  },
}