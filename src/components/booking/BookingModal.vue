<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[60] bg-slate-950/45 px-4 py-6 backdrop-blur-sm" @click.self="close">
        <div class="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-soft">
          <div class="border-b border-slate-100 p-5 sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-teal-700">Đặt lịch khám</p>
                <h2 class="mt-1 text-2xl font-semibold text-slate-950">{{ displayText(doctor?.doctorName) || 'Bác sĩ' }}</h2>
              </div>
              <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" @click="close">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Stethoscope class="h-6 w-6" />
              </div>
              <dl class="mt-5 space-y-4 text-sm">
                <div>
                  <dt class="text-slate-500">Chuyên khoa</dt>
                  <dd class="mt-1 font-semibold text-slate-900">{{ displayText(doctor?.specialtyName || specialtyName) }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Ngày và giờ</dt>
                  <dd class="mt-1 font-semibold text-slate-900">{{ appointmentDate }} - {{ slotTime }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Phí khám</dt>
                  <dd class="mt-1 font-semibold text-slate-900">{{ formatCurrency(doctor?.examFee || 0) }}</dd>
                </div>
              </dl>
            </div>

            <AppointmentForm
             :doctorId="doctor?.doctorId || 0"
             :appointmentDate="appointmentDate"
             :slotTime="slotTime"
             :loading="submitting"
              @submit="createBooking"
            />
          </div>
        </div>
      </div>
    </Transition>

    <Toast
     :show="toast.show"
     :title="toast.title"
     :message="toast.message"
     :type="toast.type"
      @close="toast.show = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Stethoscope, X } from 'lucide-vue-next'
import AppointmentForm from '@/components/booking/AppointmentForm.vue'
import Toast from '@/components/ui/Toast.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { getApiErrorMessage } from '@/services/apiClient'
import type { CreateAppointmentRequest } from '@/types/appointment'
import type { Doctor } from '@/types/doctor'
import { displayText } from '@/utils/displayText'

defineProps<{
  open: boolean
  doctor?: Doctor
  specialtyName?: string
  appointmentDate: string
  slotTime: string
}>()

const emit = defineEmits<{
  close: []
  booked: [appointmentId?: number]
}>()

const submitting = ref(false)
const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error',
})

function close() {
  emit('close')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

async function createBooking(payload: CreateAppointmentRequest) {
  submitting.value = true
  try {
    const latestSlots = await appointmentApi.getAvailableSlots(payload.doctorId, payload.appointmentDate)
    if (!latestSlots.map((slot) => slot.slice(0, 5)).includes(payload.slotTime.slice(0, 5))) {
      throw new Error('Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.')
    }
    const appointment = await appointmentApi.createAppointment(payload)
    toast.title = 'Đặt lịch thành công'
    toast.message = `Mã lịch hẹn: ${appointment.appointmentId || 'đang cập nhật'}`
    toast.type = 'success'
    toast.show = true
    emit('booked', appointment.appointmentId)
    close()
  } catch (error) {
    toast.title = 'Chưa thể đặt lịch'
    toast.message = getApiErrorMessage(error)
    toast.type = 'error'
    toast.show = true
  } finally {
    submitting.value = false
  }
}
</script>
