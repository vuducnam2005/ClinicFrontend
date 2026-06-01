<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
      Mã bệnh nhân được hệ thống tự gắn khi đặt lịch. Bạn chỉ cần nhập họ tên, số điện thoại và lý do khám.
    </div>
    <BaseInput v-model="form.patientPhoneSnapshot" label="Số điện thoại" placeholder="0900000000" required />
    <BaseInput v-model="form.patientNameSnapshot" label="Họ tên" placeholder="Nguyễn Văn D" required />
    <label class="block">
      <span class="mb-2 block text-sm font-medium text-slate-700">Lý do khám</span>
      <textarea
        v-model="form.reason"
        rows="3"
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        placeholder="Mô tả ngắn gọn triệu chứng"
      ></textarea>
    </label>
    <BaseButton class="w-full" type="submit" size="lg" :loading="loading" :disabled="!canSubmit">
      <template #icon><CalendarCheck class="h-4 w-4" /></template>
      Xác nhận đặt lịch
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { CalendarCheck } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import type { CreateAppointmentRequest } from '@/types/appointment'

const props = defineProps<{
  doctorId: number
  appointmentDate: string
  slotTime: string
  loading?: boolean
  initialPatientId?: string | number
  initialPatientName?: string
  initialPatientPhone?: string
}>()

const emit = defineEmits<{
  submit: [payload: CreateAppointmentRequest]
}>()

const form = reactive({
  patientId: props.initialPatientId ? String(props.initialPatientId) : '',
  patientNameSnapshot: props.initialPatientName || '',
  patientPhoneSnapshot: props.initialPatientPhone || '',
  reason: '',
})

watch(
  () => [props.initialPatientId, props.initialPatientName, props.initialPatientPhone],
  ([patientId, patientName, patientPhone]) => {
    form.patientId = patientId ? String(patientId) : ''
    if (patientName && !form.patientNameSnapshot) form.patientNameSnapshot = String(patientName)
    if (patientPhone && !form.patientPhoneSnapshot) form.patientPhoneSnapshot = String(patientPhone)
  },
  { immediate: true },
)

const canSubmit = computed(
  () =>
    Boolean(props.doctorId) &&
    Boolean(props.appointmentDate) &&
    Boolean(props.slotTime) &&
    Boolean(form.patientId) &&
    Boolean(form.patientNameSnapshot.trim()) &&
    Boolean(form.patientPhoneSnapshot.trim()),
)

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    patientId: Number(form.patientId),
    patientNameSnapshot: form.patientNameSnapshot.trim(),
    patientPhoneSnapshot: form.patientPhoneSnapshot.trim(),
    doctorId: props.doctorId,
    appointmentDate: props.appointmentDate,
    slotTime: props.slotTime,
    reason: form.reason.trim() || undefined,
  })
}
</script>
