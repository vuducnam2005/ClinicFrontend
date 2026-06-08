<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <PackageOpen class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">N3 Pharmacy</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Kho thuốc</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Quản lý thuốc, hoạt chất, nhóm thuốc, đơn vị, giá bán, tồn kho, ngưỡng cảnh báo, hạn dùng và trạng thái phát thuốc.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">GET/POST/PUT/DELETE /pharmacy/api/medicines</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Role Nurse</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" :disabled="loading" @click="loadMedicines">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
          <BaseButton @click="openForm()">
            <template #icon><Plus class="h-4 w-4" /></template>
            Thêm thuốc
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="metric in metrics" :key="metric.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ metric.label }}</p>
            <p class="mt-3 text-3xl font-bold text-slate-950">{{ metric.value }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-500">{{ metric.note }}</p>
          </div>
          <span :class="['flex h-11 w-11 items-center justify-center rounded-xl', metric.className]">
            <component :is="metric.icon" class="h-5 w-5" />
          </span>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
        <label class="relative block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Tìm kiếm</span>
          <Search class="pointer-events-none absolute left-3 top-[2.65rem] h-4 w-4 text-slate-400" />
          <input
            v-model="query"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100"
            placeholder="Tên thuốc, hoạt chất, nhóm thuốc..."
          />
        </label>
        <BaseSelect v-model="typeFilter" label="Nhóm thuốc" placeholder="Tất cả" :options="typeOptions" />
        <BaseSelect v-model="statusFilter" label="Trạng thái" placeholder="Tất cả" :options="statusOptions" />
        <BaseSelect v-model="alertFilter" label="Cảnh báo" placeholder="Tất cả" :options="alertOptions" />
        <BaseButton variant="outline" @click="resetFilters">
          <template #icon><RotateCcw class="h-4 w-4" /></template>
          Đặt lại
        </BaseButton>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <span>{{ error }}</span>
      <button type="button" class="ml-3 font-bold text-amber-900 underline" @click="loadMedicines">Thử lại</button>
    </div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="item in 3" :key="item" />
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-bold text-slate-900">Danh mục thuốc</p>
          <p class="mt-1 text-xs font-medium text-slate-500">Hiển thị đầy đủ các trường chính trong bảng Medicines của N3.</p>
        </div>
        <span class="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{{ filteredMedicines.length }} thuốc</span>
      </div>

      <div v-if="filteredMedicines.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3.5">Thuốc</th>
              <th class="px-5 py-3.5">Hoạt chất</th>
              <th class="px-5 py-3.5">Nhóm</th>
              <th class="px-5 py-3.5 text-right">Giá</th>
              <th class="px-5 py-3.5 text-right">Tồn kho</th>
              <th class="px-5 py-3.5">Hạn dùng</th>
              <th class="px-5 py-3.5">Trạng thái</th>
              <th class="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="medicine in paginatedMedicines" :key="medicineKey(medicine)" class="transition hover:bg-slate-50">
              <td class="px-5 py-4 align-top">
                <p class="font-bold text-slate-950">{{ medicineName(medicine) }}</p>
                <p class="mt-1 font-mono text-xs font-semibold text-slate-500">#{{ medicineId(medicine) || 'N/A' }}</p>
                <p class="mt-1 text-xs font-medium text-slate-500">{{ medicineUnit(medicine) }}</p>
              </td>
              <td class="px-5 py-4 align-top text-slate-700">{{ medicineActiveIngredient(medicine) }}</td>
              <td class="px-5 py-4 align-top">
                <span class="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">{{ medicineType(medicine) }}</span>
              </td>
              <td class="px-5 py-4 text-right align-top font-bold text-slate-900">{{ formatCurrency(medicinePrice(medicine)) }}</td>
              <td class="px-5 py-4 text-right align-top">
                <p class="font-bold text-slate-950">{{ medicineStock(medicine) }}</p>
                <p class="mt-1 text-xs text-slate-500">Tối thiểu {{ medicineMinStock(medicine) }}</p>
              </td>
              <td class="px-5 py-4 align-top">
                <p class="font-semibold text-slate-800">{{ formatDate(medicineExpiryDate(medicine)) }}</p>
                <p :class="['mt-1 text-xs font-bold', expiryClass(medicine)]">{{ expiryText(medicine) }}</p>
              </td>
              <td class="px-5 py-4 align-top">
                <div class="space-y-1.5">
                  <span :class="['inline-flex rounded-full px-2.5 py-1 text-xs font-bold', stockClass(medicine)]">{{ stockText(medicine) }}</span>
                  <span :class="['block w-fit rounded-full px-2.5 py-1 text-xs font-bold', statusClass(medicine)]">{{ statusText(medicine) }}</span>
                </div>
              </td>
              <td class="px-5 py-4 align-top text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50" @click="openStockForm(medicine)">
                    <Archive class="h-3.5 w-3.5" />
                    Tồn
                  </button>
                  <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100" @click="openForm(medicine)">
                    <Pencil class="h-3.5 w-3.5" />
                    Sửa
                  </button>
                  <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100" @click="deleteMedicine(medicine)">
                    <Trash2 class="h-3.5 w-3.5" />
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <span>Hiển thị</span>
            <select v-model="itemsPerPage" class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
            <span>bản ghi mỗi trang</span>
          </div>
          <div class="text-sm font-medium text-slate-500">
            {{ pageStart }} - {{ pageEnd }} trên {{ filteredMedicines.length }} kết quả
          </div>
          <div v-if="totalPages > 1" class="flex items-center gap-1.5">
            <button type="button" :disabled="currentPage === 1" class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50" @click="currentPage--">
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              type="button"
              :class="[
                'h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition',
                currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              ]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
            <button type="button" :disabled="currentPage === totalPages" class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50" @click="currentPage++">
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-300" />
        <h2 class="mt-4 text-lg font-bold text-slate-950">Không có thuốc phù hợp</h2>
        <p class="mt-2 text-sm text-slate-500">Thử đổi bộ lọc hoặc thêm thuốc mới vào kho N3.</p>
      </div>
    </div>

    <div v-if="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">{{ editingMedicine ? 'Cập nhật thuốc' : 'Thêm thuốc mới' }}</p>
              <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ form.medicineName || 'Thông tin thuốc' }}</h2>
              <p class="mt-2 text-sm text-slate-500">Nhập đủ thông tin để đồng bộ với database Medicines của N3.</p>
            </div>
            <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="closeForm">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>

        <form class="space-y-6 p-6" @submit.prevent="submitMedicine">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BaseInput v-model="form.medicineName" label="Tên thuốc" required placeholder="Paracetamol 500mg" />
            <BaseInput v-model="form.activeIngredient" label="Hoạt chất" required placeholder="Paracetamol" />
            <BaseInput v-model="form.medicineType" label="Nhóm thuốc" required placeholder="Giảm đau - hạ sốt" />
            <BaseInput v-model="form.unit" label="Đơn vị" required placeholder="Viên, Chai, Ống..." />
            <BaseInput v-model="form.price" label="Giá bán" type="number" min="0" required />
            <BaseInput v-model="form.stockQuantity" label="Tồn kho" type="number" min="0" required />
            <BaseInput v-model="form.minStockLevel" label="Ngưỡng tồn tối thiểu" type="number" min="0" required />
            <BaseInput v-model="form.expiryDate" label="Hạn dùng" type="date" required />
            <BaseSelect v-model="form.status" label="Trạng thái" :options="statusOptionsForForm" required />
          </div>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Mô tả / ghi chú nội bộ</span>
            <textarea v-model="form.description" rows="3" class="form-textarea" placeholder="Thông tin bảo quản, lưu ý khi cấp phát hoặc ghi chú nhập kho."></textarea>
          </label>

          <div v-if="editingMedicine" class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-3">
            <InfoItem label="Mã thuốc" :value="String(medicineId(editingMedicine) || '-')" />
            <InfoItem label="Ngày tạo" :value="formatDateTime(medicineCreatedAt(editingMedicine))" />
            <InfoItem label="Cập nhật cuối" :value="formatDateTime(medicineUpdatedAt(editingMedicine))" />
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">
              <template #icon><Save class="h-4 w-4" /></template>
              Lưu thuốc
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <div v-if="stockFormOpen && stockMedicine" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Điều chỉnh tồn kho</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ medicineName(stockMedicine) }}</h2>
            <p class="mt-2 text-sm text-slate-500">Tồn hiện tại: {{ medicineStock(stockMedicine) }} {{ medicineUnit(stockMedicine) }}</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="closeStockForm">
            <X class="h-5 w-5" />
          </button>
        </div>
        <form class="mt-5 space-y-4" @submit.prevent="submitStock">
          <BaseInput v-model="stockForm.quantity" label="Tồn kho mới" type="number" min="0" required />
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Lý do điều chỉnh</span>
            <textarea v-model="stockForm.reason" rows="3" class="form-textarea" placeholder="Nhập kho, kiểm kê, hủy thuốc hết hạn..."></textarea>
          </label>
          <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <BaseButton type="button" variant="outline" @click="closeStockForm">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">
              <template #icon><Archive class="h-4 w-4" /></template>
              Cập nhật tồn
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import {
  Archive,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SearchX,
  Trash2,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { medicineApi } from '@/services/medicineApi'
import type { Medicine } from '@/types/medicine'

type MedicineRecord = Medicine & Record<string, any>

const medicines = ref<MedicineRecord[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const alertFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const formOpen = ref(false)
const editingMedicine = ref<MedicineRecord | null>(null)
const stockFormOpen = ref(false)
const stockMedicine = ref<MedicineRecord | null>(null)

const form = reactive({
  medicineName: '',
  activeIngredient: '',
  medicineType: '',
  unit: '',
  price: '',
  stockQuantity: '',
  minStockLevel: '',
  expiryDate: '',
  status: 'Active',
  description: '',
})

const stockForm = reactive({
  quantity: '',
  reason: '',
})

const statusOptions = [
  { label: 'Hoạt động', value: 'Active' },
  { label: 'Tạm ngưng', value: 'Inactive' },
]

const statusOptionsForForm = statusOptions

const alertOptions = [
  { label: 'Hết hàng', value: 'out' },
  { label: 'Tồn thấp', value: 'low' },
  { label: 'Hết hạn', value: 'expired' },
  { label: 'Sắp hết hạn', value: 'expiring' },
  { label: 'Đủ hàng', value: 'healthy' },
]

const typeOptions = computed(() => {
  const values = new Set(medicines.value.map(medicineType).filter(Boolean))
  return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi')).map((value) => ({ label: value, value }))
})

const filteredMedicines = computed(() => {
  const keyword = normalizeText(query.value)
  return medicines.value.filter((medicine) => {
    const matchesKeyword = !keyword || [
      medicineName(medicine),
      medicineActiveIngredient(medicine),
      medicineType(medicine),
      medicineUnit(medicine),
      statusText(medicine),
    ].some((value) => normalizeText(value).includes(keyword))
    const matchesType = !typeFilter.value || medicineType(medicine) === typeFilter.value
    const matchesStatus = !statusFilter.value || medicineStatus(medicine).toLowerCase() === statusFilter.value.toLowerCase()
    const matchesAlert = !alertFilter.value || alertKey(medicine) === alertFilter.value
    return matchesKeyword && matchesType && matchesStatus && matchesAlert
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMedicines.value.length / Number(itemsPerPage.value || 10))))
const paginatedMedicines = computed(() => {
  const start = (currentPage.value - 1) * Number(itemsPerPage.value || 10)
  return filteredMedicines.value.slice(start, start + Number(itemsPerPage.value || 10))
})
const visiblePages = computed(() => {
  const pages: number[] = []
  const from = Math.max(1, currentPage.value - 2)
  const to = Math.min(totalPages.value, currentPage.value + 2)
  for (let page = from; page <= to; page += 1) pages.push(page)
  return pages
})
const pageStart = computed(() => filteredMedicines.value.length ? (currentPage.value - 1) * Number(itemsPerPage.value || 10) + 1 : 0)
const pageEnd = computed(() => Math.min(filteredMedicines.value.length, currentPage.value * Number(itemsPerPage.value || 10)))

const metrics = computed(() => [
  { label: 'Tổng thuốc', value: medicines.value.length, note: 'Danh mục N3', icon: PackageOpen, className: 'bg-blue-50 text-blue-700' },
  { label: 'Đang hoạt động', value: medicines.value.filter((item) => medicineStatus(item).toLowerCase() === 'active').length, note: 'Có thể cấp phát', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  { label: 'Cần bổ sung', value: medicines.value.filter((item) => ['out', 'low'].includes(alertKey(item))).length, note: 'Hết hàng hoặc dưới ngưỡng', icon: AlertTriangle, className: 'bg-amber-50 text-amber-700' },
  { label: 'Cận hạn', value: medicines.value.filter((item) => ['expired', 'expiring'].includes(expiryKey(item))).length, note: 'Hết hạn hoặc trong 60 ngày', icon: Clock3, className: 'bg-rose-50 text-rose-700' },
])

const InfoItem = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, required: true } },
  setup(props) {
    return () => h('div', [
      h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, props.label),
      h('p', { class: 'mt-1 font-semibold text-slate-800' }, props.value),
    ])
  },
})

watch([query, typeFilter, statusFilter, alertFilter, itemsPerPage], () => {
  currentPage.value = 1
})

onMounted(loadMedicines)

async function loadMedicines() {
  loading.value = true
  error.value = ''
  try {
    medicines.value = await medicineApi.getMedicines({ pageSize: 100 }) as MedicineRecord[]
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
    medicines.value = []
  } finally {
    loading.value = false
  }
}

function openForm(medicine?: MedicineRecord) {
  editingMedicine.value = medicine || null
  Object.assign(form, {
    medicineName: medicine ? medicineName(medicine) : '',
    activeIngredient: medicine ? medicineActiveIngredient(medicine) : '',
    medicineType: medicine ? medicineType(medicine) : '',
    unit: medicine ? medicineUnit(medicine) : '',
    price: medicine ? String(medicinePrice(medicine)) : '',
    stockQuantity: medicine ? String(medicineStock(medicine)) : '',
    minStockLevel: medicine ? String(medicineMinStock(medicine)) : '10',
    expiryDate: normalizeDateInput(medicine ? medicineExpiryDate(medicine) : ''),
    status: medicine ? medicineStatus(medicine) : 'Active',
    description: medicine?.description || medicine?.Description || '',
  })
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingMedicine.value = null
}

async function submitMedicine() {
  const validation = validateMedicineForm()
  if (validation) {
    error.value = validation
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload = medicinePayload()
    if (editingMedicine.value) {
      await medicineApi.updateMedicine(medicineId(editingMedicine.value), payload)
      note.value = 'Đã cập nhật thông tin thuốc.'
    } else {
      await medicineApi.createMedicine(payload)
      note.value = 'Đã thêm thuốc mới vào kho.'
    }
    closeForm()
    await loadMedicines()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    saving.value = false
  }
}

function openStockForm(medicine: MedicineRecord) {
  stockMedicine.value = medicine
  Object.assign(stockForm, {
    quantity: String(medicineStock(medicine)),
    reason: 'Điều chỉnh tồn kho từ giao diện Nurse',
  })
  stockFormOpen.value = true
}

function closeStockForm() {
  stockFormOpen.value = false
  stockMedicine.value = null
}

async function submitStock() {
  if (!stockMedicine.value) return
  const quantity = Number(stockForm.quantity)
  if (!Number.isFinite(quantity) || quantity < 0) {
    error.value = 'Tồn kho mới phải là số không âm.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await medicineApi.updateStock(medicineId(stockMedicine.value), quantity)
    note.value = 'Đã cập nhật tồn kho.'
    closeStockForm()
    await loadMedicines()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    saving.value = false
  }
}

async function deleteMedicine(medicine: MedicineRecord) {
  const id = medicineId(medicine)
  if (!id) return
  if (!window.confirm(`Xóa thuốc "${medicineName(medicine)}" khỏi kho?`)) return
  saving.value = true
  error.value = ''
  try {
    await medicineApi.deleteMedicine(id)
    note.value = 'Đã xóa thuốc khỏi kho.'
    await loadMedicines()
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    saving.value = false
  }
}

function resetFilters() {
  query.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
  alertFilter.value = ''
}

function validateMedicineForm() {
  if (!form.medicineName.trim()) return 'Vui lòng nhập tên thuốc.'
  if (!form.activeIngredient.trim()) return 'Vui lòng nhập hoạt chất.'
  if (!form.medicineType.trim()) return 'Vui lòng nhập nhóm thuốc.'
  if (!form.unit.trim()) return 'Vui lòng nhập đơn vị.'
  if (!isNonNegativeNumber(form.price)) return 'Giá bán phải là số không âm.'
  if (!isNonNegativeNumber(form.stockQuantity)) return 'Tồn kho phải là số không âm.'
  if (!isNonNegativeNumber(form.minStockLevel)) return 'Ngưỡng tồn tối thiểu phải là số không âm.'
  if (!form.expiryDate) return 'Vui lòng chọn hạn dùng.'
  return ''
}

function medicinePayload(): Partial<Medicine> {
  const price = Number(form.price || 0)
  return {
    medicineName: form.medicineName.trim(),
    activeIngredient: form.activeIngredient.trim(),
    medicineType: form.medicineType.trim(),
    unit: form.unit.trim(),
    price,
    unitPrice: price,
    stockQuantity: Number(form.stockQuantity || 0),
    minStockLevel: Number(form.minStockLevel || 0),
    expiryDate: form.expiryDate,
    status: form.status || 'Active',
    isActive: (form.status || 'Active') === 'Active',
    description: form.description.trim() || undefined,
  }
}

function medicineKey(medicine: MedicineRecord) {
  return String(medicineId(medicine) || medicineName(medicine))
}

function medicineId(medicine: MedicineRecord | null) {
  return Number(medicine?.medicineId ?? medicine?.MedicineId ?? medicine?.id ?? medicine?.Id ?? 0)
}

function medicineName(medicine: MedicineRecord) {
  return String(medicine.medicineName ?? medicine.MedicineName ?? medicine.name ?? 'Chưa cập nhật')
}

function medicineActiveIngredient(medicine: MedicineRecord) {
  return String(medicine.activeIngredient ?? medicine.ActiveIngredient ?? 'Chưa cập nhật')
}

function medicineType(medicine: MedicineRecord) {
  return String(medicine.medicineType ?? medicine.MedicineType ?? medicine.type ?? medicine.Type ?? 'Khác')
}

function medicineUnit(medicine: MedicineRecord) {
  return String(medicine.unit ?? medicine.Unit ?? medicine.dosageForm ?? medicine.DosageForm ?? 'đơn vị')
}

function medicinePrice(medicine: MedicineRecord) {
  return Number(medicine.price ?? medicine.Price ?? medicine.unitPrice ?? medicine.UnitPrice ?? 0) || 0
}

function medicineStock(medicine: MedicineRecord) {
  return Number(medicine.stockQuantity ?? medicine.StockQuantity ?? medicine.stock ?? medicine.Stock ?? 0) || 0
}

function medicineMinStock(medicine: MedicineRecord) {
  return Number(medicine.minStockLevel ?? medicine.MinStockLevel ?? 10) || 0
}

function medicineExpiryDate(medicine: MedicineRecord) {
  return String(medicine.expiryDate ?? medicine.ExpiryDate ?? '')
}

function medicineCreatedAt(medicine: MedicineRecord) {
  return String(medicine.createdAt ?? medicine.CreatedAt ?? '')
}

function medicineUpdatedAt(medicine: MedicineRecord) {
  return String(medicine.updatedAt ?? medicine.UpdatedAt ?? '')
}

function medicineStatus(medicine: MedicineRecord) {
  const explicit = medicine.status ?? medicine.Status
  if (explicit) return String(explicit)
  if (medicine.isActive === false || medicine.IsActive === false) return 'Inactive'
  return 'Active'
}

function stockText(medicine: MedicineRecord) {
  const key = alertKey(medicine)
  if (key === 'out') return 'Hết hàng'
  if (key === 'low') return 'Tồn thấp'
  return 'Đủ hàng'
}

function stockClass(medicine: MedicineRecord) {
  const key = alertKey(medicine)
  if (key === 'out') return 'bg-rose-100 text-rose-700'
  if (key === 'low') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function statusText(medicine: MedicineRecord) {
  return medicineStatus(medicine).toLowerCase() === 'active' ? 'Hoạt động' : 'Tạm ngưng'
}

function statusClass(medicine: MedicineRecord) {
  return medicineStatus(medicine).toLowerCase() === 'active'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-slate-100 text-slate-600'
}

function alertKey(medicine: MedicineRecord) {
  if (medicineStock(medicine) <= 0) return 'out'
  if (medicineStock(medicine) <= medicineMinStock(medicine)) return 'low'
  const expiry = expiryKey(medicine)
  if (expiry === 'expired' || expiry === 'expiring') return expiry
  return 'healthy'
}

function expiryKey(medicine: MedicineRecord) {
  const value = medicineExpiryDate(medicine)
  if (!value) return 'none'
  const expiry = new Date(value)
  if (Number.isNaN(expiry.getTime())) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 60) return 'expiring'
  return 'valid'
}

function expiryText(medicine: MedicineRecord) {
  const key = expiryKey(medicine)
  if (key === 'expired') return 'Đã hết hạn'
  if (key === 'expiring') return 'Sắp hết hạn'
  if (key === 'valid') return 'Còn hạn'
  return 'Chưa cập nhật'
}

function expiryClass(medicine: MedicineRecord) {
  const key = expiryKey(medicine)
  if (key === 'expired') return 'text-rose-600'
  if (key === 'expiring') return 'text-amber-600'
  if (key === 'valid') return 'text-emerald-600'
  return 'text-slate-400'
}

function isNonNegativeNumber(value: string) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0
}

function normalizeText(value: string) {
  return String(value || '').trim().toLowerCase()
}

function normalizeDateInput(value: string) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
</script>

<style scoped>
.form-textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100;
}
</style>
