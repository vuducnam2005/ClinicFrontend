<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', config.iconClass]">
            <component :is="config.icon" class="h-6 w-6" />
          </span>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-[#0F52BA]">{{ config.service }}</p>
            <h1 class="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">{{ config.title }}</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
          </div>
        </div>
        <button
          v-if="resource !== 'profile'"
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#003c90] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="loadData"
        >
          <RefreshCw :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
          Tải lại
        </button>
      </div>
    </div>

    <div v-if="resource !== 'profile'" class="grid gap-4 sm:grid-cols-3">
      <div v-for="metric in metrics" :key="metric.label" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-bold text-slate-950">{{ metric.value }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ metric.note }}</p>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#003c90]">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <ProfilePanel v-if="resource === 'profile'" :patient-id="patientId" />

    <div v-else-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="item in 3" :key="item" />
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="query"
            class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            :placeholder="config.placeholder"
          />
        </label>
        <span class="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-[#003c90]">{{ filteredRows.length }} dòng</span>
      </div>

      <div v-if="filteredRows.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th v-for="column in config.columns" :key="column.key" :class="['px-5 py-3', column.right ? 'text-right' : 'text-left']">
                {{ column.label }}
              </th>
              <th v-if="resource === 'bills'" class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(row, index) in filteredRows" :key="String(row.id || index)" class="transition hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" :class="['px-5 py-4 align-top', column.right ? 'text-right' : 'text-left']">
                <span v-if="column.badge" :class="['rounded-full px-2.5 py-1 text-xs font-bold', statusClass(value(row, column.key))]">
                  {{ value(row, column.key) }}
                </span>
                <span v-else :class="column.strong ? 'font-bold text-slate-950' : 'text-slate-700'">
                  {{ value(row, column.key) }}
                </span>
              </td>
              <td v-if="resource === 'bills'" class="px-5 py-4 text-right">
                <button
                  v-if="String(row.status).toLowerCase() !== 'paid' && !String(row.status).toLowerCase().includes('đã thanh toán')"
                  type="button"
                  class="rounded-lg bg-[#0F52BA] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#003c90] disabled:opacity-60"
                  :disabled="actingId === row.id"
                  @click="pay(row)"
                >
                  Thanh toán
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-400" />
        <h2 class="mt-4 text-lg font-bold text-slate-950">Chưa có dữ liệu</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Database chưa có dữ liệu phù hợp với tài khoản bệnh nhân này. Khi bạn đặt lịch, khám bệnh hoặc phát sinh hóa đơn, dữ liệu sẽ hiển thị tại đây.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  CalendarClock,
  CreditCard,
  FileHeart,
  Pill,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { getApiErrorMessage } from '@/services/apiClient'
import type { Appointment } from '@/types/appointment'
import type { Invoice, Prescription } from '@/types/billing'
import type { MedicalRecord } from '@/types/medicalRecord'

type Resource = 'appointments' | 'records' | 'prescriptions' | 'bills' | 'profile'
type Row = Record<string, any>
interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config {
  title: string
  service: string
  description: string
  placeholder: string
  icon: Component
  iconClass: string
  search: string[]
  columns: Column[]
}

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const rows = ref<Row[]>([])
const actingId = ref<string | number | null>(null)

const resource = computed<Resource>(() => isResource(route.meta.patientResource) ? route.meta.patientResource : 'appointments')
const config = computed(() => configs[resource.value])
const patientId = computed(() => Number(authStore.user?.patientId || authStore.user?.id || 0))

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

const metrics = computed(() => {
  const statusText = rows.value.map((row) => String(row.status || '').toLowerCase())
  const pending = statusText.filter((status) => status.includes('pending') || status.includes('waiting') || status.includes('chờ') || status.includes('unpaid')).length
  const done = statusText.filter((status) => status.includes('completed') || status.includes('paid') || status.includes('hoàn') || status.includes('đã')).length
  return [
    { label: 'Tổng số', value: rows.value.length, note: config.value.service },
    { label: 'Cần theo dõi', value: pending, note: 'Đang chờ hoặc chưa thanh toán' },
    { label: 'Đã xử lý', value: done, note: 'Hoàn tất hoặc đã thanh toán' },
  ]
})

const configs: Record<Resource, Config> = {
  appointments: cfg('Lịch hẹn của tôi', 'N1 Appointment', 'Theo dõi lịch đã đặt, bác sĩ, giờ khám, số thứ tự và trạng thái xác nhận.', 'Tìm bác sĩ, lý do, trạng thái...', CalendarClock, 'bg-blue-50 text-[#0F52BA]', ['doctorName', 'status', 'reason', 'dateTime'], cols(['id', 'Mã'], ['doctorName', 'Bác sĩ', false, false, true], ['dateTime', 'Ngày giờ'], ['queueNumber', 'STT', true], ['reason', 'Lý do'], ['status', 'Trạng thái', false, true])),
  records: cfg('Hồ sơ bệnh án', 'N2 Medical Record', 'Xem chẩn đoán, triệu chứng và ghi chú bác sĩ sau mỗi lần khám.', 'Tìm chẩn đoán, triệu chứng, ghi chú...', FileHeart, 'bg-indigo-50 text-indigo-700', ['id', 'diagnosis', 'symptoms', 'doctorNotes'], cols(['id', 'Mã BA'], ['diagnosis', 'Chẩn đoán', false, false, true], ['symptoms', 'Triệu chứng'], ['doctorNotes', 'Ghi chú'], ['createdAt', 'Ngày tạo'])),
  prescriptions: cfg('Đơn thuốc', 'N3 Pharmacy', 'Theo dõi đơn thuốc đã gửi nhà thuốc, thuốc được kê và trạng thái phát thuốc.', 'Tìm mã đơn, thuốc, trạng thái...', Pill, 'bg-cyan-50 text-cyan-700', ['id', 'medicine', 'status', 'note'], cols(['id', 'Mã đơn'], ['medicine', 'Thuốc', false, false, true], ['quantity', 'Số lượng', true], ['note', 'Ghi chú'], ['status', 'Trạng thái', false, true])),
  bills: cfg('Viện phí của tôi', 'N3 Billing', 'Xem hóa đơn, số tiền và thực hiện thanh toán viện phí khi cần.', 'Tìm mã hóa đơn, trạng thái...', CreditCard, 'bg-emerald-50 text-emerald-700', ['id', 'amount', 'status'], cols(['id', 'Mã HĐ'], ['appointmentId', 'Lịch hẹn'], ['amount', 'Số tiền', true, false, true], ['status', 'Trạng thái', false, true])),
  profile: cfg('Hồ sơ cá nhân', 'Auth/N2 Profile', 'Thông tin tài khoản bệnh nhân và khóa liên kết dữ liệu giữa các service.', '', UserRound, 'bg-slate-100 text-slate-700', [], []),
}

const ProfilePanel = defineComponent({
  props: { patientId: { type: Number, required: true } },
  setup(props) {
    const user = authStore.user
    const items = [
      ['Họ và tên', user?.fullName || 'Chưa cập nhật'],
      ['Tên đăng nhập', user?.username || 'Chưa cập nhật'],
      ['Email', user?.email || 'Chưa cập nhật'],
      ['Số điện thoại', user?.phoneNumber || 'Chưa cập nhật'],
      ['Patient ID', props.patientId ? `#${props.patientId}` : 'Chưa liên kết'],
      ['Vai trò', 'Bệnh nhân'],
    ]
    return () => h('div', { class: 'grid gap-6 lg:grid-cols-[1fr_0.85fr]' }, [
      h('section', { class: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm' }, [
        h('div', { class: 'flex items-center gap-4' }, [
          h('div', { class: 'flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0F52BA]' }, [h(UserRound, { class: 'h-7 w-7' })]),
          h('div', null, [
            h('p', { class: 'text-sm font-bold uppercase tracking-wide text-[#0F52BA]' }, 'Thông tin tài khoản'),
            h('h2', { class: 'mt-1 text-2xl font-bold text-slate-950' }, user?.fullName || user?.username || 'Bệnh nhân'),
          ]),
        ]),
        h('dl', { class: 'mt-6 grid gap-4 sm:grid-cols-2' }, items.map(([label, valueText]) => (
          h('div', { class: 'rounded-xl border border-slate-100 bg-slate-50 p-4' }, [
            h('dt', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, label),
            h('dd', { class: 'mt-2 break-words font-semibold text-slate-900' }, valueText),
          ])
        ))),
      ]),
      h('section', { class: 'rounded-2xl border border-blue-100 bg-blue-50 p-6 text-[#003c90]' }, [
        h('div', { class: 'flex items-center gap-3' }, [
          h('span', { class: 'flex h-10 w-10 items-center justify-center rounded-xl bg-white' }, [h(ShieldCheck, { class: 'h-5 w-5' })]),
          h('h3', { class: 'font-bold' }, 'Liên kết dữ liệu'),
        ]),
        h('div', { class: 'mt-5 space-y-3 text-sm leading-6' }, [
          h('p', null, 'N1 dùng Patient ID để đọc lịch hẹn và hàng đợi khám.'),
          h('p', null, 'N2 dùng Patient ID để đọc lịch sử khám và hồ sơ bệnh án.'),
          h('p', null, 'N3 dùng User/Patient ID để đọc đơn thuốc, hóa đơn và thanh toán.'),
        ]),
      ]),
    ])
  },
})

watch(resource, () => {
  query.value = ''
  void loadData()
}, { immediate: true })

async function loadData() {
  if (resource.value === 'profile') return
  loading.value = true
  error.value = ''
  note.value = ''
  
  const userId = Number(authStore.user?.id || 0)
  let resolvedN2Id = userId

  try {
    // 1. Resolve N2 patient ID
    try {
      const appts = await appointmentApi.getAppointmentsByPatient(userId).catch(() => [])
      const phone = appts.find(a => a.patientPhone)?.patientPhone
      const patients = await medicalRecordApi.getPatients()
      const match = patients.find(p => (phone && (p.phoneNumber === phone || p.phone === phone)) || p.fullName === authStore.user?.fullName)
      if (match) {
        resolvedN2Id = Number(match.id || match.patientId)
        if (authStore.user) {
          authStore.user.patientId = resolvedN2Id
        }
      }
    } catch (e) {
      console.error('Failed to resolve N2 Patient ID in PatientResourcePage', e)
    }

    // 2. Fetch and merge data depending on resource type
    if (resource.value === 'appointments') {
      const rows1 = await loadRows(() => appointmentApi.getAppointmentsByPatient(userId), mapAppointment, '')
      const rows2 = resolvedN2Id !== userId ? await loadRows(() => appointmentApi.getAppointmentsByPatient(resolvedN2Id), mapAppointment, '') : []
      const combined = [...rows1, ...rows2]
      const seen = new Set()
      rows.value = combined.filter(a => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })
      note.value = rows.value.length ? 'Đã tải lịch hẹn từ N1.' : 'Database chưa có dữ liệu cho bệnh nhân này.'
    }
    
    if (resource.value === 'records') {
      const rows1 = await loadRows(() => medicalRecordApi.getMedicalRecords(String(userId)), mapRecord, '')
      const rows2 = resolvedN2Id !== userId ? await loadRows(() => medicalRecordApi.getMedicalRecords(String(resolvedN2Id)), mapRecord, '') : []
      const combined = [...rows1, ...rows2]
      const seen = new Set()
      rows.value = combined.filter(r => {
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
      note.value = rows.value.length ? 'Đã tải hồ sơ bệnh án từ N2.' : 'Database chưa có dữ liệu cho bệnh nhân này.'
    }

    if (resource.value === 'prescriptions') {
      const rows1 = await loadRows(() => billingApi.getPrescriptions(userId), mapPrescription, '')
      const rows2 = resolvedN2Id !== userId ? await loadRows(() => billingApi.getPrescriptions(resolvedN2Id), mapPrescription, '') : []
      const combined = [...rows1, ...rows2]
      const seen = new Set()
      rows.value = combined.filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      note.value = rows.value.length ? 'Đã tải đơn thuốc từ N3.' : 'Database chưa có dữ liệu cho bệnh nhân này.'
    }

    if (resource.value === 'bills') {
      const rows1 = await loadRows(() => billingApi.getInvoices(userId), mapInvoice, '')
      const rows2 = resolvedN2Id !== userId ? await loadRows(() => billingApi.getInvoices(resolvedN2Id), mapInvoice, '') : []
      const combined = [...rows1, ...rows2]
      const seen = new Set()
      rows.value = combined.filter(b => {
        if (seen.has(b.id)) return false
        seen.add(b.id)
        return true
      })
      note.value = rows.value.length ? 'Đã tải viện phí từ N3.' : 'Database chưa có dữ liệu cho bệnh nhân này.'
    }

  } finally {
    loading.value = false
  }
}

async function loadRows<T>(loader: () => Promise<T[]>, mapper: (item: T) => Row, successNote: string) {
  try {
    const data = await loader()
    note.value = data.length ? successNote : 'Database chưa có dữ liệu cho bệnh nhân này.'
    return data.map(mapper)
  } catch (apiError) {
    if ((apiError as any)?.response?.status === 404 || (apiError as any)?.response?.status === 403) {
      note.value = 'Database chưa có dữ liệu hoặc tài khoản chưa được liên kết Patient ID.'
      return []
    }
    error.value = getApiErrorMessage(apiError)
    note.value = 'Endpoint chưa phản hồi ổn định.'
    return []
  }
}

function mapAppointment(item: Appointment): Row {
  return {
    id: item.appointmentId,
    doctorName: item.doctorName,
    dateTime: `${formatDate(item.appointmentDate)} - ${item.slotTime || 'Chưa cập nhật'}`,
    queueNumber: item.queueNumber || '-',
    reason: item.reason || 'Khám bệnh',
    status: statusLabel(item.status),
  }
}

function mapRecord(item: MedicalRecord): Row {
  return {
    id: item.recordId || item.medicalRecordId || 'MR',
    diagnosis: item.diagnosis || 'Chưa có chẩn đoán',
    symptoms: item.symptoms || 'Chưa ghi nhận',
    doctorNotes: item.doctorNotes || 'Chưa ghi chú',
    createdAt: formatDate(item.examDate || item.createdAt),
  }
}

function mapPrescription(item: Prescription): Row {
  const medicines = (item.items || [])
    .map((line) => line.medicineNameSnapshot || line.medicineName)
    .filter(Boolean)
    .join(', ')
  const quantity = (item.items || []).reduce((total, line) => total + Number(line.quantity || 0), 0)
  return {
    id: item.prescriptionCode || item.prescriptionId || item.id || 'DT',
    medicine: medicines || 'Chưa có thuốc',
    quantity: quantity || '-',
    note: item.note || 'Không có ghi chú',
    status: item.status || 'Chưa cập nhật',
  }
}

function mapInvoice(item: Invoice & Record<string, any>): Row {
  const amount = invoiceAmount(item)
  return {
    id: toNumber(item.invoiceId, item.InvoiceId, item.id, item.Id),
    appointmentId: item.appointmentId || item.AppointmentId ? `#${item.appointmentId || item.AppointmentId}` : '-',
    amount: formatCurrency(amount),
    amountValue: amount,
    status: statusLabel(item.status || item.Status),
    raw: item,
  }
}

async function pay(row: Row) {
  const id = Number(row.id)
  if (!id) return
  actingId.value = row.id || null
  error.value = ''
  try {
    await billingApi.payInvoice(id, toNumber(row.amountValue))
    note.value = 'Đã cập nhật thanh toán hóa đơn.'
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    actingId.value = null
  }
}

function cfg(title: string, service: string, description: string, placeholder: string, icon: Component, iconClass: string, search: string[], columns: Column[]): Config {
  return { title, service, description, placeholder, icon, iconClass, search, columns }
}
function cols(...defs: [string, string, boolean?, boolean?, boolean?][]): Column[] {
  return defs.map(([key, label, right, badge, strong]) => ({ key, label, right, badge, strong }))
}
function value(row: Row, key: string) {
  return row[key] === undefined || row[key] === '' ? 'Chưa cập nhật' : String(row[key])
}
function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function toNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value)
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue
  }
  return 0
}

function invoiceAmount(item: Invoice & Record<string, any>) {
  return toNumber(item.amount, item.Amount, item.totalAmount, item.TotalAmount, item.examinationFee, item.ExaminationFee, item.examFee, item.ExamFee)
}
function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}
function statusClass(status?: string) {
  const valueText = String(status || '').toLowerCase()
  if (valueText.includes('paid') || valueText.includes('confirmed') || valueText.includes('completed') || valueText.includes('đã') || valueText.includes('hoàn')) return 'bg-teal-100 text-teal-700'
  if (valueText.includes('pending') || valueText.includes('unpaid') || valueText.includes('waiting') || valueText.includes('chờ') || valueText.includes('chưa')) return 'bg-amber-100 text-amber-700'
  if (valueText.includes('cancel') || valueText.includes('hủy')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
function statusLabel(status?: string) {
  const valueText = String(status || '').toLowerCase()
  if (valueText.includes('confirmed')) return 'Đã xác nhận'
  if (valueText.includes('completed') || valueText.includes('done')) return 'Hoàn tất'
  if (valueText.includes('pending') || valueText.includes('waiting')) return 'Đang chờ'
  if (valueText.includes('unpaid')) return 'Chưa thanh toán'
  if (valueText.includes('paid')) return 'Đã thanh toán'
  if (valueText.includes('cancel')) return 'Đã hủy'
  return status || 'Chưa cập nhật'
}
function isResource(valueToCheck: unknown): valueToCheck is Resource {
  return typeof valueToCheck === 'string' && valueToCheck in configs
}
</script>
