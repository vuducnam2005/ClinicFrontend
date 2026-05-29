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
            <p class="mt-2 text-sm font-medium text-slate-600">
              T?i kho?n: <span class="text-slate-950">{{ authStore.user?.fullName }}</span>
              <span v-if="authStore.user?.doctorId"> ? DoctorId #{{ authStore.user.doctorId }}</span>
            </p>
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
        <p class="mt-2 text-sm text-slate-500">Ch?a c? l?ch h?n ho?c d? li?u ph? h?p v?i b?c s? ?ang ??ng nh?p.</p>
      </div>
    </div>

    <div v-if="examineOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">N2 Medical Record</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Phi?u kh?m & k? ??n</h2>
            <p class="mt-2 text-sm text-slate-500">T?o b?nh ?n t? l?ch h?n, sau ?? ho?n t?t l?ch h?n ? N1.</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="closeExamine">?</button>
        </div>

        <div class="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p><strong class="text-slate-900">B?nh nh?n:</strong> {{ selectedRow?.patientName }}</p>
          <p class="mt-1"><strong class="text-slate-900">L?ch h?n:</strong> #{{ selectedRow?.id }} ? {{ selectedRow?.dateTime }}</p>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="submitExamination">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Tri?u ch?ng</span>
            <textarea v-model="examForm.symptoms" rows="3" required class="form-textarea" placeholder="V? d?: s?t, ho, ?au ng?c..."></textarea>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Ch?n ?o?n</span>
            <textarea v-model="examForm.diagnosis" rows="3" required class="form-textarea" placeholder="Ch?n ?o?n s? b? ho?c k?t lu?n kh?m"></textarea>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">??n thu?c / ghi ch? ?i?u tr?</span>
            <textarea v-model="examForm.doctorNotes" rows="4" class="form-textarea" placeholder="T?n thu?c, li?u d?ng, h??ng d?n t?i kh?m"></textarea>
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="examForm.recheckDate" label="Ng?y t?i kh?m" type="date" />
            <BaseInput v-model="examForm.prescriptionCode" label="M? ??n thu?c n?i b?" placeholder="VD: RX-001" />
          </div>
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton type="button" variant="outline" @click="closeExamine">??ng</BaseButton>
            <BaseButton type="submit" :loading="savingExam">
              <template #icon><FileHeart class="h-4 w-4" /></template>
              L?u b?nh ?n & ho?n t?t kh?m
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
import { CalendarClock, ClipboardList, FileHeart, RefreshCw, Search, SearchX, Stethoscope, Users } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { fallbackAppointments, fallbackDoctors, fallbackQueue } from '@/services/fallbackData'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor, filterSchedulesForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

type Resource = 'queue' | 'appointments' | 'examine' | 'records' | 'schedule'
type Row = Record<string, string | number | undefined>
interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config { title: string; service: string; description: string; endpoint: string; icon: Component; iconClass: string; search: string[]; columns: Column[] }

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
const examForm = reactive({ symptoms: '', diagnosis: '', doctorNotes: '', recheckDate: '', prescriptionCode: '' })

const filteredRows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return rows.value
  return rows.value.filter((row) => config.value.search.some((key) => String(row[key] || '').toLowerCase().includes(keyword)))
})

const fallbackSchedules: DoctorSchedule[] = fallbackDoctors.map((doctor, index) => ({
  scheduleId: 800 + index,
  doctorId: doctor.doctorId,
  doctorName: doctor.doctorName,
  workDate: addDays(index).toISOString().slice(0, 10),
  startTime: index % 2 === 0 ? '08:00' : '13:00',
  endTime: index % 2 === 0 ? '11:30' : '16:30',
  slotDurationMinutes: 30,
  isAvailable: true,
}))
const fallbackRecords: MedicalRecord[] = [
  { recordId: 'MR001', patientId: '12', appointmentId: '2201', doctorId: 1, doctorName: 'B?c s? Nguy?n V?n A', diagnosis: 'Theo d?i tim m?ch', symptoms: '?au ng?c nh?', doctorNotes: 'T?i kh?m sau 7 ng?y', createdAt: new Date().toISOString() },
  { recordId: 'MR002', patientId: '13', appointmentId: '2202', doctorId: 2, doctorName: 'B?c s? Tr?n Th? B', diagnosis: 'Vi?m h? h?p tr?n', symptoms: 'S?t, ho', doctorNotes: 'K? thu?c v? ngh? ng?i', createdAt: new Date().toISOString() },
  { recordId: 'MR003', patientId: '14', appointmentId: '2203', doctorId: 3, doctorName: 'B?c s? L? V?n C', diagnosis: 'D? ?ng da', symptoms: 'N?i m?n ??', doctorNotes: 'Theo d?i ph?n ?ng thu?c', createdAt: new Date().toISOString() },
]

const configs: Record<Resource, Config> = {
  queue: cfg('H?ng ??i kh?m', 'N1 Waiting Queue', 'Danh s?ch b?nh nh?n ?ang ch?, ?ang kh?m ho?c ?? ho?n t?t trong ng?y c?a b?c s? ?ang ??ng nh?p.', 'GET /api/waiting-queue?date=today', Users, 'bg-teal-50 text-teal-700', ['patientName','doctorName','status'], cols(['queueNumber','STT', true], ['patientName','B?nh nh?n', false, false, true], ['doctorName','B?c s?'], ['slotTime','Gi?'], ['status','Tr?ng th?i', false, true])),
  appointments: cfg('L?ch h?n h?m nay', 'N1 Appointment', 'C?c l?ch h?n c?a b?c s? ?ang ??ng nh?p, ?u ti?n ??c t? endpoint theo doctorId.', 'GET /api/appointments/doctor/{doctorId}', CalendarClock, 'bg-cyan-50 text-cyan-700', ['patientName','doctorName','status','reason'], cols(['id','M?'], ['patientName','B?nh nh?n', false, false, true], ['doctorName','B?c s?'], ['dateTime','Ng?y gi?'], ['reason','L? do'], ['status','Tr?ng th?i', false, true])),
  examine: cfg('Kh?m & K? ??n', 'N1 + N2', 'B?c s? kh?m b?nh, t?o b?nh ?n N2 v? ho?n t?t l?ch h?n N1.', 'POST /api/medical-records ? PUT /api/appointments/{id}/complete', Stethoscope, 'bg-blue-50 text-blue-700', ['patientName','doctorName','action','status'], cols(['id','M?'], ['patientName','B?nh nh?n', false, false, true], ['doctorName','B?c s?'], ['dateTime','Ng?y gi?'], ['action','Thao t?c'], ['status','Tr?ng th?i', false, true])),
  records: cfg('L?ch s? b?nh ?n', 'N2 Medical Record', 'Tra c?u b?nh ?n, tri?u ch?ng, ch?n ?o?n v? ghi ch? c?a b?c s? ?ang ??ng nh?p.', 'GET /api/medical-records', FileHeart, 'bg-indigo-50 text-indigo-700', ['id','patientId','diagnosis','symptoms'], cols(['id','M? BA'], ['patientId','B?nh nh?n', false, false, true], ['diagnosis','Ch?n ?o?n'], ['symptoms','Tri?u ch?ng'], ['doctorNotes','Ghi ch?'], ['createdAt','Ng?y t?o'])),
  schedule: cfg('L?ch l?m vi?c c? nh?n', 'N1 Doctor Schedule', 'Ca l?m vi?c v? slot kh?m c?a b?c s? ?ang ??ng nh?p.', 'GET /api/doctor-schedules/doctor/{doctorId}', ClipboardList, 'bg-emerald-50 text-emerald-700', ['doctorName','workDate','timeRange','status'], cols(['id','M?'], ['doctorName','B?c s?', false, false, true], ['workDate','Ng?y l?m'], ['timeRange','Ca kh?m'], ['duration','Slot'], ['status','Tr?ng th?i', false, true])),
}

watch(resource, () => { query.value = ''; void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    const doctorId = currentDoctorId(authStore.user)
    if (resource.value === 'queue') rows.value = await loadRows(() => appointmentApi.getWaitingQueue(today).then((items) => filterQueueForDoctor(items, authStore.user)), filterQueueForDoctor(fallbackQueue, authStore.user), mapQueue, '?? ??c h?ng ??i t? N1 v? l?c theo b?c s?.')
    if (resource.value === 'appointments') rows.value = await loadRows(() => (doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()).then((items) => filterAppointmentsForDoctor(items, authStore.user)), filterAppointmentsForDoctor(fallbackAppointments, authStore.user), mapAppointment, '?? ??c l?ch h?n t? N1 theo b?c s?.')
    if (resource.value === 'examine') rows.value = await loadRows(() => (doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()).then((items) => filterAppointmentsForDoctor(items, authStore.user)), filterAppointmentsForDoctor(fallbackAppointments, authStore.user), mapExamine, '?? ??c danh s?ch kh?m t? N1 theo b?c s?.')
    if (resource.value === 'records') rows.value = await loadRows(() => medicalRecordApi.getMedicalRecords().then((items) => filterRecordsForDoctor(items, authStore.user)), filterRecordsForDoctor(fallbackRecords, authStore.user), mapRecord, '?? ??c b?nh ?n t? N2 theo b?c s?.')
    if (resource.value === 'schedule') rows.value = await loadRows(() => (doctorId ? appointmentApi.getDoctorSchedulesByDoctor(doctorId) : appointmentApi.getDoctorSchedules()).then((items) => filterSchedulesForDoctor(items, authStore.user)), filterSchedulesForDoctor(fallbackSchedules, authStore.user), mapSchedule, '?? ??c l?ch l?m vi?c t? N1 theo b?c s?.')
  } finally {
    loading.value = false
  }
}

async function loadRows<T>(loader: () => Promise<T[]>, fallback: T[], mapper: (item: T) => Row, successNote: string) {
  try {
    const data = await loader()
    if (data.length) { note.value = successNote; return data.map(mapper) }
    note.value = 'API tr? d? li?u r?ng cho b?c s? n?y, ?ang hi?n th? fallback t??ng ?ng ?? ki?m th? lu?ng.'
    return fallback.map(mapper)
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    note.value = 'Endpoint ch?a ph?n h?i ?n ??nh, ?ang hi?n th? fallback theo b?c s?.'
    return fallback.map(mapper)
  }
}

function mapQueue(item: WaitingQueueItem): Row { return { id: item.id || item.queueId || item.appointmentId, appointmentId: item.appointmentId, queueNumber: item.queueNumber, patientId: item.patientId, patientName: displayText(item.patientName), doctorName: displayText(item.doctorName), slotTime: item.slotTime || '-', status: item.status } }
function mapAppointment(item: Appointment): Row { return { id: item.appointmentId, appointmentId: item.appointmentId, patientId: item.patientId, patientName: displayText(item.patientName), doctorName: displayText(item.doctorName), dateTime: `${formatDate(item.appointmentDate)} ? ${item.slotTime}`, reason: item.reason || 'Ch?a ghi nh?n', status: item.status } }
function mapExamine(item: Appointment): Row { return { ...mapAppointment(item), action: 'M? phi?u kh?m / k? ??n' } }
function mapRecord(item: MedicalRecord): Row { return { id: item.recordId || item.medicalRecordId || 'MR', patientId: item.patientId, diagnosis: item.diagnosis || 'Ch?a c? ch?n ?o?n', symptoms: item.symptoms || 'Ch?a ghi nh?n', doctorNotes: item.doctorNotes || 'Ch?a ghi ch?', createdAt: formatDate(item.examDate || item.createdAt) } }
function mapSchedule(item: DoctorSchedule): Row { return { id: item.scheduleId, doctorName: displayText(item.doctorName), workDate: formatDate(item.workDate), timeRange: `${item.startTime} - ${item.endTime}`, duration: `${item.slotDurationMinutes || 30} ph?t`, status: item.isAvailable === false ? 'T?m ng?ng' : '?ang m?' } }

function rowActions(row: Row) {
  const status = String(row.status || '').toLowerCase()
  const actions: Array<{ key: 'start' | 'done' | 'cancel' | 'examine'; label: string; className: string }> = []
  if (resource.value === 'examine') actions.push({ key: 'examine', label: 'Kh?m b?nh', className: 'bg-blue-600 text-white hover:bg-blue-700' })
  if (resource.value !== 'examine' && (status.includes('waiting') || status.includes('confirmed'))) actions.push({ key: 'start', label: 'B?t ??u kh?m', className: 'bg-blue-600 text-white hover:bg-blue-700' })
  if (resource.value !== 'examine' && (status.includes('inprogress') || status.includes('?ang kh?m'))) actions.push({ key: 'done', label: 'Ho?n t?t', className: 'bg-teal-600 text-white hover:bg-teal-700' })
  if (resource.value !== 'examine' && !status.includes('done') && !status.includes('completed') && !status.includes('cancel')) actions.push({ key: 'cancel', label: 'H?y', className: 'bg-rose-50 text-rose-700 hover:bg-rose-100' })
  return actions
}

async function runAction(action: 'start' | 'done' | 'cancel' | 'examine', row: Row) {
  if (action === 'examine') { openExamine(row); return }
  const id = Number(row.id || row.appointmentId)
  if (!id) return
  actingId.value = row.id || null
  error.value = ''
  try {
    if (action === 'start') await appointmentApi.setQueueInProgress(id)
    if (action === 'done') await appointmentApi.setQueueDone(id)
    if (action === 'cancel') await appointmentApi.cancelQueueItem(id)
    note.value = '?? c?p nh?t tr?ng th?i h?ng ch?.'
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    actingId.value = null
  }
}

function openExamine(row: Row) { selectedRow.value = row; examineOpen.value = true }
function closeExamine() { examineOpen.value = false; selectedRow.value = null; examForm.symptoms = ''; examForm.diagnosis = ''; examForm.doctorNotes = ''; examForm.recheckDate = ''; examForm.prescriptionCode = '' }
async function submitExamination() {
  if (!selectedRow.value) return
  savingExam.value = true
  error.value = ''
  const appointmentId = Number(selectedRow.value.appointmentId || selectedRow.value.id)
  try {
    await medicalRecordApi.createMedicalRecord({
      appointmentId: String(appointmentId),
      patientId: String(selectedRow.value.patientId || ''),
      doctorId: authStore.user?.doctorId,
      doctorName: authStore.user?.fullName,
      symptoms: examForm.symptoms.trim(),
      diagnosis: examForm.diagnosis.trim(),
      doctorNotes: [examForm.doctorNotes, examForm.recheckDate ? `T?i kh?m: ${examForm.recheckDate}` : '', examForm.prescriptionCode ? `M? ??n: ${examForm.prescriptionCode}` : ''].filter(Boolean).join('\n'),
      examDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
    await appointmentApi.completeAppointment(appointmentId)
    note.value = '?? t?o b?nh ?n N2 v? ho?n t?t l?ch h?n N1.'
    closeExamine()
    await loadData()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    savingExam.value = false
  }
}

function cfg(title: string, service: string, description: string, endpoint: string, icon: Component, iconClass: string, search: string[], columns: Column[]): Config { return { title, service, description, endpoint, icon, iconClass, search, columns } }
function cols(...defs: [string, string, boolean?, boolean?, boolean?][]): Column[] { return defs.map(([key, label, right, badge, strong]) => ({ key, label, right, badge, strong })) }
function value(row: Row, key: string) { return row[key] === undefined || row[key] === '' ? 'Ch?a c?p nh?t' : String(row[key]) }
function formatDate(value?: string) { if (!value) return 'Ch?a c?p nh?t'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date) }
function addDays(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date }
function statusClass(status?: string) { const value = String(status || '').toLowerCase(); if (value.includes('done') || value.includes('completed') || value.includes('confirmed') || value.includes('?ang m?')) return 'bg-teal-100 text-teal-700'; if (value.includes('inprogress') || value.includes('?ang kh?m')) return 'bg-blue-100 text-blue-700'; if (value.includes('waiting') || value.includes('pending') || value.includes('ch?')) return 'bg-amber-100 text-amber-700'; if (value.includes('cancel') || value.includes('t?m')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
function isResource(value: unknown): value is Resource { return typeof value === 'string' && value in configs }
</script>

<style scoped>
.form-textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}
</style>
