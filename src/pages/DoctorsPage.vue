<template>
  <section class="bg-white py-12">
    <div class="container-page">
      <div class="rounded-2xl bg-slate-950 p-6 text-white shadow-soft sm:p-8">
        <p class="text-sm font-semibold text-cyan-200">Danh sách bác sĩ</p>
        <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">Tìm bác sĩ phù hợp</h1>
        <p class="mt-4 max-w-2xl text-slate-300">
          Lọc theo chuyên khoa, tìm theo tên và sắp xếp phí khám. Bấm vào tên bác sĩ để xem hồ sơ chi tiết.
        </p>
      </div>

      <div class="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:grid-cols-[1fr_1fr_220px]">
        <BaseInput v-model="search" label="Tìm bác sĩ" placeholder="Nhập tên bác sĩ" />
        <BaseSelect v-model="specialtyId" label="Chuyên khoa" :options="specialtyOptions" placeholder="Tất cả chuyên khoa" />
        <BaseSelect
          v-model="sort"
          label="Sắp xếp phí"
          :options="[
            { label: 'Mặc định', value: 'default' },
            { label: 'Thấp đến cao', value: 'asc' },
            { label: 'Cao đến thấp', value: 'desc' },
          ]"
        />
      </div>

      <div v-if="loading" class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <LoadingSkeleton v-for="item in 6" :key="item" />
      </div>

      <div v-else-if="filteredDoctors.length" class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <BaseCard v-for="doctor in filteredDoctors" :key="doctor.doctorId" class="p-5">
          <button class="group flex w-full gap-4 text-left" type="button" @click="openDoctor(doctor)">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition group-hover:bg-teal-100">
              <img :src="doctorAvatarUrl(doctor)" :alt="doctorName(doctor)" class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold text-slate-950 transition group-hover:text-teal-700">
                {{ doctorName(doctor) }}
              </h2>
              <p class="mt-1 text-sm font-medium text-teal-700">{{ displayText(doctor.specialtyName) }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ doctor.degree || 'Bác sĩ chuyên khoa' }}</p>
              <p v-if="doctor.experienceYears" class="mt-1 text-xs font-medium text-slate-400">{{ doctor.experienceYears }} năm kinh nghiệm</p>
            </div>
          </button>

          <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span class="font-semibold text-slate-950">{{ formatCurrency(doctor.examFee) }}</span>
            <RouterLink :to="{ path: '/booking', query: { doctorId: doctor.doctorId } }">
              <BaseButton size="sm">
                <template #icon><CalendarPlus class="h-4 w-4" /></template>
                Đặt lịch
              </BaseButton>
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <div v-else class="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-400" />
        <h2 class="mt-4 text-lg font-semibold text-slate-950">Không tìm thấy bác sĩ</h2>
        <p class="mt-2 text-sm text-slate-500">Thử đổi từ khóa tìm kiếm hoặc bộ lọc chuyên khoa.</p>
      </div>
    </div>

    <DoctorDetailModal :doctor="selectedDoctor" @close="closeDoctor" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarPlus, SearchX } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import DoctorDetailModal from '@/components/booking/DoctorDetailModal.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackDoctors, fallbackSpecialties } from '@/services/fallbackData'
import type { Doctor } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'
import { doctorAvatarUrl } from '@/utils/doctorAvatar'
import { displayText } from '@/utils/displayText'

const doctors = ref<Doctor[]>([])
const specialties = ref<Specialty[]>([])
const selectedDoctor = ref<Doctor | null>(null)
const loading = ref(true)
const search = ref('')
const specialtyId = ref('')
const sort = ref('default')

const specialtyOptions = computed(() =>
  specialties.value.map((specialty) => ({
    label: displayText(specialty.specialtyName),
    value: specialty.specialtyId,
  })),
)

const filteredDoctors = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  const result = doctors.value.filter((doctor) => {
    const name = doctorName(doctor).toLowerCase()
    const matchesName = !keyword || name.includes(keyword)
    const matchesSpecialty = !specialtyId.value || doctor.specialtyId === Number(specialtyId.value)
    return matchesName && matchesSpecialty
  })

  if (sort.value === 'asc') return [...result].sort((a, b) => a.examFee - b.examFee)
  if (sort.value === 'desc') return [...result].sort((a, b) => b.examFee - a.examFee)
  return result
})

onMounted(async () => {
  try {
    const [doctorData, specialtyData] = await Promise.all([
      appointmentApi.getDoctors(),
      appointmentApi.getSpecialties(),
    ])
    doctors.value = doctorData.length ? doctorData : fallbackDoctors
    specialties.value = specialtyData.length ? specialtyData : fallbackSpecialties
  } catch {
    doctors.value = fallbackDoctors
    specialties.value = fallbackSpecialties
  } finally {
    loading.value = false
  }
})

function openDoctor(doctor: Doctor) {
  selectedDoctor.value = doctor
}

function closeDoctor() {
  selectedDoctor.value = null
}

function doctorName(doctor?: Doctor | null) {
  return displayText(doctor?.doctorName || doctor?.fullName || '')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}
</script>
