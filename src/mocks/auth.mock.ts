
import { RoleId, type User } from '@/types/user'
import type { LoginResponse } from '@/services/authApi'

const now = () => new Date().toISOString()

const mockUsers: Record<string, User> = {
  admin: {
    id: 'u-admin',
    username: 'admin',
    fullName: 'Qu?n tr? vi?n H? th?ng',
    email: 'admin@cliniccare.vn',
    phoneNumber: '0911222333',
    roleId: RoleId.Admin,
    roleName: 'Admin',
    createdAt: now(),
  },
  doctor1: {
    id: 'u-doctor-1',
    username: 'doctor1',
    fullName: 'B?c s? Nguy?n V?n A',
    email: 'nguyenvana.doctor@cliniccare.vn',
    phoneNumber: '0922333401',
    roleId: RoleId.Doctor,
    roleName: 'Doctor',
    doctorId: 1,
    specialtyId: 1,
    specialtyName: 'Tim m?ch',
    degree: 'Th?c s?, B?c s? CKI',
    examFee: 150000,
    createdAt: now(),
  },
  doctor2: {
    id: 'u-doctor-2',
    username: 'doctor2',
    fullName: 'B?c s? Tr?n Th? B',
    email: 'tranthib.doctor@cliniccare.vn',
    phoneNumber: '0922333402',
    roleId: RoleId.Doctor,
    roleName: 'Doctor',
    doctorId: 2,
    specialtyId: 2,
    specialtyName: 'Nhi khoa',
    degree: 'B?c s? CKII',
    examFee: 120000,
    createdAt: now(),
  },
  doctor3: {
    id: 'u-doctor-3',
    username: 'doctor3',
    fullName: 'B?c s? L? V?n C',
    email: 'levanc.doctor@cliniccare.vn',
    phoneNumber: '0922333403',
    roleId: RoleId.Doctor,
    roleName: 'Doctor',
    doctorId: 3,
    specialtyId: 3,
    specialtyName: 'Da li?u',
    degree: 'B?c s? Da li?u',
    examFee: 100000,
    createdAt: now(),
  },
  receptionist: {
    id: 'u-receptionist',
    username: 'receptionist',
    fullName: 'Ti?p t?n L? Th? Mai',
    email: 'maile.receptionist@cliniccare.vn',
    phoneNumber: '0933444555',
    roleId: RoleId.Receptionist,
    roleName: 'Receptionist',
    createdAt: now(),
  },
  patient: {
    id: 'u-patient',
    username: 'patient',
    fullName: 'B?nh nh?n Nguy?n V?n ??c',
    email: 'vuduc@gmail.com',
    phoneNumber: '0909090909',
    roleId: RoleId.Patient,
    roleName: 'Patient',
    patientId: 4,
    createdAt: now(),
  },
}

const aliases: Record<string, string> = {
  admin: 'admin',
  'admin@cliniccare.vn': 'admin',
  doctor: 'doctor1',
  doctor1: 'doctor1',
  'nguyenvana.doctor@cliniccare.vn': 'doctor1',
  doctor2: 'doctor2',
  'tranthib.doctor@cliniccare.vn': 'doctor2',
  doctor3: 'doctor3',
  'levanc.doctor@cliniccare.vn': 'doctor3',
  receptionist: 'receptionist',
  'maile.receptionist@cliniccare.vn': 'receptionist',
  patient: 'patient',
  'vuduc@gmail.com': 'patient',
}

export const authMock = {
  async login(identifier: string, password?: string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const cleanIdentifier = identifier.trim().toLowerCase()
    const matchedKey = aliases[cleanIdentifier] || ''
    if (!matchedKey) throw new Error('T?n ??ng nh?p ho?c email kh?ng t?n t?i trong h? th?ng mock.')
    const expectedPassword = `${matchedKey}123`
    if (password && password !== expectedPassword && password !== '123456') {
      throw new Error(`M?t kh?u kh?ng ch?nh x?c. H?y d?ng "${expectedPassword}" ho?c "123456" ?? ??ng nh?p.`)
    }
    return { token: `mock_token_${matchedKey}`, user: mockUsers[matchedKey] }
  },

  async getMe(token: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const matchedKey = token.replace('mock_token_', '')
    const user = mockUsers[matchedKey]
    if (!user) throw new Error('Phi?n ??ng nh?p kh?ng h?p l? ho?c ?? h?t h?n.')
    return user
  },

  async getUsers(): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 180))
    return Object.values(mockUsers)
  },

  async register(payload: any): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return {
      success: true,
      message: '??ng k? t?i kho?n gi? l?p th?nh c?ng.',
      data: {
        id: `u-${Math.random().toString(36).substring(2, 9)}`,
        username: payload.username,
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        roleId: payload.roleId,
        roleName: RoleId[payload.roleId] || 'Patient',
        createdAt: now(),
      },
    }
  },
}
