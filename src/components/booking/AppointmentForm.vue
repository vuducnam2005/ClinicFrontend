<template>
  <form :class="formClass" @submit.prevent="submit">
    <div :class="fieldClass">
      <BaseInput
        v-model="form.patientPhoneSnapshot"
        label="Số điện thoại"
        placeholder="0900000000"
        required
        :error="phoneError"
        @blur="validatePhone"
      />
      <button
        v-if="showPhoneSuggestion"
        type="button"
        class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 hover:border-blue-300"
        @click="useRegisteredPhone"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Sử dụng SĐT đã đăng ký: {{ initialPatientPhone }}
      </button>
    </div>
    <div :class="fieldClass">
      <BaseInput v-model="form.patientNameSnapshot" label="Họ tên" placeholder="Nguyễn Văn D" required />
    </div>
    <label :class="reasonClass">
      <span class="mb-2 block text-sm font-medium text-slate-700">Lý do khám</span>
      <textarea
        v-model="form.reason"
        :rows="textareaRows"
        :class="textareaClass"
        placeholder="Mô tả ngắn gọn triệu chứng"
      ></textarea>
    </label>
    <div :class="buttonClass">
      <BaseButton class="w-full whitespace-nowrap" type="submit" size="lg" :loading="loading" :disabled="!canSubmit">
        <template #icon><CalendarCheck class="h-4 w-4" /></template>
        Xác nhận đặt lịch
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CalendarCheck } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { authApi } from '@/services/authApi'
import type { CreateAppointmentRequest } from '@/types/appointment'

const props = defineProps<{
  doctorId: number
  appointmentDate: string
  slotTime: string
  loading?: boolean
  initialPatientId?: string | number
  initialPatientName?: string
  initialPatientPhone?: string
  layout?: 'stacked' | 'inline'
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

const phoneError = ref('')
const phoneValidating = ref(false)
const inlineLayout = computed(() => props.layout === 'inline')

const formClass = computed(() => inlineLayout.value
  ? 'grid gap-4 xl:grid-cols-4 xl:items-start'
  : 'space-y-4',
)
const infoClass = computed(() => inlineLayout.value
  ? 'rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800 xl:col-span-4'
  : 'rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800',
)
const fieldClass = computed(() => inlineLayout.value ? 'min-w-0' : '')
const reasonClass = computed(() => inlineLayout.value ? 'block min-w-0' : 'block')
const buttonClass = computed(() => inlineLayout.value ? 'flex items-end xl:pt-7' : '')
const textareaRows = computed(() => inlineLayout.value ? 1 : 3)
const textareaClass = computed(() => [
  'w-full resize-none rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100',
  inlineLayout.value ? 'h-11 py-2.5 leading-5' : 'py-3',
])

watch(
  () => [props.initialPatientId, props.initialPatientName, props.initialPatientPhone],
  (values: any[]) => {
    const patientId = values[0]
    const patientName = values[1]
    const patientPhone = values[2]
    form.patientId = patientId ? String(patientId) : ''
    if (patientName && !form.patientNameSnapshot) form.patientNameSnapshot = String(patientName)
    if (patientPhone && !form.patientPhoneSnapshot) form.patientPhoneSnapshot = String(patientPhone)
  },
  { immediate: true },
)

// Show phone suggestion chip when the user clears or changes away from their registered phone
const showPhoneSuggestion = computed(() => {
  const initialPhone = props.initialPatientPhone
  if (!initialPhone) return false
  return form.patientPhoneSnapshot.trim() !== initialPhone.trim()
})

function useRegisteredPhone() {
  const initialPhone = props.initialPatientPhone
  if (initialPhone) {
    form.patientPhoneSnapshot = initialPhone
    phoneError.value = ''
  }
}

// Clear error when user types
watch(() => form.patientPhoneSnapshot, () => {
  if (phoneError.value) phoneError.value = ''
})

async function validatePhone(e?: any) {
  const phone = form.patientPhoneSnapshot.trim()
  if (!phone) return

  const initialPhone = props.initialPatientPhone
  // If it matches the registered phone, no need to validate
  if (initialPhone && phone === initialPhone.trim()) {
    phoneError.value = ''
    return
  }

  phoneValidating.value = true
  try {
    const result = await authApi.checkDuplicate({ phoneNumber: phone })
    if (result.phoneNumberExists) {
      phoneError.value = 'Số điện thoại này đã được đăng ký với bệnh nhân khác.'
    } else {
      phoneError.value = ''
    }
  } catch (error) {
    // If check fails, allow submission (don't block on network errors)
    phoneError.value = ''
  } finally {
    phoneValidating.value = false
  }
}

const canSubmit = computed(
  () =>
    Boolean(props.doctorId) &&
    Boolean(props.appointmentDate) &&
    Boolean(props.slotTime) &&
    Boolean(form.patientNameSnapshot.trim()) &&
    Boolean(form.patientPhoneSnapshot.trim()) &&
    !phoneError.value &&
    !phoneValidating.value,
)

async function submit() {
  await validatePhone()
  if (!canSubmit.value) return
  const patientId = Number(form.patientId)
  emit('submit', {
    ...(Number.isFinite(patientId) && patientId > 0 ? { patientId } : {}),
    patientNameSnapshot: form.patientNameSnapshot.trim(),
    patientPhoneSnapshot: form.patientPhoneSnapshot.trim(),
    doctorId: props.doctorId,
    appointmentDate: props.appointmentDate,
    slotTime: props.slotTime,
    reason: form.reason.trim() || undefined,
  })
}
</script>
