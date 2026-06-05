<template>
  <section class="space-y-6">
    <div class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">{{ config.service }}</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{{ config.title }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">{{ config.endpoint }}</span>
            <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Không kê đơn / không hoàn tất bệnh án</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="resource === 'patients'" @click="openPatientModal()">
            <template #icon><UserPlus class="h-4 w-4" /></template>
            Thêm bệnh nhân
          </BaseButton>
          <BaseButton variant="outline" :disabled="loading" @click="loadData">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
        </div>
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
          <input v-model="query" class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" :placeholder="config.placeholder" />
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
                <span v-if="column.badge" :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(row[column.key])]">{{ statusText(row[column.key]) }}</span>
                <span v-else :class="column.strong ? 'font-semibold text-slate-950' : 'text-slate-700'">{{ value(row, column.key) }}</span>
              </td>
              <td v-if="hasActions" class="px-5 py-4 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button v-for="action in rowActions(row)" :key="action.key" type="button" :disabled="actingId === row.id" :class="['inline-flex h-9 items-center rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60', action.className]" @click="runAction(action.key, row)">
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

    <div v-if="vitalsOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-3xl rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">N2 Visit Vitals</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Cập nhật chỉ số sức khỏe</h2>
            <p class="mt-2 text-sm text-slate-500">{{ activeRow?.patientName }} - Visit #{{ activeRow?.visitId || activeRow?.id }}</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="closeVitals">
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <p class="font-bold">Hướng dẫn nhập chỉ số sức khỏe</p>
          <ul class="mt-2 grid gap-1 sm:grid-cols-2">
            <li>Nhiệt độ: 30-45°C, ví dụ 36.8.</li>
            <li>Huyết áp: dạng 120/80, tối đa 30 ký tự.</li>
            <li>Nhịp tim: 1-250 lần/phút.</li>
            <li>Chiều cao: 1-300 cm.</li>
            <li>Cân nặng: 1-500 kg.</li>
            <li>Có thể để trống chỉ số chưa đo.</li>
          </ul>
        </div>
        <form class="mt-5 space-y-4" @submit.prevent="submitVitals">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BaseInput v-model.number="vitalsForm.temperature" label="Nhiệt độ (°C)" type="number" min="30" max="45" step="0.1" />
            <BaseInput v-model="vitalsForm.bloodPressure" label="Huyết áp" placeholder="120/80" maxlength="30" />
            <BaseInput v-model.number="vitalsForm.heartRate" label="Nhịp tim" type="number" min="1" max="250" />
            <BaseInput v-model.number="vitalsForm.height" label="Chiều cao (cm)" type="number" min="1" max="300" />
            <BaseInput v-model.number="vitalsForm.weight" label="Cân nặng (kg)" type="number" min="1" max="500" />
          </div>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Ghi chú điều dưỡng</span>
            <textarea v-model="vitalsForm.note" rows="3" maxlength="500" class="form-textarea"></textarea>
          </label>
          <div class="flex justify-end gap-3">
            <BaseButton type="button" variant="outline" @click="closeVitals">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">Lưu chỉ số sức khỏe</BaseButton>
          </div>
        </form>
      </div>
    </div>

    <div v-if="patientModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">N2 Patient</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ editingPatientId ? 'Cập nhật bệnh nhân' : 'Thêm bệnh nhân' }}</h2>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="closePatientModal">
            <X class="h-5 w-5" />
          </button>
        </div>
        <form class="mt-5 space-y-4" @submit.prevent="submitPatient">
          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="patientForm.fullName" label="Họ tên" required />
            <BaseInput v-model="patientForm.phoneNumber" label="Số điện thoại" />
            <BaseInput v-model="patientForm.email" label="Email" type="email" />
            <BaseInput v-model="patientForm.dateOfBirth" label="Ngày sinh" type="date" />
            <BaseSelect v-model="patientForm.gender" label="Giới tính" :options="genderOptions" placeholder="Chọn giới tính" />
            <BaseInput v-model="patientForm.bloodType" label="Nhóm máu" />
          </div>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Địa chỉ</span>
            <textarea v-model="patientForm.address" rows="2" maxlength="255" class="form-textarea"></textarea>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Tiền sử bệnh / dị ứng</span>
            <textarea v-model="patientForm.medicalHistory" rows="3" class="form-textarea"></textarea>
          </label>
          <div class="flex justify-end gap-3">
            <BaseButton type="button" variant="outline" @click="closePatientModal">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">Lưu hồ sơ</BaseButton>
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
import { CalendarCheck, ChevronLeft, ChevronRight, CreditCard, RefreshCw, Search, SearchX, UserPlus, Users, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import Toast from '@/components/ui/Toast.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi, type MedicalVisit } from '@/services/medicalRecordApi'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Invoice, Prescription } from '@/types/billing'
import type { Patient } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

type Resource = 'appointments' | 'patients' | 'queue' | 'bills' | 'prescriptions'
type ActionKey = 'confirm' | 'checkin' | 'cancelAppointment' | 'pay' | 'vitals' | 'editPatient'
type Row = Record<string, any>
interface Column { key: string; label: string; badge?: boolean; strong?: boolean }

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const actingId = ref<string | number | null>(null)
const rows = ref<Row[]>([])
const patientsList = ref<Patient[]>([])
const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })
const resource = computed<Resource>(() => isResource(route.meta.nurseResource) ? route.meta.nurseResource : 'appointments')
const config = computed(() => configs[resource.value])
const today = new Date().toISOString().slice(0, 10)
const hasActions = computed(() => ['appointments', 'queue', 'patients', 'bills'].includes(resource.value))
const vitalsOpen = ref(false)
const patientModalOpen = ref(false)
const activeRow = ref<Row | null>(null)
const editingPatientId = ref<string | number | null>(null)
const vitalsForm = reactive({ temperature: undefined as number | undefined, bloodPressure: '', heartRate: undefined as number | undefined, height: undefined as number | undefined, weight: undefined as number | undefined, note: '' })
const patientForm = reactive({ fullName: '', phoneNumber: '', email: '', dateOfBirth: '', gender: '', address: '', bloodType: '', allergyNote: '', medicalHistory: '' })
const genderOptions = [{ label: 'Nam', value: 'Male' }, { label: 'Nữ', value: 'Female' }]

const configs: Record<Resource, { title: string; service: string; description: string; endpoint: string; search: string[]; placeholder: string; emptyText: string; columns: Column[] }> = {
  appointments: cfg('Lịch hẹn tiếp nhận', 'N1 -> N2', 'Xác nhận lịch hẹn và gửi event check-in để N2 tạo lượt khám.', 'POST /medical/api/v1/medical/events/patient-checked-in', ['patientName', 'doctorName', 'status', 'reason'], 'Tìm bệnh nhân, bác sĩ, lý do...', 'N1 chưa có lịch hẹn để tiếp nhận.', cols(['id', 'Mã'], ['patientName', 'Bệnh nhân', false, true], ['doctorName', 'Bác sĩ'], ['dateTime', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái', true])),
  patients: cfg('Hồ sơ bệnh nhân', 'N2 Patients', 'Tạo và cập nhật thông tin hồ sơ bệnh nhân khi tiếp nhận.', 'GET/POST/PUT /medical/api/v1/medical/patients', ['id', 'name', 'phone', 'gender', 'history'], 'Tìm mã bệnh nhân, họ tên, số điện thoại...', 'N2 chưa có hồ sơ bệnh nhân.', cols(['id', 'Mã BN'], ['name', 'Bệnh nhân', false, true], ['phone', 'Số điện thoại'], ['gender', 'Giới tính'], ['history', 'Tiền sử bệnh'])),
  queue: cfg('Hàng chờ khám', 'N2 Visits', 'Theo dõi lượt khám đã check-in và cập nhật chỉ số sức khỏe trước khám.', 'GET /medical/api/v1/medical/visits/today', ['patientName', 'doctorName', 'status', 'reason'], 'Tìm bệnh nhân, bác sĩ, trạng thái...', 'N2 chưa có lượt khám hôm nay.', cols(['id', 'Visit'], ['patientName', 'Bệnh nhân', false, true], ['doctorName', 'Bác sĩ'], ['dateTime', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái', true])),
  bills: cfg('Thu viện phí', 'N3 Billing', 'Theo dõi hóa đơn và thu tiền. Không thuộc nghiệp vụ N2 bệnh án.', 'GET /pharmacy/api/invoices', ['id', 'patientId', 'amount', 'status'], 'Tìm hóa đơn, bệnh nhân, trạng thái...', 'N3 chưa có hóa đơn.', cols(['id', 'Mã HĐ'], ['patientId', 'Bệnh nhân'], ['appointmentId', 'Lịch hẹn'], ['amount', 'Số tiền'], ['status', 'Trạng thái', true])),
  prescriptions: cfg('Đơn thuốc', 'N2/N3 Readonly', 'Y tá chỉ xem trạng thái đơn thuốc, không kê hoặc chốt đơn.', 'N2 prescription.created -> N3', ['id', 'patientId', 'medicine', 'status'], 'Tìm đơn thuốc, bệnh nhân, thuốc...', 'Chưa có đơn thuốc.', cols(['id', 'Mã đơn'], ['patientId', 'Bệnh nhân', false, true], ['medicalRecordId', 'Bệnh án'], ['medicine', 'Thuốc'], ['status', 'Trạng thái', true])),
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
  { label: 'Tổng dữ liệu', value: rows.value.length, note: 'Theo service hiện tại' },
  { label: 'Đang xử lý', value: rows.value.filter((row) => isActiveStatus(row.status)).length, note: 'Chờ, xác nhận hoặc chưa thu' },
  { label: 'Hoàn tất', value: rows.value.filter((row) => isDoneStatus(row.status)).length, note: 'Đã xử lý xong' },
])

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    // Proactively fetch patients list for naming lookups
    if (!patientsList.value.length) {
      patientsList.value = await medicalRecordApi.getPatients({ pageSize: 100 }).catch(() => [])
    }
    
    if (resource.value === 'appointments') rows.value = (await appointmentApi.getAppointments()).map(mapAppointment)
    if (resource.value === 'patients') rows.value = (await medicalRecordApi.getPatients({ pageSize: 100 })).map(mapPatient)
    if (resource.value === 'queue') rows.value = await loadNurseQueue()
    if (resource.value === 'bills') rows.value = (await billingApi.getInvoices()).map(mapInvoice)
    if (resource.value === 'prescriptions') rows.value = await loadReadonlyPrescriptions()
    note.value = rows.value.length ? 'Đã đồng bộ dữ liệu từ API Gateway.' : ''
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    showToast('Không tải được dữ liệu', `${error.value} Thử bấm Tải lại hoặc chuyển sang Lịch hẹn để check-in lại.`, 'error')
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadReadonlyPrescriptions() {
  const [patients, n3Prescriptions] = await Promise.all([
    medicalRecordApi.getPatients({ pageSize: 100 }).catch(() => [] as Patient[]),
    billingApi.getPrescriptions().catch(() => [] as Prescription[])
  ])
  
  const histories = await Promise.allSettled(patients.map((patient) => medicalRecordApi.getPatientHistory(patient.patientId)))
  const n2Prescriptions = histories.flatMap((result) => result.status === 'fulfilled' ? result.value.prescriptions : [])
  
  // Merge and deduplicate
  const combined = [...n2Prescriptions, ...n3Prescriptions]
  const seen = new Set<string>()
  const uniquePrescriptions: Prescription[] = []
  
  for (const p of combined) {
    const id = p.prescriptionId || p.id || p.prescriptionCode
    if (!id) continue
    const idStr = String(id)
    if (!seen.has(idStr)) {
      seen.add(idStr)
      uniquePrescriptions.push({
        ...p,
        id: p.id || p.prescriptionId,
        prescriptionId: p.prescriptionId || p.id,
        items: p.items || p.prescriptionItems || []
      })
    } else {
      const existing = uniquePrescriptions.find(x => String(x.prescriptionId || x.id || x.prescriptionCode) === idStr)
      if (existing) {
        existing.status = existing.status || p.status || (p as any).Status
        existing.note = existing.note || p.note || (p as any).Note
        const pItems = p.items || p.prescriptionItems || []
        if ((!existing.items || !existing.items.length) && pItems.length) {
          existing.items = pItems
        }
      }
    }
  }
  
  return uniquePrescriptions.map(mapPrescription)
}

async function loadNurseQueue() {
  try {
    const visits = await medicalRecordApi.getVisitsToday()
    return visits.map(mapVisit)
  } catch (apiError) {
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
    note.value = `N2 /visits/today đang lỗi (${getApiErrorMessage(apiError)}). Đang hiển thị hàng chờ từ N1; chỉ cập nhật chỉ số sức khỏe với dòng đã có Visit N2.`
    return rowsWithVisits
  }
}

function rowActions(row: Row) {
  const status = String(row.status || '').toLowerCase()
  const actions: Array<{ key: ActionKey; label: string; className: string }> = []
  if (resource.value === 'appointments') {
    if (status.includes('pending') || status.includes('waiting')) actions.push({ key: 'confirm', label: 'Xác nhận', className: 'bg-blue-700 text-white hover:bg-blue-800' })
    if (!status.includes('completed') && !status.includes('cancel')) actions.push({ key: 'checkin', label: 'Check-in N2', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
    if (!isDoneStatus(row.status) && !status.includes('cancel')) actions.push({ key: 'cancelAppointment', label: 'Hủy', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  if (resource.value === 'queue' && Number(row.visitId) > 0) {
    actions.push({ key: 'vitals', label: 'Sinh hiệu', className: 'bg-blue-700 text-white hover:bg-blue-800' })
  }
  if (resource.value === 'patients') actions.push({ key: 'editPatient', label: 'Cập nhật', className: 'bg-blue-50 text-blue-700 hover:bg-blue-100' })
  if (resource.value === 'bills' && !status.includes('paid')) actions.push({ key: 'pay', label: 'Thu tiền', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
  return actions
}

async function runAction(action: ActionKey, row: Row) {
  actingId.value = row.id
  error.value = ''
  try {
    if (action === 'confirm') await appointmentApi.confirmAppointment(Number(row.appointmentId || row.id))
    if (action === 'checkin') await syncMedicalVisit(row)
    if (action === 'cancelAppointment') await appointmentApi.cancelAppointment(Number(row.appointmentId || row.id))
    if (action === 'vitals') openVitals(row)
    if (action === 'editPatient') openPatientModal(row)
    if (action === 'pay') await billingApi.payInvoice(Number(row.id), toNumber(row.amountValue))
    if (!['vitals', 'editPatient'].includes(action)) {
      note.value = 'Đã cập nhật trạng thái thành công.'
      showToast('Cập nhật thành công', nextGuideForAction(action), 'success')
      await loadData()
    }
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    showToast('Thao tác chưa thành công', `${error.value} Kiểm tra lại trạng thái lịch hẹn hoặc thử sang Hàng chờ khám.`, 'error')
  } finally {
    actingId.value = null
  }
}

async function syncMedicalVisit(row: Row) {
  await medicalRecordApi.syncAppointmentConfirmed(row).catch(() => undefined)
  await medicalRecordApi.syncPatientCheckedIn(row)
  const appointmentId = Number(row.appointmentId || row.id)
  await medicalRecordApi.getVisitByAppointment(appointmentId)
  note.value = 'Đã check-in và xác nhận N2 đã tạo lượt khám.'
  showToast('Check-in N2 thành công', 'Tiếp theo sang Hàng chờ khám để cập nhật chỉ số sức khỏe trước khi bác sĩ khám.', 'success')
}

function openVitals(row: Row) {
  activeRow.value = row
  vitalsOpen.value = true
  const raw = row.raw || {}
  vitalsForm.temperature = numberOrUndefined(raw.temperature ?? raw.Temperature)
  vitalsForm.bloodPressure = String(raw.bloodPressure ?? raw.BloodPressure ?? '')
  vitalsForm.heartRate = numberOrUndefined(raw.heartRate ?? raw.HeartRate)
  vitalsForm.height = numberOrUndefined(raw.height ?? raw.Height)
  vitalsForm.weight = numberOrUndefined(raw.weight ?? raw.Weight)
  vitalsForm.note = String(raw.note ?? raw.Note ?? '')
}

function closeVitals() {
  vitalsOpen.value = false
  activeRow.value = null
}

async function submitVitals() {
  const visitId = Number(activeRow.value?.visitId || activeRow.value?.id)
  if (!visitId) return
  const validation = validateVitals()
  if (validation) {
    error.value = validation
    showToast('Thông tin chỉ số sức khỏe chưa hợp lệ', `${validation} Sửa lại chỉ số rồi bấm Lưu chỉ số sức khỏe.`, 'error')
    return
  }
  saving.value = true
  error.value = ''
  try {
    await medicalRecordApi.updateVisitVitals(visitId, {
      temperature: emptyToNull(vitalsForm.temperature),
      bloodPressure: vitalsForm.bloodPressure.trim() || null,
      heartRate: emptyToNull(vitalsForm.heartRate),
      height: emptyToNull(vitalsForm.height),
      weight: emptyToNull(vitalsForm.weight),
      note: vitalsForm.note.trim() || null,
    })
    note.value = 'Đã cập nhật chỉ số sức khỏe N2.'
    showToast('Đã lưu chỉ số sức khỏe', 'Tiếp theo bác sĩ có thể sang Khám & kê đơn để bắt đầu lượt khám.', 'success')
    closeVitals()
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    showToast('Chưa lưu được chỉ số sức khỏe', `${error.value} Kiểm tra visit N2 hoặc thử check-in lại từ Lịch hẹn.`, 'error')
  } finally {
    saving.value = false
  }
}

function validateVitals() {
  if (vitalsForm.temperature !== undefined && (Number(vitalsForm.temperature) < 30 || Number(vitalsForm.temperature) > 45)) return 'Nhiệt độ phải nằm trong khoảng 30-45°C.'
  if (vitalsForm.heartRate !== undefined && (Number(vitalsForm.heartRate) < 1 || Number(vitalsForm.heartRate) > 250)) return 'Nhịp tim phải nằm trong khoảng 1-250.'
  if (vitalsForm.height !== undefined && (Number(vitalsForm.height) < 1 || Number(vitalsForm.height) > 300)) return 'Chiều cao phải nằm trong khoảng 1-300 cm.'
  if (vitalsForm.weight !== undefined && (Number(vitalsForm.weight) < 1 || Number(vitalsForm.weight) > 500)) return 'Cân nặng phải nằm trong khoảng 1-500 kg.'
  if (vitalsForm.bloodPressure.length > 30) return 'Huyết áp tối đa 30 ký tự.'
  if (vitalsForm.note.length > 500) return 'Ghi chú tối đa 500 ký tự.'
  return ''
}

function openPatientModal(row?: Row) {
  editingPatientId.value = row?.raw?.patientId || row?.raw?.id || row?.patientId || row?.id || null
  Object.assign(patientForm, {
    fullName: row?.raw?.fullName || row?.name || '',
    phoneNumber: row?.raw?.phoneNumber || row?.raw?.phone || row?.phone || '',
    email: row?.raw?.email || '',
    dateOfBirth: String(row?.raw?.dateOfBirth || '').slice(0, 10),
    gender: row?.raw?.gender || '',
    address: row?.raw?.address || '',
    bloodType: row?.raw?.bloodType || '',
    allergyNote: row?.raw?.allergyNote || '',
    medicalHistory: row?.raw?.medicalHistory || '',
  })
  patientModalOpen.value = true
}

function closePatientModal() {
  patientModalOpen.value = false
  editingPatientId.value = null
  Object.assign(patientForm, { fullName: '', phoneNumber: '', email: '', dateOfBirth: '', gender: '', address: '', bloodType: '', allergyNote: '', medicalHistory: '' })
}

async function submitPatient() {
  if (!patientForm.fullName.trim()) {
    error.value = 'Vui lòng nhập họ tên bệnh nhân.'
    showToast('Thông tin chưa hợp lệ', 'Vui lòng nhập họ tên bệnh nhân rồi lưu lại.', 'error')
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload = { ...patientForm, fullName: patientForm.fullName.trim(), phoneNumber: patientForm.phoneNumber.trim() || undefined }
    if (editingPatientId.value) await medicalRecordApi.updatePatient(editingPatientId.value, payload)
    else await medicalRecordApi.createPatient(payload)
    note.value = editingPatientId.value ? 'Đã cập nhật hồ sơ bệnh nhân.' : 'Đã tạo hồ sơ bệnh nhân.'
    showToast(
      editingPatientId.value ? 'Đã cập nhật hồ sơ' : 'Đã tạo hồ sơ',
      'Tiếp theo quay lại Lịch hẹn để check-in hoặc Hàng chờ khám để cập nhật chỉ số sức khỏe.',
      'success'
    )
    closePatientModal()
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    showToast('Chưa lưu được hồ sơ', `${error.value} Kiểm tra các trường bắt buộc rồi thử lại.`, 'error')
  } finally {
    saving.value = false
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
    examFee: item.examFee,
    patientName: displayText(item.patientName),
    doctorName: displayText(item.doctorName),
    dateTime: `${formatDate(item.appointmentDate)} - ${item.slotTime || '-'}`,
    reason: item.reason || 'Chưa ghi nhận',
    status: item.status,
    raw: item,
  }
}

const doctorNamesMap: Record<number, string> = {
  1: 'BS. Nguyễn Văn An',
  2: 'BS. Trần Thị Bình',
  3: 'BS. Lê Vân Châu',
  4: 'BS. Phạm Quốc Dũng',
  5: 'BS. Hoàng Thu Hà',
  6: 'BS. Đỗ Minh Khang',
  7: 'BS. Võ Lan Anh',
  8: 'BS. Nguyễn Đức Huy',
  9: 'BS. Bùi Thanh Tâm',
  10: 'BS. Trịnh Quang Minh'
}

function getDoctorNameFallback(doctorId?: number | string, existingName?: string) {
  if (existingName && existingName.trim()) return existingName
  if (!doctorId) return 'Chưa chỉ định'
  const docId = Number(doctorId)
  return doctorNamesMap[docId] || `Bác sĩ #${docId}`
}

function getPatientDisplayFallback(patientId?: number | string) {
  if (!patientId) return 'Chưa cập nhật'
  const patId = Number(patientId)
  const patient = patientsList.value.find(p => Number(p.patientId || p.id) === patId)
  return patient ? `${patient.fullName} (${patient.patientCode || patient.patientIdCode || patient.id})` : `Bệnh nhân #${patientId}`
}

function mapVisit(item: MedicalVisit): Row {
  return {
    id: item.visitId || item.id,
    visitId: item.visitId || item.id,
    appointmentId: item.appointmentId,
    patientName: displayText(item.patientName || item.patient?.fullName || item.Patient?.FullName || ''),
    doctorName: getDoctorNameFallback(item.doctorId, item.doctorName || item.doctor?.fullName || item.Doctor?.FullName || ''),
    dateTime: formatDate(item.visitDate || item.createdAt),
    reason: item.chiefComplaint || item.symptoms || 'Chưa ghi nhận',
    status: item.status,
    raw: item,
  }
}

function mapQueue(item: WaitingQueueItem): Row {
  return {
    id: item.id || item.queueId || item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    patientName: displayText(item.patientName || ''),
    doctorId: item.doctorId,
    doctorName: getDoctorNameFallback(item.doctorId, item.doctorName || ''),
    dateTime: `${formatDate(item.appointmentDate)} - ${item.slotTime || '-'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi nhận',
    status: item.status,
    source: 'N1',
    raw: item,
  }
}

function mapPatient(item: Patient & Record<string, any>): Row {
  return {
    id: item.patientCode || item.patientIdCode || item.patientId || item.id,
    patientId: item.patientId || item.id,
    name: displayText(item.fullName),
    phone: item.phoneNumber || item.phone || 'Chưa cập nhật',
    gender: genderLabel(item.gender),
    history: item.medicalHistory || 'Chưa ghi nhận',
    raw: item,
  }
}

function mapInvoice(item: Invoice & Record<string, any>): Row {
  const amount = invoiceAmount(item)
  return {
    id: toNumber(item.invoiceId, item.InvoiceId, item.id, item.Id),
    patientId: getPatientDisplayFallback(item.patientId || item.PatientId),
    appointmentId: item.appointmentId || item.AppointmentId ? `#${item.appointmentId || item.AppointmentId}` : 'Không gắn lịch',
    amount: formatCurrency(amount),
    amountValue: amount,
    status: item.status || item.Status,
    raw: item,
  }
}

function mapPrescription(item: any): Row {
  return {
    id: item.prescriptionCode || item.prescriptionIdCode || item.PrescriptionCode || item.PrescriptionIdCode || item.prescriptionId || item.id || 'DT',
    patientId: item.patientCode || item.patientIdCode || item.PatientCode || item.PatientIdCode || getPatientDisplayFallback(item.patientId || item.PatientId),
    medicalRecordId: item.medicalRecordCode || item.medicalRecordIdCode || item.MedicalRecordCode || item.MedicalRecordIdCode || item.medicalRecordId || item.MedicalRecordId || 'Chưa cập nhật',
    medicine: summarizeMedicine(item),
    status: item.status || item.Status || 'Chưa cập nhật',
  }
}

function summarizeMedicine(item: any) {
  const items = item.items || item.Items || []
  if (!items.length) return item.note || item.Note || 'Chưa có chi tiết thuốc'
  const first = items[0]
  const name = first.medicineNameSnapshot || first.MedicineNameSnapshot || first.medicineName || first.MedicineName
  return items.length > 1 ? `${name} +${items.length - 1}` : name
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

function toNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value)
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue
  }
  return 0
}

function numberOrUndefined(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined
}

function emptyToNull(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

function invoiceAmount(item: Invoice & Record<string, any>) {
  return toNumber(item.amount, item.Amount, item.totalAmount, item.TotalAmount, item.examinationFee, item.ExaminationFee, item.examFee, item.ExamFee)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function meaningfulText(value: unknown) {
  const textValue = String(value || '').trim()
  const normalized = textValue.toLowerCase()
  if (!textValue) return ''
  if (normalized.includes('chưa ghi') || normalized.includes('chua ghi') || normalized.includes('chưa cập') || normalized.includes('chua cap')) return ''
  return textValue
}

function genderLabel(value?: string) {
  return value ? ({ Male: 'Nam', Female: 'Nữ', Nam: 'Nam', Nữ: 'Nữ' } as Record<string, string>)[value] || value : 'Chưa cập nhật'
}

function statusText(status?: string | number) {
  const value = String(status || '')
  const normalized = value.toLowerCase()
  if (normalized.includes('checked')) return 'Đã check-in'
  if (normalized.includes('confirmed')) return 'Đã xác nhận'
  if (normalized.includes('progress')) return 'Đang khám'
  if (normalized.includes('completed') || normalized.includes('done')) return 'Hoàn tất'
  if (normalized.includes('paid')) return 'Đã thanh toán'
  if (normalized.includes('unpaid')) return 'Chưa thanh toán'
  if (normalized.includes('cancel')) return 'Đã hủy'
  if (normalized.includes('waiting') || normalized.includes('pending')) return 'Đang chờ'
  return value || 'Chưa cập nhật'
}

function isActiveStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('waiting') || value.includes('checked') || value.includes('pending') || value.includes('confirmed') || value.includes('progress') || value.includes('unpaid')
}

function isDoneStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('done') || value.includes('completed') || value.includes('paid') || value.includes('hoàn')
}

function statusClass(status?: string | number) {
  const value = String(status || '').toLowerCase()
  if (value.includes('completed') || value.includes('done') || value.includes('confirmed') || value.includes('checked') || value.includes('paid')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('progress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('waiting') || value.includes('pending') || value.includes('unpaid')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function isResource(value: unknown): value is Resource {
  return typeof value === 'string' && value in configs
}

function nextGuideForAction(action: ActionKey) {
  if (action === 'confirm') return 'Tiếp theo bấm Check-in N2 để tạo lượt khám.'
  if (action === 'checkin') return 'Tiếp theo sang Hàng chờ khám để cập nhật chỉ số sức khỏe.'
  if (action === 'pay') return 'Tiếp theo bệnh nhân có thể kiểm tra Viện phí.'
  if (action === 'cancelAppointment') return 'Lịch hẹn đã hủy; kiểm tra lại danh sách Lịch hẹn.'
  return 'Tiếp tục theo dõi ở màn hiện tại.'
}

function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
}
</script>

<style scoped>
.form-textarea {
  @apply w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}
</style>
