<template>
  <section class="space-y-6">
    <FullscreenLoader :show="loadingRecipients" />

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div class="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-teal-50 p-6 sm:p-7">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex gap-4">
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0F52BA] shadow-sm ring-1 ring-blue-100">
              <BellRing class="h-6 w-6" />
            </span>
            <div>
              <h1 class="text-2xl font-bold text-slate-950 sm:text-3xl">Gửi thông báo</h1>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Soạn nội dung, chọn người nhận và gửi thông báo realtime đến đúng nhóm người dùng trong hệ thống.
              </p>
            </div>
          </div>

          <BaseButton variant="outline" :disabled="loadingRecipients" @click="loadRecipients">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Làm mới danh sách
          </BaseButton>
        </div>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        <div class="rounded-xl bg-slate-50 px-4 py-3">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Chế độ gửi</p>
          <p class="mt-1 text-sm font-semibold text-slate-800">{{ targetModeLabel }}</p>
        </div>
        <div class="rounded-xl bg-slate-50 px-4 py-3">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Người nhận đã tải</p>
          <p class="mt-1 text-sm font-semibold text-slate-800">{{ notificationStore.recipients.length }} người dùng</p>
        </div>
        <div class="rounded-xl bg-slate-50 px-4 py-3">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Trạng thái</p>
          <p class="mt-1 text-sm font-semibold" :class="loadingRecipients ? 'text-amber-600' : 'text-teal-700'">
            {{ loadingRecipients ? 'Đang tải danh sách...' : 'Sẵn sàng gửi' }}
          </p>
        </div>
      </div>
    </div>

    <form class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7" @submit.prevent="submitNotification">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div class="space-y-5">
          <div>
            <h2 class="text-lg font-bold text-slate-950">Nội dung thông báo</h2>
            <p class="mt-1 text-sm text-slate-500">Nội dung này sẽ hiển thị trong chuông thông báo và thông báo nổi của người nhận.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="form.title" label="Tiêu đề" required maxlength="200" />
            <BaseSelect v-model="form.type" label="Loại thông báo" :options="typeOptions" required />
          </div>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Nội dung <span class="text-rose-600" aria-hidden="true">*</span>
            </span>
            <textarea
              v-model="form.content"
              required
              rows="7"
              class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100"
              placeholder="Nhập nội dung cần gửi cho người nhận..."
            ></textarea>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="form.navigateUrl" label="Đường dẫn điều hướng" placeholder="/admin/dashboard" />
            <BaseInput v-model="form.referenceId" label="Mã tham chiếu" placeholder="Ví dụ: LH132, HD1001..." />
          </div>
        </div>

        <div class="space-y-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div>
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-950">Đối tượng nhận</p>
                <p class="mt-1 text-xs text-slate-500">Chọn phạm vi gửi thông báo.</p>
              </div>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#0F52BA] ring-1 ring-blue-100">
                {{ recipientSummary }}
              </span>
            </div>

            <div class="mt-3 grid gap-2">
              <label
                v-for="mode in targetModeOptions"
                :key="mode.value"
                class="flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 text-sm font-semibold transition"
                :class="form.targetMode === mode.value ? 'border-[#0F52BA] text-[#0F52BA] ring-2 ring-blue-100' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
              >
                <input v-model="form.targetMode" type="radio" class="h-4 w-4" :value="mode.value" />
                <component :is="mode.icon" class="h-4 w-4" />
                {{ mode.label }}
              </label>
            </div>
          </div>

          <div v-if="form.targetMode === 'Roles'">
            <p class="text-sm font-bold text-slate-950">Vai trò</p>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <label
                v-for="role in roleOptions"
                :key="role.value"
                class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                <input v-model="selectedRoles" type="checkbox" class="h-4 w-4" :value="role.value" />
                {{ role.label }}
              </label>
            </div>
          </div>

          <div v-if="form.targetMode === 'User'" class="space-y-3">
            <BaseInput v-model="recipientSearch" label="Tìm người nhận" placeholder="Tên, tài khoản, email..." @blur="loadRecipients" />
            <BaseSelect v-model="selectedUserId" label="Người nhận" :options="recipientOptions" required placeholder="Chọn người nhận" />
            <p v-if="!loadingRecipients && !recipientOptions.length" class="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-700">
              Chưa tìm thấy người nhận phù hợp. Hãy thử từ khóa khác hoặc bấm Làm mới danh sách.
            </p>
          </div>
        </div>
      </div>

      <div v-if="error" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <div v-if="lastResult" class="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
        Đã gửi thông báo đến {{ lastResult }} người dùng.
      </div>

      <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <BaseButton type="button" variant="outline" @click="resetForm">Làm mới</BaseButton>
        <BaseButton type="submit" :loading="saving">
          <template #icon><Send class="h-4 w-4" /></template>
          Gửi thông báo
        </BaseButton>
      </div>
    </form>

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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { BellRing, RefreshCw, Send, ShieldCheck, UserRound, Users } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue'
import FullscreenLoader from '@/components/ui/FullscreenLoader.vue'
import Toast from '@/components/ui/Toast.vue'
import { useNotificationStore, type ManualNotificationPayload } from '@/stores/notificationStore'
import { getApiErrorMessage } from '@/services/apiClient'

type TargetMode = 'All' | 'Roles' | 'User'

const notificationStore = useNotificationStore()
const saving = ref(false)
const loadingRecipients = ref(false)
const error = ref('')
const selectedRoles = ref<string[]>([])
const selectedUserId = ref('')
const recipientSearch = ref('')
const lastResult = ref(0)
const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })
const form = reactive({
  title: '',
  content: '',
  type: 'System',
  navigateUrl: '/',
  referenceId: '',
  targetMode: 'All' as TargetMode,
})

const typeOptions: SelectOption[] = [
  { label: 'Hệ thống', value: 'System' },
  { label: 'Lịch hẹn', value: 'Appointment' },
  { label: 'Viện phí', value: 'Billing' },
  { label: 'Đơn thuốc', value: 'Prescription' },
  { label: 'Hồ sơ bệnh án', value: 'MedicalRecord' },
]

const roleOptions = [
  { label: 'Bệnh nhân', value: 'Patient' },
  { label: 'Bác sĩ', value: 'Doctor' },
  { label: 'Y tá', value: 'Nurse' },
  { label: 'Dược sĩ', value: 'Pharmacist' },
  { label: 'Quản trị viên', value: 'Admin' },
]

const targetModeOptions = [
  { label: 'Tất cả người dùng', value: 'All' as TargetMode, icon: Users },
  { label: 'Theo nhóm vai trò', value: 'Roles' as TargetMode, icon: ShieldCheck },
  { label: 'Một cá nhân', value: 'User' as TargetMode, icon: UserRound },
]

const targetModeLabel = computed(() => targetModeOptions.find((mode) => mode.value === form.targetMode)?.label || 'Tất cả người dùng')
const recipientSummary = computed(() => {
  if (form.targetMode === 'All') return 'Tất cả'
  if (form.targetMode === 'Roles') return `${selectedRoles.value.length} vai trò`
  return selectedUserId.value ? '1 người' : 'Chưa chọn'
})

const recipientOptions = computed<SelectOption[]>(() =>
  notificationStore.recipients.map((user) => ({
    label: `${user.fullName || user.username} · ${roleLabel(user.role)} · #${user.userId}`,
    value: user.userId,
  })),
)

watch(
  () => form.targetMode,
  () => {
    error.value = ''
    lastResult.value = 0
  },
)

onMounted(() => {
  void loadRecipients()
})

async function loadRecipients() {
  loadingRecipients.value = true
  try {
    await notificationStore.fetchAdminRecipients(recipientSearch.value)
    if (!notificationStore.recipients.length && form.targetMode === 'User') {
      showToast('Chưa có người nhận', 'Không tìm thấy người dùng phù hợp với từ khóa hiện tại.', 'error')
    }
  } catch (apiError) {
    showToast('Không tải được người nhận', getApiErrorMessage(apiError), 'error')
  } finally {
    loadingRecipients.value = false
  }
}

async function submitNotification() {
  error.value = validateForm()
  if (error.value) return

  saving.value = true
  lastResult.value = 0
  try {
    const payload: ManualNotificationPayload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      navigateUrl: form.navigateUrl.trim() || '/',
      referenceId: form.referenceId.trim() || undefined,
      targetMode: form.targetMode,
      roles: form.targetMode === 'Roles' ? selectedRoles.value : undefined,
      userId: form.targetMode === 'User' ? Number(selectedUserId.value) : undefined,
    }

    const result = await notificationStore.sendManualNotification(payload)
    lastResult.value = result.recipientCount
    showToast('Đã gửi thông báo', `Đã gửi thông báo đến ${result.recipientCount} người dùng.`, 'success')
    resetForm(false)
  } catch (apiError) {
    error.value = Number((apiError as any)?.response?.status) === 404
      ? 'Dịch vụ gửi thông báo hiện không khả dụng. Vui lòng kiểm tra lại kết nối hoặc liên hệ kỹ thuật.'
      : getApiErrorMessage(apiError)
    showToast('Gửi thông báo thất bại', error.value, 'error')
  } finally {
    saving.value = false
  }
}

function validateForm() {
  if (!form.title.trim()) return 'Vui lòng nhập tiêu đề.'
  if (form.title.trim().length > 200) return 'Tiêu đề tối đa 200 ký tự.'
  if (!form.content.trim()) return 'Vui lòng nhập nội dung.'
  if (form.targetMode === 'Roles' && !selectedRoles.value.length) return 'Vui lòng chọn ít nhất một vai trò.'
  if (form.targetMode === 'User' && !Number(selectedUserId.value)) return 'Vui lòng chọn người nhận.'
  return ''
}

function resetForm(clearResult = true) {
  form.title = ''
  form.content = ''
  form.type = 'System'
  form.navigateUrl = '/'
  form.referenceId = ''
  form.targetMode = 'All'
  selectedRoles.value = []
  selectedUserId.value = ''
  error.value = ''
  if (clearResult) lastResult.value = 0
}

function showToast(title: string, message: string, type: 'success' | 'error') {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
}

function roleLabel(role: string) {
  const value = role.toLowerCase()
  if (value === 'admin') return 'Quản trị viên'
  if (value === 'doctor') return 'Bác sĩ'
  if (value === 'nurse' || value === 'receptionist') return 'Y tá'
  if (value === 'pharmacist') return 'Dược sĩ'
  if (value === 'patient') return 'Bệnh nhân'
  return role || 'Người dùng'
}
</script>
