<template>
  <section class="space-y-6">
    <div class="rounded-3xl bg-slate-950 p-6 text-white shadow-card sm:p-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-200">Patient Portal</p>
          <h1 class="mt-3 text-3xl font-bold">Xin chào, {{ authStore.user?.fullName }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Theo dõi lịch hẹn từ N1, hồ sơ bệnh án từ N2 và viện phí từ N3 trong cùng một giao diện.
          </p>
        </div>
        <RouterLink to="/patient/booking" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-950/30 transition hover:bg-teal-400">
          <CalendarPlus class="h-4 w-4" />
          Đặt lịch mới
        </RouterLink>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="item in 3" :key="item" />
    </div>
    <div v-else class="grid gap-4 md:grid-cols-3">
      <RouterLink v-for="stat in stats" :key="stat.label" :to="stat.to" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-teal-200">
        <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
        <p class="mt-3 text-3xl font-bold text-slate-950">{{ stat.value }}</p>
        <p class="mt-2 text-xs font-medium text-slate-500">{{ stat.note }}</p>
      </RouterLink>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold text-slate-950">Lịch hẹn gần nhất</h2>
          <p class="mt-1 text-sm text-slate-500">Nguồn N1 Appointment Service</p>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="item in appointments.slice(0, 4)" :key="item.appointmentId" class="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p class="font-semibold text-slate-950">{{ item.doctorName }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ formatDate(item.appointmentDate) }} · {{ item.slotTime }} · {{ item.reason || 'Khám bệnh' }}</p>
            </div>
            <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ item.status }}</span>
          </div>
          <p v-if="!appointments.length" class="px-5 py-8 text-sm text-slate-500">Bạn chưa có lịch hẹn.</p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold text-slate-950">Viện phí cần theo dõi</h2>
          <p class="mt-1 text-sm text-slate-500">Nguồn N3 Pharmacy & Billing</p>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="item in invoices.slice(0, 4)" :key="item.invoiceId" class="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p class="font-semibold text-slate-950">Hóa đơn #{{ item.invoiceId }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ formatCurrency(item.amount) }} · Lịch #{{ item.appointmentId || '-' }}</p>
            </div>
            <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ item.status }}</span>
          </div>
          <p v-if="!invoices.length" class="px-5 py-8 text-sm text-slate-500">Chưa có hóa đơn.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarPlus } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { getApiErrorMessage } from '@/services/apiClient'
import { fallbackAppointments } from '@/services/fallbackData'
import type { Appointment } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { MedicalRecord } from '@/types/medicalRecord'

const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const appointments = ref<Appointment[]>([])
const invoices = ref<Invoice[]>([])
const records = ref<MedicalRecord[]>([])
const patientId = computed(() => Number(authStore.user?.patientId || 4))

const fallbackPatientAppointments = computed<Appointment[]>(() => fallbackAppointments.map((item) => ({ ...item, patientId: patientId.value, patientName: authStore.user?.fullName || item.patientName })))

const stats = computed(() => [
  { label: 'Lịch hẹn', value: appointments.value.length, note: 'N1 Appointment', to: '/patient/appointments' },
  { label: 'Bệnh án', value: records.value.length, note: 'N2 Medical Record', to: '/patient/records' },
  { label: 'Hóa đơn', value: invoices.value.length, note: 'N3 Billing', to: '/patient/bills' },
])

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = ''
  const results = await Promise.allSettled([
    appointmentApi.getAppointmentsByPatient(patientId.value),
    medicalRecordApi.getMedicalRecords(String(patientId.value)),
    billingApi.getInvoices(patientId.value),
  ])
  appointments.value = readList(results[0], fallbackPatientAppointments.value)
  records.value = readList(results[1], [])
  invoices.value = readList(results[2], [])
  const firstError = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
  if (firstError) error.value = `Một số API chưa phản hồi: ${getApiErrorMessage(firstError.reason)}. Giao diện vẫn hiển thị fallback khi có thể.`
  loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>, fallback: T[]) {
  return result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length ? result.value : fallback
}
function formatCurrency(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0)) }
function formatDate(value?: string) { if (!value) return 'Chưa cập nhật'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date) }
function statusClass(status?: string) { const value = String(status || '').toLowerCase(); if (value.includes('paid') || value.includes('confirmed') || value.includes('completed')) return 'bg-teal-100 text-teal-700'; if (value.includes('pending') || value.includes('unpaid') || value.includes('waiting')) return 'bg-amber-100 text-amber-700'; if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
</script>
