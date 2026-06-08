<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <component :is="config.icon || Stethoscope" class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ config.service }}</p>
            <h1 class="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{{ config.title }}</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
            <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-500">{{ config.endpoint }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="canCreate" @click="openForm()"><template #icon><Plus class="h-4 w-4" /></template>Thêm mới</BaseButton>
          <BaseButton variant="outline" :disabled="loading" @click="loadData"><template #icon><RefreshCw class="h-4 w-4" /></template>Tải lại</BaseButton>
        </div>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{{ error }}</div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-3"><LoadingSkeleton v-for="item in 3" :key="item" /></div>
    <div v-else class="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div class="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label class="relative block"><Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input v-model="query" class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100" placeholder="Tìm kiếm" /></label>
        <span class="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">{{ filteredRows.length }} dòng</span>
      </div>
      <div v-if="filteredRows.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th v-for="col in config.columns" :key="col.key" :class="['px-5 py-3', col.right ? 'text-right' : 'text-left']">{{ col.label }}</th><th v-if="hasActions" class="px-5 py-3 text-right">Thao tác</th></tr></thead>
          <tbody class="divide-y divide-slate-100"><tr v-for="row in paginatedRows" :key="String(row.id)" class="hover:bg-slate-50"><td v-for="col in config.columns" :key="col.key" :class="['px-5 py-4 align-top', col.right ? 'text-right' : 'text-left']"><span v-if="col.badge" :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(row[col.key])]">{{ value(row[col.key]) }}</span><span v-else :class="col.strong ? 'font-semibold text-slate-950' : 'text-slate-700'">{{ value(row[col.key]) }}</span></td><td v-if="hasActions" class="px-5 py-4 text-right"><div class="flex flex-wrap justify-end gap-2"><button v-for="action in actions(row)" :key="action.key" type="button" :disabled="actingId === row.id || action.key === 'noop'" :class="['rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-100', action.className]" @click="runAction(action.key, row)">{{ action.label }}</button></div></td></tr></tbody>
        </table>

        <!-- Pagination Footer -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 p-4 bg-slate-50/50">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <span>Hiển thị</span>
            <select
              v-model="itemsPerPage"
              class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span>bản ghi mỗi trang</span>
          </div>

          <div class="text-sm font-medium text-slate-500">
            Hiển thị {{ Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredRows.length, currentPage * itemsPerPage) }} trên {{ filteredRows.length }} kết quả
          </div>

          <div v-if="totalPages > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
              @click="currentPage--"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              :class="[
                'h-8 min-w-8 rounded-lg text-sm font-bold transition px-2',
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              ]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
              @click="currentPage++"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="p-10 text-center"><SearchX class="mx-auto h-10 w-10 text-slate-400" /><h2 class="mt-4 text-lg font-semibold text-slate-950">Chưa có dữ liệu</h2><p class="mt-2 text-sm text-slate-500">Service có thể chưa có dữ liệu hoặc endpoint chưa sẵn sàng.</p></div>
    </div>

    <div v-if="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4"><div><p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ config.service }}</p><h2 class="mt-1 text-2xl font-bold text-slate-950">{{ editingRow ? 'Cập nhật' : 'Thêm mới' }} {{ config.title.toLowerCase() }}</h2></div><button type="button" class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="closeForm">×</button></div>
        <form class="mt-5 space-y-4" @submit.prevent="submitForm"><div class="grid gap-4 sm:grid-cols-2"><template v-for="field in fields" :key="field.key"><BaseSelect v-if="field.type === 'select'" v-model="form[field.key]" :label="field.label" :options="field.options || []" :placeholder="field.placeholder || 'Chọn'" :required="field.required" /><BaseInput v-else v-model="form[field.key]" :label="field.label" :type="field.type || 'text'" :required="field.required" /></template></div><div class="flex justify-end gap-3"><BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton><BaseButton type="submit" :loading="saving">Lưu</BaseButton></div></form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, CreditCard, FileHeart, Pill, Plus, RefreshCw, Search, SearchX, Settings, Stethoscope, UserCog, UserRound } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { authApi } from '@/services/authApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { medicineApi } from '@/services/medicineApi'
import { getApiErrorMessage } from '@/services/apiClient'
import { fallbackAppointments, fallbackDoctors, fallbackSpecialties } from '@/services/fallbackData'
import { RoleId } from '@/types/user'
import type { Appointment } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { Doctor, DoctorSchedule } from '@/types/doctor'
import type { Patient, MedicalRecord } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import type { Specialty } from '@/types/specialty'
import type { User } from '@/types/user'
import { displayText } from '@/utils/displayText'

type Key = 'doctors' | 'specialties' | 'schedules' | 'patients' | 'appointments' | 'medicines' | 'prescriptions' | 'bills' | 'accounts' | 'reports'
type Row = Record<string, any>
type Action = 'edit' | 'delete' | 'confirm' | 'checkin' | 'start' | 'cancel' | 'complete' | 'pay' | 'noop'
interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config { title: string; service: string; description: string; endpoint: string; icon: Component; columns: Column[] }
interface Field { key: string; label: string; type?: string; required?: boolean; placeholder?: string; options?: SelectOption[] }

const adminKeys: Key[] = ['doctors', 'specialties', 'schedules', 'patients', 'appointments', 'medicines', 'prescriptions', 'bills', 'accounts', 'reports']
const route = useRoute()
const key = computed<Key>(() => adminKeys.includes(route.meta.adminResource as Key) ? route.meta.adminResource as Key : 'doctors')
const config = computed(() => configs[key.value] || configs.doctors)
const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const actingId = ref<string | number | null>(null)
const formOpen = ref(false)
const editingRow = ref<Row | null>(null)
const form = reactive<Record<string, string>>({})

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((row) => Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q)))
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

watch([key, query], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredRows.value.length / itemsPerPage.value))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRows.value.slice(start, end)
})
const canCreate = computed(() => ['doctors', 'specialties', 'schedules', 'patients', 'medicines', 'accounts'].includes(key.value))
const hasActions = computed(() => ['doctors', 'specialties', 'schedules', 'appointments', 'medicines', 'bills'].includes(key.value))
const fields = computed(() => buildFields(key.value))

const fallbackSchedules: DoctorSchedule[] = fallbackDoctors.map((doctor, index) => ({ scheduleId: 900 + index, doctorId: doctor.doctorId, doctorName: doctor.doctorName, workDate: addDays(index).toISOString().slice(0, 10), startTime: index % 2 === 0 ? '08:00' : '13:00', endTime: index % 2 === 0 ? '16:00' : '17:00', slotDurationMinutes: 30, isAvailable: true }))
const fallbackPatients: Patient[] = [{ patientId: 'BN001', fullName: 'Nguyễn Minh An', phone: '0901001001', gender: 'Male', medicalHistory: 'Tăng huyết áp' }]
const fallbackRecords: MedicalRecord[] = [{ recordId: 'MR001', patientId: 'BN001', diagnosis: 'Theo dõi tim mạch', doctorNotes: 'Tái khám sau 7 ngày', createdAt: new Date().toISOString() }]
const fallbackMedicines: Medicine[] = [{ medicineId: 1, medicineName: 'Paracetamol 500mg', dosageForm: 'Viên nén', unitPrice: 1500, stockQuantity: 200, isActive: true }]
const fallbackInvoices: Invoice[] = [{ invoiceId: 1001, appointmentId: 2201, patientId: 12, amount: 300000, status: 'Unpaid', createdAt: new Date().toISOString() }]
const fallbackAccounts: User[] = [{ id: 'u-admin', username: 'admin', fullName: 'Quản trị viên Hệ thống', email: 'admin@cliniccare.vn', roleId: 1, roleName: 'Admin', createdAt: new Date().toISOString() }]

const configs: Record<Key, Config> = {
  doctors: cfg('Quản lý bác sĩ', 'N1 Appointment', 'Thêm, sửa, xóa bác sĩ thuộc Appointment Service.', 'GET/POST/PUT/DELETE /api/doctors', Stethoscope, cols(['id','ID'], ['name','Bác sĩ', false, false, true], ['specialty','Chuyên khoa'], ['degree','Học vị'], ['fee','Phí khám', true], ['status','Trạng thái', false, true])),
  specialties: cfg('Quản lý chuyên khoa', 'N1 Appointment', 'Thêm, sửa, xóa chuyên khoa.', 'GET/POST/PUT/DELETE /api/specialties', Settings, cols(['id','ID'], ['name','Chuyên khoa', false, false, true], ['status','Trạng thái', false, true])),
  schedules: cfg('Lịch làm việc', 'N1 Appointment', 'Thêm, sửa, xóa lịch làm việc bác sĩ.', 'GET/POST/PUT/DELETE /api/doctor-schedules', CalendarDays, cols(['id','Mã'], ['doctorName','Bác sĩ', false, false, true], ['workDate','Ngày'], ['timeRange','Ca'], ['duration','Slot'], ['status','Trạng thái', false, true])),
  patients: cfg('Quản lý bệnh nhân', 'N2 Medical Record', 'Tạo và đọc hồ sơ bệnh nhân.', 'GET/POST /api/patients', UserRound, cols(['id','Mã BN'], ['name','Bệnh nhân', false, false, true], ['phone','SĐT'], ['gender','Giới tính'], ['history','Tiền sử'])),
  appointments: cfg('Quản lý lịch hẹn', 'N1 Appointment', 'Xác nhận, hủy và hoàn tất lịch hẹn. Hóa đơn được N3 tạo sau event prescription.created.', 'GET /api/appointments', ClipboardList, cols(['id','Mã'], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['dateTime','Ngày giờ'], ['status','Trạng thái', false, true])),
  medicines: cfg('Kho thuốc', 'N3 Pharmacy', 'Thêm, sửa, xóa thuốc và tồn kho.', 'GET/POST/PUT/DELETE /api/Medicines', Pill, cols(['id','ID'], ['name','Tên thuốc', false, false, true], ['dosageForm','Dạng'], ['price','Đơn giá', true], ['stock','Tồn', true], ['stockStatus','Trạng thái', false, true])),
  prescriptions: cfg('Đơn thuốc', 'N2 Medical Record', 'Theo dõi ghi chú kê đơn từ bệnh án.', 'GET /api/medical-records', FileHeart, cols(['id','Mã BA'], ['patientId','Bệnh nhân', false, false, true], ['diagnosis','Chẩn đoán'], ['doctorNotes','Ghi chú'], ['status','Trạng thái', false, true])),
  bills: cfg('Hóa đơn viện phí', 'N3 Billing', 'Theo dõi và thu tiền hóa đơn.', 'GET /api/billing/invoices', CreditCard, cols(['id','Mã HĐ'], ['patientId','Bệnh nhân'], ['appointmentId','Lịch hẹn'], ['amount','Số tiền', true], ['status','Trạng thái', false, true])),
  accounts: cfg('Tài khoản hệ thống', 'N3 Auth', 'Tạo và xem tài khoản người dùng.', 'GET /api/users · POST /api/auth/register', UserCog, cols(['id','ID'], ['fullName','Họ tên', false, false, true], ['username','Username'], ['email','Email'], ['roleName','Vai trò', false, true])),
  reports: cfg('Báo cáo vận hành', 'N1 + N2 + N3', 'Tổng hợp dữ liệu vận hành từ các service.', 'N1/N2/N3 health data', ClipboardList, cols(['metric','Chỉ số', false, false, true], ['value','Giá trị', true], ['source','Nguồn'], ['status','Trạng thái', false, true])),
}

watch(key, () => { query.value = ''; closeForm(); void loadData() }, { immediate: true })

async function loadData() {
  loading.value = true; error.value = ''; note.value = ''
  try {
    if (key.value === 'doctors') rows.value = mapList(await appointmentApi.getDoctors(), fallbackDoctors, mapDoctor)
    if (key.value === 'specialties') rows.value = mapList(await appointmentApi.getSpecialties(), fallbackSpecialties, mapSpecialty)
    if (key.value === 'schedules') rows.value = mapList(await appointmentApi.getDoctorSchedules(), fallbackSchedules, mapSchedule)
    if (key.value === 'patients') rows.value = mapList(await medicalRecordApi.getPatients(), fallbackPatients, mapPatient)
    if (key.value === 'appointments') rows.value = mapList(await appointmentApi.getAppointments(), fallbackAppointments, mapAppointment)
    if (key.value === 'medicines') rows.value = mapList(await medicineApi.getMedicines(), fallbackMedicines, mapMedicine)
    if (key.value === 'prescriptions') {
      const remoteRows = (await medicalRecordApi.getMedicalRecords().catch(() => [])).map(mapPrescription)
      rows.value = uniqueRows(remoteRows)
      if (!rows.value.length) rows.value = fallbackRecords.map(mapPrescription)
    }
    if (key.value === 'bills') {
      const remoteRows = (await billingApi.getInvoices().catch(() => [])).map(mapInvoice)
      rows.value = uniqueRows(remoteRows)
      if (!rows.value.length) rows.value = fallbackInvoices.map(mapInvoice)
    }
    if (key.value === 'accounts') rows.value = mapList(await authApi.getUsers(), fallbackAccounts, mapUser)
    if (key.value === 'reports') rows.value = await loadReports()
    note.value = 'Đã tải dữ liệu. Nếu API rỗng hoặc lỗi, frontend dùng fallback an toàn.'
  } catch (e) { error.value = getApiErrorMessage(e); rows.value = fallbackRows(key.value) } finally { loading.value = false }
}
function mapList<T>(data: T[], fallback: T[], mapper: (item: T) => Row) { return (data.length ? data : fallback).map(mapper) }
function fallbackRows(k: Key) { return ({ doctors: fallbackDoctors.map(mapDoctor), specialties: fallbackSpecialties.map(mapSpecialty), schedules: fallbackSchedules.map(mapSchedule), patients: fallbackPatients.map(mapPatient), appointments: fallbackAppointments.map(mapAppointment), medicines: fallbackMedicines.map(mapMedicine), prescriptions: fallbackRecords.map(mapPrescription), bills: fallbackInvoices.map(mapInvoice), accounts: fallbackAccounts.map(mapUser), reports: [] } as Record<Key, Row[]>)[k] }
async function loadReports() { const [doctors, appointments, patients, invoices] = await Promise.all([appointmentApi.getDoctors().catch(() => fallbackDoctors), appointmentApi.getAppointments().catch(() => fallbackAppointments), medicalRecordApi.getPatients().catch(() => fallbackPatients), billingApi.getInvoices().catch(() => fallbackInvoices)]); return [{ id: 'R1', metric: 'Bác sĩ', value: doctors.length, source: 'N1', status: 'OK' }, { id: 'R2', metric: 'Lịch hẹn', value: appointments.length, source: 'N1', status: 'OK' }, { id: 'R3', metric: 'Bệnh nhân', value: patients.length, source: 'N2', status: 'OK' }, { id: 'R4', metric: 'Hóa đơn', value: invoices.length, source: 'N3', status: 'OK' }] }

function buildFields(k: Key): Field[] { const sp = fallbackSpecialties.map((s) => ({ label: s.specialtyName, value: s.specialtyId })); const ds = fallbackDoctors.map((d) => ({ label: d.doctorName, value: d.doctorId })); if (k === 'doctors') return [field('doctorName','Tên bác sĩ','text',true), field('specialtyId','Chuyên khoa','select',true, sp), field('degree','Học vị'), field('examFee','Phí khám','number',true)]; if (k === 'specialties') return [field('specialtyName','Tên chuyên khoa','text',true)]; if (k === 'schedules') return [field('doctorId','Bác sĩ','select',true, ds), field('workDate','Ngày làm','date',true), field('startTime','Giờ bắt đầu','time',true), field('endTime','Giờ kết thúc','time',true), field('slotDurationMinutes','Phút/slot','number')]; if (k === 'patients') return [field('fullName','Họ tên','text',true), field('phone','Số điện thoại','text',true), field('gender','Giới tính','select',false,[{label:'Nam',value:'Male'},{label:'Nữ',value:'Female'}]), field('medicalHistory','Tiền sử bệnh')]; if (k === 'medicines') return [field('medicineName','Tên thuốc','text',true), field('dosageForm','Dạng bào chế','text',true), field('unitPrice','Đơn giá','number',true), field('stockQuantity','Tồn kho','number',true), field('description','Mô tả')]; if (k === 'accounts') return [field('username','Username','text',true), field('password','Mật khẩu','password',true), field('fullName','Họ tên','text',true), field('email','Email','email'), field('roleId','Vai trò','select',true,[{label:'Admin',value:RoleId.Admin},{label:'Bác sĩ',value:RoleId.Doctor},{label:'Tiếp tân',value:RoleId.Receptionist},{label:'Bệnh nhân',value:RoleId.Patient}])]; return [] }
function field(key: string, label: string, type = 'text', required = false, options?: SelectOption[]): Field { return { key, label, type, required, options } }
function openForm(row?: Row) { editingRow.value = row || null; Object.keys(form).forEach((k) => delete form[k]); for (const f of fields.value) form[f.key] = row?.raw?.[f.key] ?? ''; formOpen.value = true }
function closeForm() { formOpen.value = false; editingRow.value = null }
async function submitForm() { saving.value = true; error.value = ''; try { const id = Number(editingRow.value?.id); if (key.value === 'doctors') editingRow.value ? await appointmentApi.updateDoctor(id, doctorPayload()) : await appointmentApi.createDoctor(doctorPayload()); if (key.value === 'specialties') editingRow.value ? await appointmentApi.updateSpecialty(id, { specialtyName: form.specialtyName }) : await appointmentApi.createSpecialty({ specialtyName: form.specialtyName }); if (key.value === 'schedules') editingRow.value ? await appointmentApi.updateDoctorSchedule(id, schedulePayload()) : await appointmentApi.createDoctorSchedule(schedulePayload()); if (key.value === 'patients') await medicalRecordApi.createPatient({ fullName: form.fullName, phone: form.phone, phoneNumber: form.phone, gender: form.gender, medicalHistory: form.medicalHistory }); if (key.value === 'medicines') editingRow.value ? await medicineApi.updateMedicine(id, medicinePayload()) : await medicineApi.createMedicine(medicinePayload() as Omit<Medicine, 'medicineId'>); if (key.value === 'accounts') await authApi.register({ username: form.username, password: form.password, fullName: form.fullName, email: form.email, roleId: Number(form.roleId) as RoleId }); closeForm(); await loadData() } catch(e) { error.value = getApiErrorMessage(e) } finally { saving.value = false } }
function doctorPayload() { const sp = fallbackSpecialties.find((s) => s.specialtyId === Number(form.specialtyId)); return { doctorName: form.doctorName, specialtyId: Number(form.specialtyId), specialtyName: sp?.specialtyName, degree: form.degree, examFee: Number(form.examFee || 0), isActive: true } }
function schedulePayload() { const d = fallbackDoctors.find((x) => x.doctorId === Number(form.doctorId)); return { doctorId: Number(form.doctorId), doctorName: d?.doctorName, workDate: form.workDate, startTime: form.startTime, endTime: form.endTime, slotDurationMinutes: Number(form.slotDurationMinutes || 30), isAvailable: true } }
function medicinePayload() { return { medicineName: form.medicineName, dosageForm: form.dosageForm, unitPrice: Number(form.unitPrice || 0), stockQuantity: Number(form.stockQuantity || 0), description: form.description, isActive: true } }

function actions(row: Row) { const a: Array<{key: Action; label: string; className: string}> = []; const st = String(row.status || '').toLowerCase(); if (['doctors','specialties','schedules','medicines'].includes(key.value)) a.push(btn('edit','Sửa','bg-slate-100 text-slate-700 hover:bg-slate-200'), btn('delete','Xóa','bg-rose-50 text-rose-700 hover:bg-rose-100')); if (key.value === 'appointments') { if (st.includes('pending')) a.push(btn('confirm','Xác nhận','bg-teal-600 text-white hover:bg-teal-700')); if (st.includes('confirmed')) a.push(btn('checkin','Check-in','bg-emerald-600 text-white hover:bg-emerald-700')); if (st.includes('checked')) a.push(btn('noop','Đã check-in','bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200')); if (!st.includes('cancel') && !st.includes('completed') && !st.includes('checked')) a.push(btn('cancel','Hủy','bg-rose-50 text-rose-700 hover:bg-rose-100')); if (st.includes('inprogress')) a.push(btn('complete','Hoàn tất','bg-indigo-600 text-white hover:bg-indigo-700')) } if (key.value === 'bills' && !st.includes('paid')) a.push(btn('pay','Thu tiền','bg-teal-600 text-white hover:bg-teal-700')); return a }
function btn(key: Action, label: string, className: string) { return { key, label, className } }
async function runAction(action: Action, row: Row) { if (action === 'noop') return; if (action === 'edit') return openForm(row); actingId.value = row.id; error.value = ''; try { const id = Number(row.invoiceId || row.id); if (action === 'delete') await deleteRow(id); if (action === 'confirm') await appointmentApi.confirmAppointment(id); if (action === 'checkin') { await appointmentApi.checkInAppointment(id); row.status = 'CheckedIn'; if (row.raw) row.raw.status = 'CheckedIn' } if (action === 'start') await appointmentApi.ensureAppointmentInProgress(id, String(row.raw?.appointmentDate || row.appointmentDate || '')); if (action === 'cancel') await appointmentApi.cancelAppointment(id); if (action === 'complete') await appointmentApi.completeAppointmentSafely(id, String(row.raw?.appointmentDate || row.appointmentDate || '')); if (action === 'pay') { await billingApi.payInvoice(id, row.amountValue); note.value = 'Đã gửi yêu cầu thanh toán sang N3.' } await loadData() } catch(e) { error.value = getApiErrorMessage(e) } finally { actingId.value = null } }
async function deleteRow(id: number) { if (key.value === 'doctors') await appointmentApi.deleteDoctor(id); if (key.value === 'specialties') await appointmentApi.deleteSpecialty(id); if (key.value === 'schedules') await appointmentApi.deleteDoctorSchedule(id); if (key.value === 'medicines') await medicineApi.deleteMedicine(id) }
function mapDoctor(x: Doctor): Row { return { id: x.doctorId, name: displayText(x.doctorName), specialty: displayText(x.specialtyName), degree: x.degree || 'Chưa cập nhật', fee: money(x.examFee), feeValue: x.examFee, status: x.isActive === false ? 'Tạm ngưng' : 'Đang hoạt động', raw: x } }
function mapSpecialty(x: Specialty): Row { return { id: x.specialtyId, name: displayText(x.specialtyName), specialtyName: x.specialtyName, status: 'Đang hoạt động', raw: x } }
function mapSchedule(x: DoctorSchedule): Row { return { id: x.scheduleId, doctorName: displayText(x.doctorName), workDate: date(x.workDate), timeRange: `${x.startTime} - ${x.endTime}`, duration: `${x.slotDurationMinutes || 30} phút`, status: x.isAvailable === false ? 'Tạm ngưng' : 'Đang mở', raw: x } }
function mapPatient(x: Patient): Row { return { id: x.patientCode || x.patientIdCode || x.id || x.patientId, name: displayText(x.fullName), phone: x.phone || x.phoneNumber || 'Chưa cập nhật', gender: x.gender || 'Chưa cập nhật', history: x.medicalHistory || 'Chưa ghi nhận', raw: x } }
function mapAppointment(x: Appointment & Record<string, any>): Row { return { id: toNumber(x.appointmentId, x.AppointmentId, x.id), appointmentDate: x.appointmentDate || x.AppointmentDate, patientId: toNumber(x.patientId, x.PatientId), doctorId: toNumber(x.doctorId, x.DoctorId), patientName: displayText(x.patientName || x.PatientName || x.patientNameSnapshot), doctorName: displayText(x.doctorName || x.DoctorName), dateTime: `${date(x.appointmentDate || x.AppointmentDate)} · ${x.slotTime || x.SlotTime || '-'}`, status: x.status || x.Status, feeValue: toNumber(x.examFee, x.ExamFee, x.doctor?.examFee, x.Doctor?.ExamFee), raw: x } }
function mapMedicine(x: Medicine & Record<string, any>): Row { const price = toNumber(x.unitPrice, x.UnitPrice, x.price, x.Price); const stock = toNumber(x.stockQuantity, x.StockQuantity, x.stock, x.Stock); return { id: toNumber(x.medicineId, x.MedicineId, x.id), name: x.medicineName || x.MedicineName || x.name, dosageForm: x.dosageForm || x.DosageForm || x.unit || x.Unit || 'Chưa cập nhật', price: money(price), stock, stockStatus: stock <= 0 ? 'Hết hàng' : stock <= 20 ? 'Tồn thấp' : 'Đủ hàng', raw: x } }
function mapPrescription(x: MedicalRecord): Row { return { id: x.medicalRecordCode || x.medicalRecordIdCode || x.recordIdCode || x.recordId || x.medicalRecordId || 'MR', patientId: x.patientCode || x.patientIdCode || x.patientId, diagnosis: x.diagnosis || 'Chưa chẩn đoán', doctorNotes: x.doctorNotes || 'Chưa ghi chú', status: 'Chờ kê đơn', raw: x } }
function mapInvoice(x: Invoice & Record<string, any>): Row { const amount = invoiceAmount(x); const invoiceId = toNumber(x.invoiceId, x.InvoiceId, x.id, x.Id); return { id: x.invoiceCode || x.invoiceIdCode || x.InvoiceCode || x.InvoiceIdCode || invoiceId, invoiceId, patientId: x.patientCode || x.patientIdCode || x.PatientCode || x.PatientIdCode || x.patientId || x.PatientId || 'Chưa cập nhật', appointmentId: x.appointmentId || x.AppointmentId ? `#${x.appointmentId || x.AppointmentId}` : '-', amount: money(amount), amountValue: amount, status: x.status || x.Status || 'Unpaid', raw: x } }
function mapUser(x: User): Row { return { id: x.id, fullName: displayText(x.fullName), username: x.username, email: x.email || 'Chưa cập nhật', roleName: x.roleName, raw: x } }
function cfg(title: string, service: string, description: string, endpoint: string, icon: Component, columns: Column[]): Config { return { title, service, description, endpoint, icon, columns } }
function cols(...xs: [string, string, boolean?, boolean?, boolean?][]): Column[] { return xs.map(([key,label,right,badge,strong]) => ({ key, label, right, badge, strong })) }
function value(v: unknown) { return v === undefined || v === null || v === '' ? 'Chưa cập nhật' : String(v) }
function toNumber(...values: unknown[]) { for (const value of values) { const numberValue = Number(value); if (Number.isFinite(numberValue) && numberValue > 0) return numberValue } return 0 }
function invoiceAmount(item: Record<string, any>) { return toNumber(item.amount, item.Amount, item.totalAmount, item.TotalAmount, item.examinationFee, item.ExaminationFee, item.examFee, item.ExamFee) }
function uniqueRows(items: Row[]) { const seen = new Set<string>(); return items.filter((item, index) => { const rowKey = String(item.id || item.appointmentId || index); if (seen.has(rowKey)) return false; seen.add(rowKey); return true }) }
function statusClass(v: unknown) { const s = String(v || '').toLowerCase(); if (s.includes('đang') || s.includes('paid') || s.includes('confirmed') || s.includes('completed') || s.includes('đủ')) return 'bg-teal-100 text-teal-700'; if (s.includes('pending') || s.includes('unpaid') || s.includes('chờ') || s.includes('tồn thấp')) return 'bg-amber-100 text-amber-700'; if (s.includes('cancel') || s.includes('hết') || s.includes('tạm')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
function money(v: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0)) }
function date(v?: string) { if (!v) return 'Chưa cập nhật'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('vi-VN').format(d) }
function addDays(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d }
</script>
