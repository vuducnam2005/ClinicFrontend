<template>
  <section class="space-y-6">
    <div class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-card">
      <div class="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_360px]">
        <div class="pointer-events-none absolute right-8 top-6 hidden text-slate-100 xl:block">
          <Stethoscope class="h-40 w-40 stroke-[1.4]" />
        </div>
        <div class="relative">
          <div class="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            Không gian bác sĩ
          </div>
          <h1 class="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Chào mừng trở lại, {{ doctorName }}.
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Theo dõi hàng đợi, lịch hẹn và bệnh án từ các service N1/N2. Dữ liệu được lọc theo tài khoản bác sĩ đang đăng nhập.
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <RouterLink to="/doctor/examine" class="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
              <Stethoscope class="h-4 w-4" />
              Bắt đầu khám
            </RouterLink>
            <RouterLink to="/doctor/appointments" class="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50">
              <CalendarClock class="h-4 w-4" />
              Xem lịch hẹn
            </RouterLink>
          </div>
        </div>

        <div class="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-sm font-semibold text-slate-500">Thông tin trực</p>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span class="text-sm text-slate-500">Bác sĩ</span>
              <span class="text-sm font-bold text-slate-950">{{ doctorName }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span class="text-sm text-slate-500">Chuyên khoa</span>
              <span class="text-sm font-bold text-slate-950">{{ authStore.user?.specialtyName || 'Chưa cập nhật' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span class="text-sm text-slate-500">Ngày làm việc</span>
              <span class="text-sm font-bold text-slate-950">{{ todayLabel }}</span>
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

    <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <DataPanel title="Hàng đợi hôm nay" subtitle="Nguồn N1 - Waiting Queue">
        <div v-if="queue.length" class="divide-y divide-slate-100">
          <div v-for="item in queue.slice(0, 6)" :key="item.id || item.appointmentId" class="flex items-center justify-between gap-4 px-5 py-4">
            <div class="flex min-w-0 items-center gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">{{ item.queueNumber || '-' }}</span>
              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-950">{{ displayText(item.patientName) }}</p>
                <p class="mt-1 truncate text-sm text-slate-500">{{ item.slotTime || 'Chưa có giờ' }} · {{ item.reason || item.specialtyName || 'Chưa ghi lý do' }}</p>
              </div>
            </div>
            <span :class="['shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ statusText(item.status) }}</span>
          </div>
        </div>
        <EmptyState v-else title="Chưa có bệnh nhân chờ khám" text="Hàng đợi hôm nay chưa có dữ liệu cho bác sĩ này." />
      </DataPanel>

      <DataPanel title="Lịch làm việc gần nhất" subtitle="Nguồn N1 - Doctor Schedule">
        <div v-if="schedules.length" class="divide-y divide-slate-100">
          <div v-for="item in schedules.slice(0, 6)" :key="item.scheduleId" class="px-5 py-4">
            <div class="flex items-center justify-between gap-3">
              <p class="font-semibold text-slate-950">{{ formatDate(item.workDate) }}</p>
              <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', item.isAvailable === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700']">
                {{ item.isAvailable === false ? 'Tạm ngưng' : 'Đang mở' }}
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-500">{{ item.startTime }} - {{ item.endTime }} · {{ item.slotDurationMinutes || 30 }} phút/slot</p>
          </div>
        </div>
        <EmptyState v-else title="Chưa có lịch làm việc" text="N1 chưa trả lịch làm việc cho tài khoản bác sĩ này." />
      </DataPanel>
    </div>

    <DataPanel title="Lịch hẹn gần nhất" subtitle="Nguồn N1 - Appointment">
      <div v-if="appointments.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3">Bệnh nhân</th>
              <th class="px-5 py-3">Ngày khám</th>
              <th class="px-5 py-3">Giờ</th>
              <th class="px-5 py-3">Lý do</th>
              <th class="px-5 py-3 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in appointments.slice(0, 8)" :key="item.appointmentId" class="hover:bg-slate-50">
              <td class="px-5 py-4 font-semibold text-slate-950">{{ displayText(item.patientName) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ formatDate(item.appointmentDate) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ item.slotTime || '-' }}</td>
              <td class="px-5 py-4 text-slate-600">{{ item.reason || 'Chưa ghi nhận' }}</td>
              <td class="px-5 py-4 text-right"><span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ statusText(item.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="Chưa có lịch hẹn" text="Không có lịch hẹn phù hợp với tài khoản bác sĩ đang đăng nhập." />
    </DataPanel>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type Component } from 'vue'
import { CalendarClock, ClipboardList, FileHeart, RefreshCw, Stethoscope, Users } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor, filterSchedulesForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

interface Stat { label: string; value: number; note: string; to: string; icon: Component; iconClass: string }

const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const queue = ref<WaitingQueueItem[]>([])
const appointments = ref<Appointment[]>([])
const schedules = ref<DoctorSchedule[]>([])
const records = ref<MedicalRecord[]>([])
const today = new Date().toISOString().slice(0, 10)
const todayLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
const doctorName = computed(() => authStore.user?.fullName || 'Bác sĩ')

const stats = computed<Stat[]>(() => [
  { label: 'Hàng đợi', value: queue.value.length, note: 'Bệnh nhân hôm nay', to: '/doctor/queue', icon: Users, iconClass: 'bg-blue-50 text-blue-700' },
  { label: 'Lịch hẹn', value: appointments.value.length, note: 'Lịch của bác sĩ', to: '/doctor/appointments', icon: CalendarClock, iconClass: 'bg-cyan-50 text-cyan-700' },
  { label: 'Bệnh án', value: records.value.length, note: 'Nguồn N2', to: '/doctor/records', icon: FileHeart, iconClass: 'bg-indigo-50 text-indigo-700' },
  { label: 'Ca làm', value: schedules.value.length, note: 'Lịch cá nhân', to: '/doctor/schedule', icon: ClipboardList, iconClass: 'bg-emerald-50 text-emerald-700' },
])

const DataPanel = defineComponent({
  props: { title: { type: String, required: true }, subtitle: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('div', { class: 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card' }, [
      h('div', { class: 'flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4' }, [
        h('div', null, [
          h('h2', { class: 'font-bold text-slate-950' }, props.title),
          h('p', { class: 'mt-1 text-sm text-slate-500' }, props.subtitle),
        ]),
        h(RefreshCw, { class: 'h-4 w-4 text-slate-300' }),
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

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = ''
  const doctorId = currentDoctorId(authStore.user)
  const appointmentLoader = doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()
  const scheduleLoader = doctorId ? appointmentApi.getDoctorSchedulesByDoctor(doctorId) : appointmentApi.getDoctorSchedules()

  const results = await Promise.allSettled([
    appointmentApi.getWaitingQueue(today).then((items) => filterQueueForDoctor(items, authStore.user)),
    appointmentLoader.then((items) => filterAppointmentsForDoctor(items, authStore.user)),
    scheduleLoader.then((items) => filterSchedulesForDoctor(items, authStore.user)),
    medicalRecordApi.getMedicalRecords().then((items) => filterRecordsForDoctor(items, authStore.user)),
  ])

  queue.value = readList(results[0])
  appointments.value = readList(results[1])
  schedules.value = readList(results[2])
  records.value = readList(results[3])

  const firstError = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
  if (firstError) error.value = `Một số API chưa phản hồi: ${getApiErrorMessage(firstError.reason)}. Giao diện vẫn hiển thị phần dữ liệu đã tải được.`
  loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>) {
  return result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
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
  if (normalized.includes('cancel')) return 'Đã hủy'
  if (normalized.includes('waiting') || normalized.includes('pending')) return 'Đang chờ'
  return value || 'Chưa cập nhật'
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value.includes('done') || value.includes('completed') || value.includes('confirmed')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('inprogress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('waiting') || value.includes('pending')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
</script>
