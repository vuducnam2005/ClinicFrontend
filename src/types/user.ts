export enum RoleId {
  Admin = 1,
  Doctor = 2,
  Receptionist = 3,
  Patient = 4,
}

export interface User {
  id: string
  username: string
  fullName: string
  email?: string
  phoneNumber?: string
  roleId: RoleId
  roleName: string
  createdAt: string
  doctorId?: number
  specialtyId?: number
  specialtyName?: string
  degree?: string
  examFee?: number
  patientId?: number | string
}
