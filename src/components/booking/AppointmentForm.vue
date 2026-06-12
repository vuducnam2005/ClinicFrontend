<template>
  <form class="af-form" @submit.prevent="submit">
    <div class="af-fields">
      <div class="af-fld">
        <label class="af-lbl">Họ tên <span class="af-req">*</span></label>
        <input v-model="form.patientNameSnapshot" type="text" class="af-inp" placeholder="Nhập họ và tên" required />
      </div>
      <div class="af-fld">
        <label class="af-lbl">SĐT <span class="af-req">*</span></label>
        <input v-model="form.patientPhoneSnapshot" type="text" :class="['af-inp', phoneError ? 'af-inp-err' : '']" placeholder="Nhập số điện thoại" required @blur="validatePhone" />
        <span v-if="phoneError" class="af-err">{{ phoneError }}</span>
        <button v-if="showPhoneSuggestion" type="button" class="af-suggest" @click="useRegisteredPhone">+ SĐT đã đăng ký: {{ initialPatientPhone }}</button>
      </div>
      <div class="af-fld">
        <label class="af-lbl">Lý do khám</label>
        <input v-model="form.reason" type="text" class="af-inp" placeholder="Nhập lý do khám" />
      </div>
    </div>
    <div class="af-actions">
      <button v-if="showBack" type="button" class="af-back" @click="$emit('back')">
        <svg class="af-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Quay lại
      </button>
      <button type="submit" class="af-submit" :disabled="!canSubmit || loading">
        <svg v-if="loading" class="af-ic af-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        XÁC NHẬN
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { authApi } from '@/services/authApi'
import type { CreateAppointmentRequest } from '@/types/appointment'

const props = withDefaults(defineProps<{
  doctorId: number
  appointmentDate: string
  slotTime: string
  loading?: boolean
  initialPatientId?: string | number
  initialPatientName?: string
  initialPatientPhone?: string
  layout?: 'stacked' | 'inline'
  showBack?: boolean
}>(), { showBack: true })

const emit = defineEmits<{ submit: [payload: CreateAppointmentRequest]; back: [] }>()

const form = reactive({
  patientId: props.initialPatientId ? String(props.initialPatientId) : '',
  patientNameSnapshot: props.initialPatientName || '',
  patientPhoneSnapshot: props.initialPatientPhone || '',
  reason: '',
})
const phoneError = ref('')
const phoneValidating = ref(false)

const showPhoneSuggestion = computed(() => {
  const p = props.initialPatientPhone
  return p ? form.patientPhoneSnapshot.trim() !== p.trim() : false
})
function useRegisteredPhone() { if (props.initialPatientPhone) { form.patientPhoneSnapshot = props.initialPatientPhone; phoneError.value = '' } }

watch(() => [props.initialPatientId, props.initialPatientName, props.initialPatientPhone], (v: any[]) => {
  form.patientId = v[0] ? String(v[0]) : ''
  if (v[1] && !form.patientNameSnapshot) form.patientNameSnapshot = String(v[1])
  if (v[2] && !form.patientPhoneSnapshot) form.patientPhoneSnapshot = String(v[2])
}, { immediate: true })

watch(() => form.patientPhoneSnapshot, () => { if (phoneError.value) phoneError.value = '' })

async function validatePhone() {
  const ph = form.patientPhoneSnapshot.trim()
  if (!ph) return
  if (props.initialPatientPhone && ph === props.initialPatientPhone.trim()) { phoneError.value = ''; return }
  phoneValidating.value = true
  try {
    const r = await authApi.checkDuplicate({ phoneNumber: ph })
    phoneError.value = r.phoneNumberExists ? 'SĐT đã được đăng ký với bệnh nhân khác.' : ''
  } catch { phoneError.value = '' }
  finally { phoneValidating.value = false }
}

const canSubmit = computed(() =>
  Boolean(props.doctorId) && Boolean(props.appointmentDate) && Boolean(props.slotTime) &&
  Boolean(form.patientNameSnapshot.trim()) && Boolean(form.patientPhoneSnapshot.trim()) &&
  !phoneError.value && !phoneValidating.value,
)

async function submit() {
  await validatePhone()
  if (!canSubmit.value) return
  const pid = Number(form.patientId)
  emit('submit', {
    ...(Number.isFinite(pid) && pid > 0 ? { patientId: pid } : {}),
    patientNameSnapshot: form.patientNameSnapshot.trim(),
    patientPhoneSnapshot: form.patientPhoneSnapshot.trim(),
    doctorId: props.doctorId,
    appointmentDate: props.appointmentDate,
    slotTime: props.slotTime,
    reason: form.reason.trim() || undefined,
  })
}
</script>

<style scoped>
.af-form { display: flex; flex-direction: column; gap: 6px; }
.af-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.af-fld { display: flex; flex-direction: column; gap: 2px; }
.af-lbl { font-size: 12px; font-weight: 600; color: #334155; }
.af-req { color: #ef4444; }
.af-inp { height: 34px; width: 100%; padding: 0 10px; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #fff; font-size: 13px; color: #0f172a; outline: none; transition: border-color .2s; box-sizing: border-box; }
.af-inp::placeholder { color: #94a3b8; }
.af-inp:focus { border-color: #0F52BA; box-shadow: 0 0 0 2px rgba(15,82,186,.08); }
.af-inp-err { border-color: #ef4444; }
.af-inp-err:focus { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,.08); }
.af-err { font-size: 11px; color: #ef4444; }
.af-suggest { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 10px; border: 1px solid #bfdbfe; background: #eff6ff; font-size: 9.5px; font-weight: 500; color: #1d4ed8; cursor: pointer; align-self: flex-start; }
.af-suggest:hover { background: #dbeafe; }
.af-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.af-back { display: inline-flex; align-items: center; gap: 4px; padding: 0 14px; height: 30px; border-radius: 5px; background: #fff; color: #475569; border: 1.5px solid #cbd5e1; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; }
.af-back:hover { background: #f8fafc; }
.af-submit { display: inline-flex; align-items: center; gap: 4px; padding: 0 20px; height: 30px; border-radius: 5px; background: #0F52BA; color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s; letter-spacing: .3px; }
.af-submit:hover:not(:disabled) { background: #0b4296; }
.af-submit:disabled { opacity: .5; cursor: not-allowed; }
.af-ic { width: 14px; height: 14px; }
.af-spin { animation: sp 1s linear infinite; }
@keyframes sp { from { transform: rotate(0) } to { transform: rotate(360deg) } }
@media (max-width: 768px) { .af-fields { grid-template-columns: 1fr; } }
</style>
