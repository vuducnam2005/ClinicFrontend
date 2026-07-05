<template>
  <section class="space-y-6">
    <FullscreenLoader :show="loading" />

    <header class="nurse-medicine-page-header">
      <div>
        <h1>Kho thuốc</h1>
        <p>Quản lý thuốc, hoạt chất, nhóm thuốc, đơn vị, giá bán, tồn kho, hạn dùng và trạng thái cấp phát.</p>
      </div>
      <div class="nurse-medicine-page-actions">
        <BaseButton variant="outline" :disabled="loading" @click="loadMedicines">
          <template #icon><RefreshCw class="h-4 w-4" /></template>
          Tải lại
        </BaseButton>
        <BaseButton @click="openForm()">
          <template #icon><Plus class="h-4 w-4" /></template>
          Thêm thuốc
        </BaseButton>
      </div>
    </header>

    <div v-if="note" class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <span>{{ error }}</span>
      <button type="button" class="ml-3 font-bold text-amber-900 underline" @click="loadMedicines">Thử lại</button>
    </div>

    <div class="nurse-medicine-table-shell">
      <ATable
        :columns="medicineTableColumns"
        :data-source="medicines"
        :pagination="medicinePagination"
        :row-key="medicineKey"
        size="middle"
        table-layout="fixed"
        @change="handleMedicineTableChange"
      >
        <template #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
          <div class="nurse-medicine-filter">
            <p class="nurse-medicine-filter-title">Tìm theo {{ String(column.title).toLowerCase() }}</p>
            <AInput
              :value="selectedKeys[0]"
              :placeholder="`Nhập ${String(column.title).toLowerCase()}...`"
              allow-clear
              autofocus
              @change="setSelectedKeys(getMedicineFilterKeys($event))"
              @press-enter="confirm()"
            >
              <template #prefix><Search class="h-3.5 w-3.5 text-slate-400" /></template>
            </AInput>
            <div class="nurse-medicine-filter-actions">
              <AButton size="small" class="nurse-medicine-filter-reset" @click="clearMedicineFilter(clearFilters, confirm)">Đặt lại</AButton>
              <AButton type="primary" size="small" class="nurse-medicine-filter-submit" @click="confirm()">Áp dụng</AButton>
            </div>
          </div>
        </template>
        <template #customFilterIcon="{ filtered, column }">
          <CheckCircle2 v-if="column.key === 'status' || column.key === 'alert'" :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
          <Search v-else :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
        </template>
        <template #emptyText>
          <div class="py-10 text-center">
            <SearchX class="mx-auto h-10 w-10 text-slate-300" />
            <p class="mt-4 font-bold text-slate-900">Không có thuốc phù hợp</p>
            <p class="mt-1 text-sm text-slate-500">Thử đổi bộ lọc trong từng cột hoặc thêm thuốc mới vào kho.</p>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'medicine'">
            <div class="min-w-0">
              <p class="truncate text-[13px] font-bold text-slate-900" :title="medicineName(record)">{{ medicineName(record) }}</p>
              <p class="mt-0.5 font-mono text-[11px] font-semibold text-[#0F52BA]">#{{ medicineId(record) || 'N/A' }}</p>
            </div>
          </template>
          <template v-else-if="column.key === 'activeIngredient'">
            <span class="line-clamp-2 text-[13px] font-medium text-slate-700" :title="medicineActiveIngredient(record)">{{ medicineActiveIngredient(record) }}</span>
          </template>
          <template v-else-if="column.key === 'type'">
            <ATag :bordered="false" class="nurse-medicine-type-tag">{{ medicineType(record) }}</ATag>
          </template>
          <template v-else-if="column.key === 'price'">
            <span class="whitespace-nowrap text-[13px] font-semibold text-slate-900">{{ formatCurrency(medicinePrice(record)) }}</span>
          </template>
          <template v-else-if="column.key === 'stock'">
            <div class="text-[13px]">
              <p class="font-semibold text-slate-900">{{ medicineStock(record) }} {{ medicineUnit(record) }}</p>
              <p class="mt-0.5 text-[11px] font-medium text-slate-400">Tối thiểu {{ medicineMinStock(record) }}</p>
            </div>
          </template>
          <template v-else-if="column.key === 'expiry'">
            <div class="text-[13px]">
              <p class="font-medium text-slate-700">{{ formatDate(medicineExpiryDate(record)) }}</p>
              <p :class="['mt-0.5 text-[11px] font-semibold', expiryClass(record)]">{{ expiryText(record) }}</p>
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <div class="flex flex-wrap gap-1.5">
              <ATag :bordered="false" :class="['nurse-medicine-status-tag', stockStatusClass(record)]">{{ stockText(record) }}</ATag>
              <ATag :bordered="false" :class="['nurse-medicine-status-tag', activeStatusClass(record)]">{{ statusText(record) }}</ATag>
            </div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="nurse-medicine-actions">
              <button type="button" class="nurse-medicine-action-button nurse-medicine-action-muted" title="Điều chỉnh tồn kho" @click="openStockForm(record)">
                <Archive class="h-4 w-4" />
              </button>
              <button type="button" class="nurse-medicine-action-button nurse-medicine-action-primary" title="Cập nhật thuốc" @click="openForm(record)">
                <Pencil class="h-4 w-4" />
              </button>
              <button type="button" class="nurse-medicine-action-button nurse-medicine-action-danger" title="Xóa thuốc" @click="deleteMedicine(record)">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </template>
        </template>
      </ATable>
    </div>

    <Teleport to="body">
      <div v-if="formOpen" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm" @click="closeForm"></div>
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside v-if="formOpen" class="fixed right-0 top-0 z-[121] flex h-screen w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="border-b border-slate-100 p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">{{ editingMedicine ? 'Cập nhật thuốc' : 'Thêm thuốc mới' }}</p>
                <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ form.medicineName || 'Thông tin thuốc' }}</h2>
                <p class="mt-2 text-sm text-slate-500">Nhập đầy đủ thông tin thuốc để lưu vào hệ thống.</p>
              </div>
              <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="closeForm">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submitMedicine">
            <div class="flex-1 space-y-6 overflow-y-auto p-6">
              <div class="grid gap-4 md:grid-cols-2">
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
                <textarea v-model="form.description" rows="4" class="form-textarea" placeholder="Thông tin bảo quản, lưu ý khi cấp phát hoặc ghi chú nhập kho."></textarea>
              </label>

              <div v-if="editingMedicine" class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-3">
                <InfoItem label="Mã thuốc" :value="String(medicineId(editingMedicine) || '-')" />
                <InfoItem label="Ngày tạo" :value="formatDateTime(medicineCreatedAt(editingMedicine))" />
                <InfoItem label="Cập nhật cuối" :value="formatDateTime(medicineUpdatedAt(editingMedicine))" />
              </div>
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white p-5 sm:flex-row sm:justify-end">
              <BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton>
              <BaseButton type="submit" :loading="saving">
                <template #icon><Save class="h-4 w-4" /></template>
                Lưu thuốc
              </BaseButton>
            </div>
          </form>
        </aside>
      </transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="stockFormOpen && stockMedicine" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm" @click="closeStockForm"></div>
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside v-if="stockFormOpen && stockMedicine" class="fixed right-0 top-0 z-[121] flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="border-b border-slate-100 p-6">
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
          </div>
          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submitStock">
            <div class="flex-1 space-y-4 overflow-y-auto p-6">
              <BaseInput v-model="stockForm.quantity" label="Tồn kho mới" type="number" min="0" required />
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Lý do điều chỉnh</span>
                <textarea v-model="stockForm.reason" rows="4" class="form-textarea" placeholder="Nhập kho, kiểm kê, hủy thuốc hết hạn..."></textarea>
              </label>
            </div>
            <div class="flex justify-end gap-3 border-t border-slate-100 bg-white p-5">
              <BaseButton type="button" variant="outline" @click="closeStockForm">Đóng</BaseButton>
              <BaseButton type="submit" :loading="saving">
                <template #icon><Archive class="h-4 w-4" /></template>
                Cập nhật tồn
              </BaseButton>
            </div>
          </form>
        </aside>
      </transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { Button as AButton, Input as AInput, Table as ATable, Tag as ATag } from 'ant-design-vue'
import {
  Archive,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SearchX,
  Trash2,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import FullscreenLoader from '@/components/ui/FullscreenLoader.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { medicineApi } from '@/services/medicineApi'
import type { Medicine } from '@/types/medicine'

type MedicineRecord = Partial<Medicine> & Record<string, any>

const medicines = ref<MedicineRecord[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const note = ref('')
const medicineCurrentPage = ref(1)
const medicinePageSize = ref(10)
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

const medicineTableColumns = computed(() => [
  {
    title: 'Thuốc',
    key: 'medicine',
    width: 220,
    customFilterDropdown: true,
    onFilter: medicineColumnFilter('medicine'),
    sorter: (a: MedicineRecord, b: MedicineRecord) => medicineName(a).localeCompare(medicineName(b), 'vi'),
  },
  {
    title: 'Hoạt chất',
    key: 'activeIngredient',
    width: 180,
    customFilterDropdown: true,
    onFilter: medicineColumnFilter('activeIngredient'),
    sorter: (a: MedicineRecord, b: MedicineRecord) => medicineActiveIngredient(a).localeCompare(medicineActiveIngredient(b), 'vi'),
  },
  {
    title: 'Nhóm',
    key: 'type',
    width: 150,
    filters: typeOptions.value.map((option) => ({ text: option.label, value: option.value })),
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: MedicineRecord) => medicineType(record) === String(filterValue),
  },
  {
    title: 'Giá',
    key: 'price',
    width: 132,
    align: 'right' as const,
    sorter: (a: MedicineRecord, b: MedicineRecord) => medicinePrice(a) - medicinePrice(b),
  },
  {
    title: 'Tồn kho',
    key: 'stock',
    width: 136,
    sorter: (a: MedicineRecord, b: MedicineRecord) => medicineStock(a) - medicineStock(b),
  },
  {
    title: 'Hạn dùng',
    key: 'expiry',
    width: 142,
    filters: [
      { text: 'Còn hạn', value: 'valid' },
      { text: 'Sắp hết hạn', value: 'expiring' },
      { text: 'Đã hết hạn', value: 'expired' },
      { text: 'Chưa cập nhật', value: 'none' },
    ],
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: MedicineRecord) => expiryKey(record) === String(filterValue),
    sorter: (a: MedicineRecord, b: MedicineRecord) => recordTimestamp(medicineExpiryDate(a)) - recordTimestamp(medicineExpiryDate(b)),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 190,
    filters: [
      { text: 'Đủ hàng', value: 'stock:healthy' },
      { text: 'Tồn thấp', value: 'stock:low' },
      { text: 'Hết hàng', value: 'stock:out' },
      { text: 'Hoạt động', value: 'active:Active' },
      { text: 'Tạm ngưng', value: 'active:Inactive' },
    ],
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: MedicineRecord) => {
      const value = String(filterValue)
      if (value.startsWith('stock:')) return alertKey(record) === value.replace('stock:', '')
      if (value.startsWith('active:')) return medicineStatus(record).toLowerCase() === value.replace('active:', '').toLowerCase()
      return false
    },
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 126,
    align: 'center' as const,
  },
])

const medicinePagination = computed(() => ({
  current: medicineCurrentPage.value,
  pageSize: medicinePageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showLessItems: true,
  showTitle: false,
  responsive: true,
  showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} trong ${total} thuốc`,
  locale: { items_per_page: ' / trang' },
}))

const InfoItem = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, required: true } },
  setup(props) {
    return () => h('div', [
      h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, props.label),
      h('p', { class: 'mt-1 font-semibold text-slate-800' }, props.value),
    ])
  },
})

function medicineSearchField(medicine: MedicineRecord, key: string) {
  if (key === 'medicine') return [medicineName(medicine), medicineId(medicine), medicineUnit(medicine)].filter(Boolean).join(' ')
  if (key === 'activeIngredient') return medicineActiveIngredient(medicine)
  if (key === 'type') return medicineType(medicine)
  if (key === 'status') return [stockText(medicine), statusText(medicine), expiryText(medicine)].join(' ')
  return ''
}

function medicineColumnFilter(key: string) {
  return (filterValue: string | number | boolean, record: MedicineRecord) =>
    normalizeText(medicineSearchField(record, key)).includes(normalizeText(filterValue))
}

function getMedicineFilterKeys(event: Event) {
  const filterValue = (event.target as HTMLInputElement)?.value || ''
  return filterValue ? [filterValue] : []
}

function clearMedicineFilter(clearFilters: (() => void) | undefined, confirm: () => void) {
  clearFilters?.()
  confirm()
}

function handleMedicineTableChange(pagination: { current?: number; pageSize?: number }) {
  medicineCurrentPage.value = pagination.current || 1
  medicinePageSize.value = pagination.pageSize || 10
}

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

function stockStatusClass(medicine: MedicineRecord) {
  const key = alertKey(medicine)
  if (key === 'out') return 'is-danger'
  if (key === 'low') return 'is-warning'
  return 'is-success'
}

function statusText(medicine: MedicineRecord) {
  return medicineStatus(medicine).toLowerCase() === 'active' ? 'Hoạt động' : 'Tạm ngưng'
}

function statusClass(medicine: MedicineRecord) {
  return medicineStatus(medicine).toLowerCase() === 'active'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-slate-100 text-slate-600'
}

function activeStatusClass(medicine: MedicineRecord) {
  return medicineStatus(medicine).toLowerCase() === 'active' ? 'is-active' : 'is-muted'
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

function normalizeText(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function recordTimestamp(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
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

<style scoped lang="postcss">
.nurse-medicine-page-header {
  @apply flex flex-col gap-4 px-1 lg:flex-row lg:items-start lg:justify-between;
}

.nurse-medicine-page-header h1 {
  @apply text-2xl font-bold tracking-normal text-slate-900;
}

.nurse-medicine-page-header p {
  @apply mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500;
}

.nurse-medicine-page-actions {
  @apply flex flex-wrap gap-2;
}

.nurse-medicine-table-shell {
  @apply overflow-hidden border border-slate-200 bg-white shadow-sm;
  border-radius: 8px;
}

.nurse-medicine-table-shell :deep(.ant-table) {
  color: #334155;
  font-size: 13px;
}

.nurse-medicine-table-shell :deep(.ant-table-container),
.nurse-medicine-table-shell :deep(.ant-table-content) {
  overflow-x: hidden !important;
}

.nurse-medicine-table-shell :deep(.ant-table table) {
  width: 100% !important;
  table-layout: fixed !important;
}

.nurse-medicine-table-shell :deep(.ant-table-thead > tr > th) {
  height: 44px;
  background: #f9fbfd;
  border-bottom: 1px solid #e8edf3;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 650;
  padding-block: 10px;
  padding-inline: 12px;
}

.nurse-medicine-table-shell :deep(.ant-table-tbody > tr > td) {
  height: 52px;
  border-bottom-color: #eef2f7;
  padding-block: 11px;
  padding-inline: 12px;
  vertical-align: middle;
  overflow-wrap: anywhere;
}

.nurse-medicine-table-shell :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: 0;
}

.nurse-medicine-table-shell :deep(.ant-table-tbody > tr:hover > td) {
  background: #f7faff;
}

.nurse-medicine-table-shell :deep(.ant-table-tbody > tr > td.ant-table-cell-fix-right),
.nurse-medicine-table-shell :deep(.ant-table-thead > tr > th.ant-table-cell-fix-right) {
  background: #ffffff;
}

.nurse-medicine-table-shell :deep(.ant-table-tbody > tr:hover > .ant-table-cell-fix-right) {
  background: #f7faff;
}

.nurse-medicine-table-shell :deep(.ant-pagination) {
  min-height: 58px;
  border-top: 1px solid #eef2f7;
  background: #fbfcfe;
  gap: 4px;
  margin: 0;
  padding: 13px 16px;
}

.nurse-medicine-table-shell :deep(.ant-table-cell-fix-right-first::after) {
  box-shadow: inset -8px 0 8px -8px rgb(15 23 42 / 0.16);
}

.nurse-medicine-table-shell :deep(.ant-table-column-sorter),
.nurse-medicine-table-shell :deep(.ant-table-filter-trigger) {
  color: #94a3b8;
  opacity: 0.45;
  transition: color 160ms ease, opacity 160ms ease;
}

.nurse-medicine-table-shell :deep(th:hover .ant-table-column-sorter),
.nurse-medicine-table-shell :deep(th:hover .ant-table-filter-trigger),
.nurse-medicine-table-shell :deep(.ant-table-filter-trigger.active) {
  opacity: 1;
}

.nurse-medicine-table-shell :deep(.ant-table-filter-trigger:hover),
.nurse-medicine-table-shell :deep(.ant-table-filter-trigger.active),
.nurse-medicine-table-shell :deep(.ant-table-column-sorter-up.active),
.nurse-medicine-table-shell :deep(.ant-table-column-sorter-down.active) {
  color: #0f52ba;
}

.nurse-medicine-table-shell :deep(.ant-pagination-total-text) {
  color: #64748b;
  font-size: 12px;
  line-height: 30px;
  margin-right: auto;
}

.nurse-medicine-table-shell :deep(.ant-pagination-item),
.nurse-medicine-table-shell :deep(.ant-pagination-prev .ant-pagination-item-link),
.nurse-medicine-table-shell :deep(.ant-pagination-next .ant-pagination-item-link) {
  min-width: 30px;
  height: 30px;
  margin-inline-end: 0;
  border-color: transparent;
  border-radius: 8px;
  background: transparent;
  line-height: 28px;
  transition: background 160ms ease, color 160ms ease;
}

.nurse-medicine-table-shell :deep(.ant-pagination-item:hover),
.nurse-medicine-table-shell :deep(.ant-pagination-prev:not(.ant-pagination-disabled) .ant-pagination-item-link:hover),
.nurse-medicine-table-shell :deep(.ant-pagination-next:not(.ant-pagination-disabled) .ant-pagination-item-link:hover) {
  background: #eaf2ff;
  border-color: transparent;
  color: #0f52ba;
}

.nurse-medicine-table-shell :deep(.ant-pagination-item-active) {
  background: #0f52ba;
  border-color: transparent;
  box-shadow: 0 4px 12px rgb(15 82 186 / 0.2);
}

.nurse-medicine-table-shell :deep(.ant-pagination-item-active:hover) {
  background: #003c90;
  border-color: transparent;
}

.nurse-medicine-table-shell :deep(.ant-pagination-item-active a),
.nurse-medicine-table-shell :deep(.ant-pagination-item-active:hover a),
.nurse-medicine-table-shell :deep(.ant-pagination-item-active:focus a) {
  color: #ffffff;
}

.nurse-medicine-table-shell :deep(.ant-pagination-options) {
  margin-inline-start: 8px;
}

.nurse-medicine-table-shell :deep(.ant-pagination-options .ant-select-selector) {
  background: #ffffff;
  border-color: #e2e8f0;
  border-radius: 8px;
  box-shadow: none;
  font-size: 12px;
  height: 30px;
}

.nurse-medicine-table-shell :deep(.ant-pagination-options .ant-select-selection-item) {
  line-height: 28px;
}

.nurse-medicine-filter {
  @apply w-64 rounded-xl bg-white p-3 shadow-xl;
}

.nurse-medicine-filter-title {
  @apply mb-2 text-xs font-bold text-slate-500;
}

.nurse-medicine-filter-actions {
  @apply mt-3 flex justify-end gap-2;
}

.nurse-medicine-filter-reset {
  @apply border-slate-200 text-slate-600;
}

.nurse-medicine-filter-submit {
  background: #0f52ba !important;
}

.nurse-medicine-type-tag {
  @apply rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700;
}

.nurse-medicine-status-tag {
  @apply rounded-full px-2.5 py-1 text-xs font-medium;
}

.nurse-medicine-status-tag.is-success {
  @apply bg-emerald-50 text-emerald-700;
}

.nurse-medicine-status-tag.is-warning {
  @apply bg-amber-50 text-amber-700;
}

.nurse-medicine-status-tag.is-danger {
  @apply bg-rose-50 text-rose-700;
}

.nurse-medicine-status-tag.is-active {
  @apply bg-blue-50 text-blue-700;
}

.nurse-medicine-status-tag.is-muted {
  @apply bg-slate-100 text-slate-600;
}

.nurse-medicine-actions {
  @apply flex items-center justify-center gap-1.5;
}

.nurse-medicine-action-button {
  @apply inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50;
}

.nurse-medicine-action-primary {
  @apply border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100;
}

.nurse-medicine-action-danger {
  @apply border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100;
}

.nurse-medicine-action-muted {
  @apply border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700;
}

.form-textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100;
}
</style>
