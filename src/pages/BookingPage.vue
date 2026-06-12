<template>
  <section class="min-h-screen bg-[#f8fafc] py-6 sm:py-8">
    <div class="mx-auto max-w-none space-y-4 px-4 sm:px-6 lg:px-8">
      <header class="grid gap-4 px-1 pt-2 lg:grid-cols-[380px_1fr] lg:items-start">
      <div>
        <h1 class="text-[1.75rem] font-semibold tracking-normal text-slate-950">Đặt lịch khám</h1>
        <p class="mt-1.5 text-[13px] leading-5 text-slate-500">{{ bookingIntroText }}</p>
      </div>
      <div class="mt-1 grid grid-cols-4 items-start">
        <div v-for="(step, index) in bookingSteps" :key="step.value" class="relative flex flex-col items-center gap-1.5">
          <span
            v-if="index < bookingSteps.length - 1"
            class="absolute left-1/2 top-3.5 h-px w-full bg-[#0F52BA]"
            aria-hidden="true"
          ></span>
          <span
            :class="[
              'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition',
              currentStep >= step.value ? 'border-[#0F52BA] bg-[#0F52BA] text-white' : 'border-[#0F52BA] bg-white text-[#0F52BA]',
            ]"
          >
            <CheckCircle2 v-if="currentStep > step.value" class="h-4 w-4" />
            <span v-else>{{ step.value }}</span>
          </span>
          <span class="text-center text-xs font-bold text-slate-700">{{ step.label }}</span>
        </div>
      </div>
    </header>

    <div ref="patientInfoSection" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div class="mb-3 flex items-center gap-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-md bg-[#0F52BA] text-sm font-bold text-white">1</span>
        <h2 class="text-sm font-bold uppercase text-slate-900">Chọn chuyên khoa & ngày</h2>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <BaseSelect v-model="selectedSpecialty" label="Chuyên khoa" :options="specialtyOptions" placeholder="Chọn chuyên khoa" />
        <BaseInput v-model="selectedDate" label="Ngày khám" type="date" :min="today" />
      </div>
      <div v-if="apiMessage" class="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-[#003c90]">
        {{ apiMessage }}
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div class="mb-3 flex items-start gap-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-md bg-[#0F52BA] text-sm font-bold text-white">2</span>
        <div>
          <h2 class="text-sm font-bold uppercase text-slate-900">Chọn bác sĩ</h2>
          <p class="mt-0.5 text-xs font-semibold text-slate-500">{{ selectedSpecialty ? `Hãy chọn một trong các bác sĩ thuộc khoa ${catalogSpecialtyName} dưới đây:` : 'Chọn chuyên khoa để xem bác sĩ.' }}</p>
        </div>
      </div>

      <div v-if="!selectedSpecialty" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
        <UserRound class="mx-auto h-8 w-8 text-slate-300" />
        <p class="mt-2 font-semibold text-slate-900">Chưa chọn chuyên khoa</p>
      </div>

      <div v-else-if="specialtyDoctors.length" class="grid gap-3 lg:grid-cols-2">
        <article
          v-for="item in specialtyDoctors"
          :key="item.doctorId"
          :class="[
            'rounded-lg border bg-white p-3 transition duration-200',
            isSelectedDoctor(item) ? 'border-[#0F52BA] ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200 hover:shadow-sm',
          ]"
        >
          <div class="grid gap-4 sm:grid-cols-[128px_1fr]">
            <div class="flex h-[120px] w-full items-center justify-center overflow-hidden rounded-md bg-blue-50 text-[#0F52BA] ring-1 ring-blue-100">
              <img :src="doctorAvatarUrl(item)" :alt="doctorName(item)" class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0">
              <div class="flex items-start gap-2">
                <h3 class="min-w-0 flex-1 truncate text-base font-bold text-slate-950">{{ displayDoctorTitle(item) }}</h3>
                <span v-if="isSelectedDoctor(item)" class="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-[#0F52BA]">Đang chọn</span>
              </div>
              <div class="mt-2 space-y-1.5 text-sm text-slate-600">
                <p class="flex items-start gap-2">
                  <BadgeCheck class="mt-0.5 h-4 w-4 shrink-0 text-[#0F52BA]" />
                  <span>{{ item.experienceYears ? `${item.experienceYears} năm` : 'Kinh nghiệm đang cập nhật' }} - {{ item.degree || 'Bác sĩ chuyên khoa' }}</span>
                </p>
                <p class="flex items-start gap-2">
                  <GraduationCap class="mt-0.5 h-4 w-4 shrink-0 text-[#0F52BA]" />
                  <span class="line-clamp-1">{{ item.description || displayText(item.specialtyName) }}</span>
                </p>
              </div>
              <div class="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm font-bold text-slate-700">Phí khám: <span class="text-[#0F52BA]">{{ formatCurrency(item.examFee || 0) }}</span></p>
                <BaseButton
                  class="w-full sm:w-auto"
                  :variant="isSelectedDoctor(item) ? 'primary' : 'outline'"
                  size="sm"
                  :loading="loadingSlots && isSelectedDoctor(item)"
                  @click="selectDoctorForSchedule(item)"
                >
                  <template #icon><CalendarPlus class="h-4 w-4" /></template>
                  {{ isSelectedDoctor(item) ? 'Đang chọn bác sĩ này' : 'Đặt lịch với bác sĩ này' }}
                </BaseButton>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
        <UserRound class="mx-auto h-8 w-8 text-slate-300" />
        <p class="mt-2 font-semibold text-slate-900">Chưa có bác sĩ phù hợp</p>
      </div>
    </div>

    <div ref="slotControls" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex items-start gap-2">
          <span class="flex h-6 w-6 items-center justify-center rounded-md bg-[#0F52BA] text-sm font-bold text-white">3</span>
          <div>
            <h2 class="text-sm font-bold uppercase text-slate-900">Chọn giờ</h2>
            <p class="mt-0.5 text-xs font-semibold text-slate-500">{{ doctor ? `Bác sĩ: ${displayDoctorTitle(doctor)} · Ngày ${formatDisplayDate(selectedDate)}` : 'Chưa chọn bác sĩ' }}</p>
          </div>
        </div>
        <div v-if="doctor" class="flex items-center gap-3 text-xs font-bold">
          <span class="inline-flex items-center gap-1.5 text-slate-500"><span class="h-3 w-3 rounded border border-slate-200 bg-white"></span>Còn trống</span>
          <span class="inline-flex items-center gap-1.5 text-rose-600"><span class="h-3 w-3 rounded border border-rose-300 bg-rose-50"></span>Đã có lịch</span>
        </div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-3">
        <SlotPicker
          v-model="selectedSlot"
          title="Giờ khám còn trống"
          :slots="slots"
          :all-slots="displaySlots"
          :booked-slots="bookedSlots"
          :loading="loadingSlots"
          :empty-message="slotEmptyMessage"
        />
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div class="mb-3 flex items-start gap-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-md bg-[#0F52BA] text-sm font-bold text-white">4</span>
        <div>
          <h2 class="text-sm font-bold uppercase text-slate-900">Thông tin bệnh nhân</h2>
          <p class="mt-0.5 text-xs font-semibold text-[#0F52BA]">Kiểm tra và xác nhận thông tin.</p>
        </div>
      </div>
      <AppointmentForm
        v-if="selectedSlot"
        layout="inline"
        :doctorId="doctor?.doctorId || 0"
        :appointmentDate="selectedDate"
        :slotTime="selectedSlot"
        :loading="submitting"
        :initialPatientId="bookingPatientId"
        :initialPatientName="bookingPatientName"
        :initialPatientPhone="bookingPatientPhone"
        @submit="submitBooking"
      />
      <div v-else class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
        <CalendarPlus class="mx-auto h-8 w-8 text-slate-300" />
        <p class="mt-2 font-semibold text-slate-900">Chọn khung giờ để đặt lịch</p>
      </div>
    </div>

      <Toast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BadgeCheck, CalendarPlus, CheckCircle2, GraduationCap, UserRound } from 'lucide-vue-next'
import AppointmentForm from '@/components/booking/AppointmentForm.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import Toast from '@/components/ui/Toast.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import type { CreateAppointmentRequest } from '@/types/appointment'
import type { Doctor } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'
import { doctorAvatarUrl } from '@/utils/doctorAvatar'
import { displayText } from '@/utils/displayText'

const route = useRoute()
const authStore = useAuthStore()
const doctors = ref<Doctor[]>([])
const specialties = ref<Specialty[]>([])
const selectedSpecialty = ref('')
const selectedDoctor = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSlot = ref('')
const slots = ref<string[]>([])
const bookedSlots = ref<string[]>([])
const slotsChecked = ref(false)
const loadingSlots = ref(false)
const submitting = ref(false)
const apiMessage = ref('')
const slotControls = ref<HTMLElement | null>(null)
const patientInfoSection = ref<HTMLElement | null>(null)
const today = new Date().toISOString().slice(0, 10)
const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error',
})
const bookingSteps = [
  { value: 1, label: 'Chọn chuyên khoa' },
  { value: 2, label: 'Chọn bác sĩ' },
  { value: 3, label: 'Chọn giờ' },
  { value: 4, label: 'Thông tin' },
]

const isPatientBookingRoute = computed(() => route.path.startsWith('/patient'))
const bookingIntroText = computed(() => isPatientBookingRoute.value
  ? 'Danh sách bác sĩ, chuyên khoa và khung giờ trống luôn được cập nhật để bạn dễ chọn lịch khám phù hợp.'
  : 'Dữ liệu bác sĩ, chuyên khoa và lịch trống được đọc từ N1 Appointment Service qua API Gateway.',
)
const currentStep = computed(() => {
  if (selectedSlot.value) return 4
  if (selectedDoctor.value) return 3
  if (selectedSpecialty.value) return 2
  return 1
})

const specialtyOptions = computed(() =>
  specialties.value.map((specialty) => ({ label: displayText(specialty.specialtyName), value: specialty.specialtyId })),
)

const filteredDoctors = computed(() =>
  selectedSpecialty.value
    ? doctors.value.filter((doctor) => doctor.specialtyId === Number(selectedSpecialty.value))
    : doctors.value,
)

const specialtyDoctors = computed(() => selectedSpecialty.value ? filteredDoctors.value : [])
const doctor = computed(() => doctors.value.find((item) => item.doctorId === Number(selectedDoctor.value)))
const catalogSpecialtyName = computed(() => {
  if (!selectedSpecialty.value) return 'Tất cả chuyên khoa'
  return displayText(specialties.value.find((item) => item.specialtyId === Number(selectedSpecialty.value))?.specialtyName)
    || 'Tất cả chuyên khoa'
})
const displaySlots = computed(() => mergeSlots(slots.value, bookedSlots.value))
const slotEmptyMessage = computed(() => {
  if (!selectedSpecialty.value) return 'Chọn chuyên khoa để xem danh sách bác sĩ phù hợp.'
  if (!selectedDoctor.value) return 'Chọn bác sĩ để xem lịch trống.'
  if (!slotsChecked.value) return `Đang sẵn sàng tải lịch cho ${displayDoctorTitle(doctor.value)} vào ngày ${formatDisplayDate(selectedDate.value)}.`
  return 'Không có slot trống cho bác sĩ/ngày đã chọn. Hãy chọn ngày khác hoặc bác sĩ khác.'
})
const bookingPatientId = computed(() => authStore.isPatient ? authStore.user?.patientId : undefined)
const bookingPatientName = computed(() => authStore.isPatient ? authStore.user?.fullName : '')
const bookingPatientPhone = computed(() => authStore.isPatient ? authStore.user?.phoneNumber : '')

watch(selectedSpecialty, () => {
  if (selectedDoctor.value && !filteredDoctors.value.some((item) => item.doctorId === Number(selectedDoctor.value))) {
    selectedDoctor.value = ''
  }
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

watch(selectedSlot, (slot) => {
  if (!slot) return
  nextTick(() => {
    patientInfoSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

onMounted(loadCatalog)

async function loadCatalog() {
  apiMessage.value = ''
  try {
    const [doctorData, specialtyData] = await Promise.all([
      appointmentApi.getDoctors(),
      appointmentApi.getSpecialties(),
    ])
    doctors.value = doctorData
    specialties.value = specialtyData
    if (!doctorData.length || !specialtyData.length) {
      apiMessage.value = 'Database chưa có đủ bác sĩ hoặc chuyên khoa để đặt lịch.'
    }
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

async function findSlots() {
  if (!selectedDoctor.value || !selectedDate.value) return
  loadingSlots.value = true
  selectedSlot.value = ''
  apiMessage.value = ''
  try {
    const [data, booked] = await Promise.all([
      appointmentApi.getAvailableSlots(Number(selectedDoctor.value), selectedDate.value),
      appointmentApi.getBookedSlots(Number(selectedDoctor.value), selectedDate.value).catch(() => []),
    ])
    slots.value = data
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
      throw new Error('Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.')
    }
    const appointment = await appointmentApi.createAppointment(payload)
    toast.title = 'Đặt lịch thành công'
    toast.message = `Mã lịch hẹn: ${appointment.appointmentId || 'đang cập nhật'}`
    toast.type = 'success'
    toast.show = true
    await findSlots()
  } catch (error) {
    toast.title = 'Chưa thể đặt lịch'
    toast.message = getApiErrorMessage(error)
    toast.type = 'error'
    toast.show = true
  } finally {
    submitting.value = false
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function doctorName(item?: Doctor | null) {
  return displayText(item?.doctorName || item?.fullName || '')
}

function displayDoctorTitle(item?: Doctor | null) {
  const name = doctorName(item)
  if (!name) return 'Bác sĩ chưa cập nhật'
  return name.toLowerCase().startsWith('bs') ? name : `BS. ${name}`
}

function isSelectedDoctor(item: Doctor) {
  return Number(selectedDoctor.value) === item.doctorId
}

function selectDoctorForSchedule(item: Doctor) {
  const shouldReload = isSelectedDoctor(item)
  selectedDoctor.value = String(item.doctorId)
  if (shouldReload) void findSlots()
  nextTick(() => {
    slotControls.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function mergeSlots(...groups: string[][]) {
  return Array.from(new Set(groups.flat().map((slot) => String(slot || '').slice(0, 5)).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function formatDisplayDate(value: string) {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}
</script>
