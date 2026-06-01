<template>
  <section class="space-y-6">
    <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-card sm:p-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', config.iconClass]">
            <component :is="config.icon" class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">{{ config.service }}</p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{{ config.title }}</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Bác sĩ: {{ authStore.user?.fullName || 'Chưa xác định' }}</span>
              <span v-if="authStore.user?.doctorId" class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">DoctorId #{{ authStore.user.doctorId }}</span>
              <span class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">{{ config.endpoint }}</span>
            </div>
          </div>
        </div>
        <BaseButton variant="outline" :disabled="loading" @click="loadData">
          <template #icon><RefreshCw class="h-4 w-4" /></template>
          Tải lại
        </BaseButton>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="metric in metrics" :key="metric.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">{{ metric.label }}</p>
        <p class="mt-3 text-3xl font-bold text-slate-950">{{ metric.value }}</p>
        <p class="mt-1 text-xs font-semibold text-slate-500">{{ metric.note }}</p>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <LoadingSkeleton v-for="item in 4" :key="item" />
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div class="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="query"
            class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            :placeholder="config.placeholder"
          />
        </label>
        <span class="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{{ filteredRows.length }} dòng</span>
      </div>

      <div v-if="filteredRows.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th v-for="column in config.columns" :key="column.key" :class="['px-5 py-3', column.right ? 'text-right' : 'text-left']">{{ column.label }}</th>
              <th v-if="hasActions" class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(row, index) in filteredRows" :key="String(row.id || index)" class="transition hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" :class="['px-5 py-4 align-top', column.right ? 'text-right' : 'text-left']">
                <span v-if="column.badge" :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(value(row, column.key))]">{{ statusText(value(row, column.key)) }}</span>
                <span v-else :class="column.strong ? 'font-semibold text-slate-950' : 'text-slate-700'">{{ value(row, column.key) }}</span>
              </td>
              <td v-if="hasActions" class="px-5 py-4 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    v-for="action in rowActions(row)"
                    :key="action.key"
                    type="button"
                    :disabled="actingId === row.id"
                    :class="['inline-flex h-9 items-center rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60', action.className]"
                    @click="runAction(action.key, row)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-300" />
        <h2 class="mt-4 text-lg font-bold text-slate-950">Chưa có dữ liệu</h2>
        <p class="mt-2 text-sm text-slate-500">{{ config.emptyText }}</p>
      </div>
    </div>

    <div v-if="examineOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">N2 Medical Record</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Phiếu khám bệnh</h2>
            <p class="mt-2 text-sm text-slate-500">Tạo bệnh án từ lượt khám N2 tương ứng với lịch hẹn N1, sau đó hoàn tất lịch hẹn.</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Đóng" @click="closeExamine">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
          <p><strong class="text-slate-900">Bệnh nhân:</strong> {{ selectedRow?.patientName }}</p>
          <p><strong class="text-slate-900">Lịch hẹn:</strong> #{{ selectedRow?.appointmentId || selectedRow?.id }}</p>
          <p><strong class="text-slate-900">Thời gian:</strong> {{ selectedRow?.dateTime }}</p>
          <p><strong class="text-slate-900">Lý do:</strong> {{ selectedRow?.reason || 'Chưa ghi nhận' }}</p>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="submitExamination">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Triệu chứng</span>
            <textarea v-model="examForm.symptoms" rows="3" required class="form-textarea" placeholder="Ví dụ: sốt, ho, đau ngực..."></textarea>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Chẩn đoán</span>
            <textarea v-model="examForm.diagnosis" rows="3" required class="form-textarea" placeholder="Chẩn đoán sơ bộ hoặc kết luận khám"></textarea>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Ghi chú điều trị</span>
            <textarea v-model="examForm.doctorNotes" rows="4" class="form-textarea" placeholder="Hướng điều trị, dặn dò, chỉ định liên quan"></textarea>
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="examForm.recheckDate" label="Ngày tái khám" type="date" />
          </div>
          <section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <Pill class="h-5 w-5 text-blue-700" />
                  <h3 class="text-base font-bold text-slate-950">Kê đơn thuốc</h3>
                </div>
                <p class="mt-1 text-sm text-slate-500">Chọn nhóm thuốc rồi chọn nhiều thuốc cần kê cho bệnh nhân.</p>
              </div>
              <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                {{ prescriptionItems.length }} thuốc đã chọn
              </span>
            </div>

            <div v-if="medicineError" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ medicineError }}</div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="category in medicineCategories"
                :key="category"
                type="button"
                :class="[
                  'rounded-full px-3 py-2 text-xs font-bold transition',
                  selectedMedicineType === category
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700'
                ]"
                @click="selectedMedicineType = category"
              >
                {{ category }}
              </button>
            </div>

            <div v-if="medicineLoading" class="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">Đang tải danh mục thuốc...</div>
            <div v-else-if="filteredMedicines.length" class="mt-4 grid gap-3 md:grid-cols-2">
              <button
                v-for="medicine in filteredMedicines"
                :key="medicineId(medicine)"
                type="button"
                :disabled="medicineStock(medicine) <= 0"
                :class="[
                  'flex min-h-[112px] items-start gap-3 rounded-xl border bg-white p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
                  isMedicineSelected(medicineId(medicine))
                    ? 'border-blue-500 ring-4 ring-blue-100'
                    : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/40'
                ]"
                @click="toggleMedicine(medicine)"
              >
                <span
                  :class="[
                    'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                    isMedicineSelected(medicineId(medicine)) ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white'
                  ]"
                >
                  <Check v-if="isMedicineSelected(medicineId(medicine))" class="h-3.5 w-3.5" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-bold text-slate-950">{{ medicineName(medicine) }}</span>
                  <span class="mt-1 block text-xs font-semibold text-blue-700">{{ medicineType(medicine) }}</span>
                  <span class="mt-2 block text-xs leading-5 text-slate-500">
                    Hoạt chất: {{ medicineIngredient(medicine) || 'Chưa cập nhật' }} · Tồn: {{ medicineStock(medicine) }} {{ medicineUnit(medicine) }}
                  </span>
                </span>
              </button>
            </div>
            <div v-else class="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">Không có thuốc trong nhóm này.</div>

            <div v-if="selectedMedicineItems.length" class="mt-5 space-y-3">
              <div
                v-for="{ item, medicine } in selectedMedicineItems"
                :key="item.medicineId"
                class="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="font-bold text-slate-950">{{ medicine ? medicineName(medicine) : `Thuốc #${item.medicineId}` }}</p>
                    <p class="mt-1 text-xs font-semibold text-slate-500">{{ medicine ? medicineType(medicine) : 'Chưa phân loại' }}</p>
                  </div>
                  <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50" aria-label="Bỏ thuốc" @click="removeMedicine(item.medicineId)">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
                <div class="mt-3 grid gap-3 sm:grid-cols-[110px_1fr_1fr]">
                  <label class="block">
                    <span class="mb-1 block text-xs font-semibold text-slate-500">Số lượng</span>
                    <input v-model.number="item.quantity" min="1" type="number" class="form-input" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs font-semibold text-slate-500">Liều dùng</span>
                    <input v-model="item.dosage" type="text" class="form-input" placeholder="VD: 1 viên/lần, ngày 2 lần" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs font-semibold text-slate-500">Cách dùng</span>
                    <input v-model="item.usageInstruction" type="text" class="form-input" placeholder="VD: Uống sau ăn" />
                  </label>
                </div>
              </div>
            </div>
          </section>
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton type="button" variant="outline" @click="closeExamine">Đóng</BaseButton>
            <BaseButton type="submit" :loading="savingExam">
              <template #icon><FileHeart class="h-4 w-4" /></template>
              Lưu bệnh án & hoàn tất khám
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarClock, Check, ClipboardList, FileHeart, Pill, RefreshCw, Search, SearchX, Stethoscope, Trash2, Users, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { medicineApi } from '@/services/medicineApi'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor, filterSchedulesForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { DoctorSchedule } from '@/types/doctor'
import type { Medicine } from '@/types/medicine'
import type { MedicalRecord } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

type Resource = 'queue' | 'appointments' | 'examine' | 'records' | 'schedule'
type ActionKey = 'start' | 'done' | 'cancel' | 'confirm' | 'complete' | 'examine'
type Row = Record<string, string | number | undefined>
type MedicineRecord = Medicine & Record<string, any>

interface PrescriptionDraft {
  medicineId: number
  quantity: number
  dosage: string
  usageInstruction: string
}

interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config {
  title: string
  service: string
  description: string
  endpoint: string
  icon: Component
  iconClass: string
  search: string[]
  placeholder: string
  emptyText: string
  columns: Column[]
}

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const actingId = ref<string | number | null>(null)
const rows = ref<Row[]>([])
const resource = computed<Resource>(() => isResource(route.meta.doctorResource) ? route.meta.doctorResource : 'appointments')
const config = computed(() => configs[resource.value])
const today = new Date().toISOString().slice(0, 10)
const hasActions = computed(() => ['queue', 'appointments', 'examine'].includes(resource.value))
const examineOpen = ref(false)
const savingExam = ref(false)
const selectedRow = ref<Row | null>(null)
const examForm = reactive({ symptoms: '', diagnosis: '', doctorNotes: '', recheckDate: '' })
const medicines = ref<MedicineRecord[]>([])
const medicineLoading = ref(false)
const medicineError = ref('')
const allMedicineTypes = 'Tất cả'
const selectedMedicineType = ref(allMedicineTypes)
const prescriptionItems = ref<PrescriptionDraft[]>([])

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

const medicineCategories = computed(() => {
  const categories = Array.from(new Set(medicines.value.map(medicineType).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'))
  return [allMedicineTypes, ...categories]
})

const filteredMedicines = computed(() => {
  return medicines.value
    .filter((medicine) => isMedicineActive(medicine))
    .filter((medicine) => selectedMedicineType.value === allMedicineTypes || medicineType(medicine) === selectedMedicineType.value)
    .sort((a, b) => medicineName(a).localeCompare(medicineName(b), 'vi'))
})

const selectedMedicineItems = computed(() => {
  return prescriptionItems.value.map((item) => ({
    item,
    medicine: medicines.value.find((medicine) => medicineId(medicine) === item.medicineId),
  }))
})

const metrics = computed(() => [
  { label: 'Tổng dữ liệu', value: rows.value.length, note: 'Theo bộ lọc hiện tại' },
  { label: 'Đang xử lý', value: rows.value.filter((row) => isActiveStatus(row.status)).length, note: 'Chờ, xác nhận hoặc đang khám' },
  { label: 'Hoàn tất', value: rows.value.filter((row) => isDoneStatus(row.status)).length, note: 'Đã hoàn thành' },
])

const configs: Record<Resource, Config> = {
  queue: cfg('Hàng đợi khám', 'N1 Waiting Queue', 'Danh sách bệnh nhân đang chờ, đang khám hoặc đã hoàn tất trong ngày của bác sĩ đang đăng nhập.', 'GET /appointment/api/waiting-queue?date=today', Users, 'bg-blue-50 text-blue-700', ['patientName','doctorName','status','reason'], 'Tìm bệnh nhân, bác sĩ, trạng thái...', 'Chưa có bệnh nhân trong hàng đợi của bác sĩ này.', cols(['queueNumber','STT', true], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['slotTime','Giờ'], ['reason','Lý do'], ['status','Trạng thái', false, true])),
  appointments: cfg('Lịch hẹn của bác sĩ', 'N1 Appointment', 'Các lịch hẹn được đọc từ endpoint theo doctorId và lọc theo tài khoản bác sĩ đang đăng nhập.', 'GET /appointment/api/appointments/doctor/{doctorId}', CalendarClock, 'bg-cyan-50 text-cyan-700', ['patientName','doctorName','status','reason'], 'Tìm bệnh nhân, lý do, trạng thái...', 'Không có lịch hẹn phù hợp với bác sĩ đang đăng nhập.', cols(['id','Mã'], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['dateTime','Ngày giờ'], ['reason','Lý do'], ['status','Trạng thái', false, true])),
  examine: cfg('Khám & kê đơn', 'N1 + N2', 'Bác sĩ mở phiếu khám, tạo bệnh án N2 theo visitId và hoàn tất lịch hẹn N1.', 'POST /medical/api/v1/medical/records', Stethoscope, 'bg-indigo-50 text-indigo-700', ['patientName','doctorName','action','status'], 'Tìm bệnh nhân cần khám...', 'Chưa có lịch hẹn để lập phiếu khám.', cols(['id','Mã'], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['dateTime','Ngày giờ'], ['reason','Lý do'], ['status','Trạng thái', false, true])),
  records: cfg('Lịch sử bệnh án', 'N2 Medical Record', 'Tra cứu bệnh án, chẩn đoán và ghi chú điều trị từ N2 theo bác sĩ đang đăng nhập.', 'GET /medical/api/v1/medical/patients/{id}/history', FileHeart, 'bg-violet-50 text-violet-700', ['id','patientId','diagnosis','symptoms','doctorNotes'], 'Tìm mã bệnh án, bệnh nhân, chẩn đoán...', 'N2 chưa có bệnh án phù hợp với bác sĩ này.', cols(['id','Mã BA'], ['patientId','Bệnh nhân', false, false, true], ['diagnosis','Chẩn đoán'], ['symptoms','Triệu chứng'], ['doctorNotes','Ghi chú'], ['createdAt','Ngày tạo'])),
  schedule: cfg('Lịch làm việc cá nhân', 'N1 Doctor Schedule', 'Ca làm việc và slot khám của bác sĩ đang đăng nhập.', 'GET /appointment/api/doctor-schedules/doctor/{doctorId}', ClipboardList, 'bg-emerald-50 text-emerald-700', ['doctorName','workDate','timeRange','status'], 'Tìm ngày làm, ca khám...', 'Chưa có lịch làm việc cho bác sĩ này.', cols(['id','Mã'], ['doctorName','Bác sĩ', false, false, true], ['workDate','Ngày làm'], ['timeRange','Ca khám'], ['duration','Slot'], ['status','Trạng thái', false, true])),
}

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    const doctorId = currentDoctorId(authStore.user)
    if (resource.value === 'queue') {
      try {
        const [queueData, appointments] = await Promise.all([
          appointmentApi.getWaitingQueue(today),
          (doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()).catch(() => [])
        ])
        const filteredQueue = filterQueueForDoctor(queueData, authStore.user)
        note.value = filteredQueue.length ? 'Đã đồng bộ dữ liệu từ API Gateway.' : ''
        rows.value = filteredQueue.map((item) => {
          const appt = appointments.find((a) => a.appointmentId === item.appointmentId)
          return {
            id: item.id || item.queueId || item.appointmentId,
            appointmentId: item.appointmentId,
            patientId: item.patientId || appt?.patientId,
            queueNumber: item.queueNumber,
            patientName: displayText(item.patientName || appt?.patientName || ''),
            doctorName: displayText(item.doctorName || appt?.doctorName || ''),
            slotTime: item.slotTime || appt?.slotTime || '-',
            reason: item.reason || appt?.reason || appt?.specialtyName || 'Chưa ghi nhận',
            status: item.status,
          }
        })
      } catch (apiError) {
        error.value = getApiErrorMessage(apiError)
        rows.value = []
      }
    }
    if (resource.value === 'appointments') rows.value = await loadRows(() => (doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()).then((items) => filterAppointmentsForDoctor(items, authStore.user)), mapAppointment)
    if (resource.value === 'examine') rows.value = await loadRows(() => (doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()).then((items) => filterAppointmentsForDoctor(items, authStore.user)), mapExamine)
    if (resource.value === 'records') rows.value = await loadRows(() => medicalRecordApi.getMedicalRecords().then((items) => filterRecordsForDoctor(items, authStore.user)), mapRecord)
    if (resource.value === 'schedule') rows.value = await loadRows(() => (doctorId ? appointmentApi.getDoctorSchedulesByDoctor(doctorId) : appointmentApi.getDoctorSchedules()).then((items) => filterSchedulesForDoctor(items, authStore.user)), mapSchedule)
  } finally {
    loading.value = false
  }
}

async function loadRows<T>(loader: () => Promise<T[]>, mapper: (item: T) => Row) {
  try {
    const data = await loader()
    note.value = data.length ? 'Đã đồng bộ dữ liệu từ API Gateway.' : ''
    return data.map(mapper)
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    return []
  }
}

function mapQueue(item: WaitingQueueItem): Row {
  return {
    id: item.id || item.queueId || item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    queueNumber: item.queueNumber,
    patientName: displayText(item.patientName),
    doctorName: displayText(item.doctorName),
    slotTime: item.slotTime || '-',
    reason: item.reason || item.specialtyName || 'Chưa ghi nhận',
    status: item.status,
  }
}

function mapAppointment(item: Appointment): Row {
  return {
    id: item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    patientPhone: item.patientPhone,
    doctorId: item.doctorId,
    specialtyId: item.specialtyId,
    specialtyName: item.specialtyName,
    appointmentDate: item.appointmentDate,
    slotTime: item.slotTime,
    queueNumber: item.queueNumber,
    patientName: displayText(item.patientName),
    doctorName: displayText(item.doctorName),
    dateTime: `${formatDate(item.appointmentDate)} · ${item.slotTime || '-'}`,
    reason: item.reason || 'Chưa ghi nhận',
    status: item.status,
  }
}

function mapExamine(item: Appointment): Row {
  return { ...mapAppointment(item), action: 'Mở phiếu khám' }
}

function mapRecord(item: MedicalRecord): Row {
  return {
    id: item.recordId || item.medicalRecordId || 'MR',
    patientId: item.patientId || 'Chưa cập nhật',
    diagnosis: item.diagnosis || 'Chưa có chẩn đoán',
    symptoms: item.symptoms || 'Chưa ghi nhận',
    doctorNotes: item.doctorNotes || 'Chưa ghi chú',
    createdAt: formatDate(item.examDate || item.createdAt),
  }
}

function mapSchedule(item: DoctorSchedule): Row {
  return {
    id: item.scheduleId,
    doctorName: displayText(item.doctorName),
    workDate: formatDate(item.workDate),
    timeRange: `${item.startTime} - ${item.endTime}`,
    duration: `${item.slotDurationMinutes || 30} phút`,
    status: item.isAvailable === false ? 'Tạm ngưng' : 'Đang mở',
  }
}

function rowActions(row: Row) {
  const status = String(row.status || '').toLowerCase()
  const actions: Array<{ key: ActionKey; label: string; className: string }> = []
  if (resource.value === 'examine') {
    if (status.includes('confirmed') || status.includes('inprogress')) {
      return [{ key: 'examine', label: 'Khám bệnh', className: 'bg-blue-700 text-white hover:bg-blue-800' }]
    }
    return []
  }
  if (resource.value === 'queue') {
    if (status.includes('waiting') || status.includes('pending') || status.includes('confirmed')) actions.push({ key: 'start', label: 'Bắt đầu khám', className: 'bg-blue-700 text-white hover:bg-blue-800' })
    if (status.includes('inprogress')) actions.push({ key: 'done', label: 'Hoàn tất', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
    if (!isDoneStatus(row.status) && !status.includes('cancel')) actions.push({ key: 'cancel', label: 'Hủy', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  if (resource.value === 'appointments') {
    if (status.includes('pending') || status.includes('waiting')) actions.push({ key: 'confirm', label: 'Xác nhận', className: 'bg-blue-700 text-white hover:bg-blue-800' })
    if (status.includes('confirmed') || status.includes('inprogress')) actions.push({ key: 'complete', label: 'Hoàn tất', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
    if (!isDoneStatus(row.status) && !status.includes('cancel')) actions.push({ key: 'cancel', label: 'Hủy', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  return actions
}

async function runAction(action: string, row: Row) {
  if (action === 'examine') { openExamine(row); return }
  const id = Number(row.id || row.appointmentId)
  if (!id) return
  actingId.value = row.id || null
  error.value = ''
  try {
    if (action === 'start') await appointmentApi.setQueueInProgress(id)
    if (action === 'done') await appointmentApi.setQueueDone(id)
    if (action === 'cancel' && resource.value === 'queue') await appointmentApi.cancelQueueItem(id)
    if (action === 'cancel' && resource.value === 'appointments') await appointmentApi.cancelAppointment(id)
    if (action === 'confirm') await appointmentApi.confirmAppointment(id)
    if (action === 'complete') await appointmentApi.completeAppointment(id)
    note.value = 'Đã cập nhật trạng thái thành công.'
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    actingId.value = null
  }
}

function openExamine(row: Row) {
  selectedRow.value = row
  examineOpen.value = true
  void loadMedicines()
}

function closeExamine() {
  examineOpen.value = false
  selectedRow.value = null
  examForm.symptoms = ''
  examForm.diagnosis = ''
  examForm.doctorNotes = ''
  examForm.recheckDate = ''
  prescriptionItems.value = []
  selectedMedicineType.value = allMedicineTypes
}

async function loadMedicines() {
  if (medicines.value.length || medicineLoading.value) return
  medicineLoading.value = true
  medicineError.value = ''
  try {
    medicines.value = (await medicineApi.getMedicines()) as MedicineRecord[]
  } catch (apiError) {
    medicineError.value = getApiErrorMessage(apiError)
    medicines.value = []
  } finally {
    medicineLoading.value = false
  }
}

function toggleMedicine(medicine: MedicineRecord) {
  const id = medicineId(medicine)
  if (!id || medicineStock(medicine) <= 0) return
  const exists = prescriptionItems.value.some((item) => item.medicineId === id)
  if (exists) {
    removeMedicine(id)
    return
  }

  prescriptionItems.value.push({
    medicineId: id,
    quantity: 1,
    dosage: '',
    usageInstruction: '',
  })
}

function removeMedicine(medicineId: number) {
  prescriptionItems.value = prescriptionItems.value.filter((item) => item.medicineId !== medicineId)
}

function isMedicineSelected(medicineId: number) {
  return prescriptionItems.value.some((item) => item.medicineId === medicineId)
}

async function submitExamination() {
  if (!selectedRow.value) return
  savingExam.value = true
  error.value = ''
  const appointmentId = Number(selectedRow.value.appointmentId || selectedRow.value.id)
  try {
    const visitId = await resolveVisitId(selectedRow.value, appointmentId)
    await markAppointmentInProgress(appointmentId)

    const doctorNotes = [
      examForm.doctorNotes.trim(),
      examForm.symptoms ? `Triệu chứng: ${examForm.symptoms}` : '',
      prescriptionNote(),
    ].filter(Boolean).join('\n')
    const medicalRecord = await medicalRecordApi.createMedicalRecord({
      visitId,
      diagnosis: examForm.diagnosis.trim(),
      doctorNotes,
      recheckDate: examForm.recheckDate || undefined,
    })
    const completionMessage = await createPrescriptionForPharmacy(medicalRecord, appointmentId)
    await appointmentApi.completeAppointment(appointmentId)
    note.value = completionMessage
    closeExamine()
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    savingExam.value = false
  }
}

async function resolveVisitId(row: Row, appointmentId: number) {
  const candidateIds = new Set<string>()
  if (row.patientId) candidateIds.add(String(row.patientId))

  const patients = await medicalRecordApi.getPatients().catch(() => [])
  const patientByIdentity = patients.find((patient) => {
    const samePhone = normalizeText(patient.phone || patient.phoneNumber) && normalizeText(patient.phone || patient.phoneNumber) === normalizeText(String(row.patientPhone || ''))
    const sameName = normalizeText(patient.fullName) && normalizeText(patient.fullName) === normalizeText(String(row.patientName || ''))
    return samePhone || sameName
  })
  if (patientByIdentity?.patientId) candidateIds.add(String(patientByIdentity.patientId))

  for (const patientId of candidateIds) {
    try {
      const history = await medicalRecordApi.getPatientHistory(patientId)
      const visit = history.visits.find((item) => Number(item.appointmentId ?? item.appointmentID ?? item.appointment?.appointmentId) === appointmentId)
      const visitId = Number(visit?.visitId ?? visit?.id)
      if (visitId > 0) return visitId
    } catch (apiError: any) {
      if (apiError?.response?.status !== 404) throw apiError
    }
  }

  await ensureVisitSynced(row, appointmentId)

  const patientAfterSync = patients.find((patient) => {
    const samePhone = normalizeText(patient.phone || patient.phoneNumber) && normalizeText(patient.phone || patient.phoneNumber) === normalizeText(String(row.patientPhone || ''))
    const sameName = normalizeText(patient.fullName) && normalizeText(patient.fullName) === normalizeText(String(row.patientName || ''))
    return samePhone || sameName
  }) || (await medicalRecordApi.getPatients().catch(() => [])).find((patient) => {
    const samePhone = normalizeText(patient.phone || patient.phoneNumber) && normalizeText(patient.phone || patient.phoneNumber) === normalizeText(String(row.patientPhone || ''))
    const sameName = normalizeText(patient.fullName) && normalizeText(patient.fullName) === normalizeText(String(row.patientName || ''))
    return samePhone || sameName
  })
  if (patientAfterSync?.patientId) candidateIds.add(String(patientAfterSync.patientId))

  for (const patientId of candidateIds) {
    try {
      const history = await medicalRecordApi.getPatientHistory(patientId)
      const visit = history.visits.find((item) => Number(item.appointmentId ?? item.appointmentID ?? item.appointment?.appointmentId) === appointmentId)
      const visitId = Number(visit?.visitId ?? visit?.id)
      if (visitId > 0) return visitId
    } catch (apiError: any) {
      if (apiError?.response?.status !== 404) throw apiError
    }
  }

  if (!candidateIds.size) {
    throw new Error('Không tìm thấy hồ sơ bệnh nhân tương ứng ở N2. Vui lòng tiếp nhận/tạo hồ sơ bệnh nhân trước khi khám.')
  }
  throw new Error('N2 chưa có lượt khám tương ứng với lịch hẹn này. Vui lòng check-in/tạo lượt khám cho bệnh nhân trước khi lưu bệnh án.')
}

function normalizeText(value?: string) {
  return String(value || '').trim().toLowerCase()
}

async function ensureVisitSynced(row: Row, appointmentId: number) {
  const payload = {
    appointmentId,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    doctorId: Number(row.doctorId || currentDoctorId(authStore.user)),
    doctorName: row.doctorName || authStore.user?.fullName,
    specialtyId: row.specialtyId,
    specialtyName: row.specialtyName,
    appointmentDate: row.appointmentDate,
    slotTime: row.slotTime,
    queueNumber: row.queueNumber,
    status: 'Confirmed',
  }

  if (!payload.doctorId) return
  await medicalRecordApi.syncAppointmentConfirmed(payload).catch(() => undefined)
  await medicalRecordApi.syncPatientCheckedIn(payload).catch(() => undefined)
}

async function markAppointmentInProgress(appointmentId: number) {
  await appointmentApi.setQueueInProgress(appointmentId).catch(() => undefined)
}

async function createPrescriptionForPharmacy(medicalRecord: MedicalRecord, appointmentId: number) {
  if (!selectedMedicineItems.value.length) return 'Đã tạo bệnh án N2 và hoàn tất lịch hẹn N1.'

  try {
    await billingApi.createPrescription({
      medicalRecordId: toPositiveNumber(medicalRecord.medicalRecordId),
      medicalRecordCode: medicalRecord.recordId,
      patientId: toPositiveNumber(selectedRow.value?.patientId),
      doctorId: toPositiveNumber(selectedRow.value?.doctorId || currentDoctorId(authStore.user)),
      appointmentId,
      status: 'Pending',
      note: prescriptionNote(),
      items: selectedMedicineItems.value.map(({ item, medicine }) => ({
        medicineId: item.medicineId,
        medicineNameSnapshot: medicine ? medicineName(medicine) : `Thuốc #${item.medicineId}`,
        unitSnapshot: medicine ? medicineUnit(medicine) : undefined,
        dosage: item.dosage.trim() || undefined,
        quantity: Number(item.quantity || 1),
        usageInstruction: item.usageInstruction.trim() || undefined,
      })),
    })
    return 'Đã tạo bệnh án N2, gửi đơn thuốc N3 và hoàn tất lịch hẹn N1.'
  } catch (apiError) {
    return `Đã tạo bệnh án N2 và hoàn tất lịch hẹn N1, nhưng chưa gửi được đơn thuốc sang N3: ${getApiErrorMessage(apiError)}`
  }
}

function prescriptionNote() {
  if (!selectedMedicineItems.value.length) return ''

  const lines = selectedMedicineItems.value.map(({ item, medicine }) => {
    const name = medicine ? medicineName(medicine) : `Thuốc #${item.medicineId}`
    const unit = medicine ? medicineUnit(medicine) : ''
    const quantity = Number(item.quantity || 1)
    const dosage = item.dosage.trim() || 'Chưa ghi liều dùng'
    const usage = item.usageInstruction.trim() || 'Chưa ghi cách dùng'
    return `- ${name}: SL ${quantity}${unit ? ` ${unit}` : ''}; Liều: ${dosage}; Cách dùng: ${usage}`
  })

  return ['Đơn thuốc:', ...lines].join('\n')
}

function toPositiveNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined
}

function medicineId(medicine: MedicineRecord) {
  return Number(medicine.medicineId ?? medicine.MedicineId ?? medicine.id ?? 0)
}

function medicineName(medicine: MedicineRecord) {
  return String(medicine.medicineName ?? medicine.MedicineName ?? medicine.name ?? `Thuốc #${medicineId(medicine)}`)
}

function medicineIngredient(medicine: MedicineRecord) {
  return String(medicine.activeIngredient ?? medicine.ActiveIngredient ?? medicine.ingredient ?? '').trim()
}

function medicineUnit(medicine: MedicineRecord) {
  return String(medicine.unit ?? medicine.Unit ?? medicine.dosageForm ?? medicine.DosageForm ?? 'đơn vị')
}

function medicineStock(medicine: MedicineRecord) {
  const value = Number(medicine.stockQuantity ?? medicine.StockQuantity ?? medicine.stock ?? 0)
  return Number.isFinite(value) ? value : 0
}

function medicineType(medicine: MedicineRecord) {
  const directType = String(medicine.medicineType ?? medicine.MedicineType ?? medicine.category ?? medicine.type ?? '').trim()
  return directType || inferMedicineType(medicine)
}

function isMedicineActive(medicine: MedicineRecord) {
  const status = String(medicine.status ?? medicine.Status ?? '').toLowerCase()
  const active = medicine.isActive ?? medicine.IsActive
  if (typeof active === 'boolean') return active
  return !status || status.includes('active') || status.includes('đang')
}

function inferMedicineType(medicine: MedicineRecord) {
  const text = `${medicineName(medicine)} ${medicineIngredient(medicine)}`.toLowerCase()
  if (text.includes('omeprazole')) return 'Tiêu hóa'
  if (text.includes('paracetamol')) return 'Giảm đau - hạ sốt'
  if (text.includes('ibuprofen')) return 'Giảm đau - kháng viêm'
  if (text.includes('amoxicillin')) return 'Kháng sinh'
  if (text.includes('cetirizine')) return 'Dị ứng'
  if (text.includes('salbutamol')) return 'Hô hấp'
  if (text.includes('tobramycin')) return 'Mắt'
  if (text.includes('metformin')) return 'Nội tiết - đái tháo đường'
  if (text.includes('amlodipine') || text.includes('losartan')) return 'Tim mạch'
  if (text.includes('atorvastatin')) return 'Rối loạn lipid máu'
  if (text.includes('vitamin') || text.includes('calcium')) return 'Vitamin - khoáng chất'
  if (text.includes('natri') || text.includes('sodium')) return 'Dung dịch truyền/rửa'
  return 'Khác'
}

function cfg(title: string, service: string, description: string, endpoint: string, icon: Component, iconClass: string, search: string[], placeholder: string, emptyText: string, columns: Column[]): Config {
  return { title, service, description, endpoint, icon, iconClass, search, placeholder, emptyText, columns }
}

function cols(...defs: [string, string, boolean?, boolean?, boolean?][]): Column[] {
  return defs.map(([key, label, right, badge, strong]) => ({ key, label, right, badge, strong }))
}

function value(row: Row, key: string) {
  return row[key] === undefined || row[key] === '' ? 'Chưa cập nhật' : String(row[key])
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
  if (normalized.includes('đang mở')) return 'Đang mở'
  if (normalized.includes('tạm')) return 'Tạm ngưng'
  return value || 'Chưa cập nhật'
}

function isActiveStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('waiting') || value.includes('pending') || value.includes('confirmed') || value.includes('inprogress') || value.includes('đang mở')
}

function isDoneStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('done') || value.includes('completed') || value.includes('hoàn tất')
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value.includes('done') || value.includes('completed') || value.includes('confirmed') || value.includes('đang mở')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('inprogress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('waiting') || value.includes('pending') || value.includes('chờ')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel') || value.includes('tạm')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function isResource(value: unknown): value is Resource {
  return typeof value === 'string' && value in configs
}
</script>

<style scoped>
.form-textarea {
  @apply w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}

.form-input {
  @apply h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}
</style>
