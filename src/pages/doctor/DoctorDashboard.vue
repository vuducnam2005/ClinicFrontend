<template>
  <section class="space-y-6">
    <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_340px]">
        <div class="pointer-events-none absolute right-8 top-6 hidden text-slate-100 xl:block">
          <Stethoscope class="h-40 w-40 stroke-[1.4]" />
        </div>

        <div class="relative">
          <span class="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            Bảng điều khiển bác sĩ
          </span>
          <h1 class="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Xin chào, {{ doctorName }}
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Theo dõi lịch khám, hàng chờ và bệnh án cần xử lý trong ngày của bác sĩ.
          </p>

          <div class="mt-7 flex flex-wrap gap-3">
            <RouterLink to="/doctor/appointments" class="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0F52BA] px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0B4296] focus:outline-none focus:ring-4 focus:ring-blue-100">
              <CalendarClock class="h-4 w-4" />
              Xem lịch hẹn
            </RouterLink>
            <RouterLink to="/doctor/examine" class="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100">
              <Stethoscope class="h-4 w-4" />
              Khám bệnh
            </RouterLink>
          </div>
        </div>

        <div class="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm font-semibold text-slate-500">Thông tin phiên làm việc</p>
          <div class="mt-4 space-y-3">
            <InfoRow label="Bác sĩ" :value="doctorName" />
            <InfoRow label="Chuyên khoa" :value="authStore.user?.specialtyName || 'Chưa cập nhật'" />
            <InfoRow label="Ngày trực" :value="todayLabel" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {{ error }}
    </div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <LoadingSkeleton v-for="item in 5" :key="item" />
    </div>
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <RouterLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
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

    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <PanelCard title="Bệnh nhân tiếp theo" subtitle="Ưu tiên lịch hôm nay, sau đó đến lịch sắp tới gần nhất">
        <div v-if="nextPatient" class="p-5">
          <div class="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Tiếp theo</p>
              <h2 class="mt-2 text-2xl font-bold text-slate-950">{{ nextPatient.patientName }}</h2>
              <p class="mt-2 text-sm text-slate-600">{{ nextPatient.time }} · {{ nextPatient.reason }}</p>
            </div>
            <RouterLink
              to="/doctor/examine"
              class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F52BA] px-4 text-sm font-bold text-white transition hover:bg-[#0B4296] focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <PlayCircle class="h-4 w-4" />
              Bắt đầu khám
            </RouterLink>
          </div>
        </div>
        <EmptyState v-else title="Không có lịch hẹn sắp tới" text="Chưa có bệnh nhân tiếp theo cho bác sĩ này." />
      </PanelCard>

      <PanelCard title="Quick actions" subtitle="Các thao tác bác sĩ dùng thường xuyên">
        <div class="grid gap-3 p-5 sm:grid-cols-2">
          <QuickAction to="/doctor/appointments" label="Xem lịch hẹn" text="Lọc theo ngày và trạng thái" :icon="CalendarClock" />
          <QuickAction to="/doctor/queue" label="Hàng chờ khám" text="Theo dõi bệnh nhân đã check-in" :icon="Users" />
          <QuickAction to="/doctor/examine" label="Khám & kê đơn" text="Ghi bệnh án, kê thuốc" :icon="Stethoscope" />
          <QuickAction to="/doctor/records" label="Lịch sử bệnh án" text="Tra cứu hồ sơ đã lưu" :icon="FileHeart" />
        </div>
      </PanelCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <PanelCard title="Hàng chờ khám" subtitle="Hiển thị tối đa 5 bệnh nhân đang chờ">
        <div v-if="queueRows.length" class="divide-y divide-slate-100">
          <QueueRow v-for="item in queueRows.slice(0, 5)" :key="item.key" :item="item" />
        </div>
        <EmptyState v-else title="Không có bệnh nhân trong hàng chờ" text="Hàng chờ hôm nay chưa có dữ liệu phù hợp." />
      </PanelCard>

      <PanelCard title="Lịch hẹn hôm nay" subtitle="Sắp xếp theo giờ khám tăng dần">
        <div v-if="appointmentRows.length" class="divide-y divide-slate-100">
          <AppointmentRow v-for="item in appointmentRows.slice(0, 6)" :key="item.key" :item="item" />
        </div>
        <EmptyState v-else title="Không có lịch hẹn trong ngày" text="Không có lịch hẹn hôm nay cho bác sĩ đang đăng nhập." />
      </PanelCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarClock, CheckCircle2, ClipboardList, FileHeart, PlayCircle, Stethoscope, Users } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { MedicalRecord } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

type StatusTone = 'success' | 'info' | 'warning' | 'error' | 'muted'

interface SummaryRow {
  key: string | number
  patientName: string
  time: string
  reason: string
  status: string
  tone: StatusTone
  queueNumber?: number | string
}

const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const appointments = ref<Appointment[]>([])
const queue = ref<WaitingQueueItem[]>([])
const visits = ref<any[]>([])
const records = ref<MedicalRecord[]>([])

const today = localDate()
const todayLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
const doctorName = computed(() => authStore.user?.fullName || 'Bác sĩ')

const todayAppointments = computed(() =>
  appointments.value
    .filter((item) => normalizeDate(item.appointmentDate) === today)
    .sort((a, b) => String(a.slotTime || '').localeCompare(String(b.slotTime || ''))),
)

const upcomingAppointments = computed(() =>
  appointments.value
    .filter((item) => normalizeDate(item.appointmentDate) >= today)
    .filter((item) => !isCompleted(item.status) && !isCancelled(item.status))
    .sort((a, b) => `${normalizeDate(a.appointmentDate)} ${a.slotTime || ''}`.localeCompare(`${normalizeDate(b.appointmentDate)} ${b.slotTime || ''}`)),
)

const activeQueue = computed(() => queue.value.filter((item) => normalizeDate(item.appointmentDate) === today))
const inProgressVisits = computed(() => visits.value.filter((item) => isInProgress(item.status)))
const completedVisits = computed(() => visits.value.filter((item) => isCompleted(item.status)))
const prescriptionsCount = computed(() => records.value.filter((item: any) => Number(item.prescriptionId || item.prescriptions?.length || 0) > 0).length)

const stats = computed(() => [
  { label: 'Lịch hẹn hôm nay', value: todayAppointments.value.length, note: 'Theo ngày hiện tại', to: '/doctor/appointments', icon: CalendarClock, iconClass: 'bg-blue-50 text-blue-700' },
  { label: 'Đang chờ khám', value: activeQueue.value.filter((item) => isWaiting(item.status)).length, note: 'Hàng chờ khám bệnh', to: '/doctor/queue', icon: Users, iconClass: 'bg-amber-50 text-amber-700' },
  { label: 'Đang khám', value: inProgressVisits.value.length, note: 'Lượt khám trong ngày', to: '/doctor/examine', icon: Stethoscope, iconClass: 'bg-cyan-50 text-cyan-700' },
  { label: 'Đã hoàn tất', value: completedVisits.value.length, note: 'Lượt khám đã hoàn tất', to: '/doctor/records', icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-700' },
  { label: 'Đơn thuốc đã kê', value: prescriptionsCount.value, note: 'Hồ sơ bệnh án đã kê đơn', to: '/doctor/records', icon: ClipboardList, iconClass: 'bg-indigo-50 text-indigo-700' },
])

const appointmentRows = computed<SummaryRow[]>(() => todayAppointments.value.map((item) => ({
  key: item.appointmentId,
  patientName: displayText(item.patientName) || 'Chưa có tên',
  time: item.slotTime || '--:--',
  reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
  status: statusText(item.status),
  tone: statusTone(item.status),
})))

const upcomingRows = computed<SummaryRow[]>(() => upcomingAppointments.value.map((item) => ({
  key: item.appointmentId,
  patientName: displayText(item.patientName) || 'Chưa có tên',
  time: `${formatDate(item.appointmentDate)} · ${item.slotTime || '--:--'}`,
  reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
  status: statusText(item.status),
  tone: statusTone(item.status),
})))

const queueRows = computed<SummaryRow[]>(() => activeQueue.value.map((item) => ({
  key: item.id || item.queueId || item.appointmentId,
  queueNumber: item.queueNumber || '-',
  patientName: displayText(item.patientName) || 'Chưa có tên',
  time: item.slotTime || '--:--',
  reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
  status: statusText(item.status),
  tone: statusTone(item.status),
})))

const nextPatient = computed(() => appointmentRows.value.find((item) => !['Đã hoàn tất', 'Đã hủy'].includes(item.status)) || upcomingRows.value[0] || queueRows.value[0])

const InfoRow = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3' }, [
      h('span', { class: 'text-sm text-slate-500' }, props.label),
      h('span', { class: 'truncate text-sm font-bold text-slate-950' }, props.value),
    ])
  },
})

const PanelCard = defineComponent({
  props: { title: { type: String, required: true }, subtitle: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('div', { class: 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm' }, [
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
      h(FileHeart, { class: 'mx-auto h-10 w-10 text-slate-300' }),
      h('p', { class: 'mt-3 font-semibold text-slate-950' }, props.title),
      h('p', { class: 'mt-1 text-sm text-slate-500' }, props.text),
    ])
  },
})

const QuickAction = defineComponent({
  props: { to: { type: String, required: true }, label: { type: String, required: true }, text: { type: String, required: true }, icon: { type: Object as () => Component, required: true } },
  setup(props) {
    return () => h(RouterLink, { to: props.to, class: 'group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100' }, () => [
      h('span', { class: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-white' }, [h(props.icon, { class: 'h-5 w-5' })]),
      h('span', { class: 'min-w-0' }, [
        h('span', { class: 'block font-bold text-slate-950' }, props.label),
        h('span', { class: 'mt-1 block text-sm text-slate-500' }, props.text),
      ]),
    ])
  },
})

const QueueRow = defineComponent({
  props: { item: { type: Object as () => SummaryRow, required: true } },
  setup(props) {
    return () => h('div', { class: 'flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50' }, [
      h('div', { class: 'flex min-w-0 items-center gap-3' }, [
        h('span', { class: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700' }, String(props.item.queueNumber || '-')),
        h('div', { class: 'min-w-0' }, [
          h('p', { class: 'truncate font-semibold text-slate-950' }, props.item.patientName),
          h('p', { class: 'mt-1 truncate text-sm text-slate-500' }, `${props.item.time} · ${props.item.reason}`),
        ]),
      ]),
      h('span', { class: ['shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', toneClass(props.item.tone)] }, props.item.status),
    ])
  },
})

const AppointmentRow = defineComponent({
  props: { item: { type: Object as () => SummaryRow, required: true } },
  setup(props) {
    return () => h('div', { class: 'flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50' }, [
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate font-semibold text-slate-950' }, props.item.patientName),
        h('p', { class: 'mt-1 truncate text-sm text-slate-500' }, `${props.item.time} · ${props.item.reason}`),
      ]),
      h('span', { class: ['shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', toneClass(props.item.tone)] }, props.item.status),
    ])
  },
})

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = ''
  appointments.value = []
  queue.value = []
  visits.value = []
  records.value = []

  const doctorId = currentDoctorId(authStore.user)
  const results = await Promise.allSettled([
    doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : Promise.resolve([]),
    appointmentApi.getWaitingQueue(today).then((items) => filterQueueForDoctor(items, authStore.user)),
    doctorId ? medicalRecordApi.getVisitsToday(doctorId) : Promise.resolve([]),
    medicalRecordApi.getMedicalRecords().then((items) => filterRecordsForDoctor(items, authStore.user)),
  ])

  appointments.value = readList(results[0])
  queue.value = readList(results[1])
  visits.value = readList(results[2])
  records.value = readList(results[3])

  const failed = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
  if (failed) error.value = `Kết nối đến máy chủ bị gián đoạn: ${getApiErrorMessage(failed.reason)}. Hệ thống đang hiển thị dữ liệu lưu trữ tạm thời.`
  loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>) {
  return result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
}

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function normalizeDate(value?: string) {
  return String(value || '').slice(0, 10)
}

function isWaiting(status?: string) {
  const value = String(status || '').toLowerCase()
  return value.includes('waiting') || value.includes('pending') || value.includes('confirmed') || value.includes('checked') || value.includes('chờ')
}

function isInProgress(status?: string) {
  const value = String(status || '').toLowerCase()
  return value.includes('progress') || value.includes('đang')
}

function isCompleted(status?: string) {
  const value = String(status || '').toLowerCase()
  return value.includes('done') || value.includes('completed') || value.includes('hoàn')
}

function isCancelled(status?: string) {
  const value = String(status || '').toLowerCase()
  return value.includes('cancel') || value.includes('hủy') || value.includes('huy')
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : new Intl.DateTimeFormat('vi-VN').format(date)
}

function statusText(status?: string) {
  const value = String(status || '')
  const normalized = value.toLowerCase()
  if (normalized.includes('checked')) return 'Đã check-in'
  if (normalized.includes('confirmed')) return 'Đã xác nhận'
  if (normalized.includes('progress')) return 'Đang khám'
  if (normalized.includes('completed') || normalized.includes('done')) return 'Đã hoàn tất'
  if (normalized.includes('cancel')) return 'Đã hủy'
  if (normalized.includes('waiting') || normalized.includes('pending')) return 'Đang chờ'
  return value || 'Chưa cập nhật'
}

function statusTone(status?: string): StatusTone {
  const value = String(status || '').toLowerCase()
  if (value.includes('completed') || value.includes('done')) return 'success'
  if (value.includes('progress')) return 'info'
  if (value.includes('cancel')) return 'error'
  if (value.includes('waiting') || value.includes('pending') || value.includes('confirmed') || value.includes('checked')) return 'warning'
  return 'muted'
}

function toneClass(tone: StatusTone) {
  const classes = {
    success: 'bg-emerald-100 text-emerald-700',
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    muted: 'bg-slate-100 text-slate-700',
  }
  return classes[tone]
}
</script>
