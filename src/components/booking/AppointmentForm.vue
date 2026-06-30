<template>
  <form :class="['af-form', `af-${layout}`]" novalidate @submit.prevent="submit">
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
        <label class="af-lbl">Lý do khám</label>
        <textarea v-model="form.reason" class="af-area" rows="2" placeholder="Nhập lý do khám..."></textarea>
      </div>

      <div class="af-support af-full">
        <div class="af-support-head">
          <div>
            <h3>Nhu cầu hỗ trợ</h3>
            <p>Chọn trước để bệnh viện chuẩn bị hỗ trợ phù hợp khi bạn đến khám.</p>
          </div>
        </div>

        <div class="af-support-options">
          <label v-for="option in supportOptions" :key="option.value" :class="['af-check', form.supportNeeds.includes(option.value) ? 'is-checked' : '']">
            <input v-model="form.supportNeeds" type="checkbox" :value="option.value" />
            <span></span>
            {{ option.label }}
          </label>
          <input
            v-if="form.supportNeeds.includes('other')"
            v-model="form.supportOther"
            class="af-inp af-other-input"
            type="text"
            placeholder="Nhập nhu cầu hỗ trợ khác"
          />
        </div>

        <label class="af-fld">
          <span class="af-lbl">Mô tả chi tiết nhu cầu hỗ trợ</span>
          <textarea
            v-model="form.supportDescription"
            class="af-area"
            rows="2"
            placeholder="Ví dụ: cần xe lăn tại cổng chính, cần nhân viên hỗ trợ lên tầng..."
          ></textarea>
        </label>

        <button type="button" class="af-add-companion" @click="addCompanion">
          <svg class="af-add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          <span>
            <b>Thêm người khác</b>
            <small>Người nhà hoặc người quen</small>
          </span>
        </button>

        <div v-if="form.companions.length" class="af-companion-list">
          <section v-for="(companion, index) in form.companions" :key="companion.key" class="af-companion-card">
            <div class="af-companion-title">
              <b>Thông tin người khác {{ index + 1 }}</b>
              <button type="button" class="af-companion-remove" :aria-label="`Xóa người khác ${index + 1}`" @click="removeCompanion(index)">
                <Trash2 class="af-remove-icon" />
              </button>
            </div>
            <div class="af-companion-grid">
              <label class="af-fld">
                <span class="af-lbl">Họ tên <span class="af-req">*</span></span>
                <div class="af-patient-combobox">
                  <input
                    v-model="companion.fullName"
                    type="text"
                    class="af-inp"
                    placeholder="Gõ tên hoặc mã bệnh nhân..."
                    required
                    autocomplete="off"
                    @focus="openCompanionPatientSearch(companion)"
                    @input="handleCompanionNameInput(companion)"
                    @blur="closeCompanionPatientSearch"
                  />
                  <div v-if="activeCompanionKey === companion.key" class="af-patient-menu">
                    <button
                      v-for="patient in companionPatientMatches(companion)"
                      :key="patientOptionKey(patient)"
                      type="button"
                      class="af-patient-option"
                      @mousedown.prevent="selectCompanionPatient(companion, patient)"
                    >
                      <span>
                        <b>{{ patient.fullName }}</b>
                        <small>{{ patientCode(patient) }}</small>
                      </span>
                      <em>{{ patientPhone(patient) || 'Chưa có SĐT' }}</em>
                    </button>
                    <div v-if="patientsLoading" class="af-patient-empty">Đang tải bệnh nhân...</div>
                    <div v-else-if="!companionPatientMatches(companion).length" class="af-patient-empty">
                      Không tìm thấy bệnh nhân phù hợp. Bạn vẫn có thể nhập tay.
                    </div>
                  </div>
                </div>
                <span v-if="companion.patientId" class="af-selected-patient">Đã chọn bệnh nhân {{ companion.patientCode || `#${companion.patientId}` }}</span>
              </label>
              <label class="af-fld">
                <span class="af-lbl">Quan hệ</span>
                <input v-model="companion.relationship" type="text" class="af-inp" placeholder="Gia đình, bạn bè..." />
              </label>
              <label class="af-fld">
                <span class="af-lbl">Số điện thoại</span>
                <input v-model="companion.phoneNumber" type="text" class="af-inp" placeholder="SĐT liên hệ nếu cần" />
              </label>
              <label class="af-fld af-full">
                <span class="af-lbl">Lý do khám sơ bộ <span class="af-req">*</span></span>
                <textarea v-model="companion.reason" class="af-area" rows="2" required placeholder="Triệu chứng hoặc nhu cầu khám của người này..."></textarea>
              </label>
            </div>
          </section>
        </div>
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
import { Trash2 } from 'lucide-vue-next'
import { authApi } from '@/services/authApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import type { CreateAppointmentRequest } from '@/types/appointment'
import type { Patient } from '@/types/medicalRecord'

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
  examFee?: number
  layout?: 'stacked' | 'inline' | 'wide'
  showBack?: boolean
  submitLabel?: string
}>(), {
  layout: 'stacked',
  showBack: true,
  submitLabel: 'XÁC NHẬN',
  examFee: 0,
})

interface CompanionForm {
  key: number
  patientId?: number
  patientCode?: string
  fullName: string
  relationship: string
  phoneNumber: string
  reason: string
}

interface PatientSummary {
  name: string
}

const emit = defineEmits<{
  submit: [payload: CreateAppointmentRequest]
  back: []
  patientCountChange: [count: number]
  patientSummaryChange: [patients: PatientSummary[]]
}>()

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
  supportNeeds: [] as string[],
  supportOther: '',
  supportDescription: '',
  companions: [] as CompanionForm[],
})
const phoneError = ref('')
const phoneValidating = ref(false)
const companionKey = ref(0)
const patientsLoading = ref(false)
const patientsLoaded = ref(false)
const activeCompanionKey = ref<number | null>(null)
const patientOptions = ref<Patient[]>([])
const lastPatientLookupKeyword = ref('')
const pendingPatientLookupKeyword = ref('')

const supportOptions = [
  { value: 'wheelchair', label: 'Cần xe lăn' },
  { value: 'companion', label: 'Có người đi cùng' },
  { value: 'staff', label: 'Cần nhân viên hỗ trợ' },
  { value: 'mobility', label: 'Người cao tuổi / khó đi lại' },
  { value: 'other', label: 'Khác' },
]

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

const patientCount = computed(() => 1 + form.companions.length)
const patientSummaries = computed<PatientSummary[]>(() => [
  { name: form.patientNameSnapshot.trim() || 'Người khám chính' },
  ...form.companions.map((item, index) => ({
    name: item.fullName.trim() || `Người khác ${index + 1}`,
  })),
])
const companionsValid = computed(() =>
  form.companions.every((item) => item.fullName.trim() && item.reason.trim()),
)

watch(patientCount, (count) => emit('patientCountChange', count), { immediate: true })
watch(patientSummaries, (patients) => emit('patientSummaryChange', patients), { immediate: true })

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
  companionsValid.value &&
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
    reason: buildReason(),
    patients: buildPatients(),
    supportNeeds: supportLabels(),
    supportDescription: form.supportDescription.trim() || undefined,
    totalEstimatedFee: Number(props.examFee || 0) * patientCount.value,
  })
}

function addCompanion() {
  companionKey.value += 1
  form.companions.push({
    key: companionKey.value,
    patientId: undefined,
    patientCode: '',
    fullName: '',
    relationship: '',
    phoneNumber: '',
    reason: '',
  })
  if (!form.supportNeeds.includes('companion')) form.supportNeeds.push('companion')
}

function removeCompanion(index: number) {
  form.companions.splice(index, 1)
}

function buildReason() {
  const lines: string[] = []
  const note = form.reason.trim()
  if (note) lines.push(note)

  const labels = supportLabels()
  if (labels.length) lines.push(`Nhu cầu hỗ trợ: ${labels.join(', ')}`)
  if (form.supportDescription.trim()) lines.push(`Mô tả hỗ trợ: ${form.supportDescription.trim()}`)

  const companionSummaries = form.companions
    .filter((item) => item.fullName.trim() || item.relationship.trim() || item.phoneNumber.trim() || item.reason.trim())
    .map((item, index) => {
      const details = [
        item.fullName.trim() || `Người khác ${index + 1}`,
        item.relationship.trim() ? `Quan hệ: ${item.relationship.trim()}` : '',
        item.phoneNumber.trim() ? `SĐT: ${item.phoneNumber.trim()}` : '',
        item.reason.trim() ? `Lý do khám: ${item.reason.trim()}` : '',
      ].filter(Boolean)
      return details.join(' - ')
    })
  if (companionSummaries.length) {
    lines.push(`Người đi cùng/người thân:\n${companionSummaries.map((item) => `- ${item}`).join('\n')}`)
  }

  return lines.length ? lines.join('\n') : undefined
}

function supportLabels(): string[] {
  return form.supportNeeds
    .map((value) => {
      if (value === 'other') return form.supportOther.trim()
      return supportOptions.find((option) => option.value === value)?.label || ''
    })
    .filter((value): value is string => Boolean(value))
}

function buildPatients() {
  const patientId = Number(form.patientId)
  return [
    {
      ...(Number.isFinite(patientId) && patientId > 0 ? { patientId } : {}),
      fullName: form.patientNameSnapshot.trim(),
      phoneNumber: form.patientPhoneSnapshot.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      citizenId: form.citizenId.trim() || undefined,
      email: form.email.trim() || undefined,
      insuranceStatus: form.insuranceStatus || undefined,
      reason: form.reason.trim() || undefined,
      isPrimary: true,
    },
    ...form.companions
      .filter((item) => item.fullName.trim() || item.phoneNumber.trim() || item.reason.trim())
      .map((item) => ({
        ...(Number(item.patientId) > 0 ? { patientId: Number(item.patientId) } : {}),
        fullName: item.fullName.trim(),
        phoneNumber: item.phoneNumber.trim() || undefined,
        relationship: item.relationship.trim() || undefined,
        reason: item.reason.trim() || undefined,
        isPrimary: false,
      })),
  ]
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

async function ensurePatientsLoaded(keyword = '') {
  const lookupKeyword = keyword.trim()
  if (patientsLoading.value) {
    pendingPatientLookupKeyword.value = lookupKeyword
    return
  }
  if (patientsLoaded.value && normalizeLookup(lastPatientLookupKeyword.value) === normalizeLookup(lookupKeyword)) return
  patientsLoading.value = true
  pendingPatientLookupKeyword.value = ''
  try {
    const [medicalPatients, authPatients] = await Promise.all([
      medicalRecordApi.lookupPatientsForBooking({ keyword: lookupKeyword || undefined, limit: 30 })
        .catch(() => medicalRecordApi.getPatients({ keyword: lookupKeyword || undefined, pageSize: 30 }))
        .catch(() => [] as Patient[]),
      authApi.getUsers()
        .then((users) => users
          .filter((user) => Number(user.roleId) === 4 || String(user.roleName || '').toLowerCase() === 'patient')
          .map((user) => ({
            patientId: user.patientId || '',
            id: user.patientId || undefined,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
          }) as Patient))
        .catch(() => [] as Patient[]),
    ])
    patientOptions.value = mergePatientOptions([...medicalPatients, ...authPatients])
    patientsLoaded.value = true
    lastPatientLookupKeyword.value = lookupKeyword
  } catch {
    patientOptions.value = []
  } finally {
    patientsLoading.value = false
    const pendingKeyword = pendingPatientLookupKeyword.value
    if (pendingKeyword && normalizeLookup(pendingKeyword) !== normalizeLookup(lastPatientLookupKeyword.value)) {
      void ensurePatientsLoaded(pendingKeyword)
    }
  }
}

function openCompanionPatientSearch(companion: CompanionForm) {
  activeCompanionKey.value = companion.key
  void ensurePatientsLoaded(companion.fullName)
}

function closeCompanionPatientSearch() {
  window.setTimeout(() => {
    activeCompanionKey.value = null
  }, 120)
}

function handleCompanionNameInput(companion: CompanionForm) {
  companion.patientId = undefined
  companion.patientCode = ''
  void ensurePatientsLoaded(companion.fullName)
}

function companionPatientMatches(companion: CompanionForm) {
  const keyword = normalizeLookup(companion.fullName)
  const candidates = patientOptions.value
    .filter((patient) => !isSelectedPatientForAnotherCompanion(companion, patient))
    .filter((patient) => {
      if (!keyword) return true
      return [
        patient.fullName,
        patient.patientCode,
        patient.patientIdCode,
        patient.phoneNumber,
        patient.phone,
        patient.citizenId,
      ].some((value) => normalizeLookup(value).includes(keyword))
    })

  return candidates.slice(0, 8)
}

function selectCompanionPatient(companion: CompanionForm, patient: Patient) {
  companion.patientId = Number(patient.patientId || patient.id) || undefined
  companion.patientCode = patientCode(patient)
  companion.fullName = patient.fullName || companion.fullName
  companion.phoneNumber = patientPhone(patient) || companion.phoneNumber
  activeCompanionKey.value = null
}

function isSelectedPatientForAnotherCompanion(companion: CompanionForm, patient: Patient) {
  const patientId = Number(patient.patientId || patient.id)
  if (!patientId) return false
  return form.companions.some((item) => item.key !== companion.key && Number(item.patientId) === patientId)
}

function patientOptionKey(patient: Patient) {
  return String(patient.patientId || patient.id || patient.patientCode || patient.fullName)
}

function patientCode(patient: Patient) {
  return String(patient.patientCode || patient.patientIdCode || patient.patientId || patient.id || '')
}

function patientPhone(patient: Patient) {
  return String(patient.phoneNumber || patient.phone || '').trim()
}

function normalizeLookup(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function mergePatientOptions(patients: Patient[]) {
  const map = new Map<string, Patient>()
  for (const patient of patients) {
    if (!patient?.fullName) continue
    const key = [
      patient.patientId || patient.id,
      patient.patientCode || patient.patientIdCode,
      patient.phoneNumber || patient.phone,
      normalizeLookup(patient.fullName),
    ].filter(Boolean).join('|')
    const existing = map.get(key)
    map.set(key, {
      ...(existing || {}),
      ...patient,
      patientId: String(patient.patientId || existing?.patientId || patient.id || ''),
      id: patient.id || existing?.id || patient.patientId,
      phoneNumber: patient.phoneNumber || patient.phone || existing?.phoneNumber || existing?.phone,
      patientCode: patient.patientCode || patient.patientIdCode || existing?.patientCode || existing?.patientIdCode,
    })
  }
  return Array.from(map.values()).sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || ''), 'vi'))
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
  font-weight: 500;
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
  font-weight: 400;
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

.af-support {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #eef3f8;
  padding-top: 2px;
}

.af-support-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.af-support-head h3 {
  margin: 0;
  color: #10233f;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
}

.af-support-head p {
  margin: 3px 0 0;
  color: #7b8ba2;
  font-size: 11px;
  line-height: 1.45;
}

.af-support-options {
  display: flex;
  flex-wrap: wrap;
  gap: 9px 12px;
  align-items: center;
}

.af-check {
  position: relative;
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 5px 8px;
  color: #51617a;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.af-check:hover,
.af-check.is-checked {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #0f52ba;
}

.af-check input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.af-check span {
  width: 15px;
  height: 15px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  box-shadow: inset 0 0 0 2px #fff;
}

.af-check.is-checked span {
  border-color: #0f52ba;
  background: #0f52ba;
}

.af-other-input {
  width: min(100%, 220px);
  height: 32px;
  font-size: 12px;
}

.af-add-companion {
  display: flex;
  width: 100%;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed #b9c8dc;
  border-radius: 8px;
  background: #fbfdff;
  color: #0f52ba;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.af-add-companion:hover {
  border-color: #0f52ba;
  background: #f0f7ff;
  box-shadow: 0 8px 18px rgba(15, 82, 186, 0.08);
}

.af-add-companion span {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
}

.af-add-companion b {
  font-size: 12px;
  font-weight: 500;
}

.af-add-companion small {
  color: #7b8ba2;
  font-size: 11px;
  font-weight: 400;
}

.af-add-icon {
  width: 18px;
  height: 18px;
}

.af-companion-list {
  display: grid;
  gap: 10px;
}

.af-companion-card {
  border: 1px solid #e5edf6;
  border-radius: 8px;
  background: #f8fbff;
  padding: 12px;
}

.af-companion-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.af-companion-title b {
  color: #10233f;
  font-size: 12px;
  font-weight: 600;
}

.af-companion-remove {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: #fee2e2;
  color: #dc2626;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.af-companion-remove:hover {
  background: #fecaca;
  color: #b91c1c;
}

.af-remove-icon {
  width: 15px;
  height: 15px;
}

.af-companion-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr;
  gap: 12px;
}

.af-patient-combobox {
  position: relative;
}

.af-patient-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  width: min(460px, 100%);
  max-height: 174px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #dbe7f5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.af-patient-menu::-webkit-scrollbar {
  width: 6px;
}

.af-patient-menu::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}

.af-patient-menu::-webkit-scrollbar-track {
  background: transparent;
}

.af-patient-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  width: 100%;
  align-items: center;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid #eef3f8;
  background: #fff;
  min-height: 58px;
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.af-patient-option:last-child {
  border-bottom: 0;
}

.af-patient-option:hover {
  background: #f0f7ff;
}

.af-patient-option span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.af-patient-option b {
  overflow: hidden;
  color: #10233f;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.af-patient-option small,
.af-patient-option em {
  color: #71819a;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
}

.af-patient-option em {
  color: #667996;
  white-space: nowrap;
}

.af-patient-empty {
  padding: 12px;
  color: #71819a;
  font-size: 12px;
  font-weight: 400;
}

.af-selected-patient {
  align-self: flex-start;
  border-radius: 999px;
  background: #e0f2fe;
  padding: 3px 8px;
  color: #0369a1;
  font-size: 10px;
  font-weight: 600;
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

  .af-support-options {
    align-items: stretch;
    flex-direction: column;
  }

  .af-check,
  .af-other-input {
    width: 100%;
  }

  .af-companion-grid {
    grid-template-columns: 1fr;
  }

  .af-back,
  .af-submit {
    width: 100%;
  }
}
</style>
