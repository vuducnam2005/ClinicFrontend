<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
        <div>
          <h1 class="mt-4 text-3xl font-bold leading-tight tracking-normal text-slate-950">
            Chọn chuyên khoa, bác sĩ và khung giờ phù hợp
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {{ bookingIntroText }}
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="item in summary" :key="item.label" class="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-400">{{ item.label }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-950">{{ item.value }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ item.note }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div ref="slotControls" class="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
          <BaseSelect v-model="selectedSpecialty" label="Chuyên khoa" :options="specialtyOptions" placeholder="Chọn chuyên khoa" />
          <BaseInput v-model="selectedDate" label="Ngày khám" type="date" :min="today" />
          <div class="flex items-end">
            <BaseButton
              class="w-full"
              size="lg"
              :loading="loadingSlots"
              :disabled="!selectedDoctor || !selectedDate"
              :title="selectedDoctor ? 'Kiểm tra lịch trống' : 'Chọn bác sĩ ở danh sách bên phải trước'"
              @click="findSlots"
            >
              <template #icon><Search class="h-4 w-4" /></template>
              Kiểm tra lịch trống
            </BaseButton>
          </div>
        </div>

        <div
          v-if="doctor"
          class="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#003c90] sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="flex min-w-0 items-center gap-2 font-semibold">
            <CheckCircle2 class="h-4 w-4 shrink-0" />
            <span class="truncate">Đang chọn: {{ displayDoctorTitle(doctor) }}</span>
          </p>
          <span class="shrink-0 font-bold">Phí khám: {{ formatCurrency(doctor.examFee || 0) }}</span>
        </div>

        <div
          v-else
          class="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        >
          <Info class="h-4 w-4 shrink-0 text-[#0F52BA]" />
          Chọn bác sĩ ở danh sách bên phải để kiểm tra lịch trống.
        </div>

        <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <SlotPicker
            v-model="selectedSlot"
            :slots="slots"
            :all-slots="displaySlots"
            :booked-slots="bookedSlots"
            :loading="loadingSlots"
            :empty-message="slotEmptyMessage"
          />
        </div>

        <div v-if="apiMessage" class="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#003c90]">
          {{ apiMessage }}
        </div>

        <div class="mt-5 border-t border-slate-100 pt-5">
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
          <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <CalendarPlus class="mx-auto h-9 w-9 text-slate-300" />
            <p class="mt-3 font-semibold text-slate-900">Chọn khung giờ để đặt lịch</p>
            <p class="mt-1 text-sm text-slate-500">Sau khi chọn slot trống, form xác nhận đặt lịch sẽ xuất hiện tại đây.</p>
          </div>
        </div>
      </div>

      <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="sticky top-0 z-10 -mx-1 bg-white/95 px-1 pb-4 backdrop-blur">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Thông tin sơ bộ bác sĩ</p>
              <h2 class="mt-2 text-lg font-bold text-slate-950">{{ selectedSpecialty ? catalogSpecialtyName : 'Chọn chuyên khoa để xem bác sĩ' }}</h2>
            </div>
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0F52BA]">
              <Stethoscope class="h-5 w-5" />
            </span>
          </div>

          <p class="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Info class="h-4 w-4" />
            Chỉ hiển thị khi đã chọn chuyên khoa
          </p>

          <div
            v-if="selectedSpecialty"
            class="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#003c90]"
          >
            Đã chọn chuyên khoa: {{ catalogSpecialtyName }} · {{ specialtyDoctors.length }} bác sĩ phù hợp
          </div>
        </div>

        <div v-if="!selectedSpecialty" class="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <UserRound class="mx-auto h-10 w-10 text-slate-300" />
          <p class="mt-3 font-semibold text-slate-900">Chưa chọn chuyên khoa</p>
          <p class="mt-1 text-sm text-slate-500">Danh sách bác sĩ sẽ xuất hiện sau khi bạn chọn chuyên khoa ở form bên trái.</p>
        </div>

        <div v-else-if="specialtyDoctors.length" class="mt-5 space-y-4 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto xl:pr-1">
          <article
            v-for="item in specialtyDoctors"
            :key="item.doctorId"
            :class="[
              'rounded-xl border bg-white p-4 shadow-sm transition duration-200',
              isSelectedDoctor(item) ? 'border-[#0F52BA] ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-200 hover:shadow-card',
            ]"
          >
            <div class="flex gap-4">
              <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-[#0F52BA] ring-1 ring-blue-100">
                <img :src="doctorAvatarUrl(item)" :alt="doctorName(item)" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-2">
                  <h3 class="min-w-0 flex-1 truncate text-base font-bold text-slate-950">{{ displayDoctorTitle(item) }}</h3>
                  <span v-if="isSelectedDoctor(item)" class="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-[#0F52BA]">
                    Đang chọn
                  </span>
                </div>
                <div class="mt-2 space-y-1.5 text-sm text-slate-600">
                  <p class="flex items-start gap-2">
                    <BadgeCheck class="mt-0.5 h-4 w-4 shrink-0 text-[#0F52BA]" />
                    <span>{{ item.experienceYears ? `${item.experienceYears} năm kinh nghiệm` : 'Kinh nghiệm đang cập nhật' }}</span>
                  </p>
                  <p class="flex items-start gap-2">
                    <GraduationCap class="mt-0.5 h-4 w-4 shrink-0 text-[#0F52BA]" />
                    <span>{{ item.degree || 'Bác sĩ chuyên khoa' }}</span>
                  </p>
                  <p class="flex items-start gap-2">
                    <Star class="mt-0.5 h-4 w-4 shrink-0 text-[#0F52BA]" />
                    <span class="line-clamp-2">{{ item.description || `Chuyên khoa ${displayText(item.specialtyName)}` }}</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm font-bold text-[#003c90]">Phí khám: {{ formatCurrency(item.examFee || 0) }}</p>
              <BaseButton
                class="w-full sm:w-auto"
                :variant="isSelectedDoctor(item) ? 'primary' : 'outline'"
                size="sm"
                @click="selectDoctorForSchedule(item)"
              >
                <template #icon><CalendarPlus class="h-4 w-4" /></template>
                {{ isSelectedDoctor(item) ? 'Đang chọn lịch' : 'Chọn lịch với BS này' }}
              </BaseButton>
            </div>
          </article>
        </div>

        <div v-else class="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <UserRound class="mx-auto h-10 w-10 text-slate-300" />
          <p class="mt-3 font-semibold text-slate-900">Chưa có bác sĩ phù hợp</p>
          <p class="mt-1 text-sm text-slate-500">Vui lòng chọn chuyên khoa khác hoặc quay lại sau.</p>
        </div>
      </aside>
    </div>

    <Toast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BadgeCheck, CalendarPlus, CheckCircle2, GraduationCap, Info, Search, Star, Stethoscope, UserRound } from 'lucide-vue-next'
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
const today = new Date().toISOString().slice(0, 10)
const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error',
})

const isPatientBookingRoute = computed(() => route.path.startsWith('/patient'))
const bookingIntroText = computed(() => isPatientBookingRoute.value
  ? 'Danh sách bác sĩ, chuyên khoa và khung giờ trống luôn được cập nhật để bạn dễ chọn lịch khám phù hợp.'
  : 'Dữ liệu bác sĩ, chuyên khoa và lịch trống được đọc từ N1 Appointment Service qua API Gateway.',
)

const summary = computed(() => [
  { label: 'Chuyên khoa', value: specialties.value.length, note: 'Đang hoạt động' },
  { label: 'Bác sĩ', value: doctors.value.length, note: 'Có thể đặt lịch' },
  {
    label: 'Slot trống',
    value: slotsChecked.value ? slots.value.length : '--',
    note: slotsChecked.value ? 'Theo bác sĩ và ngày đã chọn' : 'Chưa kiểm tra',
  },
])

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
  if (!selectedDoctor.value) return 'Chọn bác sĩ ở danh sách bên phải để kiểm tra lịch trống.'
  if (!slotsChecked.value) return `Sẵn sàng kiểm tra lịch trống cho ${displayDoctorTitle(doctor.value)} vào ngày ${selectedDate.value}.`
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

watch([selectedDoctor, selectedDate], () => {
  selectedSlot.value = ''
  slots.value = []
  bookedSlots.value = []
  slotsChecked.value = false
  apiMessage.value = ''
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
  if (isSelectedDoctor(item)) return
  selectedDoctor.value = String(item.doctorId)
  nextTick(() => {
    slotControls.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function mergeSlots(...groups: string[][]) {
  return Array.from(new Set(groups.flat().map((slot) => String(slot || '').slice(0, 5)).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}
</script>
