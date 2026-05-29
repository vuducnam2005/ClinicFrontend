<template>
 <section class="space-y-6">
 <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
 <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Reception workspace</p>
 <h1 class="mt-2 text-3xl font-bold text-slate-950">Bảng điều khiển y tá / lễ tân</h1>
 <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
 Theo dõi lịch hẹn, tiếp nhận bệnh nhân, hàng đợi khám, viện phí và phát thuốc. Dữ liệu kết nối N1, N2, N3 theo đúng phân công microservices.
 </p>
 </div>
 <BaseButton variant="outline" :disabled="loading" @click="loadData">
 <template #icon><RefreshCw class="h-4 w-4" /></template>
 Tải lại
 </BaseButton>
 </div>
 </div>

 <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

 <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <LoadingSkeleton v-for="item in 4" :key="item" />
 </div>

 <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <RouterLink v-for="stat in stats" :key="stat.label" :to="stat.to" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-teal-200">
 <div class="flex items-start justify-between gap-4">
 <div>
 <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
 <p class="mt-3 text-3xl font-bold text-slate-950">{{ stat.value }}</p>
 <p class="mt-2 text-xs font-medium text-slate-500">{{ stat.note }}</p>
 </div>
 <span :class="['flex h-11 w-11 items-center justify-center rounded-xl', stat.iconClass]">
 <component :is="stat.icon" class="h-5 w-5" />
 </span>
 </div>
 </RouterLink>
 </div>

 <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
 <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
 <div class="border-b border-slate-100 px-5 py-4">
 <h2 class="font-semibold text-slate-950">Lịch hẹn cần xử lý</h2>
 <p class="mt-1 text-sm text-slate-500">Nguồn N1 - Appointment Service</p>
 </div>
 <div class="divide-y divide-slate-100">
 <div v-for="item in appointments.slice(0, 5)" :key="item.appointmentId" class="flex items-center justify-between gap-4 px-5 py-4">
 <div>
 <p class="font-semibold text-slate-950">{{ displayText(item.patientName) }}</p>
 <p class="mt-1 text-sm text-slate-500">{{ displayText(item.doctorName) }} · {{ formatDate(item.appointmentDate) }} {{ item.slotTime }}</p>
 </div>
 <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ item.status }}</span>
 </div>
 </div>
 </div>

 <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
 <div class="border-b border-slate-100 px-5 py-4">
 <h2 class="font-semibold text-slate-950">Hóa đơn chưa thanh toán</h2>
 <p class="mt-1 text-sm text-slate-500">Nguồn N3 - Billing</p>
 </div>
 <div class="divide-y divide-slate-100">
 <div v-for="item in unpaidInvoices.slice(0, 5)" :key="item.invoiceId" class="flex items-center justify-between gap-4 px-5 py-4">
 <div>
 <p class="font-semibold text-slate-950">Hóa đơn #{{ item.invoiceId }}</p>
 <p class="mt-1 text-sm text-slate-500">Bệnh nhân {{ item.patientId }} · {{ formatCurrency(item.amount) }}</p>
 </div>
 <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{{ item.status }}</span>
 </div>
 <p v-if="!unpaidInvoices.length" class="px-5 py-8 text-sm text-slate-500">Chưa có hóa đơn cần thu.</p>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { CalendarCheck, CreditCard, Pill, RefreshCw, Users } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { fallbackAppointments, fallbackQueue } from '@/services/fallbackData'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { Patient } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

interface Stat { label: string; value: number; note: string; to: string; icon: Component; iconClass: string }

const loading = ref(true)
const error = ref('')
const appointments = ref<Appointment[]>([])
const patients = ref<Patient[]>([])
const queue = ref<WaitingQueueItem[]>([])
const invoices = ref<Invoice[]>([])

const fallbackPatients: Patient[] = [
 { patientId: 'BN001', fullName: 'Nguyễn Minh An', phone: '0901001001', gender: 'Male' },
 { patientId: 'BN002', fullName: 'Trần Thu Hà', phone: '0902002002', gender: 'Female' },
]
const fallbackInvoices: Invoice[] = [
 { invoiceId: 1001, appointmentId: 2201, patientId: 12, amount: 300000, status: 'Paid', createdAt: new Date().toISOString() },
 { invoiceId: 1002, appointmentId: 2202, patientId: 4, amount: 350000, status: 'Unpaid', createdAt: new Date().toISOString() },
]

const unpaidInvoices = computed(() => invoices.value.filter((item) => String(item.status).toLowerCase() !== 'paid'))
const stats = computed<Stat[]>(() => [
 { label: 'Lịch hẹn', value: appointments.value.length, note: 'Cần xác nhận/tiếp nhận', to: '/nurse/appointments', icon: CalendarCheck, iconClass: 'bg-teal-50 text-teal-700' },
 { label: 'Bệnh nhân', value: patients.value.length, note: 'Hồ sơ N2', to: '/nurse/patients', icon: Users, iconClass: 'bg-cyan-50 text-cyan-700' },
 { label: 'Hàng đợi', value: queue.value.length, note: 'Trong ngày', to: '/nurse/queue', icon: Users, iconClass: 'bg-blue-50 text-blue-700' },
 { label: 'Chưa thu phí', value: unpaidInvoices.value.length, note: 'Hóa đơn N3', to: '/nurse/bills', icon: CreditCard, iconClass: 'bg-emerald-50 text-emerald-700' },
])

onMounted(loadData)

async function loadData() {
 loading.value = true
 error.value = ''
 const today = new Date().toISOString().slice(0, 10)
 const results = await Promise.allSettled([
 appointmentApi.getAppointments(),
 medicalRecordApi.getPatients(),
 appointmentApi.getWaitingQueue(today),
 billingApi.getInvoices(),
 ])
 appointments.value = readList(results[0], fallbackAppointments)
 patients.value = readList(results[1], fallbackPatients)
 queue.value = readList(results[2], fallbackQueue)
 invoices.value = readList(results[3], fallbackInvoices)
 const firstError = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
 if (firstError) error.value = `Một số API chưa phản hồi: ${getApiErrorMessage(firstError.reason)}. Đang dùng fallback cho phần thiếu dữ liệu.`
 loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>, fallback: T[]) { return result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length ? result.value : fallback }
function formatCurrency(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) }
function formatDate(value?: string) { if (!value) return 'Chưa cập nhật'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date) }
function statusClass(status?: string) { const value = String(status || '').toLowerCase(); if (value.includes('confirmed') || value.includes('completed')) return 'bg-teal-100 text-teal-700'; if (value.includes('pending') || value.includes('waiting')) return 'bg-amber-100 text-amber-700'; if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
</script>