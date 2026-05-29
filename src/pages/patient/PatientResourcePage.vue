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
        <BaseButton variant="outline" :disabled="loading" @click="loadData">
          <template #icon><RefreshCw class="h-4 w-4" /></template>
          T?i l?i
        </BaseButton>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="resource === 'profile'" class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">H? s? c? nh?n</p>
        <h2 class="mt-2 text-2xl font-bold text-slate-950">{{ authStore.user?.fullName }}</h2>
        <dl class="mt-6 space-y-4 text-sm">
          <div class="flex justify-between gap-4"><dt class="text-slate-500">PatientId</dt><dd class="font-semibold text-slate-900">#{{ patientId }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-500">Email</dt><dd class="font-semibold text-slate-900">{{ authStore.user?.email || 'Ch?a c?p nh?t' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-500">S? ?i?n tho?i</dt><dd class="font-semibold text-slate-900">{{ authStore.user?.phoneNumber || 'Ch?a c?p nh?t' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-500">Vai tr?</dt><dd class="font-semibold text-slate-900">B?nh nh?n</dd></div>
        </dl>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Li?n k?t service</p>
        <div class="mt-5 space-y-3 text-sm text-slate-600">
          <p><strong class="text-slate-900">N1</strong> d?ng PatientId ?? ??c l?ch h?n.</p>
          <p><strong class="text-slate-900">N2</strong> d?ng PatientId ?? ??c h? s? b?nh ?n.</p>
          <p><strong class="text-slate-900">N3</strong> d?ng PatientId ?? ??c h?a ??n v? thanh to?n.</p>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="item in 3" :key="item" />
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
              <th v-if="resource === 'bills'" class="px-5 py-3 text-right">Thao t?c</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(row, index) in filteredRows" :key="String(row.id || index)" class="hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" :class="['px-5 py-4 align-top', column.right ? 'text-right' : 'text-left']">
                <span v-if="column.badge" :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(value(row, column.key))]">{{ value(row, column.key) }}</span>
                <span v-else :class="column.strong ? 'font-semibold text-slate-950' : 'text-slate-700'">{{ value(row, column.key) }}</span>
              </td>
              <td v-if="resource === 'bills'" class="px-5 py-4 text-right">
                <button v-if="String(row.status).toLowerCase() !== 'paid'" type="button" class="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60" :disabled="actingId === row.id" @click="pay(row)">
                  Thanh to?n
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-400" />
        <h2 class="mt-4 text-lg font-semibold text-slate-950">Ch?a c? d? li?u</h2>
        <p class="mt-2 text-sm text-slate-500">Ch?a c? d? li?u ph? h?p v?i t?i kho?n b?nh nh?n n?y.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarClock, CreditCard, FileHeart, RefreshCw, Search, SearchX, UserRound } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { getApiErrorMessage } from '@/services/apiClient'
import { fallbackAppointments } from '@/services/fallbackData'
import type { Appointment } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { MedicalRecord } from '@/types/medicalRecord'

type Resource = 'appointments' | 'records' | 'prescriptions' | 'bills' | 'profile'
type Row = Record<string, string | number | undefined>
interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config { title: string; service: string; description: string; endpoint: string; icon: Component; iconClass: string; search: string[]; columns: Column[] }

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
const patientId = computed(() => Number(authStore.user?.patientId || 4))
const fallbackPatientAppointments = computed<Appointment[]>(() => fallbackAppointments.map((item) => ({ ...item, patientId: patientId.value, patientName: authStore.user?.fullName || item.patientName })))

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

const configs: Record<Resource, Config> = {
  appointments: cfg('L?ch h?n c?a t?i', 'N1 Appointment', 'Theo d?i l?ch ?? ??t, b?c s?, gi? kh?m, s? th? t? v? tr?ng th?i.', 'GET /api/appointments/patient/{patientId}', CalendarClock, 'bg-teal-50 text-teal-700', ['doctorName','status','reason'], cols(['id','M?'], ['doctorName','B?c s?', false, false, true], ['dateTime','Ng?y gi?'], ['queueNumber','STT', true], ['reason','L? do'], ['status','Tr?ng th?i', false, true])),
  records: cfg('H? s? b?nh ?n', 'N2 Medical Record', 'Xem tri?u ch?ng, ch?n ?o?n v? ghi ch? b?c s? sau m?i l?n kh?m.', 'GET /api/medical-records?patientId={patientId}', FileHeart, 'bg-blue-50 text-blue-700', ['id','diagnosis','symptoms','doctorNotes'], cols(['id','M? BA'], ['diagnosis','Ch?n ?o?n', false, false, true], ['symptoms','Tri?u ch?ng'], ['doctorNotes','Ghi ch?'], ['createdAt','Ng?y t?o'])),
  prescriptions: cfg('??n thu?c', 'N2 + N3', 'Theo d?i thu?c ???c k? t? b?nh ?n v? tr?ng th?i chu?n b? ph?t thu?c.', 'GET /api/medical-records ? N3 medicines', FileHeart, 'bg-indigo-50 text-indigo-700', ['id','diagnosis','medicine','status'], cols(['id','M?'], ['diagnosis','Ch?n ?o?n', false, false, true], ['medicine','Thu?c'], ['status','Tr?ng th?i', false, true])),
  bills: cfg('Vi?n ph? c?a t?i', 'N3 Billing', 'Xem h?a ??n, s? ti?n v? thanh to?n vi?n ph? khi N3 s?n s?ng.', 'GET /api/billing/invoices?patientId={patientId}', CreditCard, 'bg-emerald-50 text-emerald-700', ['id','amount','status'], cols(['id','M? H?'], ['appointmentId','L?ch h?n'], ['amount','S? ti?n', true], ['status','Tr?ng th?i', false, true])),
  profile: cfg('H? s? c? nh?n', 'Auth/N2', 'Th?ng tin t?i kho?n b?nh nh?n v? kh?a li?n k?t d? li?u gi?a c?c service.', 'GET /api/auth/me ? GET /api/patients/{patientId}', UserRound, 'bg-slate-100 text-slate-700', [], []),
}

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  if (resource.value === 'profile') return
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    if (resource.value === 'appointments') rows.value = await loadRows(() => appointmentApi.getAppointmentsByPatient(patientId.value), fallbackPatientAppointments.value, mapAppointment, '?? ??c l?ch h?n t? N1 theo PatientId.')
    if (resource.value === 'records') rows.value = await loadRows(() => medicalRecordApi.getMedicalRecords(String(patientId.value)), [], mapRecord, '?? ??c b?nh ?n t? N2.')
    if (resource.value === 'prescriptions') rows.value = await loadRows(() => medicalRecordApi.getMedicalRecords(String(patientId.value)), [], mapPrescription, '?? t?ng h?p ??n thu?c t? b?nh ?n N2.')
    if (resource.value === 'bills') rows.value = await loadRows(() => billingApi.getInvoices(patientId.value), [], mapInvoice, '?? ??c vi?n ph? t? N3.')
  } finally {
    loading.value = false
  }
}

async function loadRows<T>(loader: () => Promise<T[]>, fallback: T[], mapper: (item: T) => Row, successNote: string) {
  try {
    const data = await loader()
    if (data.length) { note.value = successNote; return data.map(mapper) }
    note.value = 'API tr? d? li?u r?ng cho b?nh nh?n n?y.'
    return fallback.map(mapper)
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    note.value = 'Endpoint ch?a ph?n h?i ?n ??nh, ?ang d?ng fallback n?u c?.'
    return fallback.map(mapper)
  }
}

function mapAppointment(item: Appointment): Row { return { id: item.appointmentId, doctorName: item.doctorName, dateTime: `${formatDate(item.appointmentDate)} ? ${item.slotTime}`, queueNumber: item.queueNumber || '-', reason: item.reason || 'Kh?m b?nh', status: item.status } }
function mapRecord(item: MedicalRecord): Row { return { id: item.recordId || item.medicalRecordId || 'MR', diagnosis: item.diagnosis || 'Ch?a c? ch?n ?o?n', symptoms: item.symptoms || 'Ch?a ghi nh?n', doctorNotes: item.doctorNotes || 'Ch?a ghi ch?', createdAt: formatDate(item.examDate || item.createdAt) } }
function mapPrescription(item: MedicalRecord): Row { return { id: item.recordId || item.medicalRecordId || 'MR', diagnosis: item.diagnosis || 'Ch?a c? ch?n ?o?n', medicine: item.doctorNotes || 'Ch? b?c s? k? ??n', status: item.doctorNotes ? '?? c? h??ng d?n' : 'Ch? k? ??n' } }
function mapInvoice(item: Invoice): Row { return { id: item.invoiceId, appointmentId: item.appointmentId ? `#${item.appointmentId}` : '-', amount: formatCurrency(item.amount), status: item.status } }

async function pay(row: Row) {
  const id = Number(row.id)
  if (!id) return
  actingId.value = row.id || null
  error.value = ''
  try {
    await billingApi.payInvoice(id)
    note.value = '?? c?p nh?t thanh to?n h?a ??n.'
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    actingId.value = null
  }
}

function cfg(title: string, service: string, description: string, endpoint: string, icon: Component, iconClass: string, search: string[], columns: Column[]): Config { return { title, service, description, endpoint, icon, iconClass, search, columns } }
function cols(...defs: [string, string, boolean?, boolean?, boolean?][]): Column[] { return defs.map(([key, label, right, badge, strong]) => ({ key, label, right, badge, strong })) }
function value(row: Row, key: string) { return row[key] === undefined || row[key] === '' ? 'Ch?a c?p nh?t' : String(row[key]) }
function formatCurrency(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0)) }
function formatDate(value?: string) { if (!value) return 'Ch?a c?p nh?t'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date) }
function statusClass(status?: string) { const value = String(status || '').toLowerCase(); if (value.includes('paid') || value.includes('confirmed') || value.includes('completed') || value.includes('??')) return 'bg-teal-100 text-teal-700'; if (value.includes('pending') || value.includes('unpaid') || value.includes('waiting') || value.includes('ch?')) return 'bg-amber-100 text-amber-700'; if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
function isResource(value: unknown): value is Resource { return typeof value === 'string' && value in configs }
</script>
