<template>
  <form :class="['af-form', `af-${layout}`]" @submit.prevent="submit">
    <div class="af-fields">
      <div class="af-fld">
        <label class="af-lbl">Họ và tên <span class="af-req">*</span></label>
        <input v-model="form.patientNameSnapshot" type="text" class="af-inp" placeholder="Nhập họ và tên" required />
      </div>

      <div class="af-fld">
        <label class="af-lbl">Ngày sinh</label>
        <input v-model="form.dateOfBirth" type="date" class="af-inp" />
      </div>

      <div class="af-fld">
        <label class="af-lbl">Giới tính</label>
        <span class="af-select-wrap">
          <select v-model="form.gender" class="af-inp af-select">
            <option value="">Chưa cập nhật</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </span>
      </div>

      <div class="af-fld">
        <label class="af-lbl">Số điện thoại <span class="af-req">*</span></label>
        <input
          v-model="form.patientPhoneSnapshot"
          type="text"
          :class="['af-inp', phoneError ? 'af-inp-err' : '']"
          placeholder="Nhập số điện thoại"
          required
          @blur="validatePhone"
        />
        <span v-if="phoneError" class="af-err">{{ phoneError }}</span>
        <button v-if="showPhoneSuggestion" type="button" class="af-suggest" @click="useRegisteredPhone">
          Dùng SĐT đã đăng ký: {{ initialPatientPhone }}
        </button>
      </div>

      <div class="af-fld">
        <label class="af-lbl">Số CCCD/CMND</label>
        <input v-model="form.citizenId" type="text" class="af-inp" placeholder="Chưa cập nhật" />
      </div>

      <div class="af-fld">
        <label class="af-lbl">Email</label>
        <input v-model="form.email" type="email" class="af-inp" placeholder="Chưa cập nhật" />
      </div>

      <div class="af-fld">
        <label class="af-lbl">Bảo hiểm y tế</label>
        <span class="af-select-wrap">
          <select v-model="form.insuranceStatus" class="af-inp af-select">
            <option value="">Chưa cập nhật</option>
            <option value="Có BHYT">Có BHYT</option>
            <option value="Không có BHYT">Không có BHYT</option>
          </select>
        </span>
      </div>

      <div class="af-fld af-full">
        <label class="af-lbl">Ghi chú thêm (không bắt buộc)</label>
        <textarea v-model="form.reason" class="af-area" rows="2" placeholder="Nhập ghi chú nếu có..."></textarea>
      </div>
    </div>

    <div :class="['af-actions', !showBack ? 'af-no-back' : '']">
      <button v-if="showBack" type="button" class="af-back" @click="$emit('back')">
        <svg class="af-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Quay lại
      </button>
      <button type="submit" class="af-submit" :disabled="!canSubmit || loading">
        <svg v-if="loading" class="af-ic af-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>{{ submitLabel }}</span>
        <svg v-if="!loading" class="af-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
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
  initialDateOfBirth?: string
  initialGender?: string
  initialCitizenId?: string
  initialEmail?: string
  initialInsuranceStatus?: string
  layout?: 'stacked' | 'inline' | 'wide'
  showBack?: boolean
  submitLabel?: string
}>(), {
  layout: 'stacked',
  showBack: true,
  submitLabel: 'XÁC NHẬN',
})

const emit = defineEmits<{ submit: [payload: CreateAppointmentRequest]; back: [] }>()

const form = reactive({
  patientId: props.initialPatientId ? String(props.initialPatientId) : '',
  patientNameSnapshot: props.initialPatientName || '',
  patientPhoneSnapshot: props.initialPatientPhone || '',
  dateOfBirth: normalizeDate(props.initialDateOfBirth),
  gender: normalizeGender(props.initialGender),
  citizenId: props.initialCitizenId || '',
  email: props.initialEmail || '',
  insuranceStatus: props.initialInsuranceStatus || '',
  reason: '',
})
const phoneError = ref('')
const phoneValidating = ref(false)

const showPhoneSuggestion = computed(() => {
  const registeredPhone = props.initialPatientPhone
  return registeredPhone ? form.patientPhoneSnapshot.trim() !== registeredPhone.trim() : false
})

function useRegisteredPhone() {
  if (!props.initialPatientPhone) return
  form.patientPhoneSnapshot = props.initialPatientPhone
  phoneError.value = ''
}

watch(() => [
  props.initialPatientId,
  props.initialPatientName,
  props.initialPatientPhone,
  props.initialDateOfBirth,
  props.initialGender,
  props.initialCitizenId,
  props.initialEmail,
  props.initialInsuranceStatus,
], (values: any[]) => {
  form.patientId = values[0] ? String(values[0]) : ''
  if (values[1] && !form.patientNameSnapshot) form.patientNameSnapshot = String(values[1])
  if (values[2] && !form.patientPhoneSnapshot) form.patientPhoneSnapshot = String(values[2])
  if (values[3] && !form.dateOfBirth) form.dateOfBirth = normalizeDate(String(values[3]))
  if (values[4] && !form.gender) form.gender = normalizeGender(String(values[4]))
  if (values[5] && !form.citizenId) form.citizenId = String(values[5])
  if (values[6] && !form.email) form.email = String(values[6])
  if (values[7] && !form.insuranceStatus) form.insuranceStatus = String(values[7])
}, { immediate: true })

watch(() => form.patientPhoneSnapshot, () => {
  if (phoneError.value) phoneError.value = ''
})

async function validatePhone() {
  const phone = form.patientPhoneSnapshot.trim()
  if (!phone) return
  if (props.initialPatientPhone && phone === props.initialPatientPhone.trim()) {
    phoneError.value = ''
    return
  }

  phoneValidating.value = true
  try {
    const result = await authApi.checkDuplicate({ phoneNumber: phone })
    phoneError.value = result.phoneNumberExists ? 'SĐT đã được đăng ký với bệnh nhân khác.' : ''
  } catch {
    phoneError.value = ''
  } finally {
    phoneValidating.value = false
  }
}

const canSubmit = computed(() =>
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

function normalizeDate(value?: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function normalizeGender(value?: string) {
  const raw = String(value || '').trim()
  const lower = raw.toLowerCase()
  if (!raw) return ''
  if (lower === 'male' || lower === 'nam') return 'Nam'
  if (lower === 'female' || lower === 'nữ' || lower === 'nu') return 'Nữ'
  return raw
}
</script>

<style scoped>
.af-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.af-fields {
  display: grid;
  gap: 14px 18px;
}

.af-stacked .af-fields {
  grid-template-columns: 1fr;
}

.af-inline .af-fields {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.af-wide .af-fields {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.af-fld {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.af-full {
  grid-column: 1 / -1;
}

.af-lbl {
  color: #51617a;
  font-size: 12px;
  font-weight: 700;
}

.af-req {
  color: #ef4444;
}

.af-inp,
.af-area {
  width: 100%;
  border: 1px solid #d4deec;
  border-radius: 6px;
  background: #fff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
  box-sizing: border-box;
}

.af-inp {
  height: 40px;
  padding: 0 12px;
}

.af-area {
  min-height: 42px;
  resize: vertical;
  padding: 10px 12px;
  line-height: 1.4;
}

.af-inp::placeholder,
.af-area::placeholder {
  color: #9aa8bc;
}

.af-inp:focus,
.af-area:focus {
  border-color: #0f52ba;
  box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.08);
}

.af-select-wrap {
  position: relative;
  display: block;
}

.af-select {
  appearance: none;
  padding-right: 34px;
  cursor: pointer;
}

.af-select-wrap::after {
  content: '';
  position: absolute;
  right: 13px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-bottom: 2px solid #8ea0bb;
  border-right: 2px solid #8ea0bb;
  pointer-events: none;
  transform: translateY(-65%) rotate(45deg);
}

.af-inp-err {
  border-color: #ef4444;
}

.af-inp-err:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.af-err {
  color: #ef4444;
  font-size: 11px;
  font-weight: 700;
}

.af-suggest {
  align-self: flex-start;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  padding: 3px 8px;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.af-suggest:hover {
  background: #dbeafe;
}

.af-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.af-no-back {
  justify-content: flex-end;
}

.af-back,
.af-submit {
  display: inline-flex;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 7px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.af-back {
  min-width: 120px;
  border: 1px solid #dbe4f1;
  background: #fff;
  color: #0f52ba;
}

.af-back:hover {
  border-color: #b8cdf0;
  background: #f8fbff;
}

.af-submit {
  min-width: 198px;
  border: 0;
  background: #0f52ba;
  color: #fff;
  box-shadow: 0 16px 28px rgba(15, 82, 186, 0.18);
}

.af-submit:hover:not(:disabled) {
  background: #0b4296;
}

.af-submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.af-ic {
  width: 16px;
  height: 16px;
}

.af-spin {
  animation: af-spin 1s linear infinite;
}

@keyframes af-spin {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .af-wide .af-fields,
  .af-inline .af-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .af-wide .af-fields,
  .af-inline .af-fields {
    grid-template-columns: 1fr;
  }

  .af-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .af-back,
  .af-submit {
    width: 100%;
  }
}
</style>
