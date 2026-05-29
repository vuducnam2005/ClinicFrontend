<template>
 <section id="specialties" class="section-pad bg-white ">
 <div class="container-page">
 <!-- Section Header -->
 <div v-reveal class="max-w-3xl">
 <span class="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-3 py-1 rounded-full">
 Chuyên khoa lâm sàng
 </span>
 <h2 class="section-title mt-4">Chuyên khoa nổi bật</h2>
 <p class="section-subtitle">
 Chọn đúng phân khoa điều trị để hệ điều hành gợi ý chính xác lịch trực của bác sĩ chuyên môn phù hợp nhất.
 </p>
 </div>

 <!-- Loading State -->
 <div v-if="loading" class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
 <LoadingSkeleton v-for="item in 4" :key="item" class="rounded-3xl h-64" />
 </div>

 <!-- Specialty Grid List -->
 <div v-else class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
 <div
 v-for="(specialty, index) in specialties"
 :key="specialty.specialtyId"
 v-reveal
 class="group rounded-3xl p-8 border border-slate-100 bg-slate-50 shadow-soft hover:shadow-medical hover:-translate-y-1.5 transition-all duration-300"
 >
 <!-- Elegant Gradient circular icon container -->
 <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 border border-teal-100/50 group-hover:scale-110 transition-transform duration-300">
 <component :is="icons[index % icons.length]" class="h-7 w-7" />
 </div>

 <h3 class="mt-6 text-xl font-bold text-slate-900 ">
 {{ displayText(specialty.specialtyName) }}
 </h3>
 
 <p class="mt-3 text-sm leading-relaxed text-slate-500 ">
 Hỗ trợ đặt hẹn tức thì, phân loại hồ sơ tự động và hiển thị ca trực tuyến của bác sĩ phụ trách.
 </p>

 <!-- Micro interaction indicator -->
 <div class="mt-6 flex items-center gap-1.5 text-xs font-bold text-teal-600 group-hover:gap-2.5 transition-all">
 Xem thêm bác sĩ
 <span class="text-base font-normal leading-none">→</span>
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { onMounted, ref, type Component } from 'vue'
import { Baby, Ear, HeartPulse, Sparkles } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackSpecialties } from '@/services/fallbackData'
import type { Specialty } from '@/types/specialty'
import { displayText } from '@/utils/displayText'

const specialties = ref<Specialty[]>([])
const loading = ref(true)
const icons: Component[] = [HeartPulse, Baby, Sparkles, Ear]

onMounted(async () => {
 try {
 const data = await appointmentApi.getSpecialties()
 specialties.value = data.length ? data : fallbackSpecialties
 } catch {
 specialties.value = fallbackSpecialties
 } finally {
 loading.value = false
 }
})
</script>
