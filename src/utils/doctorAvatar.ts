import type { Doctor } from '@/types/doctor'

const maleDoctorAvatarUrl = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80'
const femaleDoctorAvatarUrl = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80'
const neutralDoctorAvatarUrl = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80'

export function doctorAvatarUrl(doctor?: Pick<Doctor, 'avatarUrl' | 'gender'> | null) {
  const avatarUrl = doctor?.avatarUrl?.trim()
  if (avatarUrl) return avatarUrl

  const gender = doctor?.gender?.trim().toLowerCase()
  if (gender === 'female' || gender === 'nữ' || gender === 'nu') return femaleDoctorAvatarUrl
  if (gender === 'male' || gender === 'nam') return maleDoctorAvatarUrl

  return neutralDoctorAvatarUrl
}
