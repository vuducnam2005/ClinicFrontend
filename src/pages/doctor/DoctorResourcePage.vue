<template>
  <section class="space-y-6">
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{{ config.kicker }}</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{{ config.title }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Bác sĩ: {{ doctorName }}
            </span>
            <span class="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700">
              {{ config.endpoint }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" :disabled="loading" @click="resetFilters">
            <template #icon><RotateCcw class="h-4 w-4" /></template>
            Đặt lại bộ lọc
          </BaseButton>
          <BaseButton variant="outline" :loading="loading" @click="loadData">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard v-for="metric in metrics" :key="metric.label" :metric="metric" />
    </div>

    <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 xl:grid-cols-[1.4fr_180px_180px_180px_180px_auto] xl:items-end">
        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-slate-700">Tìm kiếm</span>
          <span class="relative block">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="filters.keyword"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              :placeholder="config.searchPlaceholder"
            />
          </span>
        </label>

        <BaseInput v-model="filters.date" label="Ngày khám" type="date" />
        <BaseInput v-model="filters.fromDate" label="Từ ngày" type="date" />
        <BaseInput v-model="filters.toDate" label="Đến ngày" type="date" />
        <BaseSelect v-model="filters.status" label="Trạng thái" :options="statusOptions" placeholder="Tất cả" />

        <BaseButton variant="secondary" :loading="loading" @click="loadData">
          Lọc dữ liệu
        </BaseButton>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        Mặc định chỉ hiển thị dữ liệu ngày hôm nay của bác sĩ đang đăng nhập. Chọn khoảng ngày nếu cần đối chiếu dữ liệu cũ.
      </p>
    </div>

    <div v-if="note" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {{ error }}
      <button type="button" class="ml-2 font-bold text-blue-700 underline" @click="loadData">Thử lại</button>
    </div>

    <div v-if="resource === 'examine'" class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 p-4">
          <h2 class="font-bold text-slate-950">Bệnh nhân cần khám</h2>
          <p class="mt-1 text-sm text-slate-500">Chọn một lượt khám đã check-in để ghi bệnh án và kê đơn.</p>
        </div>
        <div v-if="loading" class="space-y-3 p-4">
          <LoadingSkeleton v-for="item in 4" :key="item" />
        </div>
        <div v-else-if="filteredRows.length" class="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
          <button
            v-for="row in filteredRows"
            :key="row.key"
            type="button"
            :class="[
              'block w-full p-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100',
              selectedRow?.key === row.key ? 'bg-blue-50' : 'bg-white',
            ]"
            @click="selectVisit(row)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-bold text-slate-950">{{ row.patientName }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ row.timeLabel }} · {{ row.reason }}</p>
              </div>
              <StatusChip :status="row.status" />
            </div>
          </button>
        </div>
        <EmptyState v-else title="Không có lượt khám phù hợp" text="N2 chưa có visit hôm nay cho bác sĩ này hoặc bệnh nhân chưa được check-in." />
      </div>

      <ExaminationWorkspace
        :row="selectedRow"
        :active-visit="activeVisit"
        :active-record="activeRecord"
        :clinical-orders="clinicalOrders"
        :medicines="medicines"
        :medicine-loading="medicineLoading"
        :saving="savingExam"
        :exam-tab="examTab"
        :exam-form="examForm"
        :order-form="orderForm"
        :prescription-items="prescriptionItems"
        @tab="examTab = $event"
        @start="startVisit"
        @save-record="saveMedicalRecord"
        @add-order="addClinicalOrder"
        @toggle-medicine="toggleMedicine"
        @remove-medicine="removeMedicine"
        @submit="submitExamination"
      />
    </div>

    <div v-else class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="font-bold text-slate-950">{{ config.tableTitle }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ config.tableSubtitle }}</p>
        </div>
        <span class="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{{ filteredRows.length }} dòng</span>
      </div>

      <div v-if="loading" class="grid gap-4 p-4 md:grid-cols-3">
        <LoadingSkeleton v-for="item in 6" :key="item" />
      </div>

      <div v-else-if="filteredRows.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th v-for="column in config.columns" :key="column.key" class="px-5 py-3">{{ column.label }}</th>
              <th class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in pagedRows" :key="row.key" class="transition hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" class="px-5 py-4 align-top">
                <StatusChip v-if="column.key === 'status'" :status="row.status" />
                <span v-else :class="column.strong ? 'font-bold text-slate-950' : 'text-slate-700'">{{ row[column.key] || 'Chưa cập nhật' }}</span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    v-for="action in rowActions(row)"
                    :key="action.key"
                    type="button"
                    :disabled="actingKey === row.key"
                    :class="['inline-flex h-9 items-center rounded-lg px-3 text-xs font-bold transition disabled:opacity-60', action.className]"
                    @click="runAction(action.key, row)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-500">Hiển thị {{ pageStart }} - {{ pageEnd }} trên {{ filteredRows.length }} kết quả</p>
          <div class="flex items-center gap-2">
            <button class="pager-btn" :disabled="page === 1" @click="page--">Trước</button>
            <span class="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{{ page }} / {{ totalPages }}</span>
            <button class="pager-btn" :disabled="page === totalPages" @click="page++">Sau</button>
          </div>
        </div>
      </div>

      <EmptyState v-else :title="config.emptyTitle" :text="config.emptyText" />
    </div>

    <RecordDrawer v-if="recordDrawerOpen" :row="selectedRecord" @close="recordDrawerOpen = false" />
    <DetailDrawer v-if="detailDrawerOpen" :row="selectedDetail" :title="config.detailTitle" @close="detailDrawerOpen = false" />

    <Toast :show="toast.show" :title="toast.title" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileHeart,
  Pill,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { medicalRecordApi, type MedicalVisit, type PrescriptionItemPayload } from '@/services/medicalRecordApi'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor, filterSchedulesForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import { displayText } from '@/utils/displayText'

type Resource = 'appointments' | 'queue' | 'examine' | 'records' | 'schedule'
type ActionKey = 'view' | 'start' | 'complete' | 'cancel' | 'record'
type ToastType = 'success' | 'error'

interface Row {
  key: string | number
  id?: string | number
  appointmentId?: number
  visitId?: number
  medicalRecordId?: number
  patientId?: number | string
  doctorId?: number
  patientName?: string
  doctorName?: string
  date?: string
  time?: string
  timeLabel?: string
  reason?: string
  diagnosis?: string
  diagnosisCode?: string
  note?: string
  status?: string
  room?: string
  raw?: any
  [key: string]: any
}

interface Column { key: string; label: string; strong?: boolean }
interface Config {
  kicker: string
  title: string
  description: string
  endpoint: string
  searchPlaceholder: string
  tableTitle: string
  tableSubtitle: string
  emptyTitle: string
  emptyText: string
  detailTitle: string
  columns: Column[]
}

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const note = ref('')
const rows = ref<Row[]>([])
const page = ref(1)
const pageSize = 10
const actingKey = ref<string | number | null>(null)
const selectedRow = ref<Row | null>(null)
const activeVisit = ref<MedicalVisit | null>(null)
const activeRecord = ref<MedicalRecord | null>(null)
const clinicalOrders = ref<Record<string, any>[]>([])
const medicines = ref<(Medicine & Record<string, any>)[]>([])
const medicineLoading = ref(false)
const savingExam = ref(false)
const examTab = ref('overview')
const recordDrawerOpen = ref(false)
const detailDrawerOpen = ref(false)
const selectedRecord = ref<Row | null>(null)
const selectedDetail = ref<Row | null>(null)
const toast = reactive({ show: false, title: '', message: '', type: 'success' as ToastType })

const filters = reactive({
  keyword: '',
  date: today(),
  fromDate: '',
  toDate: '',
  status: '',
})

const examForm = reactive({
  chiefComplaint: '',
  symptoms: '',
  diagnosisCode: '',
  diagnosis: '',
  doctorNote: '',
  treatmentPlan: '',
  followUpDate: '',
})

const orderForm = reactive({
  orderType: 'Xét nghiệm',
  orderName: '',
  reason: '',
})

const prescriptionItems = ref<PrescriptionItemPayload[]>([])

const configs: Record<Resource, Config> = {
  appointments: {
    kicker: 'N1 Appointments',
    title: 'Lịch hẹn hôm nay',
    description: 'Quản lý lịch khám và trạng thái tiếp nhận bệnh nhân trong ngày.',
    endpoint: 'GET /appointment/api/appointments/doctor/{doctorId}',
    searchPlaceholder: 'Tìm tên bệnh nhân, mã lịch hẹn, lý do khám...',
    tableTitle: 'Danh sách lịch hẹn',
    tableSubtitle: 'Mặc định theo ngày hiện tại và bác sĩ đang đăng nhập.',
    emptyTitle: 'Không có lịch hẹn trong ngày',
    emptyText: 'Không tìm thấy lịch hẹn phù hợp với bộ lọc hiện tại.',
    detailTitle: 'Chi tiết lịch hẹn',
    columns: cols(['id', 'Mã lịch hẹn'], ['patientName', 'Bệnh nhân', true], ['timeLabel', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái']),
  },
  queue: {
    kicker: 'N1 / N2 Queue',
    title: 'Hàng đợi khám',
    description: 'Theo dõi bệnh nhân đang chờ và điều phối quá trình khám.',
    endpoint: 'GET /appointment/api/waiting-queue?date=YYYY-MM-DD',
    searchPlaceholder: 'Tìm bệnh nhân, bác sĩ, lý do khám...',
    tableTitle: 'Danh sách hàng chờ',
    tableSubtitle: 'Chỉ hiển thị hàng chờ của bác sĩ hiện tại trong ngày đã chọn.',
    emptyTitle: 'Không có bệnh nhân trong hàng chờ',
    emptyText: 'Bệnh nhân cần được tiếp nhận/check-in trước khi vào hàng chờ.',
    detailTitle: 'Chi tiết hàng chờ',
    columns: cols(['id', 'STT'], ['patientName', 'Bệnh nhân', true], ['timeLabel', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái']),
  },
  examine: {
    kicker: 'N2 Clinical Flow',
    title: 'Khám & kê đơn',
    description: 'Mở lượt khám đã check-in, ghi bệnh án, tạo chỉ định, kê đơn và hoàn tất lượt khám.',
    endpoint: 'GET /medical/api/v1/medical/visits/today?doctorId=...',
    searchPlaceholder: 'Tìm bệnh nhân cần khám...',
    tableTitle: 'Lượt khám',
    tableSubtitle: 'Chọn một lượt khám để thao tác.',
    emptyTitle: 'Không có lượt khám phù hợp',
    emptyText: 'N2 chưa có visit hôm nay cho bác sĩ này.',
    detailTitle: 'Chi tiết lượt khám',
    columns: cols(['id', 'Visit'], ['patientName', 'Bệnh nhân', true], ['timeLabel', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái']),
  },
  records: {
    kicker: 'N2 Medical Records',
    title: 'Lịch sử bệnh án',
    description: 'Tra cứu bệnh án, chẩn đoán và ghi chú điều trị đã lưu theo bác sĩ đang đăng nhập.',
    endpoint: 'GET /medical/api/v1/medical/patients/{id}/history',
    searchPlaceholder: 'Tìm mã bệnh án, bệnh nhân, mã ICD, chẩn đoán...',
    tableTitle: 'Danh sách bệnh án',
    tableSubtitle: 'Dữ liệu được đọc từ lịch sử bệnh nhân N2.',
    emptyTitle: 'Chưa có bệnh án phù hợp',
    emptyText: 'Không tìm thấy bệnh án của bác sĩ này trong bộ lọc hiện tại.',
    detailTitle: 'Chi tiết bệnh án',
    columns: cols(['id', 'Mã bệnh án'], ['patientName', 'Bệnh nhân', true], ['diagnosis', 'Chẩn đoán'], ['diagnosisCode', 'Mã ICD'], ['timeLabel', 'Ngày tạo'], ['status', 'Trạng thái']),
  },
  schedule: {
    kicker: 'N1 Doctor Schedule',
    title: 'Lịch làm việc',
    description: 'Theo dõi ca làm, thời gian bắt đầu-kết thúc và trạng thái nhận lịch của bác sĩ.',
    endpoint: 'GET /appointment/api/doctor-schedules/doctor/{doctorId}',
    searchPlaceholder: 'Tìm ngày, ca làm, phòng khám...',
    tableTitle: 'Lịch làm việc cá nhân',
    tableSubtitle: 'Dữ liệu lịch trực theo bác sĩ đang đăng nhập.',
    emptyTitle: 'Chưa có lịch làm việc',
    emptyText: 'N1 chưa trả lịch làm việc phù hợp với bộ lọc hiện tại.',
    detailTitle: 'Chi tiết lịch làm việc',
    columns: cols(['timeLabel', 'Ngày'], ['timeRange', 'Ca làm', true], ['room', 'Phòng'], ['slotInfo', 'Slot'], ['status', 'Trạng thái']),
  },
}

const resource = computed<Resource>(() => isResource(route.meta.doctorResource) ? route.meta.doctorResource : 'queue')
const config = computed(() => configs[resource.value])
const doctorId = computed(() => currentDoctorId(authStore.user))
const doctorName = computed(() => authStore.user?.fullName || 'Bác sĩ')

const statusOptions = computed(() => [
  { label: 'Tất cả', value: '' },
  { label: 'Đang chờ', value: 'waiting' },
  { label: 'Đang khám', value: 'progress' },
  { label: 'Đã hoàn tất', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
])

const filteredRows = computed(() => {
  const keyword = normalize(filters.keyword)
  return rows.value
    .filter((row) => {
      const rowDate = row.date || ''
      const byDate = filters.fromDate || filters.toDate
        ? (!filters.fromDate || rowDate >= filters.fromDate) && (!filters.toDate || rowDate <= filters.toDate)
        : !filters.date || rowDate === filters.date
      const byStatus = !filters.status || statusBucket(row.status) === filters.status
      const haystack = normalize([row.id, row.patientName, row.doctorName, row.reason, row.diagnosis, row.diagnosisCode, row.status, row.room].join(' '))
      return byDate && byStatus && (!keyword || haystack.includes(keyword))
    })
    .sort(sortRows)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
const pagedRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const pageStart = computed(() => filteredRows.value.length ? (page.value - 1) * pageSize + 1 : 0)
const pageEnd = computed(() => Math.min(filteredRows.value.length, page.value * pageSize))

const metrics = computed(() => {
  const total = filteredRows.value.length
  const waiting = filteredRows.value.filter((row) => ['waiting', 'confirmed'].includes(statusBucket(row.status))).length
  const progress = filteredRows.value.filter((row) => statusBucket(row.status) === 'progress').length
  const done = filteredRows.value.filter((row) => statusBucket(row.status) === 'completed').length
  return [
    { label: 'Tổng dữ liệu', value: total, note: 'Theo bộ lọc hiện tại', icon: CalendarClock, className: 'bg-blue-50 text-blue-700' },
    { label: 'Đang chờ', value: waiting, note: 'Chờ hoặc đã xác nhận', icon: Clock3, className: 'bg-amber-50 text-amber-700' },
    { label: 'Đang khám', value: progress, note: 'Đang xử lý', icon: Stethoscope, className: 'bg-cyan-50 text-cyan-700' },
    { label: 'Hoàn tất', value: done, note: 'Đã xử lý xong', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  ]
})

watch([resource, () => authStore.user?.id], () => {
  clearWorkingState()
  resetFilters(false)
  loadData()
}, { immediate: true })

watch(filteredRows, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  rows.value = []
  page.value = 1

  try {
    if (!doctorId.value) {
      note.value = 'Không xác định được DoctorId của tài khoản hiện tại. Vui lòng đăng xuất và đăng nhập lại để lấy đúng hồ sơ bác sĩ.'
      return
    }

    if (resource.value === 'appointments') rows.value = await loadAppointmentRows()
    if (resource.value === 'queue') rows.value = await loadQueueRows()
    if (resource.value === 'examine') rows.value = await loadVisitRows()
    if (resource.value === 'records') rows.value = await loadRecordRows()
    if (resource.value === 'schedule') rows.value = await loadScheduleRows()

    showToast('Tải dữ liệu thành công', 'Dữ liệu đã được lọc theo bác sĩ và bộ lọc hiện tại.', 'success')
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Tải dữ liệu thất bại', error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function loadAppointmentRows() {
  const data = await appointmentApi.getAppointmentsByDoctor(doctorId.value)
  return filterAppointmentsForDoctor(data, authStore.user).map(mapAppointment)
}

async function loadQueueRows() {
  const data = await appointmentApi.getWaitingQueue(filters.date || today())
  return filterQueueForDoctor(data, authStore.user).map(mapQueue)
}

async function loadVisitRows() {
  try {
    const data = await medicalRecordApi.getVisitsToday(doctorId.value)
    return data.map(mapVisit)
  } catch (apiError) {
    note.value = `N2 /visits/today đang lỗi (${getApiErrorMessage(apiError)}). Đang hiển thị hàng chờ N1 để đối chiếu, chỉ dòng có Visit N2 mới khám được.`
    const queueRows = await loadQueueRows()
    return queueRows
  }
}

async function loadRecordRows() {
  const data = await medicalRecordApi.getMedicalRecords()
  return filterRecordsForDoctor(data, authStore.user).map(mapRecord)
}

async function loadScheduleRows() {
  const data = await appointmentApi.getDoctorSchedulesByDoctor(doctorId.value)
  return filterSchedulesForDoctor(data, authStore.user).map(mapSchedule)
}

function resetFilters(reload = true) {
  filters.keyword = ''
  filters.date = today()
  filters.fromDate = ''
  filters.toDate = ''
  filters.status = ''
  page.value = 1
  if (reload) loadData()
}

function rowActions(row: Row) {
  if (resource.value === 'appointments') {
    const actions = [{ key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' }]
    if (statusBucket(row.status) === 'progress') actions.push({ key: 'complete', label: 'Hoàn tất', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
    if (!['completed', 'cancelled'].includes(statusBucket(row.status))) actions.push({ key: 'cancel', label: 'Hủy', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
    return actions
  }
  if (resource.value === 'queue') {
    return [
      { key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' },
      { key: 'start' as ActionKey, label: 'Khám bệnh', className: 'bg-blue-600 text-white hover:bg-blue-700' },
    ]
  }
  if (resource.value === 'records') {
    return [{ key: 'record' as ActionKey, label: 'Chi tiết', className: 'bg-blue-600 text-white hover:bg-blue-700' }]
  }
  return [{ key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' }]
}

async function runAction(action: ActionKey, row: Row) {
  actingKey.value = row.key
  try {
    if (action === 'view') openDetail(row)
    if (action === 'record') openRecord(row)
    if (action === 'start') await openExamFromRow(row)
    if (action === 'complete') await completeAppointment(row)
    if (action === 'cancel') await cancelAppointment(row)
  } finally {
    actingKey.value = null
  }
}

function openDetail(row: Row) {
  selectedDetail.value = row
  detailDrawerOpen.value = true
}

function openRecord(row: Row) {
  selectedRecord.value = row
  recordDrawerOpen.value = true
}

async function openExamFromRow(row: Row) {
  if (resource.value !== 'examine') {
    selectedRow.value = row
  }
  const opened = await selectVisit(row)
  if (!opened) return
  if (resource.value !== 'examine') showToast('Đã mở lượt khám', 'Chuyển sang trang Khám & kê đơn nếu cần thao tác đầy đủ.', 'success')
}

async function selectVisit(row: Row) {
  selectedRow.value = row
  clearExamOnly()
  examForm.chiefComplaint = meaningful(row.reason)
  try {
    const visit = row.visitId
      ? await medicalRecordApi.getVisit(row.visitId)
      : row.appointmentId
        ? await medicalRecordApi.getVisitByAppointment(row.appointmentId)
        : null
    if (!visit?.visitId) throw new Error('Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.')
    activeVisit.value = visit
    examForm.chiefComplaint = meaningful(visit.chiefComplaint || row.reason)
    await Promise.all([loadExistingRecord(), loadMedicines()])
    return true
  } catch (apiError) {
    showToast('Không mở được lượt khám', businessError(apiError), 'error')
    return false
  }
}

async function startVisit() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.', 'error')
  if (!examForm.chiefComplaint.trim()) return showToast('Thiếu lý do khám', 'Vui lòng nhập lý do khám trước khi bắt đầu lượt khám.', 'error')
  savingExam.value = true
  try {
    await medicalRecordApi.startVisit(activeVisit.value.visitId, { doctorId: doctorId.value, chiefComplaint: examForm.chiefComplaint.trim() })
    activeVisit.value = await medicalRecordApi.getVisit(activeVisit.value.visitId)
    showToast('Đã bắt đầu khám', 'Tiếp theo nhập bệnh án ở tab Bệnh án.', 'success')
  } catch (apiError) {
    showToast('Chưa thể bắt đầu khám', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function saveMedicalRecord() {
  if (!activeVisit.value?.visitId) {
    showToast('Thiếu lượt khám', 'Cần có Visit N2 trước khi lưu bệnh án.', 'error')
    return false
  }
  if (!examForm.diagnosis.trim()) {
    showToast('Thiếu chẩn đoán', 'Vui lòng nhập chẩn đoán trước khi lưu bệnh án.', 'error')
    return false
  }
  savingExam.value = true
  try {
    const payload = {
      visitId: activeVisit.value.visitId,
      diagnosisCode: examForm.diagnosisCode.trim() || undefined,
      diagnosisText: examForm.diagnosis.trim(),
      doctorNote: examForm.doctorNote.trim() || undefined,
      treatmentPlan: examForm.treatmentPlan.trim() || undefined,
      followUpDate: examForm.followUpDate || undefined,
    }
    activeRecord.value = activeRecord.value?.medicalRecordId
      ? await medicalRecordApi.updateMedicalRecord(activeRecord.value.medicalRecordId, payload)
      : await medicalRecordApi.createMedicalRecord(payload)
    await loadClinicalOrders()
    showToast('Lưu bệnh án thành công', 'Tiếp theo có thể tạo chỉ định hoặc kê đơn thuốc.', 'success')
    return true
  } catch (apiError) {
    showToast('Lưu bệnh án thất bại', businessError(apiError), 'error')
    return false
  } finally {
    savingExam.value = false
  }
}

async function addClinicalOrder() {
  if (!activeRecord.value?.medicalRecordId) return showToast('Chưa có bệnh án', 'Cần lưu bệnh án trước khi tạo chỉ định lâm sàng.', 'error')
  if (!orderForm.orderName.trim()) return showToast('Thiếu chỉ định', 'Vui lòng nhập tên chỉ định lâm sàng.', 'error')
  savingExam.value = true
  try {
    await medicalRecordApi.createClinicalOrder({
      medicalRecordId: activeRecord.value.medicalRecordId,
      orderType: orderForm.orderType,
      orderName: orderForm.orderName.trim(),
      reason: orderForm.reason.trim() || undefined,
    })
    orderForm.orderName = ''
    orderForm.reason = ''
    await loadClinicalOrders()
    showToast('Đã tạo chỉ định', 'Chỉ định đã lưu vào N2.', 'success')
  } catch (apiError) {
    showToast('Tạo chỉ định thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function submitExamination() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Cần mở lượt khám N2 trước khi hoàn tất.', 'error')
  savingExam.value = true
  try {
    const saved = await saveMedicalRecord()
    if (!saved) return
    const recordId = Number(activeRecord.value?.medicalRecordId)
    if (!recordId) throw new Error('Cần lưu bệnh án trước khi hoàn tất lượt khám.')

    if (prescriptionItems.value.length) {
      validatePrescriptionItems()
      const draft = await medicalRecordApi.createPrescription({ medicalRecordId: recordId, note: prescriptionNote() })
      const prescriptionId = Number((draft as any).prescriptionId || (draft as any).id)
      for (const item of prescriptionItems.value) await medicalRecordApi.addPrescriptionItem(prescriptionId, item)
      await medicalRecordApi.submitPrescription(prescriptionId, { medicalRecordId: recordId, note: prescriptionNote(), items: prescriptionItems.value })
    }

    await medicalRecordApi.completeMedicalRecord(recordId)
    await medicalRecordApi.completeVisit(activeVisit.value.visitId)
    if (activeVisit.value.appointmentId) await appointmentApi.completeAppointmentSafely(activeVisit.value.appointmentId, selectedRow.value?.date).catch(() => undefined)
    showToast(
      'Hoàn tất khám',
      prescriptionItems.value.length
        ? 'Đơn thuốc đã chốt qua N2. N3 sẽ tự tạo viện phí qua event prescription.created.'
        : 'Bệnh án và lượt khám đã hoàn tất.',
      'success',
    )
    clearWorkingState()
    await loadData()
  } catch (apiError) {
    showToast('Chưa hoàn tất khám', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function completeAppointment(row: Row) {
  if (!row.appointmentId) return
  try {
    await appointmentApi.completeAppointmentSafely(row.appointmentId, row.date)
    showToast('Cập nhật trạng thái thành công', 'Lịch hẹn đã được hoàn tất.', 'success')
    await loadData()
  } catch (apiError) {
    showToast('Cập nhật thất bại', businessError(apiError), 'error')
  }
}

async function cancelAppointment(row: Row) {
  if (!row.appointmentId) return
  try {
    await appointmentApi.cancelAppointment(row.appointmentId)
    showToast('Đã hủy lịch hẹn', 'Lịch hẹn đã chuyển sang trạng thái hủy.', 'success')
    await loadData()
  } catch (apiError) {
    showToast('Hủy lịch thất bại', businessError(apiError), 'error')
  }
}

async function loadExistingRecord() {
  if (!activeVisit.value?.visitId) return
  if (!activeVisit.value.medicalRecordId) {
    activeRecord.value = null
    clinicalOrders.value = []
    return
  }
  try {
    activeRecord.value = await medicalRecordApi.getMedicalRecordByVisit(activeVisit.value.visitId)
    examForm.diagnosis = activeRecord.value.diagnosisText || activeRecord.value.diagnosis || ''
    examForm.diagnosisCode = activeRecord.value.diagnosisCode || ''
    examForm.doctorNote = activeRecord.value.doctorNote || activeRecord.value.doctorNotes || ''
    examForm.treatmentPlan = activeRecord.value.treatmentPlan || ''
    examForm.followUpDate = String(activeRecord.value.followUpDate || '').slice(0, 10)
    await loadClinicalOrders()
  } catch (apiError: any) {
    if (apiError?.response?.status !== 404) note.value = `Chưa tải được bệnh án theo visit: ${getApiErrorMessage(apiError)}`
  }
}

async function loadClinicalOrders() {
  const medicalRecordId = Number(activeRecord.value?.medicalRecordId)
  if (!medicalRecordId) {
    clinicalOrders.value = []
    return
  }
  clinicalOrders.value = await medicalRecordApi.getClinicalOrders({ medicalRecordId }).catch(() => [])
}

async function loadMedicines() {
  if (medicines.value.length) return
  medicineLoading.value = true
  try {
    medicines.value = await medicalRecordApi.getMedicines({ status: 'Active' }) as any
  } finally {
    medicineLoading.value = false
  }
}

function toggleMedicine(medicine: Medicine & Record<string, any>) {
  const id = medicineId(medicine)
  if (!id) return
  if (prescriptionItems.value.some((item) => item.medicineId === id)) {
    removeMedicine(id)
    return
  }
  prescriptionItems.value.push({
    medicineId: id,
    medicineNameSnapshot: medicineName(medicine),
    unitSnapshot: medicineUnit(medicine),
    dosage: '',
    frequency: '',
    durationDays: 1,
    quantity: 1,
    usageInstruction: '',
  })
}

function removeMedicine(medicineIdValue: number) {
  prescriptionItems.value = prescriptionItems.value.filter((item) => item.medicineId !== medicineIdValue)
}

function validatePrescriptionItems() {
  for (const item of prescriptionItems.value) {
    if (!item.medicineId || !item.medicineNameSnapshot) throw new Error('Đơn thuốc có dòng thuốc không hợp lệ.')
    if (!item.dosage.trim()) throw new Error('Vui lòng nhập liều dùng cho tất cả thuốc.')
    if (!item.frequency.trim()) throw new Error('Vui lòng nhập tần suất dùng thuốc.')
    if (!Number.isFinite(Number(item.durationDays)) || Number(item.durationDays) <= 0) throw new Error('Số ngày dùng thuốc phải lớn hơn 0.')
    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) throw new Error('Số lượng thuốc phải lớn hơn 0.')
  }
}

function clearWorkingState() {
  selectedRow.value = null
  selectedRecord.value = null
  selectedDetail.value = null
  recordDrawerOpen.value = false
  detailDrawerOpen.value = false
  clearExamOnly()
}

function clearExamOnly() {
  activeVisit.value = null
  activeRecord.value = null
  clinicalOrders.value = []
  prescriptionItems.value = []
  examTab.value = 'overview'
  Object.assign(examForm, { chiefComplaint: '', symptoms: '', diagnosisCode: '', diagnosis: '', doctorNote: '', treatmentPlan: '', followUpDate: '' })
}

function mapAppointment(item: Appointment): Row {
  return {
    key: `A${item.appointmentId}`,
    id: item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    patientName: displayText(item.patientName) || 'Chưa có tên',
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.appointmentDate),
    time: item.slotTime || '',
    timeLabel: `${formatDate(item.appointmentDate)} · ${item.slotTime || '--:--'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
    status: item.status,
    raw: item,
  }
}

function mapQueue(item: WaitingQueueItem): Row {
  return {
    key: `Q${item.id || item.queueId || item.appointmentId}`,
    id: item.queueNumber || item.id || item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    patientName: displayText(item.patientName) || 'Chưa có tên',
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.appointmentDate),
    time: item.slotTime || '',
    timeLabel: `${formatDate(item.appointmentDate)} · ${item.slotTime || '--:--'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
    status: item.status,
    raw: item,
  }
}

function mapVisit(item: MedicalVisit): Row {
  return {
    key: `V${item.visitId || item.id}`,
    id: item.visitId || item.id,
    visitId: item.visitId || item.id,
    medicalRecordId: item.medicalRecordId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    patientName: displayText(item.patientName) || 'Chưa có tên',
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.visitDate || item.createdAt),
    time: timeOf(item.visitDate || item.createdAt),
    timeLabel: `${formatDate(item.visitDate || item.createdAt)} · ${timeOf(item.visitDate || item.createdAt) || '--:--'}`,
    reason: item.chiefComplaint || item.symptoms || 'Chưa ghi lý do',
    status: item.status,
    raw: item,
  }
}

function mapRecord(item: MedicalRecord): Row {
  const patientName = (item as any).patientName || (item as any).patient?.fullName || (item as any).Patient?.FullName || `Bệnh nhân #${item.patientId || ''}`
  return {
    key: `R${item.medicalRecordId || item.recordId || item.id}`,
    id: item.medicalRecordCode || item.medicalRecordIdCode || item.recordIdCode || item.recordId || item.medicalRecordId || item.id,
    medicalRecordId: item.medicalRecordId,
    patientId: item.patientId,
    doctorId: Number(item.doctorId || 0) || undefined,
    patientName: displayText(patientName),
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.createdAt || item.examDate),
    timeLabel: formatDate(item.createdAt || item.examDate),
    diagnosis: item.diagnosisText || item.diagnosis || 'Chưa có chẩn đoán',
    diagnosisCode: item.diagnosisCode || '-',
    note: item.doctorNote || item.doctorNotes || item.treatmentPlan || 'Chưa ghi chú',
    status: item.status || 'Đã lưu',
    raw: item,
  }
}

function mapSchedule(item: DoctorSchedule & Record<string, any>): Row {
  return {
    key: `S${item.scheduleId || item.id}`,
    id: item.scheduleId || item.id,
    doctorId: item.doctorId,
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.workDate),
    timeLabel: formatDate(item.workDate),
    timeRange: `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`,
    slotInfo: `${item.slotDurationMinutes || 30} phút/slot`,
    room: item.roomName || item.roomNumber || item.room || 'Chưa cập nhật',
    status: item.isAvailable === false ? 'Hết slot' : 'Còn slot',
    raw: item,
  }
}

function sortRows(a: Row, b: Row) {
  const dateCompare = String(a.date || '').localeCompare(String(b.date || ''))
  if (dateCompare) return dateCompare
  return String(a.time || '').localeCompare(String(b.time || ''))
}

function statusBucket(status?: string) {
  const value = normalize(status)
  if (value.includes('cancel') || value.includes('huy') || value.includes('hủy')) return 'cancelled'
  if (value.includes('complete') || value.includes('done') || value.includes('hoan') || value.includes('hoàn')) return 'completed'
  if (value.includes('progress') || value.includes('dang') || value.includes('đang')) return 'progress'
  if (value.includes('confirm') || value.includes('checked')) return 'confirmed'
  if (value.includes('wait') || value.includes('pending') || value.includes('cho') || value.includes('chờ')) return 'waiting'
  return 'other'
}

function statusText(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'cancelled') return 'Đã hủy'
  if (bucket === 'completed') return 'Đã hoàn tất'
  if (bucket === 'progress') return 'Đang khám'
  if (bucket === 'confirmed') return 'Đã xác nhận'
  if (bucket === 'waiting') return 'Đang chờ'
  return status || 'Chưa cập nhật'
}

function statusClass(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (bucket === 'progress') return 'bg-blue-100 text-blue-700'
  if (bucket === 'confirmed') return 'bg-cyan-100 text-cyan-700'
  if (bucket === 'waiting') return 'bg-amber-100 text-amber-700'
  if (bucket === 'cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function meaningful(value: unknown) {
  const textValue = String(value || '').trim()
  const normalized = normalize(textValue)
  if (!textValue || normalized.includes('chua ghi') || normalized.includes('chua cap')) return ''
  return textValue
}

function today() {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function normalizeDate(value?: string) {
  return String(value || '').slice(0, 10)
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : new Intl.DateTimeFormat('vi-VN').format(date)
}

function timeOf(value?: string) {
  if (!value) return ''
  const match = String(value).match(/T(\d{2}:\d{2})/)
  return match?.[1] || ''
}

function medicineId(medicine: Medicine & Record<string, any>) {
  return Number(medicine.medicineId ?? medicine.MedicineId ?? medicine.id ?? 0)
}

function medicineName(medicine: Medicine & Record<string, any>) {
  return String(medicine.medicineName ?? medicine.MedicineName ?? medicine.name ?? `Thuốc #${medicineId(medicine)}`)
}

function medicineUnit(medicine: Medicine & Record<string, any>) {
  return String(medicine.unit ?? medicine.Unit ?? medicine.dosageForm ?? medicine.DosageForm ?? 'đơn vị')
}

function medicineStock(medicine: Medicine & Record<string, any>) {
  const value = Number(medicine.stockQuantity ?? medicine.StockQuantity ?? medicine.stock ?? 0)
  return Number.isFinite(value) ? value : 0
}

function medicinePrice(medicineIdValue: number) {
  const medicine = medicines.value.find((item) => medicineId(item) === medicineIdValue)
  return Number(medicine?.unitPrice ?? medicine?.UnitPrice ?? medicine?.price ?? medicine?.Price ?? 0) || 0
}

function prescriptionNote() {
  return prescriptionItems.value.map((item) => `${item.medicineNameSnapshot}: ${item.quantity} ${item.unitSnapshot || ''}; ${item.dosage}; ${item.frequency}; ${item.durationDays} ngày`).join('\n')
}

function businessError(apiError: unknown) {
  const message = getApiErrorMessage(apiError)
  const normalized = normalize(message)
  if (normalized.includes('visit') || normalized.includes('luot kham') || normalized.includes('by-appointment')) return 'Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.'
  if (normalized.includes('record') && normalized.includes('complete')) return 'Cần hoàn tất bệnh án trước khi hoàn tất lượt khám.'
  if (normalized.includes('diagnosis')) return 'Vui lòng nhập chẩn đoán hợp lệ trước khi lưu bệnh án.'
  return message
}

function showToast(title: string, message: string, type: ToastType = 'success') {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
}

function cols(...defs: [string, string, boolean?][]): Column[] {
  return defs.map(([key, label, strong]) => ({ key, label, strong }))
}

function isResource(value: unknown): value is Resource {
  return typeof value === 'string' && value in configs
}

const StatusChip = defineComponent({
  props: { status: { type: String, default: '' } },
  setup(props) {
    return () => h('span', { class: ['inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusClass(props.status)] }, statusText(props.status))
  },
})

const MetricCard = defineComponent({
  props: { metric: { type: Object as PropType<any>, required: true } },
  setup(props) {
    return () => h('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' }, [
      h('div', { class: 'flex items-start justify-between gap-4' }, [
        h('div', null, [
          h('p', { class: 'text-sm font-medium text-slate-500' }, props.metric.label),
          h('p', { class: 'mt-3 text-3xl font-bold text-slate-950' }, String(props.metric.value)),
          h('p', { class: 'mt-1 text-xs font-semibold text-slate-500' }, props.metric.note),
        ]),
        h('span', { class: ['flex h-11 w-11 items-center justify-center rounded-xl', props.metric.className] }, [h(props.metric.icon, { class: 'h-5 w-5' })]),
      ]),
    ])
  },
})

const EmptyState = defineComponent({
  props: { title: { type: String, required: true }, text: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'p-10 text-center' }, [
      h(SearchX, { class: 'mx-auto h-10 w-10 text-slate-300' }),
      h('h2', { class: 'mt-4 text-lg font-bold text-slate-950' }, props.title),
      h('p', { class: 'mt-2 text-sm text-slate-500' }, props.text),
    ])
  },
})

const DetailDrawer = defineComponent({
  props: { row: { type: Object as PropType<Row | null>, default: null }, title: { type: String, required: true } },
  emits: ['close'],
  setup(props, { emit }) {
    return () => h('div', { class: 'fixed inset-0 z-50 bg-slate-950/40', onClick: () => emit('close') }, [
      h('aside', { class: 'ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl', onClick: (event: Event) => event.stopPropagation() }, [
        drawerHeader(props.title, emit),
        h('div', { class: 'mt-6 space-y-3' }, Object.entries(props.row || {}).filter(([key]) => !['raw', 'key'].includes(key)).map(([key, value]) =>
          h('div', { class: 'rounded-xl border border-slate-200 p-4' }, [
            h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, key),
            h('p', { class: 'mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800' }, String(value || 'Chưa cập nhật')),
          ]),
        )),
      ]),
    ])
  },
})

const RecordDrawer = defineComponent({
  props: { row: { type: Object as PropType<Row | null>, default: null } },
  emits: ['close'],
  setup(props, { emit }) {
    return () => h('div', { class: 'fixed inset-0 z-50 bg-slate-950/40', onClick: () => emit('close') }, [
      h('aside', { class: 'ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl', onClick: (event: Event) => event.stopPropagation() }, [
        drawerHeader('Chi tiết bệnh án', emit),
        h('div', { class: 'mt-6 grid gap-4' }, [
          sectionBlock('Tổng quan', [
            ['Mã bệnh án', props.row?.id],
            ['Bệnh nhân', props.row?.patientName],
            ['Ngày tạo', props.row?.timeLabel],
            ['Trạng thái', statusText(props.row?.status)],
          ]),
          sectionBlock('Chẩn đoán', [
            ['Mã ICD', props.row?.diagnosisCode],
            ['Chẩn đoán', props.row?.diagnosis],
            ['Ghi chú', props.row?.note],
          ]),
          sectionBlock('Điều trị', [
            ['Kế hoạch', props.row?.raw?.treatmentPlan || props.row?.raw?.TreatmentPlan],
            ['Ngày tái khám', formatDate(props.row?.raw?.followUpDate || props.row?.raw?.FollowUpDate)],
          ]),
        ]),
      ]),
    ])
  },
})

const ExaminationWorkspace = defineComponent({
  props: {
    row: { type: Object as PropType<Row | null>, default: null },
    activeVisit: { type: Object as PropType<MedicalVisit | null>, default: null },
    activeRecord: { type: Object as PropType<MedicalRecord | null>, default: null },
    clinicalOrders: { type: Array as PropType<Record<string, any>[]>, required: true },
    medicines: { type: Array as PropType<(Medicine & Record<string, any>)[]>, required: true },
    medicineLoading: Boolean,
    saving: Boolean,
    examTab: { type: String, required: true },
    examForm: { type: Object as PropType<typeof examForm>, required: true },
    orderForm: { type: Object as PropType<typeof orderForm>, required: true },
    prescriptionItems: { type: Array as PropType<PrescriptionItemPayload[]>, required: true },
  },
  emits: ['tab', 'start', 'save-record', 'add-order', 'toggle-medicine', 'remove-medicine', 'submit'],
  setup(props, { emit }) {
    const tabs = [
      ['overview', 'Thông tin khám'],
      ['record', 'Bệnh án'],
      ['prescription', 'Đơn thuốc'],
      ['history', 'Lịch sử'],
    ]
    return () => h('div', { class: 'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm' }, [
      props.row
        ? [
            h('div', { class: 'border-b border-slate-100 p-5' }, [
              h('div', { class: 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between' }, [
                h('div', null, [
                  h('p', { class: 'text-xs font-bold uppercase tracking-[0.16em] text-blue-700' }, 'Không gian khám'),
                  h('h2', { class: 'mt-1 text-2xl font-bold text-slate-950' }, props.row.patientName || 'Bệnh nhân'),
                  h('p', { class: 'mt-2 text-sm text-slate-500' }, `${props.row.timeLabel || ''} · ${props.row.reason || 'Chưa ghi lý do'}`),
                ]),
                h(StatusChip, { status: props.activeVisit?.status || props.row.status }),
              ]),
              h('div', { class: 'mt-4 flex flex-wrap gap-2' }, tabs.map(([key, label]) =>
                h('button', {
                  type: 'button',
                  class: ['rounded-xl px-3 py-2 text-sm font-bold transition', props.examTab === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'],
                  onClick: () => emit('tab', key),
                }, label),
              )),
            ]),
            h('div', { class: 'p-5' }, renderExamTab(props, emit)),
          ]
        : h(EmptyState, { title: 'Chưa chọn bệnh nhân', text: 'Chọn một bệnh nhân bên trái để bắt đầu khám, lưu bệnh án và kê đơn.' }),
    ])
  },
})

function renderExamTab(props: any, emit: any) {
  if (props.examTab === 'overview') {
    return h('div', { class: 'space-y-4' }, [
      sectionBlock('Thông tin lượt khám', [
        ['Visit', props.activeVisit?.visitId || props.row?.visitId || 'Chưa có'],
        ['Lịch hẹn', props.activeVisit?.appointmentId || props.row?.appointmentId || 'Không gắn lịch'],
        ['Lý do khám', props.examForm.chiefComplaint || props.row?.reason || 'Chưa ghi nhận'],
      ]),
      h('div', { class: 'grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end' }, [
        h('label', { class: 'block' }, [
          h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, 'Lý do khám *'),
          h('input', {
            value: props.examForm.chiefComplaint,
            class: 'form-input',
            placeholder: 'Nhập lý do khám trước khi bắt đầu',
            onInput: (event: Event) => { props.examForm.chiefComplaint = (event.target as HTMLInputElement).value },
          }),
        ]),
        h(BaseButton, { type: 'button', variant: 'primary', loading: props.saving, onClick: () => emit('start') }, () => 'Bắt đầu lượt khám'),
      ]),
    ])
  }
  if (props.examTab === 'record') {
    return h('div', { class: 'space-y-4' }, [
      h('div', { class: 'grid gap-4 sm:grid-cols-2' }, [
        textareaField('Triệu chứng', props.examForm.symptoms, (value: string) => { props.examForm.symptoms = value }, 'Ghi nhận triệu chứng lâm sàng', 'sm:col-span-2'),
        inputField('Mã ICD', props.examForm.diagnosisCode, (value: string) => { props.examForm.diagnosisCode = value }, 'VD: H10'),
        inputField('Ngày tái khám', props.examForm.followUpDate, (value: string) => { props.examForm.followUpDate = value }, '', 'date'),
        textareaField('Chẩn đoán *', props.examForm.diagnosis, (value: string) => { props.examForm.diagnosis = value }, 'Chẩn đoán hoặc kết luận khám', 'sm:col-span-2'),
        textareaField('Ghi chú bác sĩ', props.examForm.doctorNote, (value: string) => { props.examForm.doctorNote = value }, 'Ghi chú nội bộ', 'sm:col-span-2'),
        textareaField('Kế hoạch điều trị', props.examForm.treatmentPlan, (value: string) => { props.examForm.treatmentPlan = value }, 'Hướng điều trị', 'sm:col-span-2'),
      ]),
      h('div', { class: 'flex justify-end' }, [h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('save-record') }, () => 'Lưu bệnh án')]),
      h('div', { class: 'rounded-2xl border border-slate-200 bg-slate-50 p-4' }, [
        h('h3', { class: 'font-bold text-slate-950' }, 'Chỉ định lâm sàng'),
        h('div', { class: 'mt-3 grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end' }, [
          selectField('Loại', props.orderForm.orderType, (value: string) => { props.orderForm.orderType = value }, ['Xét nghiệm', 'Siêu âm', 'X-quang', 'Khác']),
          inputField('Tên chỉ định', props.orderForm.orderName, (value: string) => { props.orderForm.orderName = value }, 'VD: X-quang phổi'),
          inputField('Lý do', props.orderForm.reason, (value: string) => { props.orderForm.reason = value }, 'Lý do chỉ định'),
          h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('add-order') }, () => 'Thêm'),
        ]),
        props.clinicalOrders.length
          ? h('div', { class: 'mt-3 flex flex-wrap gap-2' }, props.clinicalOrders.map((order: any) => h('span', { class: 'rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200' }, `${order.orderType || order.OrderType} - ${order.orderName || order.OrderName}`)))
          : null,
      ]),
    ])
  }
  if (props.examTab === 'prescription') {
    return h('div', { class: 'space-y-4' }, [
      props.medicineLoading ? h(LoadingSkeleton) : h('div', { class: 'grid gap-3 md:grid-cols-2' }, props.medicines.map((medicine: any) => {
        const id = medicineId(medicine)
        const selected = props.prescriptionItems.some((item: PrescriptionItemPayload) => item.medicineId === id)
        return h('button', {
          type: 'button',
          class: ['rounded-2xl border bg-white p-4 text-left transition hover:border-blue-200', selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'],
          onClick: () => emit('toggle-medicine', medicine),
        }, [
          h('p', { class: 'font-bold text-slate-950' }, medicineName(medicine)),
          h('p', { class: 'mt-1 text-sm text-slate-500' }, `Tồn: ${medicineStock(medicine)} ${medicineUnit(medicine)}`),
        ])
      })),
      props.prescriptionItems.length
        ? h('div', { class: 'space-y-3' }, props.prescriptionItems.map((item: PrescriptionItemPayload) => h('div', { class: 'rounded-2xl border border-slate-200 p-4' }, [
            h('div', { class: 'flex items-start justify-between gap-3' }, [
              h('p', { class: 'font-bold text-slate-950' }, item.medicineNameSnapshot),
              h('button', { type: 'button', class: 'text-rose-600', onClick: () => emit('remove-medicine', item.medicineId) }, [h(Trash2, { class: 'h-4 w-4' })]),
            ]),
            h('div', { class: 'mt-3 grid gap-3 md:grid-cols-5' }, [
              inputField('SL', item.quantity, (value: string) => { item.quantity = Number(value) }, '1', 'number'),
              inputField('Liều dùng', item.dosage, (value: string) => { item.dosage = value }, '1 viên/lần'),
              inputField('Tần suất', item.frequency, (value: string) => { item.frequency = value }, '2 lần/ngày'),
              inputField('Số ngày', item.durationDays, (value: string) => { item.durationDays = Number(value) }, '1', 'number'),
              inputField('Cách dùng', item.usageInstruction || '', (value: string) => { item.usageInstruction = value }, 'Sau ăn'),
            ]),
          ])))
        : h('p', { class: 'rounded-xl bg-slate-50 p-4 text-sm text-slate-500' }, 'Chưa chọn thuốc. Chọn thuốc từ danh mục phía trên để kê đơn.'),
      h('div', { class: 'flex justify-end' }, [h(BaseButton, { type: 'button', loading: props.saving, onClick: () => emit('submit') }, () => 'Kê đơn & hoàn tất khám')]),
    ])
  }
  return h('div', { class: 'rounded-2xl border border-slate-200 p-6 text-sm text-slate-500' }, 'Lịch sử gần đây sẽ hiển thị sau khi API lịch sử bệnh nhân trả dữ liệu theo patientId.')
}

function inputField(label: string, value: any, update: (value: string) => void, placeholder = '', type = 'text') {
  return h('label', { class: 'block' }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('input', { value, type, placeholder, class: 'form-input', onInput: (event: Event) => update((event.target as HTMLInputElement).value) }),
  ])
}

function textareaField(label: string, value: any, update: (value: string) => void, placeholder = '', extraClass = '') {
  return h('label', { class: ['block', extraClass] }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('textarea', { value, rows: 3, placeholder, class: 'form-textarea', onInput: (event: Event) => update((event.target as HTMLTextAreaElement).value) }),
  ])
}

function selectField(label: string, value: string, update: (value: string) => void, options: string[]) {
  return h('label', { class: 'block' }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('select', { value, class: 'form-input', onChange: (event: Event) => update((event.target as HTMLSelectElement).value) }, options.map((option) => h('option', { value: option }, option))),
  ])
}

function drawerHeader(title: string, emit: (event: 'close') => void) {
  return h('div', { class: 'flex items-start justify-between gap-4' }, [
    h('div', null, [
      h('p', { class: 'text-xs font-bold uppercase tracking-[0.16em] text-blue-700' }, 'MedicareDNU'),
      h('h2', { class: 'mt-1 text-2xl font-bold text-slate-950' }, title),
    ]),
    h('button', { type: 'button', class: 'rounded-xl p-2 text-slate-500 hover:bg-slate-100', onClick: () => emit('close') }, [h(X, { class: 'h-5 w-5' })]),
  ])
}

function sectionBlock(title: string, rows: [string, any][]) {
  return h('section', { class: 'rounded-2xl border border-slate-200 p-4' }, [
    h('h3', { class: 'font-bold text-slate-950' }, title),
    h('div', { class: 'mt-3 grid gap-3 sm:grid-cols-2' }, rows.map(([label, value]) => h('div', null, [
      h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, label),
      h('p', { class: 'mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800' }, String(value || 'Chưa cập nhật')),
    ]))),
  ])
}
</script>

<style scoped>
.form-input {
  @apply h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}

.form-textarea {
  @apply w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}

.pager-btn {
  @apply h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
