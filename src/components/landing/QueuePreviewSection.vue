<template>
 <section class="section-pad bg-slate-50 ">
 <div class="container-page grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
 
 <!-- Left side introduction -->
 <div v-reveal class="max-w-2xl">
 <span class="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-3 py-1 rounded-full">
 Điều hành trực tuyến
 </span>
 <h2 class="section-title mt-4">Giám sát hàng chờ thông minh</h2>
 <p class="section-subtitle mt-3">
 Thông tin hàng chờ được truyền phát thời gian thực trực tiếp từ Appointment Service (N1), hỗ trợ điều phối chính xác thứ tự khám, tránh ùn ứ tại phòng chờ.
 </p>

 <!-- Metric list for OS feeling -->
 <div class="mt-8 grid gap-4 sm:grid-cols-2">
 <div class="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-soft">
 <span class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Thời gian chờ TB</span>
 <p class="mt-2 text-2xl font-extrabold text-slate-900 ">12 Phút</p>
 </div>
 <div class="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-soft">
 <span class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Hiệu suất Gateway</span>
 <p class="mt-2 text-2xl font-extrabold text-teal-600 flex items-center gap-2">
 99.98%
 <span class="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
 </p>
 </div>
 </div>
 </div>

 <!-- Right side real-time monitor panel -->
 <div v-reveal class="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-floating ">
 <div class="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
 <div>
 <p class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Giám sát hàng chờ hôm nay</p>
 <h3 class="mt-1 text-lg font-bold text-slate-900 ">{{ today }}</h3>
 </div>
 <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 ">
 <Activity class="h-5 w-5 animate-pulse" />
 </span>
 </div>

 <!-- Loading state -->
 <div v-if="loading" class="space-y-4">
 <div v-for="item in 3" :key="item" class="h-20 animate-pulse rounded-2xl bg-slate-100 "></div>
 </div>

 <!-- Empty State Wave if queue is empty -->
 <div v-else-if="queue.length === 0" class="py-12 text-center flex flex-col items-center justify-center">
 <svg viewBox="0 0 100 30" class="h-12 w-32 text-slate-300 fill-none stroke-2 mb-4">
 <path d="M0,15 L30,15 L35,5 L40,25 L45,10 L50,18 L55,15 L100,15" stroke="currentColor" class="wave-path"></path>
 </svg>
 <h4 class="text-base font-bold text-slate-900 ">Không có ca bệnh trong hàng chờ</h4>
 <p class="mt-1 max-w-sm text-xs leading-relaxed text-slate-400 mx-auto">
 Hàng chờ hiện tại đang trống. Hệ thống đang trực tuyến và sẵn sàng tiếp nhận các lượt đặt hẹn khám mới.
 </p>
 </div>

 <!-- Real list with pulsing indicator dots -->
 <div v-else class="space-y-4">
 <div
 v-for="item in queue"
 :key="item.id"
 class="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100"
 >
 <!-- Rounded Queue Number badge -->
 <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-extrabold text-slate-900 border border-slate-200/40 shadow-soft group-hover:scale-105 transition-transform duration-300">
 {{ item.queueNumber }}
 </div>
 
 <div class="min-w-0 flex-1">
 <p class="truncate text-base font-bold text-slate-900 ">{{ displayText(item.patientName) }}</p>
 <p class="truncate text-xs font-medium text-slate-500 mt-0.5">
 {{ displayText(item.doctorName) }} • <span class="font-bold text-slate-700 ">{{ item.slotTime || 'Đang cập nhật' }}</span>
 </p>
 </div>

 <!-- Pulsing active status pill -->
 <div class="flex items-center gap-2">
 <span class="rounded-full px-3 py-1.5 text-xxs font-bold uppercase tracking-wider flex items-center gap-1.5" :class="statusClass(item.status)">
 <span class="relative flex h-1.5 w-1.5" v-if="item.status === 'InProgress' || item.status === 'Waiting'">
 <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="dotPingClass(item.status)"></span>
 <span class="relative inline-flex rounded-full h-1.5 w-1.5" :class="dotClass(item.status)"></span>
 </span>
 {{ statusLabel(item.status) }}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Activity } from 'lucide-vue-next'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackQueue } from '@/services/fallbackData'
import type { WaitingQueueItem } from '@/types/appointment'
import { displayText } from '@/utils/displayText'

const today = new Date().toISOString().slice(0, 10)
const queue = ref<WaitingQueueItem[]>([])
const loading = ref(true)

onMounted(async () => {
 try {
 const data = await appointmentApi.getWaitingQueue(today)
 queue.value = data.length ? data : fallbackQueue
 } catch {
 queue.value = fallbackQueue
 } finally {
 loading.value = false
 }
})

function statusLabel(status: string) {
 const map: Record<string, string> = {
 Waiting: 'Đang chờ',
 InProgress: 'Đang khám',
 Done: 'Hoàn tất',
 Cancelled: 'Đã hủy',
 }
 return map[status] || status
}

function statusClass(status: string) {
 const map: Record<string, string> = {
 Waiting: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
 InProgress: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
 Done: 'bg-slate-100 text-slate-500 border border-slate-200/30 ',
 Cancelled: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
 }
 return map[status] || 'bg-slate-100 text-slate-700'
}

function dotPingClass(status: string) {
 return status === 'InProgress' ? 'bg-teal-400' : 'bg-amber-400'
}

function dotClass(status: string) {
 return status === 'InProgress' ? 'bg-teal-500' : 'bg-amber-500'
}
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
