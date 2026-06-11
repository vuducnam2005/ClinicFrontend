import type { Doctor } from '@/types/doctor'

const maleDoctorAvatarUrls = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=600&q=80',
]

const femaleDoctorAvatarUrls = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
]

const neutralDoctorAvatarUrls = [
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
]

const legacyGenericAvatarUrls = new Set([
  maleDoctorAvatarUrls[0],
  femaleDoctorAvatarUrls[0],
  neutralDoctorAvatarUrls[0],
])

type DoctorAvatarSource = Pick<Doctor, 'avatarUrl' | 'gender'> & Partial<Pick<Doctor, 'doctorId' | 'doctorName' | 'fullName'>>

export function doctorAvatarUrl(doctor?: DoctorAvatarSource | null) {
  const avatarUrl = doctor?.avatarUrl?.trim()
  if (avatarUrl && !legacyGenericAvatarUrls.has(avatarUrl)) return avatarUrl

  const gender = doctor?.gender?.trim().toLowerCase()
  const identity = `${doctor?.doctorId || ''}:${doctor?.doctorName || doctor?.fullName || ''}`
  if (gender === 'female' || gender === 'nữ' || gender === 'nu') return pickAvatar(femaleDoctorAvatarUrls, identity)
  if (gender === 'male' || gender === 'nam') return pickAvatar(maleDoctorAvatarUrls, identity)

  return pickAvatar(neutralDoctorAvatarUrls, identity)
}

function pickAvatar(urls: string[], identity: string) {
  const hash = Array.from(identity || 'doctor').reduce((value, char) => value + char.charCodeAt(0), 0)
  return urls[Math.abs(hash) % urls.length]
}
