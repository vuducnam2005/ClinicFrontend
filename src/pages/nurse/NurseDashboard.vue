<template>
  <section class="space-y-6">
    <div class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-card">
      <div class="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_360px]">
        <div class="pointer-events-none absolute right-8 top-6 hidden text-slate-100 xl:block">
          <ClipboardCheck class="h-40 w-40 stroke-[1.4]" />
        </div>
        <div class="relative">
          <div class="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            Không gian điều phối
          </div>
          <h1 class="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Bảng điều khiển y tá / lễ tân
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Theo dõi lịch hẹn, tiếp nhận bệnh nhân, hàng đợi khám, viện phí và phát thuốc từ N1, N2, N3 qua API Gateway.
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <RouterLink to="/nurse/appointments" class="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
              <CalendarCheck class="h-4 w-4" />
              Xử lý lịch hẹn
            </RouterLink>
            <RouterLink to="/nurse/patients" class="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50">
              <Users class="h-4 w-4" />
              Tiếp nhận bệnh nhân
            </RouterLink>
          </div>
        </div>

        <div class="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm font-semibold text-slate-500">Ca trực hôm nay</p>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span class="text-sm text-slate-500">Ngày</span>
              <span class="text-sm font-bold text-slate-950">{{ todayLabel }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span class="text-sm text-slate-500">Hàng đợi</span>
              <span class="text-sm font-bold text-slate-950">{{ queue.length }} bệnh nhân</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span class="text-sm text-slate-500">Chưa thu phí</span>
              <span class="text-sm font-bold text-slate-950">{{ unpaidInvoices.length }} hóa đơn</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <LoadingSkeleton v-for="item in 4" :key="item" />
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <RouterLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
            <p class="mt-3 text-3xl font-bold text-slate-950">{{ stat.value }}</p>
            <p class="mt-2 text-xs font-semibold text-slate-500">{{ stat.note }}</p>
          </div>
          <span :class="['flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105', stat.iconClass]">
            <component :is="stat.icon" class="h-5 w-5" />
          </span>
        </div>
      </RouterLink>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <DataPanel title="Lịch hẹn cần xử lý" subtitle="Nguồn N1 - Appointment">
        <div v-if="pendingAppointments.length" class="divide-y divide-slate-100">
          <div v-for="item in pendingAppointments.slice(0, 6)" :key="item.appointmentId" class="flex items-center justify-between gap-4 px-5 py-4">
            <div class="min-w-0">
              <p class="truncate font-semibold text-slate-950">{{ displayText(item.patientName) }}</p>
              <p class="mt-1 truncate text-sm text-slate-500">{{ displayText(item.doctorName) }} · {{ formatDate(item.appointmentDate) }} {{ item.slotTime || '' }}</p>
            </div>
            <span :class="['shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ statusText(item.status) }}</span>
          </div>
        </div>
        <EmptyState v-else title="Không có lịch cần xử lý" text="N1 chưa có lịch hẹn chờ tiếp nhận hoặc xác nhận." />
      </DataPanel>

      <DataPanel title="Hóa đơn chưa thanh toán" subtitle="Nguồn N3 - Billing">
        <div v-if="unpaidInvoices.length" class="divide-y divide-slate-100">
          <div v-for="item in unpaidInvoices.slice(0, 6)" :key="item.invoiceId" class="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p class="font-semibold text-slate-950">Hóa đơn #{{ item.invoiceId }}</p>
              <p class="mt-1 text-sm text-slate-500">Bệnh nhân {{ item.patientId }} · {{ formatCurrency(item.amount) }}</p>
            </div>
            <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ statusText(item.status) }}</span>
          </div>
        </div>
        <EmptyState v-else title="Chưa có hóa đơn cần thu" text="N3 không trả hóa đơn chưa thanh toán." />
      </DataPanel>
    </div>

    <DataPanel title="Hàng đợi khám trong ngày" subtitle="Nguồn N1 - Waiting Queue">
      <div v-if="queue.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3 text-right">STT</th>
              <th class="px-5 py-3">Bệnh nhân</th>
              <th class="px-5 py-3">Bác sĩ</th>
              <th class="px-5 py-3">Giờ</th>
              <th class="px-5 py-3 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in queue.slice(0, 8)" :key="item.id || item.appointmentId" class="hover:bg-slate-50">
              <td class="px-5 py-4 text-right font-bold text-blue-700">{{ item.queueNumber || '-' }}</td>
              <td class="px-5 py-4 font-semibold text-slate-950">{{ displayText(item.patientName) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ displayText(item.doctorName) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ item.slotTime || '-' }}</td>
              <td class="px-5 py-4 text-right"><span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ statusText(item.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="Hàng đợi đang trống" text="Chưa có bệnh nhân trong hàng đợi hôm nay." />
    </DataPanel>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type Component } from 'vue'
import { CalendarCheck, ClipboardCheck, CreditCard, FileText, Pill, Users } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Invoice, Prescription } from '@/types/billing'
import type { Patient } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

interface Stat { label: string; value: number; note: string; to: string; icon: Component; iconClass: string }

const loading = ref(true)
const error = ref('')
const appointments = ref<Appointment[]>([])
const patients = ref<Patient[]>([])
const queue = ref<WaitingQueueItem[]>([])
const invoices = ref<Invoice[]>([])
const prescriptions = ref<Prescription[]>([])
const today = new Date().toISOString().slice(0, 10)
const todayLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())

const unpaidInvoices = computed(() => invoices.value.filter((item) => !String(item.status).toLowerCase().includes('paid')))
const pendingAppointments = computed(() => appointments.value.filter((item) => {
  const status = String(item.status || '').toLowerCase()
  return status.includes('pending') || status.includes('waiting') || status.includes('confirmed')
}))
const stats = computed<Stat[]>(() => [
  { label: 'Lịch hẹn', value: appointments.value.length, note: 'Nguồn N1', to: '/nurse/appointments', icon: CalendarCheck, iconClass: 'bg-blue-50 text-blue-700' },
  { label: 'Bệnh nhân', value: patients.value.length, note: 'Hồ sơ N2', to: '/nurse/patients', icon: Users, iconClass: 'bg-cyan-50 text-cyan-700' },
  { label: 'Hàng đợi', value: queue.value.length, note: 'Trong ngày', to: '/nurse/queue', icon: Users, iconClass: 'bg-indigo-50 text-indigo-700' },
  { label: 'Đơn thuốc', value: prescriptions.value.length, note: 'Nguồn N3', to: '/nurse/prescriptions', icon: Pill, iconClass: 'bg-emerald-50 text-emerald-700' },
])

const DataPanel = defineComponent({
  props: { title: { type: String, required: true }, subtitle: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('div', { class: 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card' }, [
      h('div', { class: 'border-b border-slate-100 px-5 py-4' }, [
        h('h2', { class: 'font-bold text-slate-950' }, props.title),
        h('p', { class: 'mt-1 text-sm text-slate-500' }, props.subtitle),
      ]),
      slots.default?.(),
    ])
  },
})

const EmptyState = defineComponent({
  props: { title: { type: String, required: true }, text: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'px-5 py-10 text-center' }, [
      h(FileText, { class: 'mx-auto h-10 w-10 text-slate-300' }),
      h('p', { class: 'mt-3 font-semibold text-slate-950' }, props.title),
      h('p', { class: 'mt-1 text-sm text-slate-500' }, props.text),
    ])
  },
})

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = ''
  const results = await Promise.allSettled([
    appointmentApi.getAppointments(),
    medicalRecordApi.getPatients(),
    appointmentApi.getWaitingQueue(today),
    billingApi.getInvoices(),
    billingApi.getPrescriptions(),
  ])
  appointments.value = readList(results[0])
  patients.value = readList(results[1])
  queue.value = readList(results[2])
  invoices.value = readList(results[3])
  prescriptions.value = readList(results[4])
  const firstError = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
  if (firstError) error.value = `Một số API chưa phản hồi: ${getApiErrorMessage(firstError.reason)}. Giao diện vẫn hiển thị phần dữ liệu đã tải được.`
  loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>) {
  return result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function statusText(status?: string) {
  const value = String(status || '')
  const normalized = value.toLowerCase()
  if (normalized.includes('confirmed')) return 'Đã xác nhận'
  if (normalized.includes('inprogress')) return 'Đang khám'
  if (normalized.includes('completed') || normalized.includes('done')) return 'Hoàn tất'
  if (normalized.includes('paid')) return 'Đã thanh toán'
  if (normalized.includes('unpaid')) return 'Chưa thanh toán'
  if (normalized.includes('cancel')) return 'Đã hủy'
  if (normalized.includes('waiting') || normalized.includes('pending')) return 'Đang chờ'
  return value || 'Chưa cập nhật'
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value.includes('confirmed') || value.includes('completed') || value.includes('done') || value.includes('paid')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('inprogress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('pending') || value.includes('waiting') || value.includes('unpaid')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
</script>
