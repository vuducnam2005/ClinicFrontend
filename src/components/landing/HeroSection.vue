<template>
 <section class="clinic-surface soft-grid relative overflow-hidden py-20 lg:py-28">
 <!-- Ambient glowing backgrounds inspired by Stripe -->
 <div class="absolute -top-40 -right-40 h-[35rem] w-[35rem] rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-500/5 blur-[120px] -z-10"></div>
 <div class="absolute top-1/2 left-[-10rem] h-[25rem] w-[25rem] rounded-full bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 blur-[100px] -z-10"></div>

 <div class="container-page relative grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
 <!-- Left: Dynamic Headlines & Badges -->
 <div class="fade-up max-w-2xl">
 <!-- Trust badge with green glowing status dot -->
 <div class="inline-flex items-center gap-2 rounded-full border border-teal-200/50 bg-teal-50/60 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm ">
 <span class="relative flex h-2 w-2">
 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
 <span class="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
 </span>
 <span class="flex items-center gap-1">
 <ShieldCheck class="h-4 w-4 text-teal-600 " />
 Nền tảng điều hành phòng khám thế hệ mới
 </span>
 </div>

 <h1 class="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-none">
 Hệ điều hành <br />
 <span class="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent ">Clinic OS</span>
 </h1>
 
 <p class="mt-6 text-lg sm:text-xl font-medium leading-relaxed text-slate-600 ">
 Đặt lịch khám thông minh, kiểm soát hàng chờ thời gian thực và quản lý hồ sơ sức khỏe mã hóa. Tất cả tích hợp trong một hệ điều hành y khoa tinh tế và tin cậy.
 </p>

 <!-- Dynamic inline statistics -->
 <div class="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-8">
 <div v-for="stat in stats" :key="stat.label" class="flex flex-col">
 <span class="text-3xl font-extrabold text-slate-900 ">{{ stat.value }}</span>
 <span class="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 ">{{ stat.label }}</span>
 </div>
 </div>

 <!-- Action CTAs -->
 <div class="mt-10 flex flex-col gap-4 sm:flex-row">
 <RouterLink to="/booking" class="w-full sm:w-auto">
 <BaseButton size="lg" class="w-full shadow-medical hover:shadow-lg rounded-2xl hover:scale-102 transition-all">
 <template #icon><CalendarPlus class="h-5 w-5" /></template>
 Đặt lịch khám ngay
 </BaseButton>
 </RouterLink>
 <RouterLink to="/doctors" class="w-full sm:w-auto">
 <BaseButton size="lg" variant="outline" class="w-full rounded-2xl">
 <template #icon><UserRoundSearch class="h-5 w-5" /></template>
 Xem danh sách bác sĩ
 </BaseButton>
 </RouterLink>
 </div>

 <!-- Trust Layer footer text -->
 <div class="mt-6 flex items-center gap-2 text-xxs font-semibold uppercase tracking-wider text-slate-400 ">
 <span>HIPAA Compliant</span>
 <span class="h-1 w-1 rounded-full bg-slate-300 "></span>
 <span>End-to-End Encrypted</span>
 <span class="h-1 w-1 rounded-full bg-slate-300 "></span>
 <span>99.9% Uptime SLA</span>
 </div>
 </div>

 <!-- Right: Premium SaaS Dashboard Mockup constructed in HTML/CSS (Clinic OS UI) -->
 <div class="fade-up relative w-full" style="animation-delay: 150ms">
 <div class="absolute -inset-1 rounded-3xl bg-gradient-to-br from-teal-500/10 to-cyan-500/20 blur-xl opacity-70"></div>
 <div class="glass-panel relative rounded-3xl shadow-floating overflow-hidden border border-slate-200/60 bg-white p-6">
 
 <!-- Mockup Top Bar -->
 <div class="flex items-center justify-between border-b border-slate-200/50 pb-4 mb-5">
 <div class="flex items-center gap-2">
 <span class="h-3 w-3 rounded-full bg-red-400"></span>
 <span class="h-3 w-3 rounded-full bg-amber-400"></span>
 <span class="h-3 w-3 rounded-full bg-green-400"></span>
 <span class="text-xs font-bold text-slate-400 ml-2">clinic-os-core.sys</span>
 </div>
 <div class="flex items-center gap-3">
 <!-- Sync Indicator -->
 <span class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2 py-0.5 text-xxs font-bold text-teal-700 border border-teal-200/30">
 <span class="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
 LIVE SYNC
 </span>
 </div>
 </div>

 <!-- Mockup Main Grid -->
 <div class="grid gap-4 sm:grid-cols-2">
 <!-- Widget 1: Hàng Chờ Live Tracker -->
 <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
 <div class="flex items-center justify-between">
 <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Hàng chờ hôm nay</span>
 <Users class="h-4 w-4 text-teal-500" />
 </div>
 <div class="mt-4 flex items-baseline justify-between">
 <span class="text-4xl font-extrabold text-slate-900 ">08</span>
 <span class="text-xs font-semibold text-teal-600 flex items-center gap-1">
 <TrendingUp class="h-3 w-3" />
 +12% vs hôm qua
 </span>
 </div>
 <!-- Wait time meter -->
 <div class="mt-4 border-t border-slate-200/50 pt-3 flex justify-between items-center text-xs">
 <span class="text-slate-400 ">Chờ trung bình:</span>
 <span class="font-bold text-slate-800 ">12 phút</span>
 </div>
 </div>

 <!-- Widget 2: Vital Health Pulse (Waveform animation!) -->
 <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-between">
 <div class="flex items-center justify-between">
 <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Băng thông Gateway</span>
 <Activity class="h-4 w-4 text-cyan-500 animate-pulse" />
 </div>
 <!-- Heart Wave SVG -->
 <div class="my-2 h-10 w-full">
 <svg viewBox="0 0 100 30" class="h-full w-full text-cyan-500 fill-none stroke-2">
 <path d="M0,15 L30,15 L35,5 L40,25 L45,10 L50,18 L55,15 L100,15" stroke="currentColor" stroke-dasharray="200" stroke-dashoffset="0" class="wave-path"></path>
 </svg>
 </div>
 <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-200/50 ">
 <span class="text-slate-400 ">Sync delay:</span>
 <span class="font-bold text-slate-800 ">45ms (Optimal)</span>
 </div>
 </div>

 <!-- Widget 3: AI Assistant Diagnosing (Futuristic Clinical Copilot) -->
 <div class="sm:col-span-2 rounded-2xl border border-teal-100 bg-teal-50/30 p-4">
 <div class="flex items-center gap-2">
 <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500 text-white shadow-sm">
 <Sparkles class="h-4 w-4" />
 </div>
 <span class="text-xs font-bold text-teal-800 uppercase tracking-wider">AI Clinical Assistant Preview</span>
 </div>
 <p class="mt-3 text-xs leading-relaxed text-slate-600 ">
 "Phân tích hàng chờ: Phát hiện 2 bệnh nhân có chỉ số huyết áp cao bất thường từ N2. Đề xuất điều hướng ưu tiên khám chuyên khoa Tim mạch ngay lập tức."
 </p>
 <div class="mt-3 flex items-center justify-between border-t border-teal-100/50 pt-3">
 <span class="text-xxs font-bold text-teal-600/80 ">CORE MODEL V4.2</span>
 <span class="text-xxs font-bold bg-teal-500/10 px-2 py-0.5 rounded text-teal-600 ">99.8% ACCURACY</span>
 </div>
 </div>

 <!-- Widget 4: Doctor Status indicator card -->
 <div class="sm:col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
 <div class="flex items-center justify-between">
 <div class="flex items-center gap-3">
 <div class="relative">
 <div class="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold">
 A
 </div>
 <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white "></span>
 </div>
 <div>
 <h4 class="text-xs font-bold text-slate-900 ">BS. Nguyễn Minh Anh</h4>
 <p class="text-xxs text-slate-400 ">Khoa Tim mạch • Video Consult</p>
 </div>
 </div>
 <!-- Mini Action slot -->
 <span class="rounded-lg bg-teal-500/10 px-2.5 py-1 text-xxs font-bold text-teal-600 ">
 ĐANG TƯ VẤN
 </span>
 </div>
 </div>
 </div>
 
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { CalendarPlus, ShieldCheck, UserRoundSearch, Users, Activity, Sparkles, TrendingUp } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'

const stats = [
 { value: '50+', label: 'Bác sĩ chuyên khoa' },
 { value: '20k+', label: 'Lượt khám hoàn thành' },
 { value: '24/7', label: 'Hệ thống vận hành' },
]
</script>

<style scoped>
.text-xxs {
 font-size: 0.68rem;
}
.text-xxs {
 font-size: 0.65rem;
}
.wave-path {
 stroke-dasharray: 200;
 stroke-dashoffset: 200;
 animation: draw-wave 4s linear infinite;
}

@keyframes draw-wave {
 to {
 stroke-dashoffset: 0;
 }
}
</style>
