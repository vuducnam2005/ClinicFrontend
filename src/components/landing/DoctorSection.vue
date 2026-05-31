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
              :src="doctorImages[index % doctorImages.length]"
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
import { displayText } from '@/utils/displayText'

const doctors = ref<Doctor[]>([])
const selectedDoctor = ref<Doctor | null>(null)
const loading = ref(true)
const doctorImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBGVzisRgPVLFMvREWL90bQypyZHMAf3GyT8T2hrfKkrIp0kQrVWtczQYCzdTSOMg5VM9xYYB6x2hh_80paaY2DDPo3cX9JeJSEJBqqjW0u4OLHLbjKxZRyWAotQALgBNU5xldyTyvvRlgv1797fO950fiD56l2QNq4qBGV4pB-1P5uHghW0wwqUutpImOpsoLMCc5jBonplAZbrpleWtmXl1fDA4J--U5xPDYpZOat5Kk83lYrQSmUFt3_6ycXtdvDwK0wc1k0tzkW',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDO-8g76IjoBWiFmS0PwzoL06SqdhVJ4GPv1OfMXeoGVjRZMYZS5onhDVriUOKbEZSNrufzx3ozgLiZ5cGVjlnSqRN7N4uTF88wCWG06D2RPT9ez2lPeBKJzbm8c6YmCvm0M7PAiPCm4S65I1NR1QwNj_yrZJkpFpMZc2A-2rZkbo1Vmm2itHfAusCCRcX_vpZ8BCH_cdJlkxOpv6L3drZxtWWtJfMJi2s-clLj_FsNgN3jZLUXoI1x-wT8cymEPdStFhBuxcMACwzD',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAvqErqUWr4xgq9XWl0Sg_XMl11L3W8Zi0CQOqWlCg6laaNBDY2pDVOqUdvYzWsoGBxAC_oEzHgkVh7sPi2kTyrMk7Z0H8HP4U60VAvbKhFdrAyiCbFo3tDSnh0M2gosT-4gxYbIrg28l1AWWhW0I5Cpk66Y4e6V8TeZc-QrbjAZ77S93825ZRcAGsBJcbc9OMBfxMZywVqigdegIIOLT_kvzyaM67y92RlgUODkV-pp-S6HYfrVP4X2rkbrdxgIKy5qPxM7ZliJ1z2',
]

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
