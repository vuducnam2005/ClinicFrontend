<template>
  <section class="space-y-6">
    <div class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">{{ config.service }}</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{{ config.title }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Bác sĩ: {{ authStore.user?.fullName || 'Chưa xác định' }}
            </span>
            <span class="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700">{{ config.endpoint }}</span>
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

    <div v-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="item in 3" :key="item" />
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              <th v-for="column in config.columns" :key="column.key" class="px-5 py-3">{{ column.label }}</th>
              <th v-if="hasActions" class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in paginatedRows" :key="String(row.id)" class="transition hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" class="px-5 py-4 align-top">
                <span v-if="column.badge" :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(row[column.key])]">
                  {{ statusText(row[column.key]) }}
                </span>
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

        <!-- Pagination Footer -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 p-4 bg-slate-50/50">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <span>Hiển thị</span>
            <select
              v-model="itemsPerPage"
              class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span>bản ghi mỗi trang</span>
          </div>

          <div class="text-sm font-medium text-slate-500">
            Hiển thị {{ Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredRows.length, currentPage * itemsPerPage) }} trên {{ filteredRows.length }} kết quả
          </div>

          <div v-if="totalPages > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
              @click="currentPage--"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              :class="[
                'h-8 min-w-8 rounded-lg text-sm font-bold transition px-2',
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              ]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
              @click="currentPage++"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-300" />
        <h2 class="mt-4 text-lg font-bold text-slate-950">Chưa có dữ liệu</h2>
        <p class="mt-2 text-sm text-slate-500">{{ config.emptyText }}</p>
      </div>
    </div>

    <div v-if="examineOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">N2 Medical Record</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Chi tiết lượt khám</h2>
            <p class="mt-2 text-sm text-slate-500">Bắt đầu khám, lưu bệnh án, tạo chỉ định và kê đơn qua N2.</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Đóng" @click="closeExamine">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
          <p><strong class="text-slate-900">Bệnh nhân:</strong> {{ activeVisit?.patientName || selectedRow?.patientName }}</p>
          <p><strong class="text-slate-900">Visit:</strong> #{{ activeVisit?.visitId || selectedRow?.visitId }}</p>
          <p><strong class="text-slate-900">Lịch hẹn:</strong> #{{ activeVisit?.appointmentId || selectedRow?.appointmentId || 'Không gắn lịch' }}</p>
          <p><strong class="text-slate-900">Trạng thái:</strong> {{ statusText(activeVisit?.status || selectedRow?.status) }}</p>
          <p class="sm:col-span-2"><strong class="text-slate-900">Lý do khám:</strong> {{ activeVisit?.chiefComplaint || selectedRow?.reason || 'Chưa ghi nhận' }}</p>
        </div>

        <form class="mt-5 space-y-5" @submit.prevent="submitExamination">
          <section class="rounded-2xl border border-slate-200 p-4">
            <h3 class="text-base font-bold text-slate-950">1. Bắt đầu khám</h3>
            <div class="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Lý do khám <span class="text-rose-600">*</span></span>
                <input v-model="examForm.chiefComplaint" type="text" class="form-input" placeholder="VD: đau mắt, sốt, khó thở..." />
              </label>
              <BaseButton type="button" variant="outline" :loading="savingExam" @click="startVisit">
                Bắt đầu lượt khám
              </BaseButton>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 p-4">
            <h3 class="text-base font-bold text-slate-950">2. Bệnh án</h3>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <label class="block sm:col-span-2">
                <span class="mb-2 block text-sm font-medium text-slate-700">Triệu chứng</span>
                <textarea v-model="examForm.symptoms" rows="3" class="form-textarea" placeholder="Ghi nhận triệu chứng lâm sàng"></textarea>
              </label>
              <BaseInput v-model="examForm.diagnosisCode" label="Mã ICD" placeholder="VD: H10" />
              <BaseInput v-model="examForm.recheckDate" label="Ngày tái khám" type="date" />
              <label class="block sm:col-span-2">
                <span class="mb-2 block text-sm font-medium text-slate-700">Chẩn đoán <span class="text-rose-600">*</span></span>
                <textarea v-model="examForm.diagnosis" rows="3" class="form-textarea" placeholder="Chẩn đoán hoặc kết luận khám"></textarea>
              </label>
              <label class="block sm:col-span-2">
                <span class="mb-2 block text-sm font-medium text-slate-700">Ghi chú bác sĩ</span>
                <textarea v-model="examForm.doctorNote" rows="3" class="form-textarea"></textarea>
              </label>
              <label class="block sm:col-span-2">
                <span class="mb-2 block text-sm font-medium text-slate-700">Hướng điều trị</span>
                <textarea v-model="examForm.treatmentPlan" rows="3" class="form-textarea"></textarea>
              </label>
            </div>
            <div class="mt-4 flex justify-end">
              <BaseButton type="button" variant="outline" :loading="savingExam" @click="saveMedicalRecord">Lưu bệnh án</BaseButton>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 p-4">
            <h3 class="text-base font-bold text-slate-950">3. Chỉ định lâm sàng</h3>
            <div class="mt-3 grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
              <BaseSelect v-model="orderForm.orderType" label="Loại" :options="orderTypeOptions" />
              <BaseInput v-model="orderForm.orderName" label="Tên chỉ định" placeholder="VD: X-quang phổi" />
              <BaseInput v-model="orderForm.reason" label="Lý do" placeholder="Lý do chỉ định" />
              <BaseButton type="button" variant="outline" :loading="savingExam" @click="addClinicalOrder">Thêm</BaseButton>
            </div>
            <div v-if="clinicalOrders.length" class="mt-3 flex flex-wrap gap-2">
              <span v-for="order in clinicalOrders" :key="String(order.clinicalOrderId || order.id || order.orderCode)" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {{ order.orderType || order.OrderType }} - {{ order.orderName || order.OrderName }}
              </span>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <Pill class="h-5 w-5 text-blue-700" />
                  <h3 class="text-base font-bold text-slate-950">4. Kê đơn thuốc</h3>
                </div>
                <p class="mt-1 text-sm text-slate-500">Danh mục thuốc được lấy qua N2 `/medical/api/v1/medical/medicines`.</p>
              </div>
              <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{{ prescriptionItems.length }} thuốc đã chọn</span>
            </div>

            <div v-if="medicineError" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ medicineError }}</div>
            <div v-if="medicineLoading" class="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">Đang tải danh mục thuốc...</div>
            <div v-else class="mt-4 grid gap-3 md:grid-cols-2">
              <button
                v-for="medicine in medicines"
                :key="medicineId(medicine)"
                type="button"
                :disabled="medicineStock(medicine) <= 0"
                :class="[
                  'flex min-h-[92px] items-start gap-3 rounded-xl border bg-white p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
                  isMedicineSelected(medicineId(medicine)) ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-200'
                ]"
                @click="toggleMedicine(medicine)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block font-bold text-slate-950">{{ medicineName(medicine) }}</span>
                  <span class="mt-1 block text-xs leading-5 text-slate-500">Tồn: {{ medicineStock(medicine) }} {{ medicineUnit(medicine) }}</span>
                </span>
              </button>
            </div>

            <div v-if="prescriptionItems.length" class="mt-5 space-y-3">
              <div v-for="item in prescriptionItems" :key="item.medicineId" class="rounded-xl border border-slate-200 bg-white p-4">
                <div class="flex items-start justify-between gap-3">
                  <p class="font-bold text-slate-950">{{ item.medicineNameSnapshot }}</p>
                  <button type="button" class="text-rose-600" @click="removeMedicine(item.medicineId)">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
                <div class="mt-3 grid gap-3 md:grid-cols-5">
                  <BaseInput v-model.number="item.quantity" label="SL" type="number" min="1" />
                  <BaseInput v-model="item.dosage" label="Liều dùng" placeholder="1 viên/lần" />
                  <BaseInput v-model="item.frequency" label="Tần suất" placeholder="2 lần/ngày" />
                  <BaseInput v-model.number="item.durationDays" label="Số ngày" type="number" min="1" />
                  <BaseInput v-model="item.usageInstruction" label="Cách dùng" placeholder="Sau ăn" />
                </div>
              </div>
            </div>
          </section>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton type="button" variant="outline" @click="closeExamine">Đóng</BaseButton>
            <BaseButton type="submit" :loading="savingExam">
              <template #icon><FileHeart class="h-4 w-4" /></template>
              Lưu, chốt đơn & hoàn tất
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <Toast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, FileHeart, Pill, RefreshCw, Search, SearchX, Trash2, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi, type MedicalVisit, type PrescriptionItemPayload } from '@/services/medicalRecordApi'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor, filterSchedulesForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import { displayText } from '@/utils/displayText'

type Resource = 'queue' | 'appointments' | 'examine' | 'records' | 'schedule'
type ActionKey = 'examine'
type Row = Record<string, any>

interface Column { key: string; label: string; badge?: boolean; strong?: boolean }

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const actingId = ref<string | number | null>(null)
const rows = ref<Row[]>([])
const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })
const resource = computed<Resource>(() => isResource(route.meta.doctorResource) ? route.meta.doctorResource : 'queue')
const config = computed(() => configs[resource.value])
const hasActions = computed(() => ['queue', 'examine'].includes(resource.value))
const today = new Date().toISOString().slice(0, 10)

const examineOpen = ref(false)
const savingExam = ref(false)
const selectedRow = ref<Row | null>(null)
const activeVisit = ref<MedicalVisit | null>(null)
const activeRecord = ref<MedicalRecord | null>(null)
const clinicalOrders = ref<Array<Record<string, any>>>([])
const medicines = ref<Array<Medicine & Record<string, any>>>([])
const medicineLoading = ref(false)
const medicineError = ref('')

const examForm = reactive({
  chiefComplaint: '',
  symptoms: '',
  diagnosisCode: '',
  diagnosis: '',
  doctorNote: '',
  treatmentPlan: '',
  recheckDate: '',
})
const orderForm = reactive({ orderType: 'XetNghiem', orderName: '', reason: '' })
const prescriptionItems = ref<PrescriptionItemPayload[]>([])
const orderTypeOptions = [
  { label: 'Xét nghiệm', value: 'XetNghiem' },
  { label: 'Siêu âm', value: 'SieuAm' },
  { label: 'X-quang', value: 'XQuang' },
  { label: 'Khác', value: 'Khac' },
]

const configs: Record<Resource, { title: string; service: string; description: string; endpoint: string; search: string[]; placeholder: string; emptyText: string; columns: Column[] }> = {
  queue: cfg('Hàng đợi khám', 'N2 Visits', 'Danh sách lượt khám hôm nay đã được N1/Nurse check-in và đồng bộ sang N2.', 'GET /medical/api/v1/medical/visits/today', ['patientName', 'doctorName', 'status', 'reason'], 'Tìm bệnh nhân, bác sĩ, trạng thái...', 'N2 chưa có lượt khám hôm nay.', cols(['id', 'Mã'], ['patientName', 'Bệnh nhân', false, true], ['doctorName', 'Bác sĩ'], ['dateTime', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái', true])),
  appointments: cfg('Lịch hẹn hôm nay', 'N1 Appointment', 'Xem lịch hẹn theo bác sĩ. Bác sĩ không tự tạo lượt khám N2 từ màn này.', 'GET /appointment/api/appointments/doctor/{doctorId}', ['patientName', 'doctorName', 'status', 'reason'], 'Tìm lịch hẹn...', 'Chưa có lịch hẹn.', cols(['id', 'Mã'], ['patientName', 'Bệnh nhân', false, true], ['dateTime', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái', true])),
  examine: cfg('Khám & kê đơn', 'N2 Clinical Flow', 'Mở lượt khám đã check-in, ghi bệnh án, chỉ định, kê đơn và hoàn tất lượt khám.', 'N2 visit -> record -> prescription', ['patientName', 'doctorName', 'status', 'reason'], 'Tìm bệnh nhân cần khám...', 'Không có lượt khám phù hợp.', cols(['id', 'Visit'], ['patientName', 'Bệnh nhân', false, true], ['doctorName', 'Bác sĩ'], ['dateTime', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái', true])),
  records: cfg('Lịch sử bệnh án', 'N2 Medical Record', 'Tra cứu bệnh án đã lưu theo bác sĩ đang đăng nhập.', 'GET /medical/api/v1/medical/patients/{id}/history', ['id', 'patientId', 'diagnosis', 'doctorNotes'], 'Tìm mã bệnh án, chẩn đoán...', 'N2 chưa có bệnh án phù hợp với bác sĩ này.', cols(['id', 'Mã BA'], ['patientId', 'Bệnh nhân'], ['diagnosis', 'Chẩn đoán', false, true], ['doctorNotes', 'Ghi chú'], ['createdAt', 'Ngày tạo'], ['status', 'Trạng thái', true])),
  schedule: cfg('Lịch làm việc', 'N1 Schedule', 'Lịch làm việc của bác sĩ đang đăng nhập.', 'GET /appointment/api/doctor-schedules/doctor/{doctorId}', ['weekday', 'timeRange', 'room'], 'Tìm lịch làm việc...', 'Chưa có lịch làm việc.', cols(['id', 'Mã'], ['weekday', 'Ngày'], ['timeRange', 'Khung giờ'], ['room', 'Phòng'], ['status', 'Trạng thái', true])),
}

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

watch([resource, query], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredRows.value.length / itemsPerPage.value))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRows.value.slice(start, end)
})

const metrics = computed(() => [
  { label: 'Tổng dữ liệu', value: rows.value.length, note: 'Theo bộ lọc hiện tại' },
  { label: 'Đang xử lý', value: rows.value.filter((row) => isActiveStatus(row.status)).length, note: 'Chờ hoặc đang khám' },
  { label: 'Hoàn tất', value: rows.value.filter((row) => isDoneStatus(row.status)).length, note: 'Đã hoàn thành' },
])

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    const doctorId = currentDoctorId(authStore.user)
    if (['queue', 'examine'].includes(resource.value)) {
      rows.value = await loadDoctorVisits(doctorId)
    }
    if (resource.value === 'appointments') {
      const appointments = doctorId ? await appointmentApi.getAppointmentsByDoctor(doctorId) : []
      rows.value = filterAppointmentsForDoctor(appointments, authStore.user).map(mapAppointment)
    }
    if (resource.value === 'records') {
      rows.value = (await medicalRecordApi.getMedicalRecords()).filter((item) => filterRecordsForDoctor([item], authStore.user).length).map(mapRecord)
    }
    if (resource.value === 'schedule') {
      const schedules = doctorId ? await appointmentApi.getDoctorSchedulesByDoctor(doctorId) : []
      rows.value = filterSchedulesForDoctor(schedules, authStore.user).map(mapSchedule)
    }
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Không tải được lượt khám', `${error.value} Thử sang Hàng đợi khám hoặc yêu cầu Nurse check-in lại N2.`, 'error')
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadDoctorVisits(doctorId: number) {
  if (doctorId) {
    try {
      const visits = await medicalRecordApi.getVisitsToday(doctorId)
      note.value = visits.length ? 'Đã tải lượt khám từ N2 theo DoctorId.' : 'N2 chưa có lượt khám hôm nay cho bác sĩ này.'
      return visits.map(mapVisit)
    } catch (apiError) {
      note.value = `N2 /visits/today?doctorId=${doctorId} đang lỗi (${getApiErrorMessage(apiError)}). Đang đối chiếu hàng chờ N1 với Visit N2.`
    }
  }

  const n1Queue = await appointmentApi.getWaitingQueue(today).catch(() => [] as WaitingQueueItem[])
  const rowsWithVisits = await Promise.all(n1Queue.map(async (item) => {
    const row = mapQueue(item)
    const appointmentId = Number(row.appointmentId || row.id)
    if (!appointmentId) return row
    const visit = await medicalRecordApi.getVisitByAppointment(appointmentId).catch(() => null)
    if (!visit) return row
    const visitRow = mapVisit(visit)
    return {
      ...row,
      ...visitRow,
      reason: meaningfulText(visitRow.reason) || meaningfulText(row.reason) || 'Chưa ghi nhận',
      source: 'N2',
      n1Status: row.status,
    }
  }))
  const scopedRows = rowsWithVisits.filter(isCurrentDoctorRow)
  if (!note.value) {
    note.value = doctorId
      ? 'Đang hiển thị hàng chờ N1 đã đối chiếu Visit N2; chỉ dòng có Visit N2 mới khám được.'
      : 'Tài khoản chưa có DoctorId, đang lọc hàng chờ theo tên bác sĩ và đối chiếu Visit N2.'
  }
  return scopedRows
}

function rowActions(row: Row) {
  if (!['queue', 'examine'].includes(resource.value)) return []
  if (!Number(row.visitId)) return []
  if (!canOpenExam(row.status)) return []
  return [{ key: 'examine' as ActionKey, label: 'Khám bệnh', className: 'bg-blue-700 text-white hover:bg-blue-800' }]
}

async function runAction(action: ActionKey, row: Row) {
  if (action !== 'examine') return
  await openExamine(row)
}

async function openExamine(row: Row) {
  actingId.value = row.id
  error.value = ''
  try {
    const visitId = Number(row.visitId || row.id)
    if (!visitId) throw new Error('Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.')
    const visit = await medicalRecordApi.getVisit(visitId)
    activeVisit.value = visit
    selectedRow.value = row
    examForm.chiefComplaint = String(visit.chiefComplaint || row.reason || '')
    examForm.symptoms = String(visit.symptoms || '')
    await loadExistingRecord(visitId)
    await Promise.all([loadMedicines(), loadClinicalOrders()])
    examineOpen.value = true
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Không mở được lượt khám', `${error.value} Hãy chuyển bệnh nhân qua Nurse/Receptionist để check-in N2 trước.`, 'error')
  } finally {
    actingId.value = null
  }
}

async function loadExistingRecord(visitId: number) {
  activeRecord.value = null
  try {
    const record = await medicalRecordApi.getMedicalRecordByVisit(visitId)
    activeRecord.value = record
    examForm.diagnosisCode = String(record.diagnosisCode || '')
    examForm.diagnosis = String(record.diagnosisText || record.diagnosis || '')
    examForm.doctorNote = String(record.doctorNote || record.doctorNotes || '')
    examForm.treatmentPlan = String(record.treatmentPlan || '')
    examForm.recheckDate = String(record.followUpDate || '').slice(0, 10)
  } catch (apiError: any) {
    if (apiError?.response?.status !== 404) throw apiError
  }
}

async function loadClinicalOrders() {
  clinicalOrders.value = []
  const recordId = Number(activeRecord.value?.medicalRecordId)
  const patientId = Number(activeVisit.value?.patientId)
  if (!recordId && !patientId) return
  clinicalOrders.value = await medicalRecordApi.getClinicalOrders({ medicalRecordId: recordId || undefined, patientId: patientId || undefined }).catch(() => [])
}

async function loadMedicines() {
  if (medicines.value.length || medicineLoading.value) return
  medicineLoading.value = true
  medicineError.value = ''
  try {
    medicines.value = (await medicalRecordApi.getMedicines({ status: 'Active' })) as Array<Medicine & Record<string, any>>
  } catch (apiError) {
    medicineError.value = businessError(apiError)
    medicines.value = []
  } finally {
    medicineLoading.value = false
  }
}

async function startVisit() {
  const visitId = Number(activeVisit.value?.visitId)
  const doctorId = currentDoctorId(authStore.user) || Number(activeVisit.value?.doctorId || selectedRow.value?.doctorId || selectedRow.value?.raw?.doctorId || selectedRow.value?.raw?.DoctorId || 0)
  if (!visitId) throwMessage('Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.')
  if (!doctorId) throwMessage('Không xác định được DoctorId của tài khoản hiện tại.')
  if (!examForm.chiefComplaint.trim()) throwMessage('Vui lòng nhập lý do khám trước khi bắt đầu lượt khám.')
  savingExam.value = true
  error.value = ''
  try {
    await medicalRecordApi.startVisit(visitId, { doctorId, chiefComplaint: examForm.chiefComplaint.trim() })
    activeVisit.value = await medicalRecordApi.getVisit(visitId)
    note.value = 'Đã bắt đầu lượt khám N2.'
    showToast('Đã bắt đầu lượt khám', 'Tiếp theo nhập chẩn đoán ở phần Bệnh án rồi bấm Lưu bệnh án.', 'success')
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Chưa thể bắt đầu khám', `${error.value} Kiểm tra lại lý do khám hoặc trạng thái visit N2.`, 'error')
  } finally {
    savingExam.value = false
  }
}

async function saveMedicalRecord() {
  const visitId = Number(activeVisit.value?.visitId)
  if (!visitId) throwMessage('Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.')
  if (!examForm.diagnosis.trim()) throwMessage('Vui lòng nhập chẩn đoán trước khi lưu bệnh án.')
  savingExam.value = true
  error.value = ''
  try {
    const payload = {
      visitId,
      diagnosisCode: examForm.diagnosisCode.trim() || undefined,
      diagnosisText: examForm.diagnosis.trim(),
      doctorNote: examForm.doctorNote.trim() || undefined,
      treatmentPlan: examForm.treatmentPlan.trim() || undefined,
      followUpDate: examForm.recheckDate || undefined,
    }
    activeRecord.value = activeRecord.value?.medicalRecordId
      ? await medicalRecordApi.updateMedicalRecord(activeRecord.value.medicalRecordId, payload)
      : await medicalRecordApi.createMedicalRecord(payload)
    note.value = 'Đã lưu bệnh án N2.'
    showToast('Đã lưu bệnh án', 'Tiếp theo có thể thêm Chỉ định lâm sàng hoặc chuyển xuống Kê đơn thuốc.', 'success')
    await loadClinicalOrders()
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Chưa lưu được bệnh án', `${error.value} Kiểm tra chẩn đoán và trạng thái lượt khám.`, 'error')
  } finally {
    savingExam.value = false
  }
}

async function addClinicalOrder() {
  const medicalRecordId = Number(activeRecord.value?.medicalRecordId)
  if (!medicalRecordId) throwMessage('Cần lưu bệnh án trước khi tạo chỉ định lâm sàng.')
  savingExam.value = true
  error.value = ''
  try {
    await medicalRecordApi.createClinicalOrder({
      medicalRecordId,
      orderType: orderForm.orderType,
      orderName: orderForm.orderName.trim(),
      reason: orderForm.reason.trim() || undefined,
    })
    orderForm.orderName = ''
    orderForm.reason = ''
    await loadClinicalOrders()
    note.value = 'Đã tạo chỉ định lâm sàng.'
    showToast('Đã tạo chỉ định', 'Tiếp theo tiếp tục kê đơn hoặc hoàn tất khám nếu không cần thêm chỉ định.', 'success')
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Chưa tạo được chỉ định', `${error.value} Cần lưu bệnh án trước khi tạo chỉ định.`, 'error')
  } finally {
    savingExam.value = false
  }
}

async function submitExamination() {
  savingExam.value = true
  error.value = ''
  try {
    await saveMedicalRecord()
    const recordId = Number(activeRecord.value?.medicalRecordId)
    if (!recordId) throw new Error('Cần lưu bệnh án trước khi kê đơn hoặc hoàn tất khám.')
    let invoiceCreated = false
    if (prescriptionItems.value.length) {
      validatePrescriptionItems()
      const draft = await medicalRecordApi.createPrescription({ medicalRecordId: recordId, note: prescriptionNote() })
      const prescriptionId = Number(draft.prescriptionId || draft.id)
      for (const item of prescriptionItems.value) {
        await medicalRecordApi.addPrescriptionItem(prescriptionId, item)
      }
      const submittedPrescription = await medicalRecordApi.submitPrescription(prescriptionId, { medicalRecordId: recordId, note: prescriptionNote(), items: prescriptionItems.value })
      invoiceCreated = await createPrescriptionInvoice(Number(submittedPrescription.prescriptionId || submittedPrescription.id || prescriptionId), recordId)
    }
    await medicalRecordApi.completeMedicalRecord(recordId)
    await medicalRecordApi.completeVisit(Number(activeVisit.value?.visitId))
    const appointmentId = Number(activeVisit.value?.appointmentId || selectedRow.value?.appointmentId)
    if (appointmentId) await appointmentApi.completeAppointmentSafely(appointmentId, String(selectedRow.value?.appointmentDate || '')).catch(() => undefined)
    note.value = prescriptionItems.value.length
      ? invoiceCreated
        ? 'Đã hoàn tất bệnh án, chốt đơn thuốc qua N2, tạo viện phí N3 và hoàn tất lượt khám.'
        : 'Đã hoàn tất bệnh án và chốt đơn thuốc qua N2. N3 chưa tạo được viện phí tự động.'
      : 'Đã hoàn tất bệnh án và lượt khám.'
    showToast(
      'Hoàn tất khám',
      prescriptionItems.value.length
        ? invoiceCreated
          ? 'Đơn thuốc đã được chốt qua N2 và đã gửi tạo viện phí N3. Tiếp theo sang Thu viện phí để kiểm tra hóa đơn.'
          : 'Đơn thuốc đã được chốt qua N2 nhưng N3 chưa nhận tạo viện phí tự động. Tiếp theo sang Thu viện phí để tạo/kiểm tra hóa đơn.'
        : 'Bệnh án đã hoàn tất. Tiếp theo bệnh nhân có thể xem Hồ sơ bệnh án.',
      'success'
    )
    closeExamine()
    await loadData()
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Chưa hoàn tất khám', `${error.value} Nếu lỗi ở đơn thuốc, kiểm tra đủ liều dùng, tần suất, số ngày và số lượng.`, 'error')
  } finally {
    savingExam.value = false
  }
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

async function createPrescriptionInvoice(prescriptionId: number, medicalRecordId: number) {
  if (!prescriptionId) return false
  const appointmentId = positiveNumber(activeVisit.value?.appointmentId || selectedRow.value?.appointmentId)
  const patientId = activeVisit.value?.patientId || selectedRow.value?.patientId
  const doctorId = positiveNumber(activeVisit.value?.doctorId || selectedRow.value?.doctorId || currentDoctorId(authStore.user))
  const items = prescriptionItems.value.map((item) => {
    const unitPrice = medicinePrice(item.medicineId)
    const quantity = Number(item.quantity) || 0
    return {
      medicineId: item.medicineId,
      medicineName: item.medicineNameSnapshot,
      medicineNameSnapshot: item.medicineNameSnapshot,
      unitSnapshot: item.unitSnapshot,
      quantity,
      unitPrice,
      amount: unitPrice * quantity,
      dosage: item.dosage,
      frequency: item.frequency,
      durationDays: item.durationDays,
      usageInstruction: item.usageInstruction,
    }
  })
  const medicineTotal = items.reduce((total, item) => total + Number(item.amount || 0), 0)

  try {
    await billingApi.createInvoiceFromPrescription({
      prescriptionId,
      medicalRecordId,
      appointmentId,
      patientId,
      doctorId,
      medicineTotal,
      items,
      note: `Viện phí thuốc từ đơn #${prescriptionId}`,
    })
    return true
  } catch {
    return false
  }
}

function toggleMedicine(medicine: Medicine & Record<string, any>) {
  const id = medicineId(medicine)
  if (!id || medicineStock(medicine) <= 0) return
  if (isMedicineSelected(id)) {
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

function removeMedicine(medicineId: number) {
  prescriptionItems.value = prescriptionItems.value.filter((item) => item.medicineId !== medicineId)
}

function isMedicineSelected(medicineId: number) {
  return prescriptionItems.value.some((item) => item.medicineId === medicineId)
}

function closeExamine() {
  examineOpen.value = false
  selectedRow.value = null
  activeVisit.value = null
  activeRecord.value = null
  clinicalOrders.value = []
  prescriptionItems.value = []
  Object.assign(examForm, { chiefComplaint: '', symptoms: '', diagnosisCode: '', diagnosis: '', doctorNote: '', treatmentPlan: '', recheckDate: '' })
}

function mapVisit(item: MedicalVisit): Row {
  return {
    id: item.visitId || item.id,
    visitId: item.visitId || item.id,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    patientName: displayText(item.patientName || item.patient?.fullName || item.Patient?.FullName || ''),
    doctorId: item.doctorId,
    doctorName: displayText(item.doctorName || item.doctor?.fullName || item.Doctor?.FullName || ''),
    dateTime: formatDate(item.visitDate || item.createdAt),
    reason: item.chiefComplaint || item.symptoms || 'Chưa ghi nhận',
    status: item.status,
    raw: item,
  }
}

function mapAppointment(item: Appointment): Row {
  return {
    id: item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    patientName: displayText(item.patientName),
    doctorId: item.doctorId,
    doctorName: displayText(item.doctorName),
    appointmentDate: item.appointmentDate,
    dateTime: `${formatDate(item.appointmentDate)} - ${item.slotTime || '-'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi nhận',
    status: item.status,
  }
}

function mapQueue(item: WaitingQueueItem): Row {
  return {
    id: item.id || item.queueId || item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    patientName: displayText(item.patientName || ''),
    doctorId: item.doctorId,
    doctorName: displayText(item.doctorName || ''),
    appointmentDate: item.appointmentDate,
    dateTime: `${formatDate(item.appointmentDate)} - ${item.slotTime || '-'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi nhận',
    status: item.status,
    source: 'N1',
    raw: item,
  }
}

function mapRecord(item: MedicalRecord): Row {
  return {
    id: item.recordId || item.medicalRecordCode || item.medicalRecordId,
    medicalRecordId: item.medicalRecordId,
    patientId: item.patientId,
    diagnosis: item.diagnosisText || item.diagnosis || 'Chưa có chẩn đoán',
    doctorNotes: item.doctorNote || item.doctorNotes || item.treatmentPlan || 'Chưa ghi chú',
    createdAt: formatDate(item.createdAt || item.examDate),
    status: item.status,
  }
}

function mapSchedule(item: DoctorSchedule & Record<string, any>): Row {
  return {
    id: item.scheduleId || item.id,
    weekday: item.workDate || item.dayOfWeek || item.weekday || 'Chưa cập nhật',
    timeRange: `${item.startTime || '-'} - ${item.endTime || '-'}`,
    room: item.roomName || item.room || 'Chưa cập nhật',
    status: item.status || 'Đang mở',
  }
}

function prescriptionNote() {
  return prescriptionItems.value.map((item) => `${item.medicineNameSnapshot}: ${item.quantity} ${item.unitSnapshot || ''}; ${item.dosage}; ${item.frequency}; ${item.durationDays} ngày`).join('\n')
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
  const medicine = medicines.value.find((item) => medicineId(item) === Number(medicineIdValue))
  if (!medicine) return 0
  return positiveNumber(
    medicine.unitPrice ??
    medicine.UnitPrice ??
    medicine.price ??
    medicine.Price ??
    medicine.sellingPrice ??
    medicine.SellingPrice ??
    medicine.retailPrice ??
    medicine.RetailPrice
  )
}

function positiveNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

function value(row: Row, key: string) {
  return row[key] === undefined || row[key] === '' ? 'Chưa cập nhật' : String(row[key])
}

function cfg(title: string, service: string, description: string, endpoint: string, search: string[], placeholder: string, emptyText: string, columns: Column[]) {
  return { title, service, description, endpoint, search, placeholder, emptyText, columns }
}

function cols(...defs: [string, string, boolean?, boolean?][]): Column[] {
  return defs.map(([key, label, badge, strong]) => ({ key, label, badge, strong }))
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function normalizeDoctorName(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(bs|bac si|dr|doctor)\b\.?/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function meaningfulText(value: unknown) {
  const textValue = String(value || '').trim()
  const normalized = textValue.toLowerCase()
  if (!textValue) return ''
  if (normalized.includes('chưa ghi') || normalized.includes('chua ghi') || normalized.includes('chưa cập') || normalized.includes('chua cap')) return ''
  return textValue
}

function isCurrentDoctorRow(row: Row) {
  const doctorId = currentDoctorId(authStore.user)
  if (doctorId && Number(row.doctorId || row.raw?.doctorId || row.raw?.DoctorId) === doctorId) return true
  const currentName = normalizeDoctorName(authStore.user?.fullName)
  const rowName = normalizeDoctorName(row.doctorName || row.raw?.doctorName || row.raw?.DoctorName)
  return Boolean(currentName && rowName && (currentName === rowName || currentName.includes(rowName) || rowName.includes(currentName)))
}

function canOpenExam(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return !value.includes('complete') && !value.includes('done') && !value.includes('cancel') && !value.includes('hoàn')
}

function isActiveStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('waiting') || value.includes('checked') || value.includes('pending') || value.includes('confirmed') || value.includes('progress') || value.includes('chờ') || value.includes('đang')
}

function isDoneStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('done') || value.includes('completed') || value.includes('hoàn')
}

function statusText(status?: string | number) {
  const value = String(status || '')
  const normalized = value.toLowerCase()
  if (normalized.includes('checked')) return 'Đã check-in'
  if (normalized.includes('confirmed')) return 'Đã xác nhận'
  if (normalized.includes('progress')) return 'Đang khám'
  if (normalized.includes('completed') || normalized.includes('done')) return 'Hoàn tất'
  if (normalized.includes('cancel')) return 'Đã hủy'
  if (normalized.includes('waiting') || normalized.includes('pending')) return 'Đang chờ'
  return value || 'Chưa cập nhật'
}

function statusClass(status?: string | number) {
  const value = String(status || '').toLowerCase()
  if (value.includes('completed') || value.includes('done') || value.includes('confirmed') || value.includes('checked')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('progress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('waiting') || value.includes('pending')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function businessError(error: unknown) {
  const message = getApiErrorMessage(error)
  const normalized = message.toLowerCase()
  if (normalized.includes('visit') || normalized.includes('lượt khám') || normalized.includes('by-appointment')) return 'Lịch hẹn chưa được check-in hoặc N2 chưa tạo lượt khám.'
  if (normalized.includes('record') && normalized.includes('complete')) return 'Cần hoàn tất bệnh án trước khi hoàn tất lượt khám.'
  if (normalized.includes('diagnosis')) return 'Vui lòng nhập chẩn đoán hợp lệ trước khi lưu bệnh án.'
  return message
}

function throwMessage(message: string): never {
  error.value = message
  showToast('Thông tin chưa hợp lệ', message, 'error')
  throw new Error(message)
}

function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
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
  @apply h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}
</style>
