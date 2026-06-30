<template>
  <section class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <ClipboardList class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Quản lý kho dược</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Phiếu yêu cầu nhập kho</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Lập yêu cầu nhập kho thuốc mới kèm theo số lô, hạn dùng và hóa đơn đối chiếu để gửi Admin phê duyệt.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Role Nurse</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" :disabled="loading" @click="loadSlips">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
          <BaseButton @click="openCreateModal">
            <template #icon><Plus class="h-4 w-4" /></template>
            Tạo phiếu nhập
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Metrics -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div v-for="metric in metrics" :key="metric.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ metric.label }}</p>
            <p class="mt-3 text-3xl font-bold text-slate-950">{{ metric.value }}</p>
          </div>
          <span :class="['flex h-11 w-11 items-center justify-center rounded-xl', metric.className]">
            <component :is="metric.icon" class="h-5 w-5" />
          </span>
        </div>
      </div>
    </div>

    <!-- Filters & List -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-slate-700">Bộ lọc trạng thái:</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              type="button"
              :class="[
                'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
              @click="statusFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <span class="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{{ filteredSlips.length }} phiếu</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <LoadingSkeleton v-for="i in 3" :key="i" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex justify-between items-center">
        <span>{{ error }}</span>
        <BaseButton size="sm" variant="outline" @click="loadSlips">Thử lại</BaseButton>
      </div>

      <!-- Table -->
      <div v-else-if="filteredSlips.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3.5">Mã phiếu</th>
              <th class="px-5 py-3.5">Nhà cung cấp</th>
              <th class="px-5 py-3.5 text-right">Số loại thuốc</th>
              <th class="px-5 py-3.5 text-right">Tổng số lượng</th>
              <th class="px-5 py-3.5">Ngày tạo</th>
              <th class="px-5 py-3.5">Trạng thái</th>
              <th class="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="slip in filteredSlips" :key="slip.slipId" class="transition hover:bg-slate-50/80">
              <td class="px-5 py-4 font-mono font-bold text-slate-950">#{{ slip.slipCode }}</td>
              <td class="px-5 py-4 text-slate-700">{{ slip.supplierName || '—' }}</td>
              <td class="px-5 py-4 text-right font-medium text-slate-900">{{ slip.totalItems }}</td>
              <td class="px-5 py-4 text-right font-bold text-slate-950">{{ slip.totalQuantity }}</td>
              <td class="px-5 py-4 text-slate-600">{{ formatDate(slip.createdAt) }}</td>
              <td class="px-5 py-4">
                <span :class="['inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusClass(slip.status)]">
                  {{ statusText(slip.status) }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <BaseButton size="sm" variant="outline" @click="viewDetails(slip)">
                  Chi tiết
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="p-10 text-center">
        <ClipboardList class="mx-auto h-10 w-10 text-slate-300" />
        <h2 class="mt-4 text-lg font-bold text-slate-950">Không có phiếu yêu cầu nào</h2>
        <p class="mt-2 text-sm text-slate-500">Hãy tạo phiếu nhập kho đầu tiên của bạn.</p>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="detailOpen && selectedSlip" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div class="border-b border-slate-100 p-6 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3">
              <span :class="['rounded-full px-2.5 py-1 text-xs font-bold', statusClass(selectedSlip.status)]">
                {{ statusText(selectedSlip.status) }}
              </span>
              <span class="text-sm font-medium text-slate-500">Loại: Nhập kho</span>
            </div>
            <h2 class="mt-2 text-2xl font-bold text-slate-950">Phiếu nhập #{{ selectedSlip.slipCode }}</h2>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="detailOpen = false">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <!-- Reject Reason -->
          <div v-if="selectedSlip.status === 'Rejected'" class="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
            <p class="font-bold">Lý do từ chối của Admin:</p>
            <p class="mt-1">{{ selectedSlip.rejectReason }}</p>
          </div>

          <!-- Slip Info -->
          <div class="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl text-sm">
            <div>
              <p class="text-slate-500 font-medium">Nhà cung cấp:</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ selectedSlip.supplierName || 'Chưa rõ' }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">Người tạo:</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ selectedSlip.createdByName }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">Ngày lập:</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ formatDateTime(selectedSlip.createdAt) }}</p>
            </div>
            <div v-if="selectedSlip.approvedAt">
              <p class="text-slate-500 font-medium">Người duyệt / Ngày duyệt:</p>
              <p class="font-bold text-slate-900 mt-0.5">
                {{ selectedSlip.approvedByName }} - {{ formatDateTime(selectedSlip.approvedAt) }}
              </p>
            </div>
          </div>

          <div v-if="selectedSlip.note" class="text-sm">
            <p class="text-slate-500 font-medium">Ghi chú:</p>
            <p class="text-slate-800 mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">{{ selectedSlip.note }}</p>
          </div>

          <!-- Items Table -->
          <div>
            <h3 class="font-bold text-slate-950 mb-3">Danh sách thuốc nhập</h3>
            <table class="min-w-full divide-y divide-slate-100 text-xs sm:text-sm">
              <thead class="bg-slate-50 text-left text-slate-500 font-semibold">
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
                  <td class="px-4 py-3 font-bold text-slate-900">{{ item.medicineName }}</td>
                  <td class="px-4 py-3 font-mono font-semibold text-slate-600">{{ item.batchNumber }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatDate(item.expiryDate) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-slate-900">
                    {{ item.importPrice ? formatCurrency(item.importPrice) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-slate-950">
                    {{ item.quantity }} {{ item.medicineUnit }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="border-t border-slate-100 p-6 flex justify-between items-center bg-slate-50">
          <div class="flex gap-2">
            <button
              v-if="selectedSlip.status === 'Pending' || selectedSlip.status === 'Rejected'"
              type="button"
              :disabled="saving"
              class="inline-flex h-11 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
              @click="voidSlip(selectedSlip.slipId)"
            >
              <span v-if="saving">Đang xử lý...</span>
              <span v-else>Hủy yêu cầu</span>
            </button>
          </div>
          <BaseButton variant="outline" @click="detailOpen = false">Đóng</BaseButton>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="createOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div class="border-b border-slate-100 p-6 flex justify-between items-start">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Tạo phiếu mới</p>
            <h2 class="mt-1 text-2xl font-bold text-slate-950">Phiếu yêu cầu nhập kho</h2>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="createOpen = false">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- Supplier & Note -->
          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="createForm.supplierName" label="Nhà cung cấp" placeholder="Nhà thuốc Long Châu, Pharmacity..." />
            <BaseInput v-model="createForm.note" label="Ghi chú phiếu" placeholder="Nhập bổ sung thuốc quý 3, hàng nhập kho..." />
          </div>

          <!-- Items list -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-slate-950">Danh sách thuốc nhập</h3>
              <BaseButton size="sm" variant="outline" @click="addItemRow">
                <template #icon><Plus class="h-3.5 w-3.5" /></template>
                Thêm thuốc
              </BaseButton>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th class="px-4 py-3 w-1/3">Tên thuốc</th>
                    <th class="px-4 py-3">Số lô</th>
                    <th class="px-4 py-3">Hạn dùng</th>
                    <th class="px-4 py-3 w-28">Giá nhập</th>
                    <th class="px-4 py-3 w-24">Số lượng</th>
                    <th class="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="(item, index) in createForm.items" :key="index">
                    <td class="px-3 py-2">
                      <select
                        v-model="item.medicineId"
                        class="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-400"
                        required
                      >
                        <option value="" disabled>-- Chọn thuốc --</option>
                        <option v-for="med in medicines" :key="med.medicineId" :value="med.medicineId">
                          {{ med.medicineName }} ({{ med.unit }})
                        </option>
                      </select>
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="item.batchNumber"
                        class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400"
                        placeholder="LOT12345"
                        required
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model="item.expiryDate"
                        type="date"
                        class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400"
                        required
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model.number="item.importPrice"
                        type="number"
                        min="0"
                        class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 text-right"
                        placeholder="0"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 text-right font-bold"
                        placeholder="0"
                        required
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <button
                        type="button"
                        class="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                        :disabled="createForm.items.length <= 1"
                        @click="removeItemRow(index)"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50">
          <BaseButton variant="outline" @click="createOpen = false">Hủy bỏ</BaseButton>
          <BaseButton :loading="saving" @click="submitCreateSlip">
            <template #icon><Send class="h-4 w-4" /></template>
            Gửi yêu cầu
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Plus,
  RefreshCw,
  X,
  Trash2,
  Send
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
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

// Filters
const statusFilter = ref<string>('All')

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

const statusOptions = [
  { label: 'Tất cả', value: 'All' },
  { label: 'Chờ duyệt', value: 'Pending' },
  { label: 'Đã duyệt', value: 'Approved' },
  { label: 'Bị từ chối', value: 'Rejected' },
  { label: 'Đã hủy', value: 'Voided' }
]

// Computed
const filteredSlips = computed(() => {
  if (statusFilter.value === 'All') return slips.value
  return slips.value.filter(s => s.status === statusFilter.value)
})

const metrics = computed(() => {
  const total = slips.value.length
  const pending = slips.value.filter(s => s.status === 'Pending').length
  const approved = slips.value.filter(s => s.status === 'Approved').length
  const rejected = slips.value.filter(s => s.status === 'Rejected').length

  return [
    { label: 'Tổng số phiếu', value: total, icon: ClipboardList, className: 'bg-blue-50 text-blue-700' },
    { label: 'Đang chờ duyệt', value: pending, icon: Clock3, className: 'bg-amber-50 text-amber-700' },
    { label: 'Đã duyệt nhập', value: approved, icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
    { label: 'Bị từ chối', value: rejected, icon: XCircle, className: 'bg-rose-50 text-rose-700' }
  ]
})

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

onMounted(() => {
  loadSlips()
  loadMedicines()
})
</script>
