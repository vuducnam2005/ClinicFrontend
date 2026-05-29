<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Doctor workspace</p>
          <h1 class="mt-2 text-3xl font-bold text-slate-950">B?ng ?i?u khi?n b?c s?</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            ?ang xem d? li?u c?a <strong class="text-slate-900">{{ authStore.user?.fullName }}</strong>
            <span v-if="authStore.user?.specialtyName"> ? {{ authStore.user.specialtyName }}</span>.
            L?ch h?n v? l?ch l?m vi?c ???c l?c theo t?i kho?n b?c s? ?ang ??ng nh?p.
          </p>
        </div>
        <BaseButton variant="outline" :disabled="loading" @click="loadData">
          <template #icon><RefreshCw class="h-4 w-4" /></template>
          T?i l?i
        </BaseButton>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <LoadingSkeleton v-for="item in 4" :key="item" />
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <RouterLink v-for="stat in stats" :key="stat.label" :to="stat.to" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-teal-200">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
            <p class="mt-3 text-3xl font-bold text-slate-950">{{ stat.value }}</p>
            <p class="mt-2 text-xs font-medium text-slate-500">{{ stat.note }}</p>
          </div>
          <span :class="['flex h-11 w-11 items-center justify-center rounded-xl', stat.iconClass]">
            <component :is="stat.icon" class="h-5 w-5" />
          </span>
        </div>
      </RouterLink>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold text-slate-950">B?nh nh?n ?ang ch? kh?m</h2>
          <p class="mt-1 text-sm text-slate-500">Ngu?n N1 - Waiting Queue, ?? l?c theo b?c s?</p>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="item in queue.slice(0, 5)" :key="item.id || item.appointmentId" class="flex items-center justify-between gap-4 px-5 py-4">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700">{{ item.queueNumber }}</span>
              <div>
                <p class="font-semibold text-slate-950">{{ displayText(item.patientName) }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ item.slotTime || 'Ch?a c? gi?' }} ? {{ item.reason || 'Ch?a ghi l? do' }}</p>
              </div>
            </div>
            <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ item.status }}</span>
          </div>
          <p v-if="!queue.length" class="px-5 py-8 text-sm text-slate-500">Ch?a c? b?nh nh?n trong h?ng ??i c?a b?c s? n?y.</p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold text-slate-950">L?ch l?m vi?c g?n nh?t</h2>
          <p class="mt-1 text-sm text-slate-500">Ngu?n N1 - Doctor Schedule</p>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="item in schedules.slice(0, 5)" :key="item.scheduleId" class="px-5 py-4">
            <p class="font-semibold text-slate-950">{{ formatDate(item.workDate) }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ item.startTime }} - {{ item.endTime }} ? {{ item.slotDurationMinutes || 30 }} ph?t/slot</p>
          </div>
          <p v-if="!schedules.length" class="px-5 py-8 text-sm text-slate-500">Ch?a c? l?ch l?m vi?c cho b?c s? n?y.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { CalendarClock, ClipboardList, FileHeart, RefreshCw, Users } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
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

interface Stat { label: string; value: number; note: string; to: string; icon: Component; iconClass: string }

const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const queue = ref<WaitingQueueItem[]>([])
const appointments = ref<Appointment[]>([])
const schedules = ref<DoctorSchedule[]>([])
const records = ref<MedicalRecord[]>([])

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

const stats = computed<Stat[]>(() => [
  { label: 'H?ng ??i', value: queue.value.length, note: 'B?nh nh?n h?m nay', to: '/doctor/queue', icon: Users, iconClass: 'bg-teal-50 text-teal-700' },
  { label: 'L?ch h?n', value: appointments.value.length, note: 'C?a b?c s? n?y', to: '/doctor/appointments', icon: CalendarClock, iconClass: 'bg-cyan-50 text-cyan-700' },
  { label: 'B?nh ?n', value: records.value.length, note: 'Ngu?n N2', to: '/doctor/records', icon: FileHeart, iconClass: 'bg-blue-50 text-blue-700' },
  { label: 'Ca l?m', value: schedules.value.length, note: 'L?ch c? nh?n', to: '/doctor/schedule', icon: ClipboardList, iconClass: 'bg-emerald-50 text-emerald-700' },
])

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = ''
  const today = new Date().toISOString().slice(0, 10)
  const doctorId = currentDoctorId(authStore.user)
  const appointmentLoader = doctorId ? appointmentApi.getAppointmentsByDoctor(doctorId) : appointmentApi.getAppointments()
  const scheduleLoader = doctorId ? appointmentApi.getDoctorSchedulesByDoctor(doctorId) : appointmentApi.getDoctorSchedules()

  const results = await Promise.allSettled([
    appointmentApi.getWaitingQueue(today).then((items) => filterQueueForDoctor(items, authStore.user)),
    appointmentLoader.then((items) => filterAppointmentsForDoctor(items, authStore.user)),
    scheduleLoader.then((items) => filterSchedulesForDoctor(items, authStore.user)),
    medicalRecordApi.getMedicalRecords().then((items) => filterRecordsForDoctor(items, authStore.user)),
  ])

  queue.value = readList(results[0], filterQueueForDoctor(fallbackQueue, authStore.user))
  appointments.value = readList(results[1], filterAppointmentsForDoctor(fallbackAppointments, authStore.user))
  schedules.value = readList(results[2], filterSchedulesForDoctor(fallbackSchedules, authStore.user))
  records.value = readList(results[3], [])

  const firstError = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
  if (firstError) error.value = `M?t s? API ch?a ph?n h?i: ${getApiErrorMessage(firstError.reason)}. ?ang d?ng fallback cho ph?n thi?u d? li?u.`
  loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>, fallback: T[]) {
  return result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length ? result.value : fallback
}
function addDays(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date }
function formatDate(value?: string) { if (!value) return 'Ch?a c?p nh?t'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date) }
function statusClass(status?: string) { const value = String(status || '').toLowerCase(); if (value.includes('done') || value.includes('completed') || value.includes('confirmed')) return 'bg-teal-100 text-teal-700'; if (value.includes('inprogress') || value.includes('?ang kh?m')) return 'bg-blue-100 text-blue-700'; if (value.includes('waiting') || value.includes('pending')) return 'bg-amber-100 text-amber-700'; return 'bg-slate-100 text-slate-700' }
</script>
