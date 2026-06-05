import { createServiceClient, readApiResponse } from '@/services/apiClient'
import { RoleId, type User } from '@/types/user'

const client = createServiceClient('billing')

function roleIdFromName(role?: string | number): RoleId {
  if (typeof role === 'number') return role as RoleId
  const value = String(role || '').toLowerCase()
  if (value === 'admin') return RoleId.Admin
  if (value === 'doctor') return RoleId.Doctor
  if (value === 'receptionist' || value === 'nurse') return RoleId.Receptionist
  return RoleId.Patient
}

function normalizeUser(payload: any): User {
  const roleName = payload?.roleName || payload?.role || payload?.userRole || 'Patient'
  return {
    id: String(payload?.id ?? payload?.userId ?? payload?.accountId ?? ''),
    username: payload?.username || payload?.email || '',
    fullName: payload?.fullName || payload?.name || payload?.username || payload?.email || '',
    email: payload?.email,
    phoneNumber: payload?.phoneNumber || payload?.phone,
    roleId: roleIdFromName(payload?.roleId ?? roleName),
    roleName,
    createdAt: payload?.createdAt || new Date().toISOString(),
    doctorId: payload?.doctorId,
    specialtyId: payload?.specialtyId,
    specialtyName: payload?.specialtyName,
    degree: payload?.degree,
    examFee: payload?.examFee,
    patientId: payload?.patientId,
  }
}

function normalizeLoginResponse(payload: any): LoginResponse {
  const data = readApiResponse<any>(payload)
  const token = data?.token || data?.accessToken || data?.jwt || data?.data?.token || data?.data?.accessToken
  const rawUser = data?.user || data?.profile || data?.account || data?.data?.user || data
  if (!token) throw new Error('API đăng nhập không trả về token hợp lệ')
  return {
    token,
    user: normalizeUser(rawUser),
  }
}

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

export interface UpdateProfileRequest {
  fullName: string
  email: string
  phoneNumber?: string
}

export const authApi = {
  async login(payload: LoginRequest) {
    const identifier = payload.identifier.trim()
    const body = {
      email: identifier,
      username: identifier,
      password: payload.password,
    }
    const response = await postLoginWithTransientRetry(body)
    return normalizeLoginResponse(response.data)
  },

  async register(payload: RegisterRequest) {
    const response = await client.post('/api/auth/register', {
      fullName: payload.fullName,
      email: payload.email,
      username: payload.username,
      password: payload.password,
      phoneNumber: payload.phoneNumber,
      role: RoleId[payload.roleId] || 'Patient',
    })
    return normalizeUser(readApiResponse<any>(response.data))
  },

  async checkDuplicate(payload: { username?: string; email?: string; phoneNumber?: string }) {
    const response = await client.post('/api/auth/check-duplicate', payload)
    return response.data as {
      usernameExists: boolean
      emailExists: boolean
      phoneNumberExists: boolean
    }
  },

  async getMe() {
    const response = await client.get('/api/auth/profile')
    return normalizeUser(readApiResponse<any>(response.data))
  },

  async updateProfile(payload: UpdateProfileRequest) {
    const response = await client.put('/api/auth/profile', payload)
    return normalizeUser(readApiResponse<any>(response.data))
  },

  async getUsers() {
    const responses = await Promise.all([
      client.get('/api/auth/users/doctors'),
      client.get('/api/auth/users/nurses'),
      client.get('/api/auth/users/patients'),
    ])
    return responses.flatMap((response) => readApiResponse<any[]>(response.data).map(normalizeUser))
  },

  logout() {
    localStorage.removeItem('cliniccare_token')
  },
}

async function postLoginWithTransientRetry(body: Record<string, unknown>) {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await client.post('/api/auth/login', body)
    } catch (error) {
      lastError = error
      if (!isTransientAuthError(error) || attempt === 2) throw error
      await delay(350 * (attempt + 1))
    }
  }
  throw lastError
}

function isTransientAuthError(error: unknown) {
  const data = (error as any)?.response?.data
  const message = String(data?.message || data?.Message || (error as any)?.message || '').toLowerCase()
  return message.includes('transient') || message.includes('timeout') || message.includes('temporar')
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
