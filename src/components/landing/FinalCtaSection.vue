<template>
 <section class="section-pad bg-white ">
 <div class="container-page">
 <!-- Gradient high-conversion CTA banner -->
 <div v-reveal class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-650 to-cyan-600 py-16 px-8 sm:px-12 text-center text-white shadow-floating border border-teal-500/20 ">
 <!-- Abstract gradient mesh overlay for high trust Apple Health feeling -->
 <div class="absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-cyan-400/20 to-teal-400/10 blur-[100px] -z-10"></div>
 <div class="absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/10 blur-[100px] -z-10"></div>

 <div class="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
 <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold tracking-wider uppercase border border-white/10">
 <Sparkles class="h-4 w-4 text-teal-200" />
 Clinic OS v1.0
 </span>
 
 <h2 class="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
 Bắt đầu trải nghiệm chăm sóc sức khỏe thông minh
 </h2>
 
 <p class="mt-6 text-base sm:text-lg leading-relaxed text-teal-50/80 max-w-2xl">
 Hãy đăng ký tài khoản bệnh nhân hoặc đặt lịch khám ngay để tự động ghi tên vào hàng chờ điều phối thông minh của ClinicCare.
 </p>

 <div class="mt-10 flex flex-col gap-4 sm:flex-row justify-center w-full sm:w-auto">
 <RouterLink to="/booking" class="w-full sm:w-auto">
 <BaseButton class="w-full rounded-2xl bg-white text-teal-800 hover:bg-slate-50 shadow-lg py-3.5 px-6 font-bold hover:scale-102 transition-all">
 <template #icon><CalendarPlus class="h-5 w-5 text-teal-700" /></template>
 Đặt lịch khám ngay
 </BaseButton>
 </RouterLink>
 <RouterLink to="/login" class="w-full sm:w-auto">
 <BaseButton variant="outline" class="w-full rounded-2xl border-white/30 text-white hover:bg-white py-3.5 px-6 font-bold">
 Đăng nhập tài khoản
 </BaseButton>
 </RouterLink>
 </div>

 <!-- Safe & Encrypted badge below CTAs -->
 <div class="mt-8 flex items-center justify-center gap-2 text-xxs font-bold uppercase tracking-wider text-teal-100/60">
 <Lock class="h-3.5 w-3.5" />
 Dữ liệu y tế được mã hóa an toàn đạt chuẩn quốc tế
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { Sparkles, CalendarPlus, Lock } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<style scoped>
.bg-teal-650 {
 background-color: #0d6d65;
}
.text-xxs {
 font-size: 0.65rem;
}
</style>
