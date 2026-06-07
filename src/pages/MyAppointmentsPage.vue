<template>
 <section class="bg-white py-12">
 <div class="container-page">
 <div class="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
 <div>
 <div class="rounded-2xl bg-gradient-to-br from-teal-700 to-slate-900 p-6 text-white shadow-soft sm:p-8">
 <p class="text-sm font-semibold text-cyan-100">Theo dõi lịch hẹn</p>
 <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">Nhập PatientId để xem lịch khám</h1>
 <p class="mt-4 text-teal-50">
 Trang này gọi GET /api/appointments/patient/{patientId}, hiển thị trạng thái lịch và cho phép hủy khi lịch chưa bắt đầu khám.
 </p>
 </div>

 <form class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card" @submit.prevent="loadAppointments">
 <BaseInput v-model="patientId" label="PatientId" type="number" min="1" placeholder="12" readonly required />
 <BaseButton class="mt-4 w-full" type="submit" size="lg" :loading="loading">
 <template #icon><Search class="h-4 w-4" /></template>
 Tra cứu lịch hẹn
 </BaseButton>
 </form>
 </div>

 <div>
 <div v-if="error" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
 {{ error }}
 </div>

 <div v-if="loading" class="space-y-4">
 <LoadingSkeleton v-for="item in 3" :key="item" />
 </div>

 <div v-else-if="appointments.length" class="space-y-4">
 <BaseCard v-for="appointment in appointments" :key="appointment.appointmentId" class="p-5">
 <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <div class="flex flex-wrap items-center gap-3">
 <h2 class="text-lg font-semibold text-slate-950">#{{ appointment.appointmentId }}</h2>
 <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="statusClass(appointment.status)">
 {{ statusLabel(appointment.status) }}
 </span>
 </div>
 <p class="mt-2 text-sm text-slate-600">{{ appointment.patientName }} - {{ appointment.patientPhone }}</p>
 <p class="mt-1 text-sm text-slate-600">{{ displayText(appointment.doctorName) }} / {{ displayText(appointment.specialtyName) }}</p>
 <p v-if="appointment.reason" class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{{ appointment.reason }}</p>
 </div>
 <div class="flex flex-col items-start gap-3 sm:items-end">
 <div class="rounded-xl bg-slate-50 px-4 py-3 text-left sm:text-right">
 <p class="text-sm font-semibold text-slate-950">{{ appointment.appointmentDate }}</p>
 <p class="mt-1 text-sm text-slate-500">{{ appointment.slotTime }} - STT {{ appointment.queueNumber }}</p>
 </div>
 <button
 v-if="canCancel(appointment.status)"
 type="button"
 :disabled="cancellingId === appointment.appointmentId"
 class="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
 @click="cancelAppointment(appointment.appointmentId)"
 >
 Hủy lịch
 </button>
 </div>
 </div>
 </BaseCard>
 </div>

 <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
 <CalendarX2 class="mx-auto h-10 w-10 text-slate-400" />
 <h2 class="mt-4 text-lg font-semibold text-slate-950">Chưa có lịch hẹn</h2>
 <p class="mt-2 text-sm text-slate-500">Nhập PatientId và bấm tra cứu để tải danh sách lịch khám.</p>
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CalendarX2, Search } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { getApiErrorMessage } from '@/services/apiClient'
import { useAuthStore } from '@/stores/authStore'
import type { Appointment } from '@/types/appointment'
import { displayText } from '@/utils/displayText'

const authStore = useAuthStore()
const patientId = ref(String(authStore.user?.patientId || ''))
const appointments = ref<Appointment[]>([])
const loading = ref(false)
const cancellingId = ref<number | null>(null)
const error = ref('')

async function loadAppointments() {
 patientId.value = String(authStore.user?.patientId || '')
 if (!patientId.value) return
 loading.value = true
 error.value = ''
 try {
 appointments.value = await appointmentApi.getAppointmentsByPatient(Number(patientId.value))
 } catch (apiError) {
 error.value = getApiErrorMessage(apiError)
 appointments.value = []
 } finally {
 loading.value = false
 }
}

onMounted(loadAppointments)

async function cancelAppointment(id: number) {
 cancellingId.value = id
 error.value = ''
 try {
 await appointmentApi.cancelAppointment(id)
 await loadAppointments()
 } catch (apiError) {
 error.value = getApiErrorMessage(apiError)
 } finally {
 cancellingId.value = null
 }
}

function canCancel(status: string) {
 const value = status.toLowerCase()
 return value.includes('pending') || value.includes('confirmed')
}

function statusLabel(status: string) {
 const map: Record<string, string> = {
 Pending: 'Chờ xác nhận',
 Confirmed: 'Đã xác nhận',
 CheckedIn: 'Đã check-in',
 InProgress: 'Đang khám',
 Cancelled: 'Đã hủy',
 Completed: 'Hoàn tất',
 NoShow: 'Không đến khám',
 Expired: 'Đã quá hạn',
 }
 return map[status] || status
}

function statusClass(status: string) {
 const map: Record<string, string> = {
 Pending: 'bg-amber-50 text-amber-700',
 Confirmed: 'bg-blue-50 text-blue-700',
 CheckedIn: 'bg-emerald-50 text-emerald-700',
 InProgress: 'bg-cyan-50 text-cyan-700',
 Cancelled: 'bg-rose-50 text-rose-700',
 Completed: 'bg-teal-50 text-teal-700',
 NoShow: 'bg-slate-100 text-slate-700',
 Expired: 'bg-slate-100 text-slate-700',
 }
 return map[status] || 'bg-slate-100 text-slate-700'
}
</script>
