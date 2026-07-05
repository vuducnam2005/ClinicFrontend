<template>
  <section class="space-y-6">
    <FullscreenLoader :show="loading" />

    <header class="nurse-inventory-page-header">
      <div>
        <h1>Phiếu yêu cầu nhập kho</h1>
        <p>Lập yêu cầu nhập kho thuốc mới kèm số lô, hạn dùng và hóa đơn đối chiếu để gửi Admin phê duyệt.</p>
      </div>
      <div class="nurse-inventory-page-actions">
        <BaseButton variant="outline" :disabled="loading" @click="loadSlips">
          <template #icon><RefreshCw class="h-4 w-4" /></template>
          Tải lại
        </BaseButton>
        <BaseButton @click="openCreateModal">
          <template #icon><Plus class="h-4 w-4" /></template>
          Tạo phiếu nhập
        </BaseButton>
      </div>
    </header>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="metric in metrics" :key="metric.label" class="nurse-inventory-metric-card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p>{{ metric.label }}</p>
            <strong>{{ metric.value }}</strong>
          </div>
          <span :class="metric.className">
            <component :is="metric.icon" class="h-5 w-5" />
          </span>
        </div>
      </div>
    </div>

    <div v-if="error" class="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <span>{{ error }}</span>
      <BaseButton size="sm" variant="outline" @click="loadSlips">Thử lại</BaseButton>
    </div>

    <div class="nurse-inventory-table-shell">
      <ATable
        :columns="slipTableColumns"
        :data-source="slips"
        :pagination="slipPagination"
        :row-key="slipIdentity"
        size="middle"
        table-layout="fixed"
        @change="handleSlipTableChange"
      >
        <template #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
          <div class="nurse-inventory-filter">
            <p class="nurse-inventory-filter-title">Tìm theo {{ String(column.title).toLowerCase() }}</p>
            <AInput
              :value="selectedKeys[0]"
              :placeholder="`Nhập ${String(column.title).toLowerCase()}...`"
              allow-clear
              autofocus
              @change="setSelectedKeys(getSlipFilterKeys($event))"
              @press-enter="confirm()"
            >
              <template #prefix><Search class="h-3.5 w-3.5 text-slate-400" /></template>
            </AInput>
            <div class="nurse-inventory-filter-actions">
              <AButton size="small" class="nurse-inventory-filter-reset" @click="clearSlipFilter(clearFilters, confirm)">Đặt lại</AButton>
              <AButton type="primary" size="small" class="nurse-inventory-filter-submit" @click="confirm()">Áp dụng</AButton>
            </div>
          </div>
        </template>
        <template #customFilterIcon="{ filtered, column }">
          <CheckCircle2 v-if="column.key === 'status'" :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
          <Search v-else :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
        </template>
        <template #emptyText>
          <div class="py-10 text-center">
            <ClipboardList class="mx-auto h-10 w-10 text-slate-300" />
            <p class="mt-4 font-bold text-slate-900">Không có phiếu yêu cầu nào</p>
            <p class="mt-1 text-sm text-slate-500">Hãy tạo phiếu nhập kho đầu tiên của bạn.</p>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <span class="font-mono text-xs font-semibold text-[#0F52BA]">#{{ record.slipCode }}</span>
          </template>
          <template v-else-if="column.key === 'supplier'">
            <div class="min-w-0">
              <p class="truncate text-[13px] font-bold text-slate-900" :title="record.supplierName">{{ record.supplierName || 'Chưa cập nhật' }}</p>
              <p class="mt-0.5 text-[11px] font-medium text-slate-400">{{ record.createdByName || 'Chưa rõ người tạo' }}</p>
            </div>
          </template>
          <template v-else-if="column.key === 'items'">
            <span class="text-[13px] font-medium text-slate-700">{{ record.totalItems }} loại</span>
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span class="text-[13px] font-semibold text-slate-900">{{ record.totalQuantity }}</span>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            <span class="text-[13px] font-medium text-slate-600">{{ formatDateTime(record.createdAt) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <ATag :bordered="false" :class="['nurse-inventory-status-tag', statusTone(record.status)]">{{ statusText(record.status) }}</ATag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="nurse-inventory-actions">
              <button type="button" class="nurse-inventory-action-button nurse-inventory-action-primary" title="Xem chi tiết phiếu" @click="viewDetailsRecord(record)">
                <Eye class="h-4 w-4" />
              </button>
            </div>
          </template>
        </template>
      </ATable>
    </div>

    <Teleport to="body">
      <div v-if="detailOpen && selectedSlip" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm" @click="detailOpen = false"></div>
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside v-if="detailOpen && selectedSlip" class="fixed right-0 top-0 z-[121] flex h-screen w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <ATag :bordered="false" :class="['nurse-inventory-status-tag', statusTone(selectedSlip.status)]">{{ statusText(selectedSlip.status) }}</ATag>
                <span class="text-xs font-semibold text-slate-400">Nhập kho</span>
              </div>
              <h2 class="mt-2 text-2xl font-bold text-slate-950">Phiếu nhập #{{ selectedSlip.slipCode }}</h2>
            </div>
            <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="detailOpen = false">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="flex-1 space-y-6 overflow-y-auto p-6">
            <div v-if="selectedSlip.status === 'Rejected'" class="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
              <p class="font-bold">Lý do từ chối của Admin</p>
              <p class="mt-1">{{ selectedSlip.rejectReason || 'Chưa cập nhật' }}</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <InfoBlock label="Nhà cung cấp" :value="selectedSlip.supplierName || 'Chưa cập nhật'" />
              <InfoBlock label="Người tạo" :value="selectedSlip.createdByName || 'Chưa cập nhật'" />
              <InfoBlock label="Ngày lập" :value="formatDateTime(selectedSlip.createdAt)" />
              <InfoBlock v-if="selectedSlip.approvedAt" label="Người duyệt / Ngày duyệt" :value="`${selectedSlip.approvedByName || 'Chưa cập nhật'} - ${formatDateTime(selectedSlip.approvedAt)}`" />
            </div>

            <div v-if="selectedSlip.note" class="space-y-2">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Ghi chú</p>
              <p class="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-700">{{ selectedSlip.note }}</p>
            </div>

            <div class="space-y-3">
              <h3 class="font-bold text-slate-950">Danh sách thuốc nhập</h3>
              <div class="overflow-hidden rounded-xl border border-slate-200">
                <table class="min-w-full divide-y divide-slate-100 text-sm">
                  <thead class="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <tr>
                      <th class="px-4 py-2.5">Thuốc</th>
                      <th class="px-4 py-2.5">Số lô</th>
                      <th class="px-4 py-2.5">Hạn dùng</th>
                      <th class="px-4 py-2.5 text-right">Giá nhập</th>
                      <th class="px-4 py-2.5 text-right">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="item in selectedSlip.items" :key="item.slipItemId">
                      <td class="px-4 py-3 font-semibold text-slate-900">{{ item.medicineName }}</td>
                      <td class="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{{ item.batchNumber }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ formatDate(item.expiryDate) }}</td>
                      <td class="px-4 py-3 text-right font-medium text-slate-900">{{ item.importPrice ? formatCurrency(item.importPrice) : '—' }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-slate-950">{{ item.quantity }} {{ item.medicineUnit }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 border-t border-slate-100 bg-white p-5">
            <button
              v-if="selectedSlip.status === 'Pending' || selectedSlip.status === 'Rejected'"
              type="button"
              :disabled="saving"
              class="inline-flex h-10 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
              @click="voidSlip(selectedSlip.slipId)"
            >
              Hủy yêu cầu
            </button>
            <span v-else></span>
            <BaseButton variant="outline" @click="detailOpen = false">Đóng</BaseButton>
          </div>
        </aside>
      </transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="createOpen" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm" @click="createOpen = false"></div>
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside v-if="createOpen" class="fixed right-0 top-0 z-[121] flex h-screen w-full max-w-5xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Tạo phiếu mới</p>
              <h2 class="mt-1 text-2xl font-bold text-slate-950">Phiếu yêu cầu nhập kho</h2>
            </div>
            <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="createOpen = false">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="flex-1 space-y-6 overflow-y-auto p-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <BaseInput v-model="createForm.supplierName" label="Nhà cung cấp" placeholder="Nhà thuốc Long Châu, Pharmacity..." />
              <BaseInput v-model="createForm.note" label="Ghi chú phiếu" placeholder="Nhập bổ sung thuốc quý 3, hàng nhập kho..." />
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-950">Danh sách thuốc nhập</h3>
                <BaseButton size="sm" variant="outline" @click="addItemRow">
                  <template #icon><Plus class="h-3.5 w-3.5" /></template>
                  Thêm thuốc
                </BaseButton>
              </div>

              <div class="overflow-hidden rounded-xl border border-slate-200">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                  <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th class="w-1/3 px-4 py-3">Tên thuốc</th>
                      <th class="px-4 py-3">Số lô</th>
                      <th class="px-4 py-3">Hạn dùng</th>
                      <th class="w-28 px-4 py-3">Giá nhập</th>
                      <th class="w-24 px-4 py-3">Số lượng</th>
                      <th class="w-12 px-4 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white">
                    <tr v-for="(item, index) in createForm.items" :key="index">
                      <td class="px-3 py-2">
                        <select v-model="item.medicineId" class="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-400" required>
                          <option value="" disabled>-- Chọn thuốc --</option>
                          <option v-for="med in medicines" :key="med.medicineId" :value="med.medicineId">
                            {{ med.medicineName }} ({{ med.unit }})
                          </option>
                        </select>
                      </td>
                      <td class="px-3 py-2">
                        <input v-model="item.batchNumber" class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400" placeholder="LOT12345" required />
                      </td>
                      <td class="px-3 py-2">
                        <input v-model="item.expiryDate" type="date" class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400" required />
                      </td>
                      <td class="px-3 py-2">
                        <input v-model.number="item.importPrice" type="number" min="0" class="h-10 w-full rounded-lg border border-slate-200 px-2 text-right text-sm outline-none focus:border-blue-400" placeholder="0" />
                      </td>
                      <td class="px-3 py-2">
                        <input v-model.number="item.quantity" type="number" min="1" class="h-10 w-full rounded-lg border border-slate-200 px-2 text-right text-sm font-semibold outline-none focus:border-blue-400" placeholder="0" required />
                      </td>
                      <td class="px-3 py-2 text-center">
                        <button type="button" class="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 disabled:opacity-40" :disabled="createForm.items.length <= 1" @click="removeItemRow(index)">
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-slate-100 bg-white p-5">
            <BaseButton variant="outline" @click="createOpen = false">Hủy bỏ</BaseButton>
            <BaseButton :loading="saving" @click="submitCreateSlip">
              <template #icon><Send class="h-4 w-4" /></template>
              Gửi yêu cầu
            </BaseButton>
          </div>
        </aside>
      </transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h, onMounted } from 'vue'
import { Button as AButton, Input as AInput, Table as ATable, Tag as ATag } from 'ant-design-vue'
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
  Trash2,
  Send
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import FullscreenLoader from '@/components/ui/FullscreenLoader.vue'
import { inventorySlipApi } from '@/services/inventorySlipApi'
import { medicineApi } from '@/services/medicineApi'
import { getApiErrorMessage } from '@/services/apiClient'
import type { InventorySlip } from '@/types/inventorySlip'
import type { Medicine } from '@/types/medicine'

// State
const slips = ref<InventorySlip[]>([])
const medicines = ref<Medicine[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const slipCurrentPage = ref(1)
const slipPageSize = ref(10)

// Detail Modal
const detailOpen = ref(false)
const selectedSlip = ref<InventorySlip | null>(null)

// Create Modal
const createOpen = ref(false)
const createForm = ref({
  supplierName: '',
  note: '',
  items: [
    {
      medicineId: '' as any,
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      importPrice: undefined as number | undefined,
      note: ''
    }
  ]
})

const metrics = computed(() => {
  const total = slips.value.length
  const pending = slips.value.filter((slip) => slip.status === 'Pending').length
  const approved = slips.value.filter((slip) => slip.status === 'Approved').length
  const rejected = slips.value.filter((slip) => slip.status === 'Rejected').length

  return [
    { label: 'Tổng số phiếu', value: total, icon: ClipboardList, className: 'bg-blue-50 text-blue-700' },
    { label: 'Đang chờ duyệt', value: pending, icon: Clock3, className: 'bg-amber-50 text-amber-700' },
    { label: 'Đã duyệt nhập', value: approved, icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
    { label: 'Bị từ chối', value: rejected, icon: XCircle, className: 'bg-rose-50 text-rose-700' },
  ]
})

const slipTableColumns = [
  {
    title: 'Mã phiếu',
    key: 'code',
    width: 116,
    customFilterDropdown: true,
    onFilter: slipColumnFilter('code'),
    sorter: (a: InventorySlip, b: InventorySlip) => slipNumericId(a) - slipNumericId(b),
  },
  {
    title: 'Nhà cung cấp',
    key: 'supplier',
    width: 260,
    customFilterDropdown: true,
    onFilter: slipColumnFilter('supplier'),
    sorter: (a: InventorySlip, b: InventorySlip) => String(a.supplierName || '').localeCompare(String(b.supplierName || ''), 'vi'),
  },
  {
    title: 'Số loại',
    key: 'items',
    width: 110,
    sorter: (a: InventorySlip, b: InventorySlip) => Number(a.totalItems || 0) - Number(b.totalItems || 0),
  },
  {
    title: 'Số lượng',
    key: 'quantity',
    width: 120,
    sorter: (a: InventorySlip, b: InventorySlip) => Number(a.totalQuantity || 0) - Number(b.totalQuantity || 0),
  },
  {
    title: 'Ngày tạo',
    key: 'createdAt',
    width: 170,
    customFilterDropdown: true,
    onFilter: slipColumnFilter('createdAt'),
    sorter: (a: InventorySlip, b: InventorySlip) => recordTimestamp(a.createdAt) - recordTimestamp(b.createdAt),
    defaultSortOrder: 'descend' as const,
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 150,
    filters: [
      { text: 'Chờ duyệt', value: 'Pending' },
      { text: 'Đã duyệt', value: 'Approved' },
      { text: 'Bị từ chối', value: 'Rejected' },
      { text: 'Đã hủy', value: 'Voided' },
    ],
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: InventorySlip) => record.status === String(filterValue),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 96,
    align: 'center' as const,
  },
]

const slipPagination = computed(() => ({
  current: slipCurrentPage.value,
  pageSize: slipPageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showLessItems: true,
  showTitle: false,
  responsive: true,
  showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} trong ${total} phiếu`,
  locale: { items_per_page: ' / trang' },
}))

const InfoBlock = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'nurse-inventory-info-block' }, [
      h('span', null, props.label),
      h('p', null, props.value),
    ])
  },
})

function slipIdentity(slip: InventorySlip) {
  return String(slip.slipId || slip.slipCode)
}

function slipNumericId(slip: InventorySlip) {
  const id = Number(slip.slipId || String(slip.slipCode || '').replace(/\D/g, ''))
  return Number.isFinite(id) ? id : 0
}

function slipSearchField(slip: InventorySlip, key: string) {
  if (key === 'code') return [slip.slipCode, slip.slipId].filter(Boolean).join(' ')
  if (key === 'supplier') return [slip.supplierName, slip.createdByName, slip.note].filter(Boolean).join(' ')
  if (key === 'createdAt') return [formatDate(slip.createdAt), formatDateTime(slip.createdAt)].join(' ')
  if (key === 'status') return statusText(slip.status)
  return ''
}

function slipColumnFilter(key: string) {
  return (filterValue: string | number | boolean, record: InventorySlip) =>
    normalizeText(slipSearchField(record, key)).includes(normalizeText(filterValue))
}

function getSlipFilterKeys(event: Event) {
  const filterValue = (event.target as HTMLInputElement)?.value || ''
  return filterValue ? [filterValue] : []
}

function clearSlipFilter(clearFilters: (() => void) | undefined, confirm: () => void) {
  clearFilters?.()
  confirm()
}

function handleSlipTableChange(pagination: { current?: number; pageSize?: number }) {
  slipCurrentPage.value = pagination.current || 1
  slipPageSize.value = pagination.pageSize || 10
}

function normalizeText(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function recordTimestamp(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

// Methods
const loadSlips = async () => {
  loading.value = true
  error.value = null
  try {
    slips.value = await inventorySlipApi.getSlips()
  } catch (err) {
    error.value = getApiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const loadMedicines = async () => {
  try {
    medicines.value = await medicineApi.getMedicines({ status: 'Active' })
  } catch (err) {
    console.error('Failed to load medicines:', err)
  }
}

const openCreateModal = () => {
  createForm.value = {
    supplierName: '',
    note: '',
    items: [
      {
        medicineId: '' as any,
        batchNumber: '',
        expiryDate: '',
        quantity: 1,
        importPrice: undefined,
        note: ''
      }
    ]
  }
  createOpen.value = true
}

const addItemRow = () => {
  createForm.value.items.push({
    medicineId: '' as any,
    batchNumber: '',
    expiryDate: '',
    quantity: 1,
    importPrice: undefined,
    note: ''
  })
}

const removeItemRow = (index: number) => {
  if (createForm.value.items.length > 1) {
    createForm.value.items.splice(index, 1)
  }
}

const submitCreateSlip = async () => {
  // Simple validation
  const invalidItem = createForm.value.items.some(
    i => !i.medicineId || !i.batchNumber || !i.expiryDate || i.quantity <= 0
  )
  if (invalidItem) {
    alert('Vui lòng điền đầy đủ thông tin thuốc, số lô, hạn dùng và số lượng lớn hơn 0.')
    return
  }

  saving.value = true
  try {
    await inventorySlipApi.createSlip({
      supplierName: createForm.value.supplierName,
      note: createForm.value.note,
      items: createForm.value.items
    })
    createOpen.value = false
    await loadSlips()
  } catch (err) {
    alert('Lỗi tạo phiếu: ' + getApiErrorMessage(err))
  } finally {
    saving.value = false
  }
}

const viewDetails = (slip: InventorySlip) => {
  selectedSlip.value = slip
  detailOpen.value = true
}

const viewDetailsRecord = (slip: Record<string, any>) => {
  viewDetails(slip as InventorySlip)
}

const voidSlip = async (slipId: number) => {
  if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu nhập kho này không?')) return
  saving.value = true
  try {
    await inventorySlipApi.voidSlip(slipId)
    detailOpen.value = false
    await loadSlips()
  } catch (err) {
    alert('Không thể hủy phiếu: ' + getApiErrorMessage(err))
  } finally {
    saving.value = false
  }
}

// Helpers
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN')
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const statusText = (status: string) => {
  switch (status) {
    case 'Pending': return 'Chờ duyệt'
    case 'Approved': return 'Đã duyệt'
    case 'Rejected': return 'Bị từ chối'
    case 'Voided': return 'Đã hủy'
    default: return status
  }
}

const statusClass = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'Rejected': return 'bg-rose-50 text-rose-700 border border-rose-200'
    case 'Voided': return 'bg-slate-100 text-slate-600 border border-slate-200'
    default: return 'bg-slate-50 text-slate-600'
  }
}

const statusTone = (status: string) => {
  switch (status) {
    case 'Pending': return 'is-pending'
    case 'Approved': return 'is-approved'
    case 'Rejected': return 'is-rejected'
    case 'Voided': return 'is-voided'
    default: return 'is-muted'
  }
}

onMounted(() => {
  loadSlips()
  loadMedicines()
})
</script>

<style scoped lang="postcss">
.nurse-inventory-page-header {
  @apply flex flex-col gap-4 px-1 lg:flex-row lg:items-start lg:justify-between;
}

.nurse-inventory-page-header h1 {
  @apply text-2xl font-bold tracking-normal text-slate-900;
}

.nurse-inventory-page-header p {
  @apply mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500;
}

.nurse-inventory-page-actions {
  @apply flex flex-wrap gap-2;
}

.nurse-inventory-metric-card {
  @apply rounded-2xl border border-slate-200 bg-white p-5 shadow-sm;
}

.nurse-inventory-metric-card p {
  @apply text-sm font-medium text-slate-500;
}

.nurse-inventory-metric-card strong {
  @apply mt-3 block text-3xl font-bold text-slate-950;
}

.nurse-inventory-metric-card span {
  @apply flex h-11 w-11 items-center justify-center rounded-xl;
}

.nurse-inventory-table-shell {
  @apply overflow-hidden border border-slate-200 bg-white shadow-sm;
  border-radius: 8px;
}

.nurse-inventory-table-shell :deep(.ant-table) {
  color: #334155;
  font-size: 13px;
}

.nurse-inventory-table-shell :deep(.ant-table-container),
.nurse-inventory-table-shell :deep(.ant-table-content) {
  overflow-x: hidden !important;
}

.nurse-inventory-table-shell :deep(.ant-table table) {
  width: 100% !important;
  table-layout: fixed !important;
}

.nurse-inventory-table-shell :deep(.ant-table-thead > tr > th) {
  height: 44px;
  background: #f9fbfd;
  border-bottom: 1px solid #e8edf3;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 650;
  padding-block: 10px;
  padding-inline: 12px;
}

.nurse-inventory-table-shell :deep(.ant-table-tbody > tr > td) {
  height: 52px;
  border-bottom-color: #eef2f7;
  padding-block: 11px;
  padding-inline: 12px;
  vertical-align: middle;
  overflow-wrap: anywhere;
}

.nurse-inventory-table-shell :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: 0;
}

.nurse-inventory-table-shell :deep(.ant-table-tbody > tr:hover > td) {
  background: #f7faff;
}

.nurse-inventory-table-shell :deep(.ant-table-column-sorter),
.nurse-inventory-table-shell :deep(.ant-table-filter-trigger) {
  color: #94a3b8;
  opacity: 0.45;
  transition: color 160ms ease, opacity 160ms ease;
}

.nurse-inventory-table-shell :deep(th:hover .ant-table-column-sorter),
.nurse-inventory-table-shell :deep(th:hover .ant-table-filter-trigger),
.nurse-inventory-table-shell :deep(.ant-table-filter-trigger.active) {
  opacity: 1;
}

.nurse-inventory-table-shell :deep(.ant-table-filter-trigger:hover),
.nurse-inventory-table-shell :deep(.ant-table-filter-trigger.active),
.nurse-inventory-table-shell :deep(.ant-table-column-sorter-up.active),
.nurse-inventory-table-shell :deep(.ant-table-column-sorter-down.active) {
  color: #0f52ba;
}

.nurse-inventory-table-shell :deep(.ant-pagination) {
  min-height: 58px;
  border-top: 1px solid #eef2f7;
  background: #fbfcfe;
  gap: 4px;
  margin: 0;
  padding: 13px 16px;
}

.nurse-inventory-table-shell :deep(.ant-pagination-total-text) {
  color: #64748b;
  font-size: 12px;
  line-height: 30px;
  margin-right: auto;
}

.nurse-inventory-table-shell :deep(.ant-pagination-item),
.nurse-inventory-table-shell :deep(.ant-pagination-prev .ant-pagination-item-link),
.nurse-inventory-table-shell :deep(.ant-pagination-next .ant-pagination-item-link) {
  min-width: 30px;
  height: 30px;
  margin-inline-end: 0;
  border-color: transparent;
  border-radius: 8px;
  background: transparent;
  line-height: 28px;
  transition: background 160ms ease, color 160ms ease;
}

.nurse-inventory-table-shell :deep(.ant-pagination-item:hover),
.nurse-inventory-table-shell :deep(.ant-pagination-prev:not(.ant-pagination-disabled) .ant-pagination-item-link:hover),
.nurse-inventory-table-shell :deep(.ant-pagination-next:not(.ant-pagination-disabled) .ant-pagination-item-link:hover) {
  background: #eaf2ff;
  border-color: transparent;
  color: #0f52ba;
}

.nurse-inventory-table-shell :deep(.ant-pagination-item-active) {
  background: #0f52ba;
  border-color: transparent;
  box-shadow: 0 4px 12px rgb(15 82 186 / 0.2);
}

.nurse-inventory-table-shell :deep(.ant-pagination-item-active a),
.nurse-inventory-table-shell :deep(.ant-pagination-item-active:hover a),
.nurse-inventory-table-shell :deep(.ant-pagination-item-active:focus a) {
  color: #ffffff;
}

.nurse-inventory-table-shell :deep(.ant-pagination-options) {
  margin-inline-start: 8px;
}

.nurse-inventory-table-shell :deep(.ant-pagination-options .ant-select-selector) {
  background: #ffffff;
  border-color: #e2e8f0;
  border-radius: 8px;
  box-shadow: none;
  font-size: 12px;
  height: 30px;
}

.nurse-inventory-table-shell :deep(.ant-pagination-options .ant-select-selection-item) {
  line-height: 28px;
}

.nurse-inventory-filter {
  @apply w-64 rounded-xl bg-white p-3 shadow-xl;
}

.nurse-inventory-filter-title {
  @apply mb-2 text-xs font-bold text-slate-500;
}

.nurse-inventory-filter-actions {
  @apply mt-3 flex justify-end gap-2;
}

.nurse-inventory-filter-reset {
  @apply border-slate-200 text-slate-600;
}

.nurse-inventory-filter-submit {
  background: #0f52ba !important;
}

.nurse-inventory-status-tag {
  @apply inline-flex min-w-[86px] justify-center rounded-full px-2.5 py-1 text-xs font-medium;
}

.nurse-inventory-status-tag.is-pending {
  @apply bg-amber-50 text-amber-700;
}

.nurse-inventory-status-tag.is-approved {
  @apply bg-emerald-50 text-emerald-700;
}

.nurse-inventory-status-tag.is-rejected {
  @apply bg-rose-50 text-rose-700;
}

.nurse-inventory-status-tag.is-voided,
.nurse-inventory-status-tag.is-muted {
  @apply bg-slate-100 text-slate-600;
}

.nurse-inventory-actions {
  @apply flex items-center justify-center gap-1.5;
}

.nurse-inventory-action-button {
  @apply inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50;
}

.nurse-inventory-action-primary {
  @apply border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100;
}

.nurse-inventory-info-block {
  @apply rounded-xl border border-slate-100 bg-slate-50 p-3;
}

.nurse-inventory-info-block span {
  @apply text-xs font-semibold text-slate-400;
}

.nurse-inventory-info-block p {
  @apply mt-1 break-words text-sm font-semibold text-slate-800;
}
</style>
