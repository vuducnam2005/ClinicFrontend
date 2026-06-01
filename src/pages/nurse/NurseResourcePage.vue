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
              <span class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">{{ config.endpoint }}</span>
              <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">API Gateway</span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="resource === 'patients'" @click="openPatientModal">
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

    <div v-if="patientModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">N2 Medical Record</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Thêm bệnh nhân</h2>
            <p class="mt-2 text-sm text-slate-500">Tạo hồ sơ bệnh nhân để liên kết lịch hẹn và bệnh án.</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Đóng" @click="patientModalOpen = false">
            <X class="h-5 w-5" />
          </button>
        </div>
        <form class="mt-5 space-y-4" @submit.prevent="submitPatient">
          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="patientForm.fullName" label="Họ tên" required />
            <BaseInput v-model="patientForm.phone" label="Số điện thoại" required />
            <BaseInput v-model="patientForm.dateOfBirth" label="Ngày sinh" type="date" />
            <BaseSelect v-model="patientForm.gender" label="Giới tính" :options="genderOptions" placeholder="Chọn giới tính" />
          </div>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Tiền sử bệnh / dị ứng</span>
            <textarea v-model="patientForm.medicalHistory" rows="3" class="form-textarea"></textarea>
          </label>
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton type="button" variant="outline" @click="patientModalOpen = false">Đóng</BaseButton>
            <BaseButton type="submit" :loading="savingPatient">Lưu bệnh nhân</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarCheck, CreditCard, Pill, RefreshCw, Search, SearchX, UserPlus, Users, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { medicineApi } from '@/services/medicineApi'
import { localClinicalStore } from '@/services/localClinicalStore'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Invoice, Prescription } from '@/types/billing'
import type { Patient } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

type Resource = 'appointments' | 'patients' | 'queue' | 'bills' | 'prescriptions'
type ActionKey = 'confirm' | 'checkin' | 'cancelAppointment' | 'invoice' | 'pay' | 'start' | 'done' | 'cancelQueue' | 'dispense'
type Row = Record<string, any>

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
const loading = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const actingId = ref<string | number | null>(null)
const rows = ref<Row[]>([])
const resource = computed<Resource>(() => isResource(route.meta.nurseResource) ? route.meta.nurseResource : 'appointments')
const config = computed(() => configs[resource.value])
const today = new Date().toISOString().slice(0, 10)
const hasActions = computed(() => ['appointments', 'queue', 'bills', 'prescriptions'].includes(resource.value))
const patientModalOpen = ref(false)
const checkedInIds = ref<number[]>(JSON.parse(localStorage.getItem('clinic_checked_in_appts') || '[]'))
const savingPatient = ref(false)
const patientForm = reactive({ fullName: '', phone: '', dateOfBirth: '', gender: '', medicalHistory: '' })
const genderOptions = [{ label: 'Nam', value: 'Male' }, { label: 'Nữ', value: 'Female' }]

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

const metrics = computed(() => [
  { label: 'Tổng dữ liệu', value: rows.value.length, note: 'Theo service hiện tại' },
  { label: 'Đang xử lý', value: rows.value.filter((row) => isActiveStatus(row.status)).length, note: 'Chờ, xác nhận hoặc chưa thu' },
  { label: 'Hoàn tất', value: rows.value.filter((row) => isDoneStatus(row.status)).length, note: 'Đã xử lý xong' },
])

const configs: Record<Resource, Config> = {
  appointments: cfg('Lịch hẹn', 'N1 Appointment', 'Xác nhận, tiếp nhận, tạo hóa đơn và điều phối lịch hẹn trong phòng khám.', 'GET /appointment/api/appointments', CalendarCheck, 'bg-blue-50 text-blue-700', ['patientName','doctorName','status','reason'], 'Tìm bệnh nhân, bác sĩ, lý do...', 'N1 chưa có lịch hẹn để xử lý.', cols(['id','Mã'], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['dateTime','Ngày giờ'], ['reason','Lý do'], ['status','Trạng thái', false, true])),
  patients: cfg('Tiếp nhận bệnh nhân', 'N2 Medical Record', 'Tra cứu và tạo hồ sơ bệnh nhân khi tiếp nhận.', 'GET/POST /medical/api/v1/medical/patients', Users, 'bg-cyan-50 text-cyan-700', ['id','name','phone','gender','history'], 'Tìm mã bệnh nhân, họ tên, số điện thoại...', 'N2 chưa có hồ sơ bệnh nhân.', cols(['id','Mã BN'], ['name','Bệnh nhân', false, false, true], ['phone','Số điện thoại'], ['gender','Giới tính'], ['history','Tiền sử bệnh'])),
  queue: cfg('Hàng đợi khám', 'N1 Waiting Queue', 'Theo dõi số thứ tự và trạng thái chờ khám trong ngày.', 'GET /appointment/api/waiting-queue?date=today', Users, 'bg-indigo-50 text-indigo-700', ['patientName','doctorName','status','reason'], 'Tìm bệnh nhân, bác sĩ, trạng thái...', 'Chưa có bệnh nhân trong hàng đợi hôm nay.', cols(['queueNumber','STT', true], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['slotTime','Giờ'], ['reason','Lý do'], ['status','Trạng thái', false, true])),
  bills: cfg('Thu viện phí', 'N3 Billing', 'Theo dõi hóa đơn, số tiền và trạng thái thanh toán.', 'GET /pharmacy/api/invoices', CreditCard, 'bg-emerald-50 text-emerald-700', ['id','patientId','amount','status'], 'Tìm mã hóa đơn, bệnh nhân, trạng thái...', 'N3 chưa có hóa đơn để hiển thị.', cols(['id','Mã HĐ'], ['patientId','Bệnh nhân'], ['appointmentId','Lịch hẹn'], ['amount','Số tiền', true], ['status','Trạng thái', false, true])),
  prescriptions: cfg('Phát thuốc', 'N3 Prescription', 'Theo dõi đơn thuốc đã gửi sang nhà thuốc và trạng thái phát thuốc.', 'GET /pharmacy/api/prescriptions', Pill, 'bg-violet-50 text-violet-700', ['id','patientId','medicalRecordId','medicine','status'], 'Tìm đơn thuốc, bệnh nhân, mã bệnh án...', 'N3 chưa có đơn thuốc để phát.', cols(['id','Mã đơn'], ['patientId','Bệnh nhân', false, false, true], ['medicalRecordId','Bệnh án'], ['medicine','Thuốc'], ['createdAt','Ngày tạo'], ['status','Trạng thái', false, true])),
}

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    if (resource.value === 'appointments') rows.value = await loadRows(() => appointmentApi.getAppointments(), mapAppointment)
    if (resource.value === 'patients') rows.value = await loadRows(() => medicalRecordApi.getPatients(), mapPatient)
    if (resource.value === 'queue') {
      try {
        const [queueData, appointments] = await Promise.all([
          appointmentApi.getWaitingQueue(today),
          appointmentApi.getAppointments().catch(() => [])
        ])
        note.value = queueData.length ? 'Đã đồng bộ dữ liệu từ API Gateway.' : ''
        rows.value = queueData.map((item) => {
          const appt = appointments.find((a) => a.appointmentId === item.appointmentId)
          return {
            id: item.id || item.queueId || item.appointmentId,
            appointmentId: item.appointmentId,
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
    if (resource.value === 'bills') {
      const remoteRows = await loadRows(() => billingApi.getInvoices(), mapInvoice)
      rows.value = uniqueRows([...remoteRows, ...localClinicalStore.getInvoices().map(mapInvoice)])
    }
    if (resource.value === 'prescriptions') {
      const remoteRows = await loadRows(() => billingApi.getPrescriptions(), mapPrescription)
      rows.value = uniqueRows([...remoteRows, ...localClinicalStore.getPrescriptions().map(mapPrescription)])
    }
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

function mapAppointment(item: Appointment): Row {
  let status = item.status
  if (checkedInIds.value.includes(item.appointmentId) && status === 'Confirmed') {
    status = 'InProgress'
  }
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
    dateTime: `${formatDate(item.appointmentDate)} · ${item.slotTime || '-'}`,
    reason: item.reason || 'Chưa ghi nhận',
    status: status,
    raw: item,
  }
}

function mapPatient(item: Patient & Record<string, any>): Row {
  return {
    id: item.patientCode || item.id || item.patientId,
    name: displayText(item.fullName),
    phone: item.phone || item.phoneNumber || 'Chưa cập nhật',
    gender: genderLabel(item.gender),
    history: item.medicalHistory || 'Chưa ghi nhận',
  }
}

function mapQueue(item: WaitingQueueItem): Row {
  return {
    id: item.id || item.queueId || item.appointmentId,
    appointmentId: item.appointmentId,
    queueNumber: item.queueNumber,
    patientName: displayText(item.patientName),
    doctorName: displayText(item.doctorName),
    slotTime: item.slotTime || '-',
    reason: item.reason || item.specialtyName || 'Chưa ghi nhận',
    status: item.status,
  }
}

function mapInvoice(item: Invoice & Record<string, any>): Row {
  const amount = invoiceAmount(item)
  return {
    id: toNumber(item.invoiceId, item.InvoiceId, item.id, item.Id),
    patientId: item.patientId || item.PatientId || 'Chưa cập nhật',
    appointmentId: item.appointmentId || item.AppointmentId ? `#${item.appointmentId || item.AppointmentId}` : 'Không gán lịch',
    amount: formatCurrency(amount),
    amountValue: amount,
    status: item.status || item.Status,
    raw: item,
  }
}

function mapPrescription(item: Prescription): Row {
  return {
    id: item.prescriptionCode || item.prescriptionId || item.id || 'RX',
    prescriptionId: item.prescriptionId || item.id,
    patientId: item.patientId || 'Chưa cập nhật',
    medicalRecordId: item.medicalRecordCode || item.medicalRecordId || 'Chưa cập nhật',
    medicine: summarizeMedicine(item),
    createdAt: formatDate(item.createdAt || item.sentToPharmacyAt),
    status: item.status || 'Chờ phát thuốc',
  }
}

function rowActions(row: Row) {
  const status = String(row.status || '').toLowerCase()
  const actions: Array<{ key: ActionKey; label: string; className: string }> = []
  if (resource.value === 'appointments') {
    if (status.includes('pending') || status.includes('waiting')) actions.push({ key: 'confirm', label: 'Xác nhận', className: 'bg-blue-700 text-white hover:bg-blue-800' })
    if (status.includes('confirmed')) actions.push({ key: 'checkin', label: 'Tạo lượt khám', className: 'bg-blue-700 text-white hover:bg-blue-800' })
    if (!isDoneStatus(row.status) && !status.includes('cancel')) actions.push({ key: 'invoice', label: 'Tạo hóa đơn', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
    if (!isDoneStatus(row.status) && !status.includes('cancel')) actions.push({ key: 'cancelAppointment', label: 'Hủy', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  if (resource.value === 'queue') {
    if (status.includes('waiting') || status.includes('pending') || status.includes('confirmed')) actions.push({ key: 'start', label: 'Đang khám', className: 'bg-blue-700 text-white hover:bg-blue-800' })
    if (status.includes('inprogress')) actions.push({ key: 'done', label: 'Hoàn tất', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
    if (!isDoneStatus(row.status) && !status.includes('cancel')) actions.push({ key: 'cancelQueue', label: 'Hủy', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  if (resource.value === 'bills' && !status.includes('paid')) actions.push({ key: 'pay', label: 'Thu tiền', className: 'bg-emerald-600 text-white hover:bg-emerald-700' })
  if (resource.value === 'prescriptions' && !isDoneStatus(row.status)) actions.push({ key: 'dispense', label: 'Đã phát thuốc', className: 'bg-violet-600 text-white hover:bg-violet-700' })
  return actions
}

async function runAction(action: string, row: Row) {
  const id = Number(row.id || row.appointmentId)
  actingId.value = row.id || null
  error.value = ''
  try {
    if (action === 'confirm') {
      const appointment = await appointmentApi.confirmAppointment(Number(row.appointmentId || row.id))
      await syncMedicalVisit({ ...row, ...appointment })
      const apptId = Number(row.appointmentId || row.id)
      if (!checkedInIds.value.includes(apptId)) {
        checkedInIds.value.push(apptId)
        localStorage.setItem('clinic_checked_in_appts', JSON.stringify(checkedInIds.value))
      }
    }
    if (action === 'checkin') {
      await syncMedicalVisit(row)
      const apptId = Number(row.appointmentId || row.id)
      if (!checkedInIds.value.includes(apptId)) {
        checkedInIds.value.push(apptId)
        localStorage.setItem('clinic_checked_in_appts', JSON.stringify(checkedInIds.value))
      }
    }
    if (action === 'cancelAppointment') await appointmentApi.cancelAppointment(Number(row.appointmentId || row.id))
    if (action === 'invoice') {
      try {
        await billingApi.createInvoiceFromAppointment(await invoicePayload(row))
      } catch (invoiceError) {
        localClinicalStore.saveInvoiceFromAppointment({ ...row.raw, ...row })
        note.value = `N3 chua tao duoc hoa don that (${getApiErrorMessage(invoiceError)}). Da ghi tam hoa don de benh nhan va admin xem ngay.`
      }
    }
    if (action === 'start') await appointmentApi.setQueueInProgress(id)
    if (action === 'done') await appointmentApi.setQueueDone(id)
    if (action === 'cancelQueue') await appointmentApi.cancelQueueItem(id)
    if (action === 'pay') await billingApi.payInvoice(Number(row.id), toNumber(row.amountValue))
    if (action === 'dispense') await dispenseMedicine(row)
    if (!note.value) note.value = 'Đã cập nhật trạng thái thành công.'
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    actingId.value = null
  }
}

async function syncMedicalVisit(row: Row | Record<string, any>) {
  const confirmed = await medicalRecordApi.syncAppointmentConfirmed(row).then(() => true).catch(() => false)
  try {
    await medicalRecordApi.syncPatientCheckedIn(row)
    note.value = confirmed
      ? 'Đã xác nhận lịch hẹn và tạo lượt khám ở N2.'
      : 'Lịch hẹn đã tồn tại ở N2, đã gửi lại sự kiện tạo lượt khám.'
  } catch (apiError: any) {
    const message = String(apiError?.response?.data?.message || apiError?.message || '').toLowerCase()
    if (apiError?.response?.status === 409 || message.includes('lượt khám') || message.includes('sẵn sàng')) {
      note.value = 'Lịch hẹn đã được xử lý tiếp nhận ở N2.'
    } else {
      throw apiError
    }
  }
}

async function dispenseMedicine(row: Row) {
  const medicineId = Number(row.medicineId)
  if (medicineId > 0) {
    await medicineApi.updateStock(medicineId, Math.max(0, Number(row.stockQty || 1) - 1))
    return
  }
  note.value = 'Đơn thuốc đã được đánh dấu trên giao diện. Backend N3 chưa cung cấp endpoint cập nhật trạng thái phát thuốc.'
}

function openPatientModal() {
  patientModalOpen.value = true
}

async function submitPatient() {
  savingPatient.value = true
  error.value = ''
  try {
    await medicalRecordApi.createPatient({
      fullName: patientForm.fullName.trim(),
      phone: patientForm.phone.trim(),
      phoneNumber: patientForm.phone.trim(),
      dateOfBirth: patientForm.dateOfBirth || undefined,
      gender: patientForm.gender || undefined,
      medicalHistory: patientForm.medicalHistory.trim() || undefined,
    })
    note.value = 'Đã tạo hồ sơ bệnh nhân ở N2.'
    patientModalOpen.value = false
    patientForm.fullName = ''
    patientForm.phone = ''
    patientForm.dateOfBirth = ''
    patientForm.gender = ''
    patientForm.medicalHistory = ''
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    savingPatient.value = false
  }
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

function toNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value)
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue
  }
  return 0
}

async function invoicePayload(row: Row) {
  const doctorId = toNumber(row.doctorId, row.raw?.doctorId, row.raw?.DoctorId)
  let examFee = toNumber(row.examFee, row.raw?.examFee, row.raw?.ExamFee, row.raw?.doctor?.examFee, row.raw?.Doctor?.ExamFee)
  if (!examFee && doctorId) examFee = toNumber((await appointmentApi.getDoctor(doctorId).catch(() => null))?.examFee)
  return {
    ...row.raw,
    appointmentId: Number(row.appointmentId || row.id),
    patientId: toNumber(row.patientId, row.raw?.patientId, row.raw?.PatientId),
    doctorId,
    examFee,
  }
}

function invoiceAmount(item: Invoice & Record<string, any>) {
  return toNumber(item.amount, item.Amount, item.totalAmount, item.TotalAmount, item.examinationFee, item.ExaminationFee, item.examFee, item.ExamFee)
}

function summarizeMedicine(item: Prescription) {
  if (!item.items?.length) return item.note || 'Chưa có chi tiết thuốc'
  const first = item.items[0]
  const name = first.medicineNameSnapshot || first.medicineName || `Thuốc #${first.medicineId || ''}`
  return item.items.length > 1 ? `${name} +${item.items.length - 1}` : name
}

function uniqueRows(items: Row[]) {
  const seen = new Set<string>()
  return items.filter((item, index) => {
    const key = String(item.id || item.appointmentId || index)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function genderLabel(value?: string) {
  return value ? ({ Male: 'Nam', Female: 'Nữ', Nam: 'Nam', Nữ: 'Nữ' } as Record<string, string>)[value] || value : 'Chưa cập nhật'
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

function isActiveStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('waiting') || value.includes('pending') || value.includes('confirmed') || value.includes('inprogress') || value.includes('unpaid') || value.includes('chờ')
}

function isDoneStatus(status?: string | number) {
  const value = String(status || '').toLowerCase()
  return value.includes('done') || value.includes('completed') || value.includes('paid') || value.includes('hoàn tất')
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value.includes('confirmed') || value.includes('completed') || value.includes('done') || value.includes('paid')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('inprogress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('pending') || value.includes('waiting') || value.includes('unpaid') || value.includes('chờ')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel') || value.includes('thiếu')) return 'bg-rose-100 text-rose-700'
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
</style>
