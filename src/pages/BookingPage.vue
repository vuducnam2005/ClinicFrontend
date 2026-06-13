<template>
  <div class="bk">
    <!-- Header + Stepper -->
    <div class="bk-hdr">
      <h1 class="bk-h1">MedicareDNU - ĐẶT LỊCH KHÁM</h1>
      <p class="bk-sub">Đặt lịch khám theo chuyên khoa, bác sĩ và khung giờ còn trống.</p>
      <div class="stp">
        <div v-for="(s, i) in steps" :key="s.v" class="stp-i">
          <div class="stp-c">
            <span :class="['stp-l', i === 0 ? 'stp-lh' : '', cur >= s.v ? 'stp-la' : '']"></span>
            <span :class="['stp-d', cur > s.v ? 'stp-dd' : cur === s.v ? 'stp-da' : 'stp-dp']">
              <svg v-if="cur > s.v" class="stp-ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span v-else>{{ s.v }}</span>
            </span>
            <span :class="['stp-l', i === steps.length - 1 ? 'stp-lh' : '', cur > s.v ? 'stp-la' : '']"></span>
          </div>
          <span class="stp-t">{{ s.t }}</span>
        </div>
      </div>
    </div>

    <!-- 1 Chuyên khoa & Ngày -->
    <div class="cd">
      <div class="cd-h"><span class="bg">1</span><h2 class="cd-t">CHỌN CHUYÊN KHOA & NGÀY</h2></div>
      <div class="r2">
        <div class="fl"><label class="lb">Chuyên khoa</label><select :value="selectedSpecialty" class="sl" @change="selectedSpecialty = ($event.target as HTMLSelectElement).value"><option value="">Chọn chuyên khoa</option><option v-for="o in specialtyOptions" :key="String(o.value)" :value="o.value">{{ o.label }}</option></select></div>
        <div class="fl"><label class="lb">Ngày khám</label><input :value="selectedDate" type="date" :min="today" class="ip" @input="selectedDate = ($event.target as HTMLInputElement).value" /></div>
      </div>
      <div v-if="apiMessage" class="am">{{ apiMessage }}</div>
    </div>

    <!-- 2 Bác sĩ -->
    <div class="cd">
      <div class="cd-h">
        <span class="bg">2</span>
        <div><h2 class="cd-t">CHỌN BÁC SĨ</h2><p class="cd-s">Chi tiết thủ tục và Giam Xem thêm.</p></div>
      </div>
      <div v-if="!selectedSpecialty" class="eb eb-doc"><UserRound class="ei" /><p>Chưa chọn chuyên khoa</p></div>
      <div v-else-if="specialtyDoctors.length" class="dg">
        <div v-for="item in specialtyDoctors" :key="item.doctorId" :class="['dc', isSelectedDoctor(item) ? 'dc-s' : '']">
          <div class="di">
            <div class="da"><img :src="doctorAvatarUrl(item)" :alt="doctorName(item)" /></div>
            <div class="db">
              <h3 class="dn">{{ displayDoctorTitle(item) }}</h3>
              <p class="dl"><BadgeCheck class="dk" /><span>{{ item.experienceYears ? `${item.experienceYears} năm` : 'KN cập nhật' }} - {{ item.degree || 'Bác sĩ chuyên khoa' }}</span></p>
              <p class="dl"><GraduationCap class="dk" /><span>{{ item.description || displayText(item.specialtyName) }}</span></p>
              <div class="df">
                <span class="dp">Phí khám: <b>{{ formatCurrency(item.examFee || 0) }}</b></span>
                <div class="d-btns">
                  <button class="dbt-info" type="button" @click="activeDetailDoctor = item">THÔNG TIN BÁC SĨ</button>
                  <button :class="['dbt', isSelectedDoctor(item) ? 'dbt-a' : '']" @click="selectDoctorForSchedule(item)">
                    {{ isSelectedDoctor(item) ? 'ĐANG CHỌN BÁC SĨ NÀY' : 'ĐẶT LỊCH VỚI BÁC SĨ NÀY' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="eb eb-doc"><UserRound class="ei" /><p>Chưa có bác sĩ phù hợp</p></div>
    </div>

    <!-- 3 Chọn giờ -->
    <div class="cd">
      <div class="cd-h">
        <span class="bg">3</span>
        <div><h2 class="cd-t">CHỌN GIỜ</h2><p class="cd-s">{{ doctor ? `Bác sĩ: ${displayDoctorTitle(doctor)} · Ngày ${formatDisplayDate(selectedDate)}` : 'Chưa chọn bác sĩ' }}</p></div>
      </div>
      <SlotPicker v-model="selectedSlot" :slots="slots" :all-slots="displaySlots" :booked-slots="bookedSlots" :loading="loadingSlots" :empty-message="slotEmptyMessage" />
      <div v-if="doctor" class="nr">
        <button class="nb nb-b" @click="goBackFromStep3"><ChevronLeft class="ni" /> Quay lại</button>
        <button class="nb nb-n" :disabled="!selectedSlot" @click="goToStep4">Tiếp theo <ChevronRight class="ni" /></button>
      </div>
    </div>

    <!-- 4 Thông tin -->
    <div class="cd">
      <div class="cd-h">
        <span class="bg">4</span>
        <div><h2 class="cd-t">THÔNG TIN BỆNH NHÂN</h2><p class="cd-sb">Kiểm tra và xác nhận thông tin.</p></div>
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
        @back="goBackFromStep4"
      />
      <div v-else class="eb eb-frm"><CalendarPlus class="ei" /><p>Chọn khung giờ để đặt lịch</p></div>
    </div>

    <Toast :show="toast.show" :title="toast.title" :message="toast.message" :type="toast.type" @close="toast.show = false" />
    <DoctorDetailModal :doctor="activeDetailDoctor" enable-select @close="activeDetailDoctor = null" @select="handleSelectDoctorFromModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BadgeCheck, CalendarPlus, ChevronLeft, ChevronRight, GraduationCap, UserRound } from 'lucide-vue-next'
import AppointmentForm from '@/components/booking/AppointmentForm.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import Toast from '@/components/ui/Toast.vue'
import DoctorDetailModal from '@/components/booking/DoctorDetailModal.vue'
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
const activeDetailDoctor = ref<Doctor | null>(null)
const slots = ref<string[]>([])
const bookedSlots = ref<string[]>([])
const slotsChecked = ref(false)
const loadingSlots = ref(false)
const submitting = ref(false)
const apiMessage = ref('')
const today = new Date().toISOString().slice(0, 10)
const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })
const steps = [
  { v: 1, t: 'Chọn chuyên khoa' },
  { v: 2, t: 'Chọn bác sĩ' },
  { v: 3, t: 'Chọn giờ' },
  { v: 4, t: 'Thông tin' },
]

const cur = computed(() => { if (selectedSlot.value) return 4; if (selectedDoctor.value) return 3; if (selectedSpecialty.value) return 2; return 1 })
const specialtyOptions = computed(() => specialties.value.map((s) => ({ label: displayText(s.specialtyName), value: s.specialtyId })))
const filteredDoctors = computed(() => selectedSpecialty.value ? doctors.value.filter((d) => d.specialtyId === Number(selectedSpecialty.value)) : doctors.value)
const specialtyDoctors = computed(() => selectedSpecialty.value ? filteredDoctors.value : [])
const doctor = computed(() => doctors.value.find((d) => d.doctorId === Number(selectedDoctor.value)))
const displaySlots = computed(() => mergeSlots(slots.value, bookedSlots.value))
const slotEmptyMessage = computed(() => { if (!selectedSpecialty.value) return 'Chọn chuyên khoa để xem bác sĩ.'; if (!selectedDoctor.value) return 'Chọn bác sĩ để xem lịch trống.'; if (!slotsChecked.value) return 'Đang tải...'; return 'Không có slot trống.' })
const bookingPatientId = computed(() => authStore.isPatient ? authStore.user?.patientId : undefined)
const bookingPatientName = computed(() => authStore.isPatient ? authStore.user?.fullName : '')
const bookingPatientPhone = computed(() => authStore.isPatient ? authStore.user?.phoneNumber : '')

watch(selectedSpecialty, () => { if (selectedDoctor.value && !filteredDoctors.value.some((d) => d.doctorId === Number(selectedDoctor.value))) selectedDoctor.value = ''; selectedSlot.value = ''; slots.value = []; bookedSlots.value = []; slotsChecked.value = false })
watch([selectedDoctor, selectedDate], ([did, date]) => { selectedSlot.value = ''; slots.value = []; bookedSlots.value = []; slotsChecked.value = false; apiMessage.value = ''; if (did && date) void findSlots() })

onMounted(loadCatalog)

async function loadCatalog() {
  apiMessage.value = ''
  try { const [dd, sd] = await Promise.all([appointmentApi.getDoctors(), appointmentApi.getSpecialties()]); doctors.value = dd; specialties.value = sd; if (!dd.length || !sd.length) apiMessage.value = 'Chưa có đủ dữ liệu.' } catch (e) { doctors.value = []; specialties.value = []; apiMessage.value = getApiErrorMessage(e) }
  const qid = Number(route.query.doctorId); if (qid) { const qd = doctors.value.find((d) => d.doctorId === qid); if (qd) { selectedDoctor.value = String(qd.doctorId); selectedSpecialty.value = String(qd.specialtyId) } }
}
async function findSlots() {
  if (!selectedDoctor.value || !selectedDate.value) return; loadingSlots.value = true; selectedSlot.value = ''; apiMessage.value = ''
  try { const [d, b] = await Promise.all([appointmentApi.getAvailableSlots(Number(selectedDoctor.value), selectedDate.value), appointmentApi.getBookedSlots(Number(selectedDoctor.value), selectedDate.value).catch(() => [])]); slots.value = d; bookedSlots.value = b; slotsChecked.value = true } catch (e) { slots.value = []; bookedSlots.value = []; slotsChecked.value = true; apiMessage.value = getApiErrorMessage(e) } finally { loadingSlots.value = false }
}
async function submitBooking(payload: CreateAppointmentRequest) {
  submitting.value = true
  try { const ls = await appointmentApi.getAvailableSlots(payload.doctorId, payload.appointmentDate); if (!ls.map((s) => s.slice(0, 5)).includes(payload.slotTime.slice(0, 5))) { selectedSlot.value = ''; await findSlots(); throw new Error('Khung giờ vừa được đặt.') }; const a = await appointmentApi.createAppointment(payload); toast.title = 'Đặt lịch thành công'; toast.message = `Mã: ${a.appointmentId || '...'}`; toast.type = 'success'; toast.show = true; await findSlots() } catch (e) { toast.title = 'Lỗi'; toast.message = getApiErrorMessage(e); toast.type = 'error'; toast.show = true } finally { submitting.value = false }
}
function goBackFromStep3() { selectedDoctor.value = ''; selectedSlot.value = '' }
function goBackFromStep4() { selectedSlot.value = '' }
function goToStep4() {}
function formatCurrency(v: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) }
function doctorName(d?: Doctor | null) { return displayText(d?.doctorName || d?.fullName || '') }
function displayDoctorTitle(d?: Doctor | null) { const n = doctorName(d); if (!n) return 'BS chưa cập nhật'; return n.toLowerCase().startsWith('bs') ? n : `BS. ${n}` }
function isSelectedDoctor(d: Doctor) { return Number(selectedDoctor.value) === d.doctorId }
function selectDoctorForSchedule(d: Doctor) { const r = isSelectedDoctor(d); selectedDoctor.value = String(d.doctorId); if (r) void findSlots() }
function handleSelectDoctorFromModal(d: Doctor) { selectDoctorForSchedule(d); activeDetailDoctor.value = null }
function mergeSlots(...g: string[][]) { return [...new Set(g.flat().map((s) => String(s||'').slice(0,5)).filter(Boolean))].sort() }
function formatDisplayDate(v: string) { if (!v) return ''; const [y,m,d] = v.slice(0,10).split('-'); return y&&m&&d ? `${d}/${m}/${y}` : v }
</script>

<style scoped>
/* Full-height wrapper that fills the available viewport */
.bk { display: flex; flex-direction: column; gap: 6px; max-width: 100%; margin: 0 auto; }

/* Header */
.bk-hdr { text-align: center; padding: 0; }
.bk-h1 { font-size: 16px; font-weight: 700; color: #1e3a5f; margin: 0; }
.bk-sub { font-size: 11px; color: #64748b; margin: 1px 0 4px; }

/* Stepper */
.stp { display: flex; justify-content: center; max-width: 440px; margin: 0 auto; }
.stp-i { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
.stp-c { display: flex; align-items: center; width: 100%; height: 22px; }
.stp-l { flex: 1; height: 2px; background: #cbd5e1; transition: background .3s; }
.stp-lh { visibility: hidden; }
.stp-la { background: #0F52BA; }
.stp-d { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; z-index: 1; }
.stp-dd { background: #0F52BA; color: #fff; border: 1.5px solid #0F52BA; }
.stp-da { background: #0F52BA; color: #fff; border: 1.5px solid #0F52BA; }
.stp-dp { background: #fff; color: #0F52BA; border: 1.5px solid #0F52BA; }
.stp-ck { width: 11px; height: 11px; }
.stp-t { font-size: 9.5px; font-weight: 600; color: #475569; }

/* Card */
.cd { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; }
.cd-h { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.bg { width: 20px; height: 20px; border-radius: 4px; background: #0F52BA; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cd-t { font-size: 12.5px; font-weight: 700; color: #0f172a; margin: 0; }
.cd-s { font-size: 10.5px; color: #64748b; margin: 0; font-weight: 500; }
.cd-sb { font-size: 10.5px; color: #0F52BA; margin: 0; font-weight: 600; }

/* Step 1 */
.r2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.fl { display: flex; flex-direction: column; gap: 2px; }
.lb { font-size: 11px; font-weight: 600; color: #334155; }
.sl, .ip { height: 32px; width: 100%; padding: 0 8px; border: 1px solid #cbd5e1; border-radius: 5px; background: #fff; font-size: 12.5px; color: #0f172a; outline: none; transition: border-color .2s; box-sizing: border-box; }
.sl { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px; cursor: pointer; }
.sl:focus, .ip:focus { border-color: #0F52BA; box-shadow: 0 0 0 2px rgba(15,82,186,.06); }
.am { margin-top: 4px; padding: 4px 10px; border-radius: 5px; background: #eff6ff; border: 1px solid #bfdbfe; font-size: 11px; color: #1e40af; }

/* Step 2 doctors */
.dg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; max-height: 106px; overflow-y: auto; padding-right: 4px; }
.dc { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; transition: border-color .2s; background: #fff; }
.dc:hover { border-color: #bfdbfe; }
.dc-s { border-color: #0F52BA !important; background: #f0f7ff; }
.di { display: flex; gap: 8px; }
.da { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid #e8effa; background: #f1f5f9; }
.da img { width: 100%; height: 100%; object-fit: cover; }
.db { flex: 1; min-width: 0; }
.dn { font-size: 12.5px; font-weight: 700; color: #0f172a; margin: 0 0 1px; }
.dl { display: flex; align-items: center; gap: 2.5px; font-size: 10.5px; color: #475569; margin: 0 0 1px; line-height: 1.25; }
.dk { width: 11px; height: 11px; color: #0F52BA; flex-shrink: 0; }
.df { display: flex; align-items: center; justify-content: space-between; margin-top: 3px; padding-top: 3px; border-top: 1px solid #f1f5f9; gap: 4px; }
.dp { font-size: 11px; font-weight: 600; color: #334155; }
.dp b { color: #0F52BA; }
.d-btns { display: flex; gap: 4px; align-items: center; }
.dbt-info { padding: 3px 8px; border: 1.5px solid #cbd5e1; border-radius: 4px; background: #fff; color: #475569; font-size: 9.5px; font-weight: 700; cursor: pointer; transition: all .2s; white-space: nowrap; }
.dbt-info:hover { background: #f8fafc; border-color: #94a3b8; color: #0F52BA; }
.dbt { padding: 3px 8px; border: 1.5px solid #0F52BA; border-radius: 4px; background: #fff; color: #0F52BA; font-size: 9.5px; font-weight: 700; cursor: pointer; transition: all .2s; white-space: nowrap; }
.dbt:hover { background: #0F52BA; color: #fff; }
.dbt-a { background: #0F52BA; color: #fff; }

/* Empty */
.eb { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 6px; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 6px; box-sizing: border-box; }
.ei { width: 16px; height: 16px; color: #cbd5e1; }
.eb p { margin: 0; font-size: 11px; font-weight: 600; color: #64748b; }
.eb-doc { height: 96px; }
.eb-frm { height: 74px; }

/* Nav */
.nr { display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #f1f5f9; }
.nb { display: inline-flex; align-items: center; gap: 3px; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .2s; }
.nb:disabled { opacity: .5; cursor: not-allowed; }
.nb-b { background: #fff; color: #475569; border-color: #e2e8f0; }
.nb-b:hover:not(:disabled) { background: #f8fafc; }
.nb-n { background: #0F52BA; color: #fff; border-color: #0F52BA; }
.nb-n:hover:not(:disabled) { background: #0b4296; }
.ni { width: 12px; height: 12px; }

@media (max-width: 768px) { .r2, .dg { grid-template-columns: 1fr; } }
</style>
