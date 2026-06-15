<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="doctor" class="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm" @click.self="emit('close')">
        <div class="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-soft">
          <!-- header -->
          <div class="relative bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
            <button class="absolute right-4 top-4 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" type="button" @click="emit('close')">
              <X class="h-5 w-5" />
            </button>
            <div class="flex flex-col gap-5 pr-10 sm:flex-row sm:items-center">
              <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-cyan-100 ring-1 ring-white/15">
                <img :src="doctorAvatarUrl(doctor)" :alt="doctorName(doctor)" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">{{ displayText(doctor.specialtyName) }}</span>
                  <span :class="['rounded-full px-3 py-1 text-xs font-semibold', doctor.isActive === false ? 'bg-rose-400/15 text-rose-100' : 'bg-emerald-400/15 text-emerald-100']">
                    {{ doctor.isActive === false ? 'Tạm ngưng nhận lịch' : 'Đang nhận lịch' }}
                  </span>
                </div>
                <h2 class="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">{{ doctorName(doctor) }}</h2>
                <p class="mt-2 text-sm text-slate-300 sm:text-base">{{ doctor.degree || 'Bác sĩ chuyên khoa' }}</p>
              </div>
            </div>
          </div>

          <!-- details -->
          <div class="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div class="p-5 sm:p-8">
              <h3 class="text-xl font-semibold text-slate-950">Hồ sơ chuyên môn</h3>
              <p class="mt-3 text-sm leading-7 text-slate-600">
                {{ doctorDescription }}
              </p>

              <div class="mt-6 grid gap-4 sm:grid-cols-2">
                <!-- Chuyên khoa -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Stethoscope class="h-5 w-5" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Chuyên khoa</p>
                      <p class="mt-1 truncate font-bold text-slate-950">{{ displayText(doctor.specialtyName) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Học vị -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <GraduationCap class="h-5 w-5" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Học vị</p>
                      <p class="mt-1 truncate font-bold text-slate-950">{{ doctor.degree || 'Chưa cập nhật' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Kinh nghiệm -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <BadgeCheck class="h-5 w-5" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Kinh nghiệm</p>
                      <p class="mt-1 truncate font-bold text-slate-950">{{ doctor.experienceYears ? `${doctor.experienceYears} năm` : 'Chưa cập nhật' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Phí khám -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <WalletCards class="h-5 w-5" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Phí khám</p>
                      <p class="mt-1 truncate font-bold text-slate-950">{{ formatCurrency(doctor.examFee) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Phòng khám -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <DoorOpen class="h-5 w-5" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Phòng khám</p>
                      <p class="mt-1 truncate font-bold text-slate-950">{{ doctor.roomNumber || 'Chưa cập nhật' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Giới tính -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <UserRound class="h-5 w-5" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Giới tính</p>
                      <p class="mt-1 truncate font-bold text-slate-950">{{ genderLabel(doctor.gender) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside class="border-t border-slate-100 bg-slate-50 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <h3 class="text-xl font-semibold text-slate-950">Thông tin liên hệ</h3>
              <div class="mt-5 space-y-3">
                <!-- Số điện thoại -->
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <Phone class="h-5 w-5" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Số điện thoại</p>
                    <p class="mt-1 break-all font-bold text-slate-950">{{ doctor.phone || 'Chưa cập nhật' }}</p>
                  </div>
                </div>

                <!-- Email -->
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <Mail class="h-5 w-5" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                    <p class="mt-1 break-all font-bold text-slate-950">{{ doctor.email || 'Chưa cập nhật' }}</p>
                  </div>
                </div>

                <!-- Ngày sinh -->
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <CalendarDays class="h-5 w-5" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Ngày sinh</p>
                    <p class="mt-1 break-all font-bold text-slate-950">{{ formatDate(doctor.dateOfBirth) }}</p>
                  </div>
                </div>

                <!-- Mã bác sĩ -->
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <BadgeCheck class="h-5 w-5" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Mã bác sĩ</p>
                    <p class="mt-1 break-all font-bold text-slate-950">{{ formatDoctorId(doctor.doctorId) }}</p>
                  </div>
                </div>
              </div>

              <div class="mt-6 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                <p class="text-sm font-semibold text-slate-950">Sẵn sàng đặt lịch</p>
                <template v-if="enableSelect">
                  <BaseButton class="mt-4 w-full" size="lg" @click="emit('select', doctor)">
                    <template #icon><CalendarPlus class="h-4 w-4" /></template>
                    Đặt lịch với bác sĩ này
                  </BaseButton>
                </template>
                <template v-else>
                  <RouterLink :to="{ path: '/booking', query: { doctorId: doctor.doctorId } }" @click="emit('close')">
                    <BaseButton class="mt-4 w-full" size="lg">
                      <template #icon><CalendarPlus class="h-4 w-4" /></template>
                      Đặt lịch với bác sĩ này
                    </BaseButton>
                  </RouterLink>
                </template>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  DoorOpen,
  GraduationCap,
  Mail,
  Phone,
  Stethoscope,
  UserRound,
  WalletCards,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Doctor } from '@/types/doctor'
import { doctorAvatarUrl } from '@/utils/doctorAvatar'
import { displayText } from '@/utils/displayText'

const props = withDefaults(
  defineProps<{
    doctor: Doctor | null
    enableSelect?: boolean
  }>(),
  {
    enableSelect: false,
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', doctor: Doctor): void
}>()

// Generate rich description if DB has very short text or is empty
const doctorDescription = computed(() => {
  const desc = props.doctor?.description?.trim() || ''
  const spec = props.doctor?.specialtyName || 'Chuyên khoa'
  
  if (!desc || desc.length < 20 || desc.toLowerCase() === spec.toLowerCase()) {
    return `Bác sĩ chuyên khoa có nhiều năm kinh nghiệm công tác trong lĩnh vực ${spec.toLowerCase()}. Bác sĩ luôn tận tâm, chu đáo và cam kết mang lại dịch vụ chăm sóc y tế chất lượng cao, an toàn nhất cho từng bệnh nhân.`
  }
  return desc
})

function doctorName(doctor?: Doctor | null) {
  return displayText(doctor?.doctorName || doctor?.fullName || '')
}

function formatDoctorId(id?: number) {
  if (!id) return 'Chưa cập nhật'
  return `MSBS-${String(id).padStart(3, '0')}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function genderLabel(value?: string) {
  const labels: Record<string, string> = {
    Male: 'Nam',
    Female: 'Nữ',
    Nam: 'Nam',
    Nữ: 'Nữ',
  }
  return value ? labels[value] || value : 'Chưa cập nhật'
}
</script>
