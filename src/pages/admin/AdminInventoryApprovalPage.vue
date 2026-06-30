<template>
  <section class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldAlert class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">Quản trị hệ thống</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Duyệt yêu cầu nhập kho</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Xem xét các phiếu yêu cầu nhập kho từ Y tá, đối chiếu số lượng và số lô thực tế trước khi bấm phê duyệt để tăng tồn kho khả dụng.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Role Admin</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" :disabled="loading" @click="loadSlips">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Metrics -->
    <div class="grid gap-4 md:grid-cols-3">
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

    <!-- List & Action -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-slate-700">Trạng thái phiếu:</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              type="button"
              :class="[
                'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                statusFilter === opt.value
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
              @click="statusFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <span class="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
          {{ filteredSlips.length }} phiếu được tìm thấy
        </span>
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
              <th class="px-5 py-3.5">Người lập</th>
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
              <td class="px-5 py-4 text-slate-700 font-medium">{{ slip.createdByName }}</td>
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
                <BaseButton
                  size="sm"
                  :variant="slip.status === 'Pending' ? 'primary' : 'outline'"
                  @click="openApprovalModal(slip)"
                >
                  {{ slip.status === 'Pending' ? 'Xem & Duyệt' : 'Chi tiết' }}
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="p-10 text-center">
        <ClipboardCheck class="mx-auto h-10 w-10 text-slate-300" />
        <h2 class="mt-4 text-lg font-bold text-slate-950">Không có phiếu yêu cầu nào</h2>
        <p class="mt-2 text-sm text-slate-500">Tất cả các yêu cầu nhập kho đã được giải quyết.</p>
      </div>
    </div>

    <!-- Review & Approval Modal -->
    <div v-if="approvalOpen && selectedSlip" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="border-b border-slate-100 p-6 flex justify-between items-start bg-slate-50">
          <div>
            <div class="flex items-center gap-3">
              <span :class="['rounded-full px-2.5 py-1 text-xs font-bold', statusClass(selectedSlip.status)]">
                {{ statusText(selectedSlip.status) }}
              </span>
              <span class="text-sm font-medium text-slate-500">Mã phiếu: #{{ selectedSlip.slipCode }}</span>
            </div>
            <h2 class="mt-2 text-2xl font-bold text-slate-950">Xét duyệt Phiếu Nhập Kho</h2>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="approvalOpen = false">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- Reject Reason Alert if already rejected -->
          <div v-if="selectedSlip.status === 'Rejected'" class="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
            <p class="font-bold">Lý do từ chối:</p>
            <p class="mt-1">{{ selectedSlip.rejectReason }}</p>
          </div>

          <!-- Slip Info Card -->
          <div class="grid gap-4 sm:grid-cols-3 bg-slate-50 p-4 rounded-xl text-sm">
            <div>
              <p class="text-slate-500 font-medium">Người lập yêu cầu:</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ selectedSlip.createdByName }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">Nhà cung cấp:</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ selectedSlip.supplierName || 'Không có' }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">Ngày gửi yêu cầu:</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ formatDateTime(selectedSlip.createdAt) }}</p>
            </div>
          </div>

          <!-- Note textareas -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-500">Ghi chú của Y tá:</p>
            <p class="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
              {{ selectedSlip.note || 'Không có ghi chú nào.' }}
            </p>
          </div>

          <!-- Items Table -->
          <div>
            <h3 class="font-bold text-slate-950 mb-3 text-sm">Thông tin danh sách thuốc yêu cầu nhập</h3>
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="min-w-full divide-y divide-slate-100 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th class="px-4 py-3">Tên thuốc</th>
                    <th class="px-4 py-3">Số lô (Batch No)</th>
                    <th class="px-4 py-3">Hạn sử dụng</th>
                    <th class="px-4 py-3 text-right">Giá nhập</th>
                    <th class="px-4 py-3 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-for="item in selectedSlip.items" :key="item.slipItemId">
                    <td class="px-4 py-3 font-bold text-slate-900">{{ item.medicineName }}</td>
                    <td class="px-4 py-3 font-mono font-bold text-blue-700">{{ item.batchNumber }}</td>
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

          <!-- Admin Approval Action Section -->
          <div v-if="selectedSlip.status === 'Pending'" class="border-t border-slate-100 pt-5 space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Ý kiến phê duyệt / Phản hồi (Tùy chọn)</span>
              <textarea
                v-model="actionNote"
                rows="3"
                class="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập ghi chú duyệt, ví dụ: 'Hàng đã kiểm đủ và khớp hóa đơn đỏ'..."
              ></textarea>
            </label>

            <!-- Reject Reason Modal/Input toggle -->
            <div v-if="showRejectInput" class="rounded-xl border border-rose-100 bg-rose-50 p-4 space-y-3">
              <label class="block">
                <span class="mb-2 block text-sm font-bold text-rose-800">Lý do từ chối phiếu này (Bắt buộc)</span>
                <input
                  v-model="rejectReason"
                  class="h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="Nhập lý do cụ thể ví dụ: Lệch số lượng thực tế, thuốc móp méo..."
                  required
                />
              </label>
              <div class="flex gap-2 justify-end">
                <BaseButton size="sm" variant="outline" @click="showRejectInput = false">Hủy từ chối</BaseButton>
                <button
                  type="button"
                  :disabled="saving"
                  class="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                  @click="submitReject"
                >
                  <span v-if="saving">Đang xử lý...</span>
                  <span v-else>Xác nhận Từ chối</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t border-slate-100 p-6 flex justify-between items-center bg-slate-50">
          <div v-if="selectedSlip.status === 'Pending' && !showRejectInput" class="flex gap-3">
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition"
              @click="showRejectInput = true"
            >
              Từ chối duyệt
            </button>
            <BaseButton :loading="saving" @click="submitApprove">
              <template #icon><CheckCircle2 class="h-4 w-4" /></template>
              Phê duyệt & Cộng kho
            </BaseButton>
          </div>
          <div v-else></div>
          <BaseButton variant="outline" @click="approvalOpen = false">Đóng</BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ShieldAlert,
  Clock3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  ClipboardCheck
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { inventorySlipApi } from '@/services/inventorySlipApi'
import { getApiErrorMessage } from '@/services/apiClient'
import type { InventorySlip } from '@/types/inventorySlip'

// State
const slips = ref<InventorySlip[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

// Actions State
const selectedSlip = ref<InventorySlip | null>(null)
const approvalOpen = ref(false)
const actionNote = ref('')
const rejectReason = ref('')
const showRejectInput = ref(false)

// Filter
const statusFilter = ref<string>('Pending')

const statusOptions = [
  { label: 'Chờ duyệt', value: 'Pending' },
  { label: 'Đã duyệt', value: 'Approved' },
  { label: 'Bị từ chối', value: 'Rejected' },
  { label: 'Tất cả', value: 'All' }
]

// Computed
const filteredSlips = computed(() => {
  if (statusFilter.value === 'All') return slips.value
  return slips.value.filter(s => s.status === statusFilter.value)
})

const metrics = computed(() => {
  const pending = slips.value.filter(s => s.status === 'Pending').length
  const approved = slips.value.filter(s => s.status === 'Approved').length
  const rejected = slips.value.filter(s => s.status === 'Rejected').length

  return [
    { label: 'Phiếu chờ duyệt', value: pending, icon: Clock3, className: 'bg-amber-50 text-amber-700' },
    { label: 'Phiếu đã duyệt', value: approved, icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
    { label: 'Phiếu bị từ chối', value: rejected, icon: XCircle, className: 'bg-rose-50 text-rose-700' }
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

const openApprovalModal = (slip: InventorySlip) => {
  selectedSlip.value = slip
  actionNote.value = ''
  rejectReason.value = ''
  showRejectInput.value = false
  approvalOpen.value = true
}

const submitApprove = async () => {
  if (!selectedSlip.value) return
  if (!confirm(`Bạn có chắc chắn phê duyệt Phiếu nhập kho #${selectedSlip.value.slipCode}?\nHành động này sẽ tăng tồn kho thực tế.`)) return

  saving.value = true
  try {
    await inventorySlipApi.approveSlip(selectedSlip.value.slipId, actionNote.value)
    approvalOpen.value = false
    await loadSlips()
  } catch (err) {
    alert('Lỗi phê duyệt: ' + getApiErrorMessage(err))
  } finally {
    saving.value = false
  }
}

const submitReject = async () => {
  if (!selectedSlip.value) return
  if (!rejectReason.value.trim()) {
    alert('Vui lòng nhập lý do từ chối.')
    return
  }

  saving.value = true
  try {
    await inventorySlipApi.rejectSlip(selectedSlip.value.slipId, rejectReason.value)
    approvalOpen.value = false
    await loadSlips()
  } catch (err) {
    alert('Lỗi từ chối: ' + getApiErrorMessage(err))
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
})
</script>
