<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', config.iconClass]">
            <component :is="config.icon" class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ config.service }}</p>
            <h1 class="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{{ config.title }}</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
            <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-500">{{ config.endpoint }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="resource === 'patients'" @click="openPatientModal">
            <template #icon><UserPlus class="h-4 w-4" /></template>
            Th?m b?nh nh?n
          </BaseButton>
          <BaseButton variant="outline" :disabled="loading" @click="loadData">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            T?i l?i
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <LoadingSkeleton v-for="item in 4" :key="item" />
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div class="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input v-model="query" class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100" placeholder="T?m ki?m" />
        </label>
        <span class="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">{{ filteredRows.length }} d?ng</span>
      </div>

      <div v-if="filteredRows.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th v-for="column in config.columns" :key="column.key" :class="['px-5 py-3', column.right ? 'text-right' : 'text-left']">{{ column.label }}</th>
              <th v-if="hasActions" class="px-5 py-3 text-right">Thao t?c</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(row, index) in filteredRows" :key="String(row.id || index)" class="hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" :class="['px-5 py-4 align-top', column.right ? 'text-right' : 'text-left']">
                <span v-if="column.badge" :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(value(row, column.key))]">{{ value(row, column.key) }}</span>
                <span v-else :class="column.strong ? 'font-semibold text-slate-950' : 'text-slate-700'">{{ value(row, column.key) }}</span>
              </td>
              <td v-if="hasActions" class="px-5 py-4 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    v-for="action in rowActions(row)"
                    :key="action.key"
                    type="button"
                    :disabled="actingId === row.id"
                    :class="['rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60', action.className]"
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
        <SearchX class="mx-auto h-10 w-10 text-slate-400" />
        <h2 class="mt-4 text-lg font-semibold text-slate-950">Ch?a c? d? li?u</h2>
        <p class="mt-2 text-sm text-slate-500">Service c? th? ch?a c? d? li?u ho?c endpoint ch?a s?n s?ng.</p>
      </div>
    </div>

    <div v-if="patientModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">N2 Medical Record</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Th?m b?nh nh?n</h2>
            <p class="mt-2 text-sm text-slate-500">T?o h? s? b?nh nh?n ?? li?n k?t l?ch h?n v? b?nh ?n.</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="patientModalOpen = false">?</button>
        </div>
        <form class="mt-5 space-y-4" @submit.prevent="submitPatient">
          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="patientForm.fullName" label="H? t?n" required />
            <BaseInput v-model="patientForm.phone" label="S? ?i?n tho?i" required />
            <BaseInput v-model="patientForm.dateOfBirth" label="Ng?y sinh" type="date" />
            <BaseSelect v-model="patientForm.gender" label="Gi?i t?nh" :options="genderOptions" placeholder="Ch?n gi?i t?nh" />
          </div>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Ti?n s? b?nh / d? ?ng</span>
            <textarea v-model="patientForm.medicalHistory" rows="3" class="form-textarea"></textarea>
          </label>
          <div class="flex justify-end gap-3">
            <BaseButton type="button" variant="outline" @click="patientModalOpen = false">??ng</BaseButton>
            <BaseButton type="submit" :loading="savingPatient">L?u b?nh nh?n</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarCheck, CreditCard, Pill, RefreshCw, Search, SearchX, UserPlus, Users } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { medicineApi } from '@/services/medicineApi'
import { fallbackAppointments, fallbackQueue } from '@/services/fallbackData'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { Patient, MedicalRecord } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import { displayText } from '@/utils/displayText'

type Resource = 'appointments' | 'patients' | 'queue' | 'bills' | 'prescriptions'
type ActionKey = 'confirm' | 'cancelAppointment' | 'invoice' | 'pay' | 'start' | 'done' | 'cancelQueue' | 'dispense'
type Row = Record<string, string | number | undefined>
interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config { title: string; service: string; description: string; endpoint: string; icon: Component; iconClass: string; search: string[]; columns: Column[] }

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
const savingPatient = ref(false)
const patientForm = reactive({ fullName: '', phone: '', dateOfBirth: '', gender: '', medicalHistory: '' })
const genderOptions = [{ label: 'Nam', value: 'Male' }, { label: 'N?', value: 'Female' }]

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

const fallbackPatients: Patient[] = [
  { patientId: 'BN001', fullName: 'Nguy?n Minh An', phone: '0901001001', gender: 'Male', medicalHistory: 'T?ng huy?t ?p' },
  { patientId: 'BN002', fullName: 'Tr?n Thu H?', phone: '0902002002', gender: 'Female', medicalHistory: 'D? ?ng h?i s?n' },
]
const fallbackInvoices: Invoice[] = [
  { invoiceId: 1001, appointmentId: 2201, patientId: 12, amount: 300000, status: 'Paid', createdAt: new Date().toISOString() },
  { invoiceId: 1002, appointmentId: 2202, patientId: 4, amount: 350000, status: 'Unpaid', createdAt: new Date().toISOString() },
]
const fallbackRecords: MedicalRecord[] = [
  { recordId: 'MR001', patientId: 'BN001', diagnosis: 'Theo d?i tim m?ch', doctorNotes: 'Paracetamol n?u ?au', createdAt: new Date().toISOString() },
  { recordId: 'MR002', patientId: 'BN002', diagnosis: 'Vi?m h? h?p tr?n', doctorNotes: 'K? ??n kh?ng vi?m nh?', createdAt: new Date().toISOString() },
]
const fallbackMedicines: Medicine[] = [
  { medicineId: 1, medicineName: 'Paracetamol 500mg', dosageForm: 'Vi?n n?n', unitPrice: 1500, stockQuantity: 200, isActive: true },
  { medicineId: 2, medicineName: 'Amoxicillin 500mg', dosageForm: 'Vi?n nang', unitPrice: 3500, stockQuantity: 18, isActive: true },
]

const configs: Record<Resource, Config> = {
  appointments: cfg('L?ch h?n', 'N1 Appointment', 'X?c nh?n, ti?p nh?n, t?o h?a ??n v? ?i?u ph?i l?ch h?n trong ph?ng kh?m.', 'GET /api/appointments', CalendarCheck, 'bg-teal-50 text-teal-700', ['patientName','doctorName','status','reason'], cols(['id','M?'], ['patientName','B?nh nh?n', false, false, true], ['doctorName','B?c s?'], ['dateTime','Ng?y gi?'], ['reason','L? do'], ['status','Tr?ng th?i', false, true])),
  patients: cfg('Ti?p nh?n b?nh nh?n', 'N2 Medical Record', 'Tra c?u v? t?o h? s? b?nh nh?n khi ti?p nh?n.', 'GET/POST /api/patients', Users, 'bg-cyan-50 text-cyan-700', ['id','name','phone','gender','history'], cols(['id','M? BN'], ['name','B?nh nh?n', false, false, true], ['phone','S? ?i?n tho?i'], ['gender','Gi?i t?nh'], ['history','Ti?n s? b?nh'])),
  queue: cfg('H?ng ??i kh?m', 'N1 Waiting Queue', 'Theo d?i s? th? t? v? tr?ng th?i ch? kh?m trong ng?y.', 'GET /api/waiting-queue?date=today', Users, 'bg-blue-50 text-blue-700', ['patientName','doctorName','status'], cols(['queueNumber','STT', true], ['patientName','B?nh nh?n', false, false, true], ['doctorName','B?c s?'], ['slotTime','Gi?'], ['status','Tr?ng th?i', false, true])),
  bills: cfg('Thu vi?n ph?', 'N3 Billing', 'Theo d?i h?a ??n, s? ti?n v? tr?ng th?i thanh to?n.', 'GET /api/billing/invoices', CreditCard, 'bg-emerald-50 text-emerald-700', ['id','patientId','amount','status'], cols(['id','M? H?'], ['patientId','B?nh nh?n'], ['appointmentId','L?ch h?n'], ['amount','S? ti?n', true], ['status','Tr?ng th?i', false, true])),
  prescriptions: cfg('Ph?t thu?c', 'N2 + N3', 'Chu?n b? ph?t thu?c t? b?nh ?n/k? ??n v? ??i chi?u t?n kho.', 'GET /api/medical-records ? GET /api/medicines', Pill, 'bg-indigo-50 text-indigo-700', ['id','patientId','diagnosis','medicine','status'], cols(['id','M?'], ['patientId','B?nh nh?n', false, false, true], ['diagnosis','Ch?n ?o?n'], ['medicine','Thu?c g?i ?'], ['stock','T?n kho'], ['status','Tr?ng th?i', false, true])),
}

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    if (resource.value === 'appointments') rows.value = await loadRows(() => appointmentApi.getAppointments(), fallbackAppointments, mapAppointment, '?? ??c l?ch h?n t? N1.')
    if (resource.value === 'patients') rows.value = await loadRows(() => medicalRecordApi.getPatients(), fallbackPatients, mapPatient, '?? ??c b?nh nh?n t? N2.')
    if (resource.value === 'queue') rows.value = await loadRows(() => appointmentApi.getWaitingQueue(today), fallbackQueue, mapQueue, '?? ??c h?ng ??i t? N1.')
    if (resource.value === 'bills') rows.value = await loadRows(() => billingApi.getInvoices(), fallbackInvoices, mapInvoice, '?? ??c h?a ??n t? N3.')
    if (resource.value === 'prescriptions') rows.value = await loadPrescriptions()
  } finally {
    loading.value = false
  }
}

async function loadRows<T>(loader: () => Promise<T[]>, fallback: T[], mapper: (item: T) => Row, successNote: string) {
  try {
    const data = await loader()
    if (data.length) { note.value = successNote; return data.map(mapper) }
    note.value = 'API tr? d? li?u r?ng, ?ang hi?n th? fallback ?? kh?ng tr?ng trang.'
    return fallback.map(mapper)
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    note.value = 'Endpoint ch?a ph?n h?i ?n ??nh, ?ang hi?n th? fallback.'
    return fallback.map(mapper)
  }
}

async function loadPrescriptions() {
  const [records, medicines] = await Promise.all([
    medicalRecordApi.getMedicalRecords().catch(() => fallbackRecords),
    medicineApi.getMedicines().catch(() => fallbackMedicines),
  ])
  const sourceRecords = records.length ? records : fallbackRecords
  const sourceMedicines = medicines.length ? medicines : fallbackMedicines
  note.value = '?? t?ng h?p b?nh ?n N2 v? kho thu?c N3 cho m?n ph?t thu?c.'
  return sourceRecords.map((record, index) => mapPrescription(record, sourceMedicines[index % sourceMedicines.length]))
}

function mapAppointment(item: Appointment): Row { return { id: item.appointmentId, appointmentId: item.appointmentId, patientId: item.patientId, examFee: item.examFee, patientName: displayText(item.patientName), doctorName: displayText(item.doctorName), dateTime: `${formatDate(item.appointmentDate)} ? ${item.slotTime}`, reason: item.reason || 'Ch?a ghi nh?n', status: item.status } }
function mapPatient(item: Patient): Row { return { id: item.patientId, name: displayText(item.fullName), phone: item.phone || item.phoneNumber || 'Ch?a c?p nh?t', gender: genderLabel(item.gender), history: item.medicalHistory || 'Ch?a ghi nh?n' } }
function mapQueue(item: WaitingQueueItem): Row { return { id: item.id || item.queueId || item.appointmentId, appointmentId: item.appointmentId, queueNumber: item.queueNumber, patientName: displayText(item.patientName), doctorName: displayText(item.doctorName), slotTime: item.slotTime || '-', status: item.status } }
function mapInvoice(item: Invoice): Row { return { id: item.invoiceId, patientId: item.patientId, appointmentId: item.appointmentId ? `#${item.appointmentId}` : 'Kh?ng g?n l?ch', amount: formatCurrency(item.amount), status: item.status } }
function mapPrescription(record: MedicalRecord, medicine?: Medicine): Row { return { id: record.recordId || record.medicalRecordId || 'MR', medicineId: medicine?.medicineId, stockQty: medicine?.stockQuantity, patientId: record.patientId, diagnosis: record.diagnosis || 'Ch?a ch?n ?o?n', medicine: medicine?.medicineName || 'Ch?a c? thu?c', stock: medicine ? `${medicine.stockQuantity} t?n` : 'Ch?a r?', status: medicine && medicine.stockQuantity > 0 ? 'S?n s?ng ph?t' : 'Thi?u thu?c' } }

function rowActions(row: Row) {
  const status = String(row.status || '').toLowerCase()
  const actions: Array<{ key: ActionKey; label: string; className: string }> = []
  if (resource.value === 'appointments') {
    if (status.includes('pending')) actions.push({ key: 'confirm', label: 'X?c nh?n / check-in', className: 'bg-teal-600 text-white hover:bg-teal-700' })
    if (!status.includes('completed') && !status.includes('cancel')) actions.push({ key: 'invoice', label: 'T?o h?a ??n', className: 'bg-blue-600 text-white hover:bg-blue-700' })
    if (!status.includes('completed') && !status.includes('cancel')) actions.push({ key: 'cancelAppointment', label: 'H?y', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  if (resource.value === 'queue') {
    if (status.includes('waiting') || status.includes('confirmed')) actions.push({ key: 'start', label: '?ang kh?m', className: 'bg-blue-600 text-white hover:bg-blue-700' })
    if (status.includes('inprogress') || status.includes('?ang kh?m')) actions.push({ key: 'done', label: 'Ho?n t?t', className: 'bg-teal-600 text-white hover:bg-teal-700' })
    if (!status.includes('done') && !status.includes('cancel')) actions.push({ key: 'cancelQueue', label: 'H?y', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  }
  if (resource.value === 'bills' && !status.includes('paid')) actions.push({ key: 'pay', label: 'Thu ti?n', className: 'bg-teal-600 text-white hover:bg-teal-700' })
  if (resource.value === 'prescriptions' && status.includes('s?n')) actions.push({ key: 'dispense', label: '?? ph?t thu?c', className: 'bg-indigo-600 text-white hover:bg-indigo-700' })
  return actions
}

async function runAction(action: ActionKey, row: Row) {
  const id = Number(row.id || row.appointmentId)
  if (!id) return
  actingId.value = row.id || null
  error.value = ''
  try {
    if (action === 'confirm') await appointmentApi.confirmAppointment(id)
    if (action === 'cancelAppointment') await appointmentApi.cancelAppointment(id)
    if (action === 'invoice') await billingApi.createInvoiceFromAppointment({ appointmentId: Number(row.appointmentId || row.id), patientId: Number(row.patientId || 4), examFee: Number(row.examFee || 0) })
    if (action === 'start') await appointmentApi.setQueueInProgress(id)
    if (action === 'done') await appointmentApi.setQueueDone(id)
    if (action === 'cancelQueue') await appointmentApi.cancelQueueItem(id)
    if (action === 'pay') await billingApi.payInvoice(id)
    if (action === 'dispense') await dispenseMedicine(row)
    note.value = '?? c?p nh?t tr?ng th?i th?nh c?ng.'
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    actingId.value = null
  }
}

async function dispenseMedicine(row: Row) {
  const medicineId = Number(row.medicineId)
  const stockQty = Number(row.stockQty)
  if (medicineId && stockQty > 0) await medicineApi.updateStock(medicineId, stockQty - 1)
}

function openPatientModal() { patientModalOpen.value = true }
async function submitPatient() {
  savingPatient.value = true
  error.value = ''
  try {
    await medicalRecordApi.createPatient({
      fullName: patientForm.fullName.trim(),
      phone: patientForm.phone.trim(),
      dateOfBirth: patientForm.dateOfBirth || undefined,
      gender: patientForm.gender || undefined,
      medicalHistory: patientForm.medicalHistory.trim() || undefined,
    })
    note.value = '?? t?o h? s? b?nh nh?n ? N2.'
    patientModalOpen.value = false
    patientForm.fullName = ''; patientForm.phone = ''; patientForm.dateOfBirth = ''; patientForm.gender = ''; patientForm.medicalHistory = ''
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    savingPatient.value = false
  }
}

function cfg(title: string, service: string, description: string, endpoint: string, icon: Component, iconClass: string, search: string[], columns: Column[]): Config { return { title, service, description, endpoint, icon, iconClass, search, columns } }
function cols(...defs: [string, string, boolean?, boolean?, boolean?][]): Column[] { return defs.map(([key, label, right, badge, strong]) => ({ key, label, right, badge, strong })) }
function value(row: Row, key: string) { return row[key] === undefined || row[key] === '' ? 'Ch?a c?p nh?t' : String(row[key]) }
function formatCurrency(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0)) }
function formatDate(value?: string) { if (!value) return 'Ch?a c?p nh?t'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date) }
function genderLabel(value?: string) { return value ? ({ 'Male': 'Nam', 'Female': 'N?', 'Nam': 'Nam', 'N?': 'N?' } as Record<string, string>)[value] || value : 'Ch?a c?p nh?t' }
function statusClass(status?: string) { const value = String(status || '').toLowerCase(); if (value.includes('confirmed') || value.includes('completed') || value.includes('paid') || value.includes('s?n')) return 'bg-teal-100 text-teal-700'; if (value.includes('pending') || value.includes('waiting') || value.includes('unpaid') || value.includes('ch?')) return 'bg-amber-100 text-amber-700'; if (value.includes('cancel') || value.includes('thi?u')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
function isResource(value: unknown): value is Resource { return typeof value === 'string' && value in configs }
</script>

<style scoped>
.form-textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}
</style>
