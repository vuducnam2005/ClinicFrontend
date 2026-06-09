<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0F52BA]">
            <BellRing class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-[#0F52BA]">N3 Notification</p>
            <h1 class="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Gửi thông báo</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Tạo thông báo hệ thống và gửi realtime đến toàn bộ người dùng, nhóm vai trò hoặc một cá nhân.
            </p>
            <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-500">
              POST /pharmacy/api/notifications/admin/send
            </p>
          </div>
        </div>
        <BaseButton variant="outline" :disabled="loadingRecipients" @click="loadRecipients">
          <template #icon><RefreshCw class="h-4 w-4" /></template>
          Tải người nhận
        </BaseButton>
      </div>
    </div>

    <form class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7" @submit.prevent="submitNotification">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-5">
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
            ></textarea>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <BaseInput v-model="form.navigateUrl" label="NavigateUrl" placeholder="/admin/dashboard" />
            <BaseInput v-model="form.referenceId" label="ReferenceId" placeholder="Mã tham chiếu" />
          </div>
        </div>

        <div class="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <p class="text-sm font-bold text-slate-950">Đối tượng nhận</p>
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
            <BaseInput v-model="recipientSearch" label="Tìm người nhận" placeholder="Tên, username, email..." @blur="loadRecipients" />
            <BaseSelect v-model="selectedUserId" label="Người nhận" :options="recipientOptions" required placeholder="Chọn người nhận" />
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
  { label: 'Patient', value: 'Patient' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'Nurse', value: 'Nurse' },
  { label: 'Pharmacist', value: 'Pharmacist' },
  { label: 'Admin', value: 'Admin' },
]

const targetModeOptions = [
  { label: 'Tất cả người dùng', value: 'All' as TargetMode, icon: Users },
  { label: 'Theo nhóm vai trò', value: 'Roles' as TargetMode, icon: ShieldCheck },
  { label: 'Cá nhân', value: 'User' as TargetMode, icon: UserRound },
]

const recipientOptions = computed<SelectOption[]>(() =>
  notificationStore.recipients.map((user) => ({
    label: `${user.fullName || user.username} · ${user.role} · #${user.userId}`,
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
    error.value = getApiErrorMessage(apiError)
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
</script>
