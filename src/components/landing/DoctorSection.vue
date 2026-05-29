<template>
 <section class="section-pad bg-slate-50 ">
 <div class="container-page">
 <!-- Section Header -->
 <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
 <div v-reveal class="max-w-2xl">
 <span class="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-3 py-1 rounded-full">
 Đội ngũ lâm sàng
 </span>
 <h2 class="section-title mt-4">Chuyên gia y khoa</h2>
 <p class="section-subtitle mt-3">
 Hồ sơ bác sĩ chuyên khoa phụ trách điều hành được đồng bộ trực tiếp từ Appointment Service (N1) với trình độ từ Thạc sĩ, CK.I, CK.II trở lên.
 </p>
 </div>
 <RouterLink to="/doctors" v-reveal style="animation-delay: 100ms">
 <BaseButton variant="outline" class="rounded-2xl">
 Xem tất cả bác sĩ
 <template #icon><ArrowRight class="h-4 w-4" /></template>
 </BaseButton>
 </RouterLink>
 </div>

 <!-- Loading State -->
 <div v-if="loading" class="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
 <LoadingSkeleton v-for="item in 4" :key="item" class="rounded-3xl h-80" />
 </div>

 <!-- Doctors Grid -->
 <div v-else class="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
 <div
 v-for="doctor in doctors.slice(0, 4)"
:key="doctor.doctorId"
 v-reveal
 class="group rounded-3xl border border-slate-200/50 bg-white overflow-hidden shadow-soft hover:shadow-medical hover:-translate-y-1.5 transition-all duration-300"
 >
 <!-- Curved dynamic header background inside card -->
 <div class="h-28 bg-gradient-to-br from-teal-500/8 via-cyan-500/3 to-transparent "></div>
 
 <!-- Card Details Content -->
 <div class="px-6 pb-6">
 <!-- Doctor avatar badge with glowing green active status ring -->
 <div
 class="relative -mt-10 ml-1 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-medical group-hover:scale-105 transition-transform duration-300 cursor-pointer"
 @click="openDoctor(doctor)"
 >
 <UserRound class="h-9 w-9" />
 <span class="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
 </div>

 <h3
 class="mt-5 text-xl font-bold text-slate-900 truncate hover:text-teal-600 cursor-pointer transition-colors"
 @click="openDoctor(doctor)"
 >
 {{ displayText(doctor.doctorName) }}
 </h3>

 <!-- Multiple Badges for Specialty & Degree -->
 <div class="mt-3 flex items-center gap-2 flex-wrap">
 <span class="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xxs font-bold text-teal-600 ">
 {{ displayText(doctor.specialtyName) }}
 </span>
 <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xxs font-semibold text-slate-500 ">
 {{ doctor.degree || 'ThS. Bác sĩ' }}
 </span>
 </div>

 <!-- Fee & Booking CTAs -->
 <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
 <div class="flex flex-col">
 <span class="text-xxs font-semibold uppercase tracking-wider text-slate-400 ">Phí dịch vụ</span>
 <span class="text-lg font-extrabold text-slate-900 ">{{ formatCurrency(doctor.examFee) }}</span>
 </div>
 <RouterLink :to="{ path: '/booking', query: { doctorId: doctor.doctorId } }">
 <BaseButton size="sm" class="rounded-xl px-4 py-2 font-bold shadow-medical hover:scale-102">
 Đặt lịch
 </BaseButton>
 </RouterLink>
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
import { ArrowRight, UserRound } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import DoctorDetailModal from '@/components/booking/DoctorDetailModal.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackDoctors } from '@/services/fallbackData'
import type { Doctor } from '@/types/doctor'
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

function formatCurrency(value: number) {
 return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function openDoctor(doctor: Doctor) {
  selectedDoctor.value = doctor
}

function closeDoctor() {
  selectedDoctor.value = null
}
</script>

<style scoped>
.text-xxs {
 font-size: 0.68rem;
}
.text-xxs {
 font-size: 0.65rem;
}
</style>
