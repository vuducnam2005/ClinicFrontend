<template>
  <section id="doctors" class="bg-[#f7f9fb] py-24">
    <div class="container-page">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <p class="section-eyebrow">Bác sĩ</p>
        <h2 class="section-title mt-3">Đội ngũ bác sĩ hàng đầu</h2>
        <p class="section-subtitle mx-auto">
          Kết nối với các chuyên gia y tế uy tín, luôn sẵn sàng lắng nghe và chăm sóc sức khỏe cho bạn.
        </p>
      </div>

      <div v-if="loading" class="mt-12 grid gap-6 md:grid-cols-3">
        <LoadingSkeleton v-for="item in 3" :key="item" class="h-96 rounded-lg" />
      </div>

      <div v-else class="mt-12 grid gap-6 md:grid-cols-3">
        <div v-for="(doctor, index) in doctors.slice(0, 3)" :key="doctor.doctorId" v-reveal class="motion-card group rounded-lg" :style="{ transitionDelay: `${index * 90}ms` }">
          <button class="relative block w-full overflow-hidden rounded-lg text-left" @click="openDoctor(doctor)">
            <img
              class="h-80 w-full object-cover transition duration-500 group-hover:scale-105"
              :src="doctorAvatarUrl(doctor)"
              :alt="displayText(doctor.doctorName)"
            />
            <span class="pulse-soft absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#1d59c1] px-3 py-1 text-xs font-semibold text-white">
              <BadgeCheck class="h-4 w-4" />
              Verified
            </span>
          </button>
          <div class="mt-5 text-center">
            <h3 class="landing-card-title text-[#003c90]">{{ displayText(doctor.doctorName) }}</h3>
            <p class="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{{ displayText(doctor.specialtyName) }}</p>
            <div class="mt-4 flex justify-center gap-2">
              <RouterLink :to="{ path: '/booking', query: { doctorId: doctor.doctorId } }" class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#003c90] transition hover:bg-[#003c90] hover:text-white">
                <CalendarPlus class="h-4 w-4" />
              </RouterLink>
              <button class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#003c90] transition hover:bg-[#003c90] hover:text-white" @click="openDoctor(doctor)">
                <Mail class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <DoctorDetailModal :doctor="selectedDoctor" @close="closeDoctor" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BadgeCheck, CalendarPlus, Mail } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import DoctorDetailModal from '@/components/booking/DoctorDetailModal.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackDoctors } from '@/services/fallbackData'
import type { Doctor } from '@/types/doctor'
import { doctorAvatarUrl } from '@/utils/doctorAvatar'
import { displayText } from '@/utils/displayText'

const doctors = ref<Doctor[]>([])
const selectedDoctor = ref<Doctor | null>(null)
const loading = ref(true)
onMounted(async () => {
  try {
    const data = await appointmentApi.getDoctors()
    doctors.value = data.length ? data : fallbackDoctors
  } catch {
    doctors.value = fallbackDoctors
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
</script>
