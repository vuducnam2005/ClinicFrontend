<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <div class="w-full max-w-[520px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-10">
      <div class="text-center">
        <RouterLink to="/login" class="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-[#0f52ba] transition gap-2 mb-6">
          <ArrowLeft class="h-4 w-4" />
          Quay lại đăng nhập
        </RouterLink>
        <h2 class="text-3xl font-bold leading-tight tracking-normal text-slate-950">Khôi phục mật khẩu</h2>
        <p class="mt-3 text-base leading-7 text-slate-600">
          {{ stepDescription }}
        </p>
      </div>

      <!-- Bước 1: Nhập Email -->
      <form v-if="step === 1" class="mt-8 space-y-6" novalidate @submit.prevent="submitEmail">
        <label class="block">
          <span class="mb-3 block text-base font-medium text-slate-800">Địa chỉ Email đăng ký <span class="text-red-500">*</span></span>
          <span class="flex h-14 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
            <Mail class="h-5 w-5 shrink-0 text-slate-500" />
            <input
              v-model="email"
              class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
              type="email"
              placeholder="email@example.com"
              required
              :disabled="loading"
            />
          </span>
        </label>

        <button
          type="submit"
          class="flex h-14 w-full items-center justify-center rounded-lg bg-[#0F52BA] px-6 text-base font-semibold text-white transition hover:bg-[#0B4296] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
        >
          <Loader2 v-if="loading" class="mr-2 h-5 w-5 animate-spin" />
          Gửi mã xác thực OTP
        </button>
      </form>

      <!-- Bước 2: Nhập OTP -->
      <form v-else-if="step === 2" class="mt-8 space-y-6" novalidate @submit.prevent="submitOtp">
        <label class="block">
          <span class="mb-3 block text-base font-medium text-slate-800">Nhập mã xác thực OTP (6 chữ số) <span class="text-red-500">*</span></span>
          <span class="flex h-14 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
            <KeyRound class="h-5 w-5 shrink-0 text-slate-500" />
            <input
              v-model="otpCode"
              class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-center font-mono text-2xl tracking-[8px] text-slate-950 outline-none placeholder:text-slate-300"
              type="text"
              maxlength="6"
              placeholder="••••••"
              required
              :disabled="loading"
            />
          </span>
        </label>

        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500">Mã OTP gửi đến: <strong class="text-slate-800">{{ email }}</strong></span>
          <button
            type="button"
            class="font-medium text-[#003c90] hover:text-[#0f52ba] disabled:cursor-not-allowed disabled:text-slate-400 transition"
            :disabled="timer > 0 || loading"
            @click="resendOtp"
          >
            {{ timer > 0 ? `Gửi lại sau ${timer}s` : 'Gửi lại mã' }}
          </button>
        </div>

        <button
          type="submit"
          class="flex h-14 w-full items-center justify-center rounded-lg bg-[#0F52BA] px-6 text-base font-semibold text-white transition hover:bg-[#0B4296] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
        >
          <Loader2 v-if="loading" class="mr-2 h-5 w-5 animate-spin" />
          Xác thực mã OTP
        </button>
      </form>

      <!-- Bước 3: Đặt lại mật khẩu mới -->
      <form v-else-if="step === 3" class="mt-8 space-y-6" novalidate @submit.prevent="submitNewPassword">
        <label class="block">
          <span class="mb-3 block text-base font-medium text-slate-800">Mật khẩu mới <span class="text-red-500">*</span></span>
          <span class="flex h-14 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
            <LockKeyhole class="h-5 w-5 shrink-0 text-slate-500" />
            <input
              v-model="newPassword"
              class="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Tối thiểu 6 ký tự"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-5 w-5" />
              <Eye v-else class="h-5 w-5" />
            </button>
          </span>
        </label>

        <label class="block">
          <span class="mb-3 block text-base font-medium text-slate-800">Xác nhận mật khẩu mới <span class="text-red-500">*</span></span>
          <span class="flex h-14 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
            <LockKeyhole class="h-5 w-5 shrink-0 text-slate-500" />
            <input
              v-model="confirmPassword"
              class="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Nhập lại mật khẩu mới"
              required
              :disabled="loading"
            />
          </span>
        </label>

        <button
          type="submit"
          class="flex h-14 w-full items-center justify-center rounded-lg bg-[#0F52BA] px-6 text-base font-semibold text-white transition hover:bg-[#0B4296] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
        >
          <Loader2 v-if="loading" class="mr-2 h-5 w-5 animate-spin" />
          Đặt lại mật khẩu
        </button>
      </form>
    </div>

    <Toast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Mail, KeyRound, LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { authApi } from '@/services/authApi'
import { getApiErrorMessage } from '@/services/apiClient'
import Toast from '@/components/ui/Toast.vue'

const router = useRouter()

const step = ref(1)
const loading = ref(false)
const email = ref('')
const otpCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

const resetToken = ref('')
const timer = ref(0)
let timerInterval: any = null

const toast = ref({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })

const stepDescription = computed(() => {
  if (step.value === 1) return 'Nhập email liên kết với tài khoản của bạn để nhận mã xác thực OTP.'
  if (step.value === 2) return 'Vui lòng nhập mã xác thực OTP gồm 6 số đã được gửi về email của bạn.'
  return 'Tạo mật khẩu mới cho tài khoản của bạn. Mật khẩu mới cần tối thiểu 6 ký tự.'
})

function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
  toast.value.title = title
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
}

function startTimer() {
  timer.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timer.value > 0) {
      timer.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})

async function submitEmail() {
  const emailVal = email.value.trim()
  if (!emailVal) {
    showToast('Lỗi nhập liệu', 'Vui lòng nhập địa chỉ email.', 'error')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailVal)) {
    showToast('Lỗi nhập liệu', 'Định dạng email không hợp lệ.', 'error')
    return
  }

  loading.value = true
  try {
    await authApi.initiatePasswordReset(emailVal)
    showToast('Thành công', 'Mã OTP đã được gửi về email của bạn.')
    step.value = 2
    startTimer()
  } catch (error) {
    showToast('Lỗi', getApiErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}

async function resendOtp() {
  if (timer.value > 0) return
  loading.value = true
  try {
    await authApi.initiatePasswordReset(email.value.trim())
    showToast('Thành công', 'Mã OTP mới đã được gửi.')
    startTimer()
  } catch (error) {
    showToast('Lỗi', getApiErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}

async function submitOtp() {
  const otpVal = otpCode.value.trim()
  if (!otpVal || otpVal.length !== 6) {
    showToast('Lỗi nhập liệu', 'Vui lòng nhập mã OTP gồm 6 chữ số.', 'error')
    return
  }

  loading.value = true
  try {
    const res = await authApi.verifyPasswordResetOtp(email.value.trim(), otpVal)
    resetToken.value = res.resetToken
    showToast('Thành công', 'Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới.')
    step.value = 3
  } catch (error) {
    showToast('Lỗi xác thực', getApiErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}

async function submitNewPassword() {
  const pwd = newPassword.value
  const confirmPwd = confirmPassword.value

  if (!pwd) {
    showToast('Lỗi nhập liệu', 'Vui lòng nhập mật khẩu mới.', 'error')
    return
  }
  if (pwd.length < 6) {
    showToast('Lỗi nhập liệu', 'Mật khẩu phải có ít nhất 6 ký tự.', 'error')
    return
  }
  if (pwd !== confirmPwd) {
    showToast('Lỗi nhập liệu', 'Mật khẩu xác nhận không khớp.', 'error')
    return
  }

  loading.value = true
  try {
    await authApi.completePasswordReset(resetToken.value, pwd)
    showToast('Thành công', 'Mật khẩu của bạn đã được cập nhật.')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    showToast('Lỗi', getApiErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}
</script>
