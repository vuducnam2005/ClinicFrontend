<template>
 <section class="section-pad bg-white relative overflow-hidden">
 <div class="container-page">
 <!-- Section Header -->
 <div v-reveal class="mx-auto max-w-2xl text-center">
 <span class="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-3 py-1 rounded-full">
 Quy trình vận hành
 </span>
 <h2 class="section-title mt-4">Hành trình khám chữa bệnh</h2>
 <p class="section-subtitle mx-auto mt-3 text-base">
 Ba bước tối giản từ việc lựa chọn chuyên khoa lâm sàng đến nhận số thứ tự điều phối vào hàng chờ khám.
 </p>
 </div>

 <!-- Linear Step Flow Grid -->
 <div class="mt-20 relative">
 <!-- Connecting dashed line in the background (visible on desktop) -->
 <div class="hidden md:block absolute top-[4rem] left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-teal-200/60 -z-10"></div>

 <div class="grid gap-8 md:grid-cols-3">
 <div
 v-for="(step, index) in steps"
:key="step.title"
 v-reveal
="`animation-delay: ${index * 100}ms`"
 class="group rounded-3xl p-8 border border-slate-100 bg-slate-50 hover:shadow-medical hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between"
 >
 <!-- Step Index Header & Icons -->
 <div class="flex items-center justify-between">
 <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 text-teal-600 border border-teal-200/25 group-hover:scale-110 transition-transform duration-300">
 <component :is="step.icon" class="h-6 w-6" />
 </div>
 <span class="text-4xl font-extrabold text-slate-200 tracking-tight group-hover:text-teal-500/20 transition-colors">
 0{{ index + 1 }}
 </span>
 </div>

 <!-- Content details -->
 <div class="mt-8">
 <h3 class="text-xl font-bold text-slate-900 ">
 {{ step.title }}
 </h3>
 <p class="mt-3 text-sm leading-relaxed text-slate-500 ">
 {{ step.description }}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { CalendarClock, ClipboardCheck, Stethoscope } from 'lucide-vue-next'

const steps: Array<{ title: string; description: string; icon: Component }> = [
 {
 title: 'Chọn chuyên khoa',
 description: 'Lọc nhanh nhu cầu điều trị theo phân khoa và hiển thị danh sách các chuyên gia y tế phụ trách trực tiếp.',
 icon: Stethoscope,
 },
 {
 title: 'Chọn bác sĩ và giờ khám',
 description: 'Tra cứu các khung giờ làm việc còn trống trong ngày và xác nhận đặt chỗ chỉ với một chạm duy nhất.',
 icon: CalendarClock,
 },
 {
 title: 'Nhận số thứ tự tự động',
 description: 'Sau khi lịch đặt hẹn thành công, hệ thống OS sẽ lập tức ghi danh và cấp số thứ tự vào hàng chờ khám.',
 icon: ClipboardCheck,
 },
]
</script>
