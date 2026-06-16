<template>
  <div class="booking-page">
    <section class="booking-hero">
      <h1 class="booking-title">MedicareDNU - ĐẶT LỊCH KHÁM</h1>
      <p class="booking-subtitle">Đặt lịch khám theo chuyên khoa, bác sĩ và khung giờ còn trống.</p>

      <div class="booking-steps" aria-label="Tiến trình đặt lịch">
        <div v-for="(step, index) in steps" :key="step.value" class="booking-step">
          <span :class="['step-line', index === 0 ? 'is-hidden' : '', cur >= step.value ? 'is-active' : '']"></span>
          <span :class="['step-dot', cur > step.value ? 'is-done' : cur === step.value ? 'is-current' : '']">
            <Check v-if="cur > step.value" class="step-check" />
            <span v-else>{{ step.value }}</span>
          </span>
          <span :class="['step-line', index === steps.length - 1 ? 'is-hidden' : '', cur > step.value ? 'is-active' : '']"></span>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>
    </section>

    <div class="booking-layout">
      <main class="booking-main">
        <section class="booking-card">
          <div class="section-heading">
            <span class="section-number">1</span>
            <h2>CHỌN CHUYÊN KHOA &amp; NGÀY</h2>
          </div>

          <div class="field-grid field-grid-two">
            <label class="field">
              <span>Chuyên khoa</span>
              <span class="select-frame">
                <select v-model="selectedSpecialty">
                  <option value="">Chọn chuyên khoa</option>
                  <option v-for="option in specialtyOptions" :key="String(option.value)" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <ChevronDown class="select-icon" />
              </span>
            </label>

            <label class="field">
              <span>Ngày khám</span>
              <input v-model="selectedDate" type="date" :min="today" />
            </label>
          </div>

          <p v-if="apiMessage" class="api-message">{{ apiMessage }}</p>
        </section>

        <section class="booking-card">
          <div class="section-heading">
            <span class="section-number">2</span>
            <div>
              <h2>CHỌN BÁC SĨ</h2>
              <p class="section-note">Chọn bác sĩ đang nhận lịch theo chuyên khoa đã chọn.</p>
            </div>
          </div>

          <div v-if="!selectedSpecialty" class="empty-panel">
            <UserRound class="empty-icon" />
            <span>Chưa chọn chuyên khoa</span>
          </div>

          <div v-else-if="specialtyDoctors.length" class="doctor-grid">
            <article
              v-for="item in visibleDoctors"
              :key="item.doctorId"
              :class="['doctor-card', isSelectedDoctor(item) ? 'is-selected' : '']"
            >
              <button class="doctor-card-hit" type="button" :aria-label="`Chọn ${displayDoctorTitle(item)}`" @click="selectDoctorForSchedule(item)"></button>
              <span v-if="isSelectedDoctor(item)" class="doctor-selected-mark">
                <Check class="selected-icon" />
              </span>

              <div class="doctor-top">
                <img class="doctor-avatar" :src="doctorAvatarUrl(item)" :alt="doctorName(item)" />
                <div class="doctor-copy">
                  <h3>{{ displayDoctorTitle(item) }}</h3>
                  <p>{{ displayText(item.specialtyName) }}</p>
                </div>
              </div>

              <dl class="doctor-meta">
                <div>
                  <BadgeCheck class="meta-icon" />
                  <span>{{ item.experienceYears ? `${item.experienceYears} năm kinh nghiệm` : 'Kinh nghiệm chưa cập nhật' }}</span>
                </div>
                <div>
                  <GraduationCap class="meta-icon" />
                  <span>{{ item.degree || 'Bác sĩ chuyên khoa' }}</span>
                </div>
                <div v-if="item.roomNumber">
                  <DoorOpen class="meta-icon" />
                  <span>Phòng {{ item.roomNumber }}</span>
                </div>
              </dl>

              <div class="doctor-bottom">
                <span>Phí khám: <b>{{ formatCurrency(item.examFee || 0) }}</b></span>
                <div class="doctor-actions">
                  <button type="button" class="ghost-action" @click.stop="activeDetailDoctor = item">Thông tin bác sĩ</button>
                  <button type="button" class="choose-action" @click.stop="selectDoctorForSchedule(item)">
                    {{ isSelectedDoctor(item) ? 'Đang chọn' : 'Chọn bác sĩ' }}
                  </button>
                </div>
              </div>
            </article>

            <button v-if="hiddenDoctorCount > 0" type="button" class="more-doctors-card" @click="showAllDoctors = true">
              <Grid2X2 class="more-icon" />
              <span>Xem thêm bác sĩ</span>
              <small>Còn {{ hiddenDoctorCount }} bác sĩ phù hợp</small>
            </button>
          </div>

          <div v-else class="empty-panel">
            <UserRound class="empty-icon" />
            <span>Chưa có bác sĩ phù hợp</span>
          </div>
        </section>

        <section class="booking-card">
          <div class="section-heading">
            <span class="section-number">3</span>
            <div>
              <h2>CHỌN KHUNG GIỜ</h2>
              <p class="section-note">{{ doctor ? `${displayDoctorTitle(doctor)} · ${formatDisplayDate(selectedDate)}` : 'Chưa chọn bác sĩ' }}</p>
            </div>
          </div>

          <SlotPicker
            v-model="selectedSlot"
            :slots="slots"
            :all-slots="displaySlots"
            :booked-slots="bookedSlots"
            :selected-date="selectedDate"
            :loading="loadingSlots"
            :empty-message="slotEmptyMessage"
          />
        </section>

        <section class="booking-card">
          <div class="section-heading">
            <span class="section-number">4</span>
            <div>
              <h2>THÔNG TIN BỆNH NHÂN</h2>
              <p class="section-note section-note-blue">Kiểm tra và xác nhận thông tin.</p>
            </div>
          </div>

          <AppointmentForm
            layout="wide"
            submit-label="Xác nhận"
            :doctor-id="doctor?.doctorId || 0"
            :appointment-date="selectedDate"
            :slot-time="selectedSlot"
            :loading="submitting"
            :initial-patient-id="bookingPatientId"
            :initial-patient-name="bookingPatientName"
            :initial-patient-phone="bookingPatientPhone"
            :initial-date-of-birth="bookingPatientDateOfBirth"
            :initial-gender="bookingPatientGender"
            :initial-citizen-id="bookingPatientCitizenId"
            :initial-email="bookingPatientEmail"
            @submit="submitBooking"
            @back="goBackFromStep4"
          />
        </section>
      </main>

      <aside class="booking-aside">
        <section class="summary-card">
          <h2><Pin class="summary-title-icon" /> THÔNG TIN ĐẶT KHÁM</h2>

          <div class="summary-list">
            <div class="summary-row">
              <span class="summary-icon"><Stethoscope /></span>
              <div>
                <small>Chuyên khoa</small>
                <b>{{ selectedSpecialtyName }}</b>
              </div>
            </div>
            <div class="summary-row">
              <span class="summary-icon avatar-icon">
                <img v-if="doctor" :src="doctorAvatarUrl(doctor)" :alt="doctorName(doctor)" />
                <UserRound v-else />
              </span>
              <div>
                <small>Bác sĩ</small>
                <b>{{ selectedDoctorName }}</b>
              </div>
            </div>
            <div class="summary-row">
              <span class="summary-icon"><CalendarDays /></span>
              <div>
                <small>Ngày khám</small>
                <b>{{ selectedDateLong }}</b>
              </div>
            </div>
            <div class="summary-row">
              <span class="summary-icon"><Clock3 /></span>
              <div>
                <small>Khung giờ</small>
                <b>{{ selectedSlot || 'Chưa chọn' }}</b>
              </div>
            </div>
            <div class="summary-row">
              <span class="summary-icon"><MessagesSquare /></span>
              <div>
                <small>Hình thức khám</small>
                <b>Khám tại bệnh viện</b>
              </div>
            </div>
          </div>

          <div class="fee-box">
            <span>CHI PHÍ DỰ KIẾN</span>
            <strong>{{ formatCurrency(doctor?.examFee || 0) }}</strong>
            <p>*Chi phí có thể thay đổi tùy theo chỉ định của bác sĩ</p>
          </div>
        </section>

        <section class="summary-card note-card">
          <h2><Info class="summary-title-icon" /> LƯU Ý KHI ĐẾN KHÁM</h2>
          <ul>
            <li><CheckCircle2 /> Đến trước giờ hẹn 15 phút</li>
            <li><CheckCircle2 /> Mang theo CCCD/CMND</li>
            <li><CheckCircle2 /> Mang theo thẻ BHYT nếu có</li>
            <li><CheckCircle2 /> Nếu không đến, vui lòng hủy lịch trước 2 giờ</li>
          </ul>
        </section>

        <section class="summary-card support-card">
          <div>
            <h2>CẦN HỖ TRỢ?</h2>
            <p>Đội ngũ CSKH luôn sẵn sàng hỗ trợ bạn</p>
            <button type="button" class="support-button">
              <Headphones class="support-icon" />
              Liên hệ ngay
            </button>
          </div>
        </section>
      </aside>
    </div>

    <Toast :show="toast.show" :title="toast.title" :message="toast.message" :type="toast.type" @close="toast.show = false" />
    <DoctorDetailModal :doctor="activeDetailDoctor" enable-select @close="activeDetailDoctor = null" @select="handleSelectDoctorFromModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DoorOpen,
  GraduationCap,
  Grid2X2,
  Headphones,
  Info,
  MessagesSquare,
  Pin,
  Stethoscope,
  UserRound,
} from 'lucide-vue-next'
import AppointmentForm from '@/components/booking/AppointmentForm.vue'
import DoctorDetailModal from '@/components/booking/DoctorDetailModal.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import Toast from '@/components/ui/Toast.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { getApiErrorMessage } from '@/services/apiClient'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { useAuthStore } from '@/stores/authStore'
import type { CreateAppointmentRequest } from '@/types/appointment'
import type { Doctor } from '@/types/doctor'
import type { Patient } from '@/types/medicalRecord'
import type { Specialty } from '@/types/specialty'
import { displayText } from '@/utils/displayText'
import { doctorAvatarUrl } from '@/utils/doctorAvatar'

const route = useRoute()
const authStore = useAuthStore()

const doctors = ref<Doctor[]>([])
const specialties = ref<Specialty[]>([])
const patientProfile = ref<Patient | null>(null)
const selectedSpecialty = ref('')
const selectedDoctor = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSlot = ref('')
const activeDetailDoctor = ref<Doctor | null>(null)
const showAllDoctors = ref(false)
const slots = ref<string[]>([])
const bookedSlots = ref<string[]>([])
const slotsChecked = ref(false)
const loadingSlots = ref(false)
const submitting = ref(false)
const apiMessage = ref('')
const today = new Date().toISOString().slice(0, 10)
const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })

const steps = [
  { value: 1, label: 'Chọn chuyên khoa' },
  { value: 2, label: 'Chọn bác sĩ' },
  { value: 3, label: 'Chọn giờ' },
  { value: 4, label: 'Thông tin' },
]

const cur = computed(() => {
  if (selectedSlot.value) return 4
  if (selectedDoctor.value) return 3
  if (selectedSpecialty.value) return 2
  return 1
})

const specialtyOptions = computed(() =>
  specialties.value.map((specialty) => ({
    label: displayText(specialty.specialtyName),
    value: specialty.specialtyId,
  })),
)
const filteredDoctors = computed(() =>
  selectedSpecialty.value ? doctors.value.filter((item) => item.specialtyId === Number(selectedSpecialty.value)) : doctors.value,
)
const specialtyDoctors = computed(() => (selectedSpecialty.value ? filteredDoctors.value.filter((item) => item.isActive !== false) : []))
const visibleDoctors = computed(() => (showAllDoctors.value ? specialtyDoctors.value : specialtyDoctors.value.slice(0, 3)))
const hiddenDoctorCount = computed(() => Math.max(specialtyDoctors.value.length - visibleDoctors.value.length, 0))
const doctor = computed(() => doctors.value.find((item) => item.doctorId === Number(selectedDoctor.value)) || null)
const displaySlots = computed(() => mergeSlots(slots.value, bookedSlots.value))
const selectedSpecialtyName = computed(() => {
  const specialty = specialties.value.find((item) => item.specialtyId === Number(selectedSpecialty.value))
  return displayText(specialty?.specialtyName || doctor.value?.specialtyName || '') || 'Chưa chọn'
})
const selectedDoctorName = computed(() => (doctor.value ? displayDoctorTitle(doctor.value) : 'Chưa chọn'))
const selectedDateLong = computed(() => formatLongDate(selectedDate.value))
const slotEmptyMessage = computed(() => {
  if (!selectedSpecialty.value) return 'Chọn chuyên khoa để xem bác sĩ.'
  if (!selectedDoctor.value) return 'Chọn bác sĩ để xem lịch trống.'
  if (!slotsChecked.value) return 'Đang tải lịch trống...'
  return 'Không có khung giờ trống.'
})

const bookingPatientId = computed(() => (authStore.isPatient ? patientProfile.value?.patientId || authStore.user?.patientId : undefined))
const bookingPatientName = computed(() => (authStore.isPatient ? patientProfile.value?.fullName || authStore.user?.fullName || '' : ''))
const bookingPatientPhone = computed(() => (authStore.isPatient ? patientProfile.value?.phoneNumber || patientProfile.value?.phone || authStore.user?.phoneNumber || '' : ''))
const bookingPatientEmail = computed(() => (authStore.isPatient ? patientProfile.value?.email || authStore.user?.email || '' : ''))
const bookingPatientDateOfBirth = computed(() => (authStore.isPatient ? patientProfile.value?.dateOfBirth || '' : ''))
const bookingPatientGender = computed(() => (authStore.isPatient ? patientProfile.value?.gender || '' : ''))
const bookingPatientCitizenId = computed(() => (authStore.isPatient ? patientProfile.value?.citizenId || patientProfile.value?.patientIdCode || '' : ''))

watch(selectedSpecialty, () => {
  if (selectedDoctor.value && !filteredDoctors.value.some((item) => item.doctorId === Number(selectedDoctor.value))) {
    selectedDoctor.value = ''
  }
  showAllDoctors.value = false
  selectedSlot.value = ''
  slots.value = []
  bookedSlots.value = []
  slotsChecked.value = false
})

watch([selectedDoctor, selectedDate], ([doctorId, date]) => {
  selectedSlot.value = ''
  slots.value = []
  bookedSlots.value = []
  slotsChecked.value = false
  apiMessage.value = ''
  if (doctorId && date) void findSlots()
})

onMounted(async () => {
  await Promise.all([loadCatalog(), loadPatientProfile()])
})

async function loadCatalog() {
  apiMessage.value = ''
  try {
    const [doctorData, specialtyData] = await Promise.all([
      appointmentApi.getDoctors(),
      appointmentApi.getSpecialties(),
    ])
    doctors.value = doctorData
    specialties.value = specialtyData
    if (!doctorData.length || !specialtyData.length) apiMessage.value = 'Chưa có đủ dữ liệu đặt lịch từ hệ thống.'
  } catch (error) {
    doctors.value = []
    specialties.value = []
    apiMessage.value = getApiErrorMessage(error)
  }

  const queryDoctorId = Number(route.query.doctorId)
  if (queryDoctorId) {
    const queryDoctor = doctors.value.find((item) => item.doctorId === queryDoctorId)
    if (queryDoctor) {
      selectedDoctor.value = String(queryDoctor.doctorId)
      selectedSpecialty.value = String(queryDoctor.specialtyId)
    }
  }
}

async function loadPatientProfile() {
  if (!authStore.isPatient) return
  try {
    patientProfile.value = await medicalRecordApi.getCurrentPatient()
  } catch {
    patientProfile.value = null
  }
}

async function findSlots() {
  if (!selectedDoctor.value || !selectedDate.value) return
  loadingSlots.value = true
  selectedSlot.value = ''
  apiMessage.value = ''

  try {
    const [availableSlots, booked] = await Promise.all([
      appointmentApi.getAvailableSlots(Number(selectedDoctor.value), selectedDate.value),
      appointmentApi.getBookedSlots(Number(selectedDoctor.value), selectedDate.value).catch(() => []),
    ])
    slots.value = availableSlots
    bookedSlots.value = booked
    slotsChecked.value = true
  } catch (error) {
    slots.value = []
    bookedSlots.value = []
    slotsChecked.value = true
    apiMessage.value = getApiErrorMessage(error)
  } finally {
    loadingSlots.value = false
  }
}

async function submitBooking(payload: CreateAppointmentRequest) {
  submitting.value = true
  try {
    const latestSlots = await appointmentApi.getAvailableSlots(payload.doctorId, payload.appointmentDate)
    if (!latestSlots.map((slot) => slot.slice(0, 5)).includes(payload.slotTime.slice(0, 5))) {
      selectedSlot.value = ''
      await findSlots()
      throw new Error('Khung giờ vừa được đặt. Vui lòng chọn khung giờ khác.')
    }

    const appointment = await appointmentApi.createAppointment(payload)
    toast.title = 'Đặt lịch thành công'
    toast.message = `Mã lịch hẹn: ${appointment.appointmentId || 'đang cập nhật'}`
    toast.type = 'success'
    toast.show = true
    await findSlots()
  } catch (error) {
    toast.title = 'Không đặt được lịch'
    toast.message = getApiErrorMessage(error)
    toast.type = 'error'
    toast.show = true
  } finally {
    submitting.value = false
  }
}

function goBackFromStep4() {
  selectedSlot.value = ''
}

function doctorName(item?: Doctor | null) {
  return displayText(item?.doctorName || item?.fullName || '')
}

function displayDoctorTitle(item?: Doctor | null) {
  const name = doctorName(item)
  if (!name) return 'BS chưa cập nhật'
  return name.toLowerCase().startsWith('bs') ? name : `BS. ${name}`
}

function isSelectedDoctor(item: Doctor) {
  return Number(selectedDoctor.value) === item.doctorId
}

function selectDoctorForSchedule(item: Doctor) {
  const alreadySelected = isSelectedDoctor(item)
  selectedDoctor.value = String(item.doctorId)
  if (alreadySelected) void findSlots()
}

function handleSelectDoctorFromModal(item: Doctor) {
  selectDoctorForSchedule(item)
  activeDetailDoctor.value = null
}

function mergeSlots(...groups: string[][]) {
  return [...new Set(groups.flat().map((slot) => String(slot || '').slice(0, 5)).filter(Boolean))].sort()
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

function formatDisplayDate(value: string) {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatLongDate(value: string) {
  if (!value) return 'Chưa chọn'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
</script>

<style scoped>
.booking-page {
  width: 100%;
  color: #10233f;
  font-weight: 400;
}

.booking-hero {
  padding: 2px 0 8px;
  text-align: center;
}

.booking-title {
  margin: 0;
  color: #0f52ba;
  font-size: 23px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: 0;
}

.booking-subtitle {
  margin: 4px 0 14px;
  color: #6b7b94;
  font-size: 13px;
  line-height: 1.2;
}

.booking-steps {
  display: flex;
  justify-content: center;
  max-width: 620px;
  margin: 0 auto;
}

.booking-step {
  display: grid;
  grid-template-columns: minmax(34px, 1fr) 26px minmax(34px, 1fr);
  grid-template-rows: 26px auto;
  align-items: center;
  min-width: 130px;
}

.step-line {
  height: 2px;
  background: #d7e0ed;
}

.step-line.is-active {
  background: #0f52ba;
}

.step-line.is-hidden {
  visibility: hidden;
}

.step-dot {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid #cfd9ea;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  font-size: 11px;
}

.step-dot.is-current,
.step-dot.is-done {
  border-color: #0f52ba;
  background: #0f52ba;
  color: #fff;
}

.step-check {
  width: 13px;
  height: 13px;
}

.step-label {
  grid-column: 1 / 4;
  color: #243b61;
  font-size: 10px;
  line-height: 1.1;
}

.booking-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 282px;
  gap: 14px;
  align-items: start;
}

.booking-main,
.booking-aside {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.booking-aside {
  position: sticky;
  top: 8px;
  gap: 8px;
}

.booking-card,
.summary-card {
  border: 1px solid #dbe4f1;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
}

.booking-card {
  padding: 8px 12px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 7px;
}

.section-number {
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: #0f52ba;
  color: #fff;
  font-size: 11px;
}

.section-heading h2 {
  margin: 1px 0 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0;
}

.section-note {
  margin: 1px 0 0;
  color: #66799a;
  font-size: 10px;
  line-height: 1.2;
}

.section-note-blue {
  color: #0f52ba;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid-two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: #334155;
  font-size: 10.5px;
}

.field input,
.field select {
  width: 100%;
  height: 30px;
  border: 1px solid #cbd6e6;
  border-radius: 6px;
  background: #fff;
  color: #0f172a;
  font-size: 12px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.field input {
  padding: 0 10px;
}

.field select {
  appearance: none;
  padding: 0 30px 0 10px;
}

.field input:focus,
.field select:focus {
  border-color: #0f52ba;
  box-shadow: 0 0 0 2px rgba(15, 82, 186, 0.08);
}

.select-frame {
  position: relative;
  display: block;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 14px;
  height: 14px;
  color: #71829e;
  pointer-events: none;
  transform: translateY(-50%);
}

.api-message {
  margin: 6px 0 0;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  padding: 5px 8px;
  color: #1d4ed8;
  font-size: 10.5px;
}

.empty-panel {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed #d8e2f0;
  border-radius: 7px;
  background: #f8fbff;
  color: #708199;
  font-size: 11px;
}

.empty-icon {
  width: 15px;
  height: 15px;
  color: #afbdd0;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.doctor-card {
  position: relative;
  min-height: 176px;
  overflow: visible;
  border: 1px solid #dbe4f1;
  border-radius: 10px;
  background: #fff;
  padding: 14px;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.doctor-card:hover {
  border-color: #8cb6ff;
  box-shadow: 0 10px 20px rgba(15, 82, 186, 0.08);
  transform: translateY(-1px);
}

.doctor-card.is-selected {
  border-color: #0f52ba;
  box-shadow: 0 0 0 1px #0f52ba;
}

.doctor-card-hit {
  position: absolute;
  inset: 0;
  z-index: 1;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.doctor-selected-mark {
  position: absolute;
  right: 7px;
  top: 7px;
  z-index: 3;
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #0f52ba;
  color: #fff;
}

.selected-icon {
  width: 12px;
  height: 12px;
}

.doctor-top,
.doctor-meta,
.doctor-bottom {
  position: relative;
  z-index: 2;
}

.doctor-top {
  display: flex;
  gap: 12px;
  align-items: center;
}

.doctor-avatar {
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid #edf3fb;
  background: #f3f7fb;
}

.doctor-copy {
  min-width: 0;
}

.doctor-copy h3 {
  margin: 0;
  color: #10215c;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.18;
}

.doctor-copy p {
  margin: 2px 0 0;
  color: #34527d;
  font-size: 13px;
  line-height: 1.15;
}

.doctor-meta {
  display: grid;
  gap: 7px;
  margin: 13px 0;
  color: #36506f;
  font-size: 13px;
}

.doctor-meta div {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.doctor-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-icon {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  color: #0f52ba;
}

.doctor-bottom {
  display: flex;
  align-items: stretch;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #eef3f9;
  padding-top: 10px;
  color: #425875;
  font-size: 13px;
}

.doctor-bottom b {
  color: #0f52ba;
}

.doctor-actions {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.ghost-action,
.choose-action {
  position: relative;
  z-index: 4;
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  padding: 0 11px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
}

.ghost-action {
  border: 1px solid #d7e3f5;
  background: #fff;
  color: #5c7394;
}

.ghost-action:hover {
  color: #0f52ba;
}

.choose-action {
  border: 1px solid #0f52ba;
  background: #0f52ba;
  color: #fff;
  box-shadow: 0 10px 18px rgba(15, 82, 186, 0.15);
}

.doctor-card.is-selected .choose-action,
.choose-action:hover {
  background: #0b4296;
  color: #fff;
}

.more-doctors-card {
  display: flex;
  min-height: 124px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #dbe4f1;
  border-radius: 7px;
  background: linear-gradient(180deg, #fff, #fbfdff);
  color: #1d3c6a;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease;
}

.more-doctors-card:hover {
  border-color: #0f52ba;
  color: #0f52ba;
}

.more-doctors-card small {
  color: #6b7b94;
  font-size: 10px;
}

.more-icon {
  width: 22px;
  height: 22px;
  color: #0f52ba;
}

.summary-card {
  padding: 11px 12px;
}

.summary-card h2 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 9px;
  color: #0e1b35;
  font-size: 12px;
  line-height: 1.2;
}

.summary-title-icon {
  width: 13px;
  height: 13px;
  color: #0f52ba;
}

.summary-list {
  display: grid;
  gap: 8px;
}

.summary-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.summary-row small {
  display: block;
  margin-bottom: 1px;
  color: #7a8aa5;
  font-size: 10px;
  line-height: 1.1;
}

.summary-row b {
  display: block;
  color: #0f172a;
  font-size: 11.5px;
  line-height: 1.2;
}

.summary-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: #eef5ff;
  color: #0f52ba;
}

.summary-icon svg {
  width: 16px;
  height: 16px;
}

.summary-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  background: #f6f8fb;
}

.fee-box {
  margin-top: 10px;
  border-top: 1px solid #dbe4f1;
  padding-top: 9px;
}

.fee-box span {
  display: block;
  color: #0f172a;
  font-size: 11px;
}

.fee-box strong {
  display: block;
  margin-top: 4px;
  color: #0f52ba;
  font-size: 19px;
  line-height: 1.1;
}

.fee-box p {
  margin: 4px 0 0;
  color: #61738d;
  font-size: 10px;
  line-height: 1.3;
}

.note-card ul {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.note-card li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #334b6f;
  font-size: 11.5px;
  line-height: 1.45;
}

.note-card li svg {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  color: #0f52ba;
}

.support-card {
  position: relative;
  min-height: 92px;
  overflow: hidden;
}

.support-card h2 {
  margin-bottom: 6px;
  color: #0f52ba;
}

.support-card p {
  max-width: 156px;
  margin: 0 0 7px;
  color: #61738d;
  font-size: 10.5px;
  line-height: 1.3;
}

.support-button {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 6px;
  border: 1px solid #bfd6ff;
  border-radius: 7px;
  background: #fff;
  padding: 0 10px;
  color: #0f52ba;
  font-size: 10.5px;
  cursor: pointer;
}

.support-icon {
  width: 14px;
  height: 14px;
}

.booking-page :deep(.af-form) {
  gap: 12px;
}

.booking-page :deep(.af-fields) {
  gap: 12px 14px;
}

.booking-page :deep(.af-wide .af-fields) {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.booking-page :deep(.af-fld) {
  gap: 6px;
}

.booking-page :deep(.af-lbl) {
  font-size: 12px;
  font-weight: 400 !important;
  line-height: 1.1;
}

.booking-page :deep(.af-inp) {
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 400 !important;
}

.booking-page :deep(.af-area) {
  min-height: 48px;
  max-height: 64px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 400 !important;
}

.booking-page :deep(.af-actions) {
  margin-top: 0;
}

.booking-page :deep(.af-back),
.booking-page :deep(.af-submit) {
  height: 40px;
  min-width: 132px;
  border-radius: 6px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 400 !important;
}

.booking-page :deep(.slot-wrap) {
  gap: 8px;
}

.booking-page :deep(.slot-tabs) {
  gap: 6px;
}

.booking-page :deep(.slot-tab) {
  height: 36px;
  min-width: 116px;
  font-size: 13px;
  font-weight: 400 !important;
}

.booking-page :deep(.slot-grid),
.booking-page :deep(.slot-skeleton) {
  grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
  gap: 7px;
}

.booking-page :deep(.slot-button),
.booking-page :deep(.skeleton-slot) {
  height: 38px;
  font-size: 13px;
  font-weight: 400 !important;
}

.booking-page :deep(.slot-legend) {
  gap: 16px;
  font-size: 12px;
  font-weight: 400 !important;
}

.booking-page :deep(.slot-empty),
.booking-page :deep(.slot-empty-period) {
  min-height: 64px;
  font-size: 13px;
  font-weight: 400 !important;
}

@media (max-width: 1380px) {
  .doctor-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .booking-layout {
    grid-template-columns: 1fr;
  }

  .booking-aside {
    position: static;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .booking-step {
    min-width: 118px;
  }

  .doctor-grid,
  .booking-aside,
  .field-grid-two {
    grid-template-columns: 1fr;
  }

  .booking-page :deep(.af-wide .af-fields) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .booking-title {
    font-size: 16px;
  }

  .booking-steps {
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 3px;
  }

  .doctor-bottom {
    align-items: flex-start;
    flex-direction: column;
  }

  .booking-page :deep(.af-wide .af-fields) {
    grid-template-columns: 1fr;
  }
}
</style>
