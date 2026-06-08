<template>
  <section class="space-y-6">
    <div v-if="isExamDetailMode" class="sticky top-0 z-20 -mx-2 border-b border-slate-200 bg-white/95 px-2 py-3 backdrop-blur">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            @click="backToAppointments"
          >
            <X class="h-5 w-5 rotate-45" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-slate-950">Chi tiết lượt khám</h1>
            <p class="mt-1 text-sm text-slate-500">Dữ liệu lấy trực tiếp từ lịch hẹn N1, lượt khám và hồ sơ N2.</p>
          </div>
        </div>
        <StatusChip :status="activeVisit?.status || selectedRow?.status" />
      </div>
    </div>

    <div v-if="!isExamDetailMode" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

    <div v-if="!isExamDetailMode" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard v-for="metric in metrics" :key="metric.label" :metric="metric" />
    </div>

    <div v-if="!isExamDetailMode" class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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

    <div v-if="resource === 'examine' && isExamDetailMode">
      <ExaminationWorkspace
        :row="selectedRow"
        :active-visit="activeVisit"
        :active-record="activeRecord"
        :active-patient="activePatient"
        :clinical-orders="clinicalOrders"
        :medicines="medicines"
        :medicine-loading="medicineLoading"
        :saving="savingExam"
        :exam-form="examForm"
        :vitals-form="vitalsForm"
        :history-form="historyForm"
        :order-form="orderForm"
        :clinical-checklist="clinicalChecklist"
        :prescription-items="prescriptionItems"
        @start="startVisit"
        @save-draft="saveDraft"
        @save-vitals="saveVitals"
        @save-record="saveMedicalRecord"
        @add-order="addClinicalOrder"
        @save-order-result="saveClinicalOrderResult"
        @add-prescription-row="addPrescriptionRow"
        @select-prescription-medicine="selectPrescriptionMedicine"
        @toggle-medicine="toggleMedicine"
        @remove-medicine="removeMedicine"
        @submit="submitExamination"
      />
    </div>

    <div v-else-if="resource === 'examine'" class="grid gap-6 xl:grid-cols-[420px_1fr]">
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
        :active-patient="activePatient"
        :clinical-orders="clinicalOrders"
        :medicines="medicines"
        :medicine-loading="medicineLoading"
        :saving="savingExam"
        :exam-form="examForm"
        :vitals-form="vitalsForm"
        :history-form="historyForm"
        :order-form="orderForm"
        :clinical-checklist="clinicalChecklist"
        :prescription-items="prescriptionItems"
        @start="startVisit"
        @save-draft="saveDraft"
        @save-vitals="saveVitals"
        @save-record="saveMedicalRecord"
        @add-order="addClinicalOrder"
        @save-order-result="saveClinicalOrderResult"
        @add-prescription-row="addPrescriptionRow"
        @select-prescription-medicine="selectPrescriptionMedicine"
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
import { computed, defineComponent, h, reactive, ref, watch, type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Save,
  Search,
  SearchX,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Trash2,
  UserRound,
  Weight,
  Wind,
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
import type { MedicalRecord, Patient } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import { displayText } from '@/utils/displayText'

type Resource = 'appointments' | 'queue' | 'examine' | 'records' | 'schedule'
type ActionKey = 'view' | 'start' | 'checkin' | 'complete' | 'cancel' | 'record'
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
  patientPhone?: string
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
const router = useRouter()
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
const activePatient = ref<Patient | null>(null)
const clinicalOrders = ref<Record<string, any>[]>([])
const medicines = ref<(Medicine & Record<string, any>)[]>([])
const medicineLoading = ref(false)
const savingExam = ref(false)
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
  clinicalExam: '',
  diagnosisCode: '',
  diagnosis: '',
  doctorNote: '',
  treatmentPlan: '',
  followUpDate: '',
  conclusionStatus: 'Hoàn thành',
})

const vitalsForm = reactive({
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  respiratoryRate: '',
  spo2: '',
  height: '',
  weight: '',
})

const historyForm = reactive({
  diabetes: false,
  hypertension: false,
  cardiovascular: false,
  asthma: false,
  other: '',
  allergies: '',
})

const orderForm = reactive({
  orderType: 'Xét nghiệm',
  orderName: '',
  reason: '',
})

const clinicalChecklist = reactive({
  bloodTest: false,
  urineTest: false,
  ultrasound: false,
  xray: false,
  ecg: false,
})

const formInputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
const formTextareaClass = 'w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
const compactOptionClass = 'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold leading-5 transition'

const prescriptionItems = ref<PrescriptionItemPayload[]>([])

const configs: Record<Resource, Config> = {
  appointments: {
    kicker: 'N1 Appointments',
    title: 'Lịch hẹn',
    description: 'Quản lý lịch khám, bao gồm lịch hôm nay và các lịch sắp tới của bác sĩ đang đăng nhập.',
    endpoint: 'GET /appointment/api/appointments/doctor/{doctorId}',
    searchPlaceholder: 'Tìm tên bệnh nhân, mã lịch hẹn, lý do khám...',
    tableTitle: 'Danh sách lịch hẹn',
    tableSubtitle: 'Mặc định hiển thị lịch từ hôm nay trở đi theo bác sĩ đang đăng nhập.',
    emptyTitle: 'Không có lịch hẹn phù hợp',
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
const isExamDetailMode = computed(() => resource.value === 'examine' && Boolean(selectedRow.value))

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

    if (resource.value === 'examine') await openRequestedExam()

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
  const selectedDate = filters.date || today()
  const queueData = await appointmentApi.getWaitingQueue({
    date: selectedDate,
    doctorId: doctorId.value,
    keyword: filters.keyword || undefined,
  }).catch(() => [] as WaitingQueueItem[])

  return filterQueueForDoctor(queueData, authStore.user)
    .map((item) => mapQueue(item))
    .filter((row) => isQueueVisibleAppointmentStatus(row.status))
    .sort(compareQueueRows)
}

async function loadVisitRows() {
  try {
    const data = await medicalRecordApi.getVisitsToday(doctorId.value)
    const visitRows = data.map(mapVisit)
    const appointmentId = Number(route.query.appointmentId || 0)
    const hasRequestedVisit = appointmentId && visitRows.some((row) => Number(row.appointmentId) === appointmentId)
    if (appointmentId && !hasRequestedVisit) {
      const requestedVisit = await medicalRecordApi.getVisitByAppointment(appointmentId).catch(() => null)
      if (requestedVisit?.visitId) visitRows.unshift(mapVisit(requestedVisit))
    }
    return visitRows
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
  filters.date = resource.value === 'appointments' || route.query.appointmentId ? '' : today()
  filters.fromDate = resource.value === 'appointments' ? today() : ''
  filters.toDate = ''
  filters.status = ''
  page.value = 1
  if (reload) loadData()
}

function rowActions(row: Row) {
  if (resource.value === 'appointments') {
    const actions = [{ key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' }]
    if (canCheckInAppointment(row.status)) actions.push({ key: 'checkin', label: 'Vào khám', className: 'bg-blue-600 text-white hover:bg-blue-700' })
    if (statusBucket(row.status) === 'progress') actions.push({ key: 'checkin', label: 'Tiếp tục khám', className: 'bg-blue-600 text-white hover:bg-blue-700' })
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
    if (action === 'checkin') await checkInAndOpenExam(row)
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

function backToAppointments() {
  clearWorkingState()
  router.push('/doctor/appointments')
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

async function checkInAndOpenExam(row: Row) {
  const appointmentId = Number(row.appointmentId || row.id)
  if (!appointmentId) return showToast('Thiếu lịch hẹn', 'Không xác định được mã lịch hẹn để check-in.', 'error')
  try {
    const visit = await medicalRecordApi.getVisitByAppointment(appointmentId).catch(() => null)
    if (!visit?.visitId && !visit?.id) {
      throw new Error('Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám. Vui lòng chuyển bệnh nhân qua y tá tiếp nhận trước.')
    }
    showToast('Đã tạo lượt khám', 'Bệnh nhân đã được check-in và có thể khám trong màn Khám & kê đơn.', 'success')
    await router.push({
      path: '/doctor/examine',
      query: {
        appointmentId: String(appointmentId),
        visitId: String(visit.visitId || visit.id || ''),
      },
    })
  } catch (apiError) {
    showToast('Chưa thể vào khám', businessError(apiError), 'error')
  }
}

async function openRequestedExam() {
  const appointmentId = Number(route.query.appointmentId || 0)
  const visitId = Number(route.query.visitId || 0)
  if (!appointmentId && !visitId) return
  const target = rows.value.find((row) =>
    (visitId && Number(row.visitId || row.id) === visitId)
    || (appointmentId && Number(row.appointmentId) === appointmentId)
  )
  if (target) await selectVisit(target)
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
    await hydrateSelectedRowFromAppointment(visit.appointmentId || row.appointmentId)
    examForm.chiefComplaint = meaningful(visit.chiefComplaint || row.reason)
    hydrateVitalsFromVisit(visit)
    await Promise.all([loadActivePatient(), loadExistingRecord(), loadMedicines()])
    return true
  } catch (apiError) {
    showToast('Không mở được lượt khám', businessError(apiError), 'error')
    return false
  }
}

async function hydrateSelectedRowFromAppointment(appointmentId?: number | string) {
  if (!appointmentId || !selectedRow.value) return
  const appointment = await appointmentApi.getAppointment(appointmentId).catch(() => null)
  if (!appointment) return
  selectedRow.value = {
    ...selectedRow.value,
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId || selectedRow.value.patientId,
    patientName: displayText(appointment.patientName) || selectedRow.value.patientName,
    patientPhone: appointment.patientPhone || selectedRow.value.patientPhone,
    doctorId: appointment.doctorId || selectedRow.value.doctorId,
    doctorName: displayText(appointment.doctorName) || selectedRow.value.doctorName,
    date: normalizeDate(appointment.appointmentDate) || selectedRow.value.date,
    time: appointment.slotTime || selectedRow.value.time,
    timeLabel: `${formatDate(appointment.appointmentDate)} · ${appointment.slotTime || selectedRow.value.time || '--:--'}`,
    reason: appointment.reason || appointment.specialtyName || selectedRow.value.reason,
    raw: { ...(selectedRow.value.raw || {}), ...appointment },
  }
}

async function startVisit() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.', 'error')
  if (!examForm.chiefComplaint.trim()) return showToast('Thiếu lý do khám', 'Vui lòng nhập lý do khám trước khi bắt đầu lượt khám.', 'error')
  savingExam.value = true
  try {
    await medicalRecordApi.startVisit(activeVisit.value.visitId, { doctorId: doctorId.value, chiefComplaint: examForm.chiefComplaint.trim() })
    activeVisit.value = await medicalRecordApi.getVisit(activeVisit.value.visitId)
    hydrateVitalsFromVisit(activeVisit.value)
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
    await saveVitals(false)
    const payload = {
      visitId: activeVisit.value.visitId,
      diagnosisCode: examForm.diagnosisCode.trim() || undefined,
      diagnosisText: examForm.diagnosis.trim(),
      doctorNote: clinicalDoctorNote(),
      treatmentPlan: clinicalTreatmentPlan(),
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
  const selectedOrders = selectedClinicalOrderNames()
  const manualName = orderForm.orderName.trim()
  const orders = manualName ? [{ orderType: orderForm.orderType, orderName: manualName }] : selectedOrders
  if (!orders.length) return showToast('Thiếu chỉ định', 'Vui lòng chọn hoặc nhập tên chỉ định cận lâm sàng.', 'error')
  savingExam.value = true
  try {
    for (const order of orders) {
      await medicalRecordApi.createClinicalOrder({
        medicalRecordId: activeRecord.value.medicalRecordId,
        orderType: order.orderType,
        orderName: order.orderName,
        reason: orderForm.reason.trim() || undefined,
      })
    }
    orderForm.orderName = ''
    orderForm.reason = ''
    Object.assign(clinicalChecklist, { bloodTest: false, urineTest: false, ultrasound: false, xray: false, ecg: false })
    await loadClinicalOrders()
    showToast('Đã tạo chỉ định', 'Chỉ định đã lưu vào N2.', 'success')
  } catch (apiError) {
    showToast('Tạo chỉ định thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function saveClinicalOrderResult(order: Record<string, any>) {
  const orderId = order.clinicalOrderId || order.ClinicalOrderId || order.orderId || order.OrderId || order.id || order.Id
  if (!orderId) return showToast('Thiếu chỉ định', 'Không xác định được mã chỉ định cận lâm sàng.', 'error')
  const resultText = window.prompt('Nhập kết quả cận lâm sàng', order.resultText || order.ResultText || '')
  if (resultText === null) return
  if (!resultText.trim()) return showToast('Thiếu kết quả', 'Vui lòng nhập nội dung kết quả cận lâm sàng.', 'error')
  const conclusion = window.prompt('Kết luận', order.conclusion || order.Conclusion || 'Bình thường') || undefined
  savingExam.value = true
  try {
    await medicalRecordApi.updateClinicalOrderResult(orderId, {
      resultText: resultText.trim(),
      conclusion: conclusion?.trim() || undefined,
      resultedBy: doctorName.value,
    })
    await loadClinicalOrders()
    showToast('Đã lưu kết quả', 'Kết quả cận lâm sàng đã được cập nhật vào N2.', 'success')
  } catch (apiError) {
    showToast('Lưu kết quả thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

function selectedClinicalOrderNames() {
  return [
    clinicalChecklist.bloodTest ? { orderType: 'Xét nghiệm', orderName: 'Xét nghiệm máu' } : null,
    clinicalChecklist.urineTest ? { orderType: 'Xét nghiệm', orderName: 'Xét nghiệm nước tiểu' } : null,
    clinicalChecklist.ultrasound ? { orderType: 'Siêu âm', orderName: 'Siêu âm' } : null,
    clinicalChecklist.xray ? { orderType: 'X-Quang', orderName: 'X-Quang' } : null,
    clinicalChecklist.ecg ? { orderType: 'Điện tim', orderName: 'Điện tim' } : null,
  ].filter(Boolean) as { orderType: string; orderName: string }[]
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

async function loadActivePatient() {
  const patientId = activeVisit.value?.patientId || selectedRow.value?.patientId
  if (!patientId) {
    activePatient.value = null
    hydrateHistoryFromPatient(null)
    return
  }

  activePatient.value = await medicalRecordApi.getPatient(patientId).catch(() => null)
  hydrateHistoryFromPatient(activePatient.value)
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
    hydrateClinicalTextFromRecord(activeRecord.value)
    await loadClinicalOrders()
  } catch (apiError: any) {
    if (apiError?.response?.status !== 404) note.value = `Chưa tải được bệnh án theo visit: ${getApiErrorMessage(apiError)}`
  }
}

async function saveVitals(showSuccess = true) {
  if (!activeVisit.value?.visitId) {
    if (showSuccess) showToast('Thiếu lượt khám', 'Cần mở lượt khám N2 trước khi lưu sinh hiệu.', 'error')
    return false
  }

  const validationError = validateVitalsForm()
  if (validationError) {
    if (showSuccess) {
      showToast('Sinh hiệu chưa hợp lệ', validationError, 'error')
      return false
    }
    throw new Error(validationError)
  }

  const shouldToggleSaving = showSuccess && !savingExam.value
  if (shouldToggleSaving) savingExam.value = true
  try {
    await savePatientHistory()
    await medicalRecordApi.updateVisitVitals(activeVisit.value.visitId, {
      bloodPressure: textOrNull(vitalsForm.bloodPressure),
      heartRate: numberOrNull(vitalsForm.heartRate),
      temperature: numberOrNull(vitalsForm.temperature),
      respiratoryRate: numberOrNull(vitalsForm.respiratoryRate),
      spo2: numberOrNull(vitalsForm.spo2),
      height: numberOrNull(vitalsForm.height),
      weight: numberOrNull(vitalsForm.weight),
      note: textOrNull(historyNote()),
    })
    activeVisit.value = await medicalRecordApi.getVisit(activeVisit.value.visitId)
    hydrateVitalsFromVisit(activeVisit.value)
    if (showSuccess) showToast('Đã lưu sinh hiệu', 'Sinh hiệu được cập nhật trực tiếp vào N2.', 'success')
    return true
  } catch (apiError) {
    if (!showSuccess) throw apiError
    showToast('Lưu sinh hiệu thất bại', businessError(apiError), 'error')
    return false
  } finally {
    if (shouldToggleSaving) savingExam.value = false
  }
}

async function savePatientHistory() {
  const patient = activePatient.value
  const id = patient?.id || patient?.patientId
  if (!id || !patient?.fullName) return
  const medicalHistory = patientHistoryText()
  activePatient.value = await medicalRecordApi.updatePatient(id, {
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    phoneNumber: patient.phoneNumber || patient.phone,
    email: patient.email,
    address: patient.address,
    citizenId: patient.citizenId,
    bloodType: patient.bloodType,
    allergyNote: textOrNull(historyForm.allergies),
    medicalHistory: textOrNull(medicalHistory),
    status: patient.status,
  }).catch(() => patient)
}

async function saveDraft() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Cần mở lượt khám N2 trước khi lưu nháp.', 'error')
  savingExam.value = true
  try {
    await saveVitals(false)
    if (examForm.diagnosis.trim()) await saveMedicalRecord()
    else showToast('Đã lưu nháp', 'Sinh hiệu và thông tin khám hiện có đã được lưu.', 'success')
  } catch (apiError) {
    showToast('Lưu nháp thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
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

function addPrescriptionRow() {
  const available = medicines.value.find((medicine) => {
    const id = medicineId(medicine)
    return id && !prescriptionItems.value.some((item) => item.medicineId === id)
  })
  if (available) {
    const id = medicineId(available)
    prescriptionItems.value.push({
      medicineId: id,
      medicineNameSnapshot: medicineName(available),
      unitSnapshot: medicineUnit(available),
      dosage: '',
      frequency: 'Theo liều dùng',
      durationDays: 1,
      quantity: 1,
      usageInstruction: '',
      note: '',
    })
    return
  }

  prescriptionItems.value.push({
    medicineId: 0,
    medicineNameSnapshot: '',
    unitSnapshot: '',
    dosage: '',
    frequency: 'Theo liều dùng',
    durationDays: 1,
    quantity: 1,
    usageInstruction: '',
    note: '',
  })
}

function selectPrescriptionMedicine(item: PrescriptionItemPayload, value: string | number) {
  const id = Number(value)
  const medicine = medicines.value.find((entry) => medicineId(entry) === id)
  item.medicineId = Number.isFinite(id) ? id : 0
  item.medicineNameSnapshot = medicine ? medicineName(medicine) : ''
  item.unitSnapshot = medicine ? medicineUnit(medicine) : ''
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
  activePatient.value = null
  clinicalOrders.value = []
  prescriptionItems.value = []
  Object.assign(examForm, { chiefComplaint: '', symptoms: '', clinicalExam: '', diagnosisCode: '', diagnosis: '', doctorNote: '', treatmentPlan: '', followUpDate: '', conclusionStatus: 'Hoàn thành' })
  Object.assign(vitalsForm, { bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', spo2: '', height: '', weight: '' })
  Object.assign(historyForm, { diabetes: false, hypertension: false, cardiovascular: false, asthma: false, other: '', allergies: '' })
  Object.assign(clinicalChecklist, { bloodTest: false, urineTest: false, ultrasound: false, xray: false, ecg: false })
  Object.assign(orderForm, { orderType: 'Xét nghiệm', orderName: '', reason: '' })
}

function mapAppointment(item: Appointment): Row {
  return {
    key: `A${item.appointmentId}`,
    id: item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    patientName: displayText(item.patientName) || 'Chưa có tên',
    patientPhone: item.patientPhone,
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.appointmentDate),
    time: item.slotTime || '',
    timeLabel: `${formatDate(item.appointmentDate)} · ${item.slotTime || '--:--'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
    status: item.status,
    raw: item,
  }
}

function mapQueue(item: WaitingQueueItem, appointment?: Appointment): Row {
  const appointmentDate = item.appointmentDate || item.queueDate || appointment?.appointmentDate
  const slotTime = item.slotTime || appointment?.slotTime || ''
  const queueNumber = item.queueNumber || appointment?.queueNumber
  const status = item.appointmentStatus || item.status || appointment?.status
  return {
    key: `Q${item.id || item.queueId || item.appointmentId}`,
    id: queueNumber || item.id || item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId || appointment?.patientId,
    doctorId: item.doctorId || appointment?.doctorId,
    patientName: displayText(item.patientName || appointment?.patientName) || 'Chưa có tên',
    patientPhone: item.patientPhone || appointment?.patientPhone,
    doctorName: displayText(item.doctorName || appointment?.doctorName),
    date: normalizeDate(appointmentDate),
    time: slotTime,
    timeLabel: `${formatDate(appointmentDate)} · ${slotTime || '--:--'}`,
    reason: item.reason || appointment?.reason || item.specialtyName || appointment?.specialtyName || 'Chưa ghi lý do',
    status,
    raw: { ...appointment, ...item },
  }
}

function isQueueVisibleAppointmentStatus(status?: string) {
  return ['confirmed', 'checkedin', 'progress', 'waiting'].includes(statusBucket(status))
}

function compareQueueRows(left: Row, right: Row) {
  const leftQueue = Number(left.id)
  const rightQueue = Number(right.id)
  if (Number.isFinite(leftQueue) && Number.isFinite(rightQueue) && leftQueue !== rightQueue) return leftQueue - rightQueue
  return String(left.time || '').localeCompare(String(right.time || ''))
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
    patientPhone: item.patientPhone || item.patientPhoneSnapshot || item.PatientPhone,
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
  if (value.includes('checked')) return 'checkedin'
  if (value.includes('confirm')) return 'confirmed'
  if (value.includes('wait') || value.includes('pending') || value.includes('cho') || value.includes('chờ')) return 'waiting'
  return 'other'
}

function canCheckInAppointment(status?: string) {
  const value = normalize(status)
  return value.includes('confirm') || value.includes('xac nhan') || value.includes('xác nhận') || value.includes('checked')
}

function statusText(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'cancelled') return 'Đã hủy'
  if (bucket === 'completed') return 'Hoàn thành'
  if (bucket === 'progress') return 'Đang khám'
  if (bucket === 'checkedin') return 'Đã check-in'
  if (bucket === 'confirmed') return 'Đã xác nhận'
  if (bucket === 'waiting') return 'Chờ khám'
  return status || 'Chưa cập nhật'
}

function statusClass(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (bucket === 'progress') return 'bg-blue-100 text-blue-700'
  if (bucket === 'checkedin') return 'bg-teal-100 text-teal-700'
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

function parseVitals(visit?: MedicalVisit | null) {
  const raw = visit?.vitalSignsJson || visit?.VitalSignsJson
  if (!raw || typeof raw !== 'string') return {} as Record<string, any>
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function hydrateVitalsFromVisit(visit?: MedicalVisit | null) {
  const vitals = parseVitals(visit)
  vitalsForm.bloodPressure = stringValue(vitals.bloodPressure ?? vitals.BloodPressure)
  vitalsForm.heartRate = stringValue(vitals.heartRate ?? vitals.HeartRate)
  vitalsForm.temperature = stringValue(vitals.temperature ?? vitals.Temperature)
  vitalsForm.respiratoryRate = stringValue(vitals.respiratoryRate ?? vitals.RespiratoryRate)
  vitalsForm.spo2 = stringValue(vitals.spo2 ?? vitals.Spo2 ?? vitals.spO2 ?? vitals.SpO2)
  vitalsForm.height = stringValue(vitals.height ?? vitals.Height)
  vitalsForm.weight = stringValue(vitals.weight ?? vitals.Weight)
}

function hydrateHistoryFromPatient(patient?: Patient | null) {
  const medicalHistory = String(patient?.medicalHistory || '').trim()
  const normalized = normalize(medicalHistory)
  historyForm.diabetes = normalized.includes('tieu duong') || normalized.includes('diabetes')
  historyForm.hypertension = normalized.includes('tang huyet ap') || normalized.includes('hypertension')
  historyForm.cardiovascular = normalized.includes('tim mach') || normalized.includes('cardio')
  historyForm.asthma = normalized.includes('hen') || normalized.includes('asthma')
  historyForm.other = medicalHistory || ''
  historyForm.allergies = String(patient?.allergyNote || patient?.allergies || '').trim()
}

function hydrateClinicalTextFromRecord(record?: MedicalRecord | null) {
  const note = record?.doctorNote || record?.doctorNotes || ''
  const plan = record?.treatmentPlan || ''
  if (!examForm.clinicalExam && note) examForm.clinicalExam = note
  if (!examForm.doctorNote && plan) examForm.doctorNote = plan
}

function textOrNull(value: unknown) {
  const textValue = String(value ?? '').trim()
  return textValue || null
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

function validateVitalsForm() {
  const ranges: { value: unknown; label: string; min: number; max: number; integer?: boolean; unit?: string }[] = [
    { value: vitalsForm.temperature, label: 'Nhiệt độ', min: 30, max: 45, unit: '°C' },
    { value: vitalsForm.heartRate, label: 'Mạch', min: 1, max: 250, integer: true, unit: 'lần/phút' },
    { value: vitalsForm.respiratoryRate, label: 'Nhịp thở', min: 1, max: 100, integer: true, unit: 'lần/phút' },
    { value: vitalsForm.spo2, label: 'SpO2', min: 1, max: 100, integer: true, unit: '%' },
    { value: vitalsForm.height, label: 'Chiều cao', min: 1, max: 300, unit: 'cm' },
    { value: vitalsForm.weight, label: 'Cân nặng', min: 1, max: 500, unit: 'kg' },
  ]

  for (const item of ranges) {
    const textValue = String(item.value ?? '').trim()
    if (!textValue) continue
    const numberValue = Number(textValue)
    if (!Number.isFinite(numberValue)) return `${item.label} phải là số hợp lệ.`
    if (item.integer && !Number.isInteger(numberValue)) return `${item.label} phải là số nguyên.`
    if (numberValue < item.min || numberValue > item.max) {
      return `${item.label} phải nằm trong khoảng ${item.min}-${item.max}${item.unit ? ` ${item.unit}` : ''}.`
    }
  }

  if (String(vitalsForm.bloodPressure ?? '').trim().length > 30) return 'Huyết áp tối đa 30 ký tự.'
  return ''
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value)
}

function historyNote() {
  const items = [
    historyForm.diabetes ? 'Tiểu đường' : '',
    historyForm.hypertension ? 'Tăng huyết áp' : '',
    historyForm.cardiovascular ? 'Tim mạch' : '',
    historyForm.asthma ? 'Hen suyễn' : '',
    historyForm.other ? `Khác: ${historyForm.other}` : '',
    historyForm.allergies ? `Dị ứng: ${historyForm.allergies}` : '',
  ].filter(Boolean)
  return items.join('; ')
}

function patientHistoryText() {
  return [
    historyForm.diabetes ? 'Tiểu đường' : '',
    historyForm.hypertension ? 'Tăng huyết áp' : '',
    historyForm.cardiovascular ? 'Tim mạch' : '',
    historyForm.asthma ? 'Hen suyễn' : '',
    historyForm.other,
  ].map((item) => item.trim()).filter(Boolean).join('; ')
}

function clinicalDoctorNote() {
  const parts = [
    examForm.symptoms.trim() ? `Triệu chứng: ${examForm.symptoms.trim()}` : '',
    examForm.clinicalExam.trim() ? `Khám lâm sàng: ${examForm.clinicalExam.trim()}` : '',
    examForm.doctorNote.trim() ? `Lời dặn: ${examForm.doctorNote.trim()}` : '',
  ].filter(Boolean)
  return parts.join('\n') || undefined
}

function clinicalTreatmentPlan() {
  const parts = [
    examForm.treatmentPlan.trim(),
    examForm.conclusionStatus ? `Tình trạng: ${examForm.conclusionStatus}` : '',
  ].filter(Boolean)
  return parts.join('\n') || undefined
}

function patientAge(patient?: Patient | null) {
  const birth = patient?.dateOfBirth
  if (!birth) return ''
  const date = new Date(birth)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const month = now.getMonth() - date.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1
  return age > 0 ? `${age} tuổi` : ''
}

function bmiValue(height: unknown, weight: unknown) {
  const heightCm = Number(height)
  const weightKg = Number(weight)
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) return ''
  return (weightKg / ((heightCm / 100) ** 2)).toFixed(1)
}

function displayOrEmpty(value: unknown) {
  const textValue = String(value ?? '').trim()
  return textValue || 'Chưa có'
}

function patientInsurance(patient?: (Patient & Record<string, any>) | null) {
  return patient?.healthInsuranceNumber || patient?.HealthInsuranceNumber || patient?.insuranceNumber || patient?.InsuranceNumber || ''
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
    activePatient: { type: Object as PropType<Patient | null>, default: null },
    clinicalOrders: { type: Array as PropType<Record<string, any>[]>, required: true },
    medicines: { type: Array as PropType<(Medicine & Record<string, any>)[]>, required: true },
    medicineLoading: Boolean,
    saving: Boolean,
    examForm: { type: Object as PropType<typeof examForm>, required: true },
    vitalsForm: { type: Object as PropType<typeof vitalsForm>, required: true },
    historyForm: { type: Object as PropType<typeof historyForm>, required: true },
    orderForm: { type: Object as PropType<typeof orderForm>, required: true },
    clinicalChecklist: { type: Object as PropType<typeof clinicalChecklist>, required: true },
    prescriptionItems: { type: Array as PropType<PrescriptionItemPayload[]>, required: true },
  },
  emits: ['start', 'save-draft', 'save-vitals', 'save-record', 'add-order', 'save-order-result', 'add-prescription-row', 'select-prescription-medicine', 'toggle-medicine', 'remove-medicine', 'submit'],
  setup(props, { emit }) {
    return () => h('div', { class: 'min-w-0' }, [
      props.row
        ? [
            renderProgressSteps(props),
            h('div', { class: 'grid gap-6 pb-28 xl:grid-cols-[minmax(0,1fr)_360px]' }, [
              h('div', { class: 'space-y-6' }, [
                renderPatientCard(props, emit),
                renderVitalsCard(props, emit),
                h('div', { class: 'grid gap-6 2xl:grid-cols-2' }, [
                  renderHistoryCard(props),
                  renderAllergyCard(props),
                ]),
                renderMedicalRecordCard(props),
                renderPrescriptionCard(props, emit),
              ]),
              h('aside', { class: 'space-y-6 xl:sticky xl:top-28 xl:self-start' }, [
                renderVisitInfoCard(props),
                renderReasonCard(props),
                renderClinicalOrdersCard(props, emit),
                renderConclusionCard(props),
              ]),
            ]),
            renderFooterActionBar(props, emit),
          ]
        : h('div', { class: 'rounded-2xl border border-slate-200 bg-white p-10 shadow-sm' }, [
            h(EmptyState, { title: 'Chưa chọn bệnh nhân', text: 'Chọn một bệnh nhân bên trái để bắt đầu khám, lưu bệnh án và kê đơn.' }),
          ]),
    ])
  },
})

function renderProgressSteps(props: any) {
  const steps = ['Bắt đầu khám', 'Bệnh án', 'Chỉ định', 'Kê đơn', 'Hoàn thành']
  const active = statusBucket(props.activeVisit?.status || props.row?.status) === 'completed'
    ? 4
    : props.prescriptionItems.length
      ? 3
      : props.clinicalOrders.length
        ? 2
        : props.activeRecord?.medicalRecordId || props.examForm.diagnosis
          ? 1
          : statusBucket(props.activeVisit?.status || props.row?.status) === 'progress'
            ? 0
            : 0
  return h('div', { class: 'mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm' }, [
    h('div', { class: 'grid min-w-[720px] grid-cols-5 gap-3' }, steps.map((label, index) =>
      h('div', { class: ['flex items-center gap-3', index < steps.length - 1 ? 'after:h-px after:flex-1 after:bg-slate-200' : ''] }, [
        h('span', { class: ['flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold', index <= active ? 'bg-[#0F52BA] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'] }, String(index + 1)),
        h('span', { class: ['whitespace-nowrap text-sm font-bold', index <= active ? 'text-[#0F52BA]' : 'text-slate-500'] }, label),
      ]),
    )),
  ])
}

function renderPatientCard(props: any, emit: any) {
  const patient = props.activePatient as (Patient & Record<string, any>) | null
  const visit = props.activeVisit as MedicalVisit | null
  const visitStatus = statusBucket(visit?.status || props.row?.status)
  return medicalCard('Thông tin bệnh nhân', UserRound, [
    h('div', { class: 'flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between' }, [
      h('div', { class: 'flex min-w-0 items-center gap-4' }, [
        h('div', { class: 'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0F52BA]' }, [h(UserRound, { class: 'h-8 w-8' })]),
        h('div', { class: 'min-w-0' }, [
          h('div', { class: 'flex flex-wrap items-center gap-2' }, [
            h('h2', { class: 'truncate text-2xl font-bold text-slate-950' }, displayOrEmpty(patient?.fullName || props.row?.patientName)),
            h('span', { class: 'rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600' }, displayOrEmpty(patient?.gender)),
            h('span', { class: 'rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700' }, patientAge(patient) || 'Chưa có tuổi'),
          ]),
          h('p', { class: 'mt-2 text-sm text-slate-500' }, displayOrEmpty(props.examForm.chiefComplaint || props.row?.reason)),
        ]),
      ]),
      h('div', { class: 'flex shrink-0 flex-wrap items-center gap-2' }, [
        h(StatusChip, { status: visit?.status || props.row?.status }),
        h(BaseButton, {
          type: 'button',
          variant: visitStatus === 'progress' ? 'outline' : 'primary',
          loading: props.saving,
          disabled: ['completed', 'progress'].includes(visitStatus),
          onClick: () => emit('start'),
        }, () => [h(Stethoscope, { class: 'h-4 w-4' }), visitStatus === 'progress' ? 'Đang khám' : 'Bắt đầu khám']),
      ]),
    ]),
    h('div', { class: 'mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4' }, [
      infoItem('Mã bệnh nhân', patient?.patientCode || patient?.patientIdCode || visit?.patientCode || props.row?.patientId),
      infoItem('Số điện thoại', patient?.phoneNumber || patient?.phone || props.row?.patientPhone || props.row?.raw?.patientPhone || props.row?.raw?.PatientPhone),
      infoItem('BHYT', patientInsurance(patient)),
      infoItem('Mã lịch hẹn', visit?.appointmentId || props.row?.appointmentId),
      infoItem('Visit ID', visit?.visitCode || visit?.visitId || props.row?.visitId),
      infoItem('Ngày khám', props.row?.timeLabel || formatDate(visit?.visitDate || visit?.createdAt)),
      infoItem('Bác sĩ', visit?.doctorName || props.row?.doctorName || doctorName.value),
      infoItem('Bệnh án', props.activeRecord?.medicalRecordCode || props.activeRecord?.medicalRecordIdCode || props.activeRecord?.medicalRecordId),
    ]),
  ])
}

function renderVisitInfoCard(props: any) {
  const visit = props.activeVisit as MedicalVisit | null
  const row = props.row as Row | null
  return medicalCard('Thông tin lượt khám', ClipboardCheck, [
    h('div', { class: 'space-y-3' }, [
      sideInfoItem('Bác sĩ khám', visit?.doctorName || row?.doctorName || doctorName.value),
      sideInfoItem('Khoa/Phòng', row?.raw?.specialtyName || row?.specialtyName || 'Chưa có'),
      sideInfoItem('Phòng khám', row?.raw?.roomName || row?.raw?.room || 'Chưa có'),
      sideInfoItem('Loại khám', row?.raw?.type || row?.raw?.visitType || 'Khám thường'),
      sideInfoItem('Mã lịch hẹn', visit?.appointmentId || row?.appointmentId),
      sideInfoItem('Visit ID', visit?.visitCode || visit?.visitId || row?.visitId),
    ]),
  ])
}

function renderReasonCard(props: any) {
  return medicalCard('Lý do khám', ClipboardList, [
    h('div', { class: 'space-y-4' }, [
      inputField('Lý do khám *', props.examForm.chiefComplaint, (value: string) => { props.examForm.chiefComplaint = value }, 'Chưa có'),
      inputField('Ngày bắt đầu', String(props.activeVisit?.startedAt || props.activeVisit?.visitDate || props.row?.date || '').slice(0, 10), () => undefined, '', 'date'),
    ]),
  ])
}

function renderVitalsCard(props: any, emit: any) {
  const bmi = bmiValue(props.vitalsForm.height, props.vitalsForm.weight)
  return medicalCard('Sinh hiệu', HeartPulse, [
    h('div', { class: 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8' }, [
      vitalField('Huyết áp', props.vitalsForm.bloodPressure, (value: string) => { props.vitalsForm.bloodPressure = value }, 'mmHg', HeartPulse),
      vitalField('Mạch', props.vitalsForm.heartRate, (value: string) => { props.vitalsForm.heartRate = value }, 'lần/phút', Activity, 'number'),
      vitalField('Nhiệt độ', props.vitalsForm.temperature, (value: string) => { props.vitalsForm.temperature = value }, '°C', Thermometer, 'number'),
      vitalField('Nhịp thở', props.vitalsForm.respiratoryRate, (value: string) => { props.vitalsForm.respiratoryRate = value }, 'lần/phút', Wind, 'number'),
      vitalField('SpO2', props.vitalsForm.spo2, (value: string) => { props.vitalsForm.spo2 = value }, '%', Activity, 'number'),
      vitalField('Chiều cao', props.vitalsForm.height, (value: string) => { props.vitalsForm.height = value }, 'cm', Ruler, 'number'),
      vitalField('Cân nặng', props.vitalsForm.weight, (value: string) => { props.vitalsForm.weight = value }, 'kg', Weight, 'number'),
      h('div', { class: 'rounded-xl border border-blue-100 bg-blue-50 p-3' }, [
        h('p', { class: 'text-xs font-bold text-blue-700' }, 'BMI'),
        h('p', { class: 'mt-2 text-xl font-bold text-slate-950' }, bmi || 'Chưa có'),
        h('p', { class: 'text-xs text-slate-500' }, bmi ? 'kg/m²' : 'Nhập chiều cao/cân nặng'),
      ]),
    ]),
    h('div', { class: 'mt-4 flex justify-end' }, [
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('save-vitals') }, () => 'Lưu sinh hiệu'),
    ]),
  ])
}

function renderHistoryCard(props: any) {
  return medicalCard('Tiền sử bệnh', ShieldCheck, [
    h('div', { class: 'grid gap-3 sm:grid-cols-2' }, [
      checkboxField('Tiểu đường', props.historyForm.diabetes, (value: boolean) => { props.historyForm.diabetes = value }),
      checkboxField('Tăng huyết áp', props.historyForm.hypertension, (value: boolean) => { props.historyForm.hypertension = value }),
      checkboxField('Tim mạch', props.historyForm.cardiovascular, (value: boolean) => { props.historyForm.cardiovascular = value }),
      checkboxField('Hen suyễn', props.historyForm.asthma, (value: boolean) => { props.historyForm.asthma = value }),
    ]),
    h('div', { class: 'mt-4' }, [
      inputField('Khác', props.historyForm.other, (value: string) => { props.historyForm.other = value }, 'Nhập tiền sử khác nếu có'),
    ]),
  ])
}

function renderAllergyCard(props: any) {
  return medicalCard('Dị ứng thuốc', AlertTriangle, [
    textareaField('Dị ứng thuốc', props.historyForm.allergies, (value: string) => { props.historyForm.allergies = value }, 'Chưa có', ''),
  ])
}

function renderMedicalRecordCard(props: any) {
  return medicalCard('Bệnh án khám', ClipboardList, [
    h('div', { class: 'grid gap-4 xl:grid-cols-2' }, [
      textareaField('Triệu chứng', props.examForm.symptoms, (value: string) => { props.examForm.symptoms = value }, 'Chưa có'),
      textareaField('Khám lâm sàng', props.examForm.clinicalExam, (value: string) => { props.examForm.clinicalExam = value }, 'Chưa có'),
      textareaField('Chẩn đoán *', props.examForm.diagnosis, (value: string) => { props.examForm.diagnosis = value }, 'VD: Cảm lạnh thông thường', 'xl:col-span-2'),
      h('div', { class: 'xl:col-span-2 grid gap-3 xl:grid-cols-[1fr_1fr]' }, [
        h('label', { class: 'block' }, [
          h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, 'Mã ICD'),
          h('input', {
            value: props.examForm.diagnosisCode,
            list: 'icd-options',
            class: formInputClass,
            placeholder: 'Search ICD',
            onInput: (event: Event) => { props.examForm.diagnosisCode = (event.target as HTMLInputElement).value },
          }),
          h('datalist', { id: 'icd-options' }, [
            h('option', { value: 'J00 - Cảm lạnh thông thường' }),
            h('option', { value: 'I10 - Tăng huyết áp' }),
            h('option', { value: 'E11 - Đái tháo đường type 2' }),
          ]),
        ]),
        inputField('Lý do khám', props.examForm.chiefComplaint, (value: string) => { props.examForm.chiefComplaint = value }, 'Chưa có'),
      ]),
    ]),
  ])
}

function renderClinicalOrdersCard(props: any, emit: any) {
  return medicalCard('Chỉ định cận lâm sàng', FlaskConical, [
    h('div', { class: 'grid gap-2 sm:grid-cols-2' }, [
      checkboxField('Xét nghiệm máu', props.clinicalChecklist.bloodTest, (value: boolean) => { props.clinicalChecklist.bloodTest = value }),
      checkboxField('Xét nghiệm nước tiểu', props.clinicalChecklist.urineTest, (value: boolean) => { props.clinicalChecklist.urineTest = value }),
      checkboxField('Siêu âm', props.clinicalChecklist.ultrasound, (value: boolean) => { props.clinicalChecklist.ultrasound = value }),
      checkboxField('X-Quang', props.clinicalChecklist.xray, (value: boolean) => { props.clinicalChecklist.xray = value }),
      checkboxField('Điện tim', props.clinicalChecklist.ecg, (value: boolean) => { props.clinicalChecklist.ecg = value }),
    ]),
    h('div', { class: 'mt-4 grid gap-3' }, [
      selectField('Loại', props.orderForm.orderType, (value: string) => { props.orderForm.orderType = value }, ['Xét nghiệm', 'Siêu âm', 'X-Quang', 'Điện tim', 'Khác']),
      inputField('Tên chỉ định khác', props.orderForm.orderName, (value: string) => { props.orderForm.orderName = value }, 'VD: Nội soi tai mũi họng'),
      inputField('Lý do', props.orderForm.reason, (value: string) => { props.orderForm.reason = value }, 'Chưa có'),
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('add-order') }, () => [h(Plus, { class: 'h-4 w-4' }), 'Thêm chỉ định']),
    ]),
    props.clinicalOrders.length
      ? h('div', { class: 'mt-4 space-y-2' }, props.clinicalOrders.map((order: any) => {
          const hasResult = Boolean(order.resultText || order.ResultText || order.conclusion || order.Conclusion)
          return h('div', { class: 'rounded-xl border border-blue-100 bg-blue-50 p-3' }, [
            h('div', { class: 'flex items-start justify-between gap-3' }, [
              h('div', { class: 'min-w-0' }, [
                h('p', { class: 'font-bold text-blue-800' }, `${order.orderType || order.OrderType || 'Chỉ định'} - ${order.orderName || order.OrderName || 'Chưa có'}`),
                h('p', { class: 'mt-1 text-xs text-slate-600' }, hasResult ? `Kết quả: ${order.resultText || order.ResultText || order.conclusion || order.Conclusion}` : 'Chưa nhập kết quả'),
              ]),
              h('button', {
                type: 'button',
                class: 'shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100',
                onClick: () => emit('save-order-result', order),
              }, hasResult ? 'Cập nhật' : 'Nhập kết quả'),
            ]),
          ])
        }))
      : h('p', { class: 'mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500' }, 'Chưa có chỉ định cận lâm sàng.'),
  ])
}

function renderPrescriptionCard(props: any, emit: any) {
  return medicalCard('Kê đơn thuốc', ClipboardCheck, [
    props.medicineLoading
      ? h(LoadingSkeleton)
      : h('div', { class: 'overflow-x-auto rounded-xl border border-slate-200' }, [
          h('table', { class: 'min-w-[900px] w-full divide-y divide-slate-200 text-sm' }, [
            h('thead', { class: 'bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500' }, [
              h('tr', null, ['Thuốc', 'Liều dùng', 'Số lượng', 'Ghi chú', 'Thao tác'].map((label) => h('th', { class: 'px-4 py-3' }, label))),
            ]),
            h('tbody', { class: 'divide-y divide-slate-100 bg-white' }, props.prescriptionItems.length
              ? props.prescriptionItems.map((item: PrescriptionItemPayload) =>
                  h('tr', null, [
                    h('td', { class: 'px-4 py-3' }, [
                      h('select', {
                        value: item.medicineId || '',
                        class: [formInputClass, 'min-w-[220px]'],
                        onChange: (event: Event) => emit('select-prescription-medicine', item, (event.target as HTMLSelectElement).value),
                      }, [
                        h('option', { value: '' }, 'Chọn thuốc'),
                        ...props.medicines.map((medicine: any) => h('option', { value: medicineId(medicine) }, `${medicineName(medicine)} - tồn ${medicineStock(medicine)}`)),
                      ]),
                    ]),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.dosage, class: [formInputClass, 'min-w-[160px]'], placeholder: 'VD: 1 viên x 2 lần/ngày', onInput: (event: Event) => { item.dosage = (event.target as HTMLInputElement).value } })),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.quantity, type: 'number', class: [formInputClass, 'min-w-[110px]'], onInput: (event: Event) => { item.quantity = Number((event.target as HTMLInputElement).value) } })),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.note || item.usageInstruction || '', class: [formInputClass, 'min-w-[180px]'], placeholder: 'Sau ăn, khi đau...', onInput: (event: Event) => { item.note = (event.target as HTMLInputElement).value; item.usageInstruction = (event.target as HTMLInputElement).value } })),
                    h('td', { class: 'px-4 py-3 text-center' }, h('button', { type: 'button', class: 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50', onClick: () => emit('remove-medicine', item.medicineId) }, [h(Trash2, { class: 'h-4 w-4' })])),
                  ]),
                )
              : [h('tr', null, [h('td', { class: 'px-4 py-6 text-center text-slate-500', colspan: 5 }, 'Chưa có thuốc trong đơn.')])]),
          ]),
        ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-3' }, [
      h(BaseButton, { type: 'button', variant: 'outline', onClick: () => emit('add-prescription-row') }, () => [h(Plus, { class: 'h-4 w-4' }), 'Thêm thuốc']),
    ]),
  ])
}

function renderConclusionCard(props: any) {
  return medicalCard('Kết luận khám', FileText, [
    h('div', { class: 'grid gap-4' }, [
      textareaField('Kết luận', props.examForm.treatmentPlan, (value: string) => { props.examForm.treatmentPlan = value }, 'Chưa có'),
      textareaField('Lời dặn bác sĩ', props.examForm.doctorNote, (value: string) => { props.examForm.doctorNote = value }, 'Chưa có'),
      inputField('Ngày tái khám', props.examForm.followUpDate, (value: string) => { props.examForm.followUpDate = value }, '', 'date'),
      h('div', null, [
        h('p', { class: 'mb-2 text-sm font-semibold text-slate-700' }, 'Tình trạng'),
        h('div', { class: 'grid gap-2' }, ['Hoàn thành', 'Theo dõi', 'Nhập viện', 'Chuyển viện'].map((option) =>
          radioField(option, props.examForm.conclusionStatus === option, () => { props.examForm.conclusionStatus = option }),
        )),
      ]),
    ]),
  ])
}

function renderFooterActionBar(props: any, emit: any) {
  return h('div', { class: 'sticky bottom-0 z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur' }, [
    h('div', { class: 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4' }, [
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('save-draft') }, () => [h(Save, { class: 'h-4 w-4' }), 'Lưu nháp']),
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('save-record') }, () => [h(FileText, { class: 'h-4 w-4' }), 'Lưu bệnh án']),
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('submit') }, () => [h(ClipboardCheck, { class: 'h-4 w-4' }), 'Kê đơn']),
      h(BaseButton, { type: 'button', variant: 'primary', loading: props.saving, onClick: () => emit('submit') }, () => [h(CheckCircle2, { class: 'h-4 w-4' }), 'Hoàn thành khám']),
    ]),
  ])
}

function medicalCard(title: string, icon: any, children: any[]) {
  return h('section', { class: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' }, [
    h('div', { class: 'mb-5 flex items-center gap-3' }, [
      h('span', { class: 'flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F52BA]' }, [h(icon, { class: 'h-5 w-5' })]),
      h('h3', { class: 'text-lg font-bold text-slate-950' }, title),
    ]),
    ...children,
  ])
}

function infoItem(label: string, value: unknown) {
  return h('div', { class: 'rounded-xl border border-slate-100 bg-slate-50 px-4 py-3' }, [
    h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, label),
    h('p', { class: 'mt-1 min-h-[20px] break-words text-sm font-bold text-slate-800' }, displayOrEmpty(value)),
  ])
}

function sideInfoItem(label: string, value: unknown) {
  return h('div', { class: 'flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3' }, [
    h('span', { class: 'text-sm font-semibold text-slate-500' }, label),
    h('span', { class: 'min-w-0 truncate text-right text-sm font-bold text-slate-950' }, displayOrEmpty(value)),
  ])
}

function vitalField(label: string, value: any, update: (value: string) => void, unit: string, icon: any, type = 'text') {
  return h('label', { class: 'block rounded-xl border border-slate-200 bg-white p-3 transition focus-within:border-blue-200 focus-within:shadow-sm' }, [
    h('span', { class: 'flex items-center gap-2 text-xs font-bold text-slate-600' }, [
      h(icon, { class: 'h-4 w-4 text-[#0F52BA]' }),
      label,
    ]),
    h('span', { class: 'mt-2 flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100' }, [
      h('input', {
        value,
        type,
        class: 'min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0',
        placeholder: 'Chưa có',
        onInput: (event: Event) => update((event.target as HTMLInputElement).value),
      }),
      h('span', { class: 'shrink-0 text-xs font-semibold text-slate-400' }, unit),
    ]),
  ])
}

function checkboxField(label: string, checked: boolean, update: (value: boolean) => void) {
  return h('label', { class: 'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50' }, [
    h('input', {
      checked,
      type: 'checkbox',
      class: 'h-4 w-4 shrink-0 rounded border-slate-300 text-[#0F52BA] focus:ring-blue-500',
      onChange: (event: Event) => update((event.target as HTMLInputElement).checked),
    }),
    h('span', { class: 'min-w-0 break-words' }, label),
  ])
}

function radioField(label: string, checked: boolean, update: () => void) {
  return h('label', { class: [compactOptionClass, checked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'] }, [
    h('input', {
      checked,
      type: 'radio',
      name: 'conclusionStatus',
      class: 'h-4 w-4 shrink-0 border-slate-300 text-[#0F52BA] focus:ring-blue-500',
      onChange: update,
    }),
    h('span', { class: 'min-w-0 break-words' }, label),
  ])
}

function inputField(label: string, value: any, update: (value: string) => void, placeholder = '', type = 'text') {
  return h('label', { class: 'block' }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('input', { value, type, placeholder, class: formInputClass, onInput: (event: Event) => update((event.target as HTMLInputElement).value) }),
  ])
}

function textareaField(label: string, value: any, update: (value: string) => void, placeholder = '', extraClass = '') {
  return h('label', { class: ['block', extraClass] }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('textarea', { value, rows: 3, placeholder, class: formTextareaClass, onInput: (event: Event) => update((event.target as HTMLTextAreaElement).value) }),
  ])
}

function selectField(label: string, value: string, update: (value: string) => void, options: string[]) {
  return h('label', { class: 'block' }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('select', { value, class: formInputClass, onChange: (event: Event) => update((event.target as HTMLSelectElement).value) }, options.map((option) => h('option', { value: option }, option))),
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
