import { RoleId, type User } from '@/types/user'
import type { LoginResponse } from '@/services/authApi'

const now = () => new Date().toISOString()

const mockUsers: Record<string, User> = {
  admin: { id: 'u-admin', username: 'admin', fullName: 'Quản trị viên Hệ thống', email: 'admin@cliniccare.vn', phoneNumber: '0911222333', roleId: RoleId.Admin, roleName: 'Admin', createdAt: now() },
  doctor1: { id: 'u-doctor-1', username: 'doctor1', fullName: 'Bác sĩ Nguyễn Văn A', email: 'nguyenvana.doctor@cliniccare.vn', phoneNumber: '0922333401', roleId: RoleId.Doctor, roleName: 'Doctor', doctorId: 1, specialtyId: 1, specialtyName: 'Tim mạch', degree: 'Thạc sĩ, Bác sĩ CKI', examFee: 150000, createdAt: now() },
  doctor2: { id: 'u-doctor-2', username: 'doctor2', fullName: 'Bác sĩ Trần Thị B', email: 'tranthib.doctor@cliniccare.vn', phoneNumber: '0922333402', roleId: RoleId.Doctor, roleName: 'Doctor', doctorId: 2, specialtyId: 2, specialtyName: 'Nhi khoa', degree: 'Bác sĩ CKII', examFee: 120000, createdAt: now() },
  doctor3: { id: 'u-doctor-3', username: 'doctor3', fullName: 'Bác sĩ Lê Văn C', email: 'levanc.doctor@cliniccare.vn', phoneNumber: '0922333403', roleId: RoleId.Doctor, roleName: 'Doctor', doctorId: 3, specialtyId: 3, specialtyName: 'Da liễu', degree: 'Bác sĩ Da liễu', examFee: 100000, createdAt: now() },
  receptionist: { id: 'u-receptionist', username: 'receptionist', fullName: 'Tiếp tân Lê Thị Mai', email: 'maile.receptionist@cliniccare.vn', phoneNumber: '0933444555', roleId: RoleId.Receptionist, roleName: 'Receptionist', createdAt: now() },
  patient: { id: 'u-patient', username: 'patient', fullName: 'Bệnh nhân Nguyễn Văn Đức', email: 'vuduc@gmail.com', phoneNumber: '0909090909', roleId: RoleId.Patient, roleName: 'Patient', patientId: 4, createdAt: now() },
}

const aliases: Record<string, string> = {
  admin: 'admin', 'admin@cliniccare.vn': 'admin', doctor: 'doctor1', doctor1: 'doctor1', 'nguyenvana.doctor@cliniccare.vn': 'doctor1', doctor2: 'doctor2', 'tranthib.doctor@cliniccare.vn': 'doctor2', doctor3: 'doctor3', 'levanc.doctor@cliniccare.vn': 'doctor3', receptionist: 'receptionist', 'maile.receptionist@cliniccare.vn': 'receptionist', patient: 'patient', 'vuduc@gmail.com': 'patient',
}

export const authMock = {
  async login(identifier: string, password?: string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const matchedKey = aliases[identifier.trim().toLowerCase()] || ''
    if (!matchedKey) throw new Error('Tên đăng nhập hoặc email không tồn tại trong hệ thống mock.')
    const expectedPassword = `${matchedKey}123`
    if (password && password !== expectedPassword && password !== '123456') throw new Error(`Mật khẩu không chính xác. Hãy dùng "${expectedPassword}" hoặc "123456" để đăng nhập.`)
    return { token: `mock_token_${matchedKey}`, user: mockUsers[matchedKey] }
  },
  async getMe(token: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const user = mockUsers[token.replace('mock_token_', '')]
    if (!user) throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.')
    return user
  },
  async getUsers(): Promise<User[]> { await new Promise((resolve) => setTimeout(resolve, 180)); return Object.values(mockUsers) },
  async register(payload: any): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return { success: true, message: 'Đăng ký tài khoản giả lập thành công.', data: { id: `u-${Math.random().toString(36).substring(2, 9)}`, username: payload.username, fullName: payload.fullName, email: payload.email, phoneNumber: payload.phoneNumber, roleId: payload.roleId, roleName: RoleId[payload.roleId] || 'Patient', createdAt: now() } }
  },
}
