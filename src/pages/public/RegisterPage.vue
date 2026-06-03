<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <div class="grid min-h-[690px] w-full max-w-[1180px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] lg:grid-cols-[0.98fr_1fr]">
      <section class="relative hidden overflow-hidden bg-[#08264c] lg:flex lg:items-center lg:justify-center">
        <img
          class="absolute inset-0 h-full w-full object-cover opacity-45"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyRtwvy8Z_0g8e99r-EzqhWt7QHKuXCFZNIVwnS6vhQEmVlrn0EKKugW3U1XUclfMcTovrIn3KjK2MXOzIsGMcPbuvprwPBC5-xPBUaG67A1_b4ZjTl_ogmUxRNa2Yf4qEoiXK_p_dZpjLQgaySKtCpHcQlN0D4BlaR-76GGmnaYsG7DPLZddE8O4LLdAHTlq7C51FQRUyXyvtGUqKrdUw95QAhPZmhYLanSxO-na1183viqpTnY914TXzpVr_7vzGXdxfcTEvxfXS"
          alt="Không gian phòng khám MedicareDNU"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-[#173d70]/90 via-[#0f52ba]/70 to-[#001b3d]/95"></div>

        <div class="relative z-10 mx-auto max-w-lg px-10 text-center text-white">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-white/90 bg-white/10 shadow-2xl backdrop-blur">
            <UserPlus class="h-9 w-9" />
          </div>
          <h1 class="mt-7 text-4xl font-bold leading-tight tracking-normal">
            Tạo hồ sơ chăm sóc<br />cùng MedicareDNU
          </h1>
          <p class="mx-auto mt-6 max-w-md text-lg leading-8 text-blue-100">
            Đăng ký tài khoản bệnh nhân để đặt lịch khám, theo dõi lịch hẹn và quản lý thông tin y tế thuận tiện hơn.
          </p>
        </div>
      </section>

      <section class="flex items-center justify-center bg-white px-5 py-8 sm:px-8">
        <div class="w-full max-w-[500px]">
          <div class="text-center">
            <RouterLink to="/" class="inline-flex items-center justify-center">
              <img :src="logoUrl" alt="MedicareDNU" class="h-12 w-auto max-w-[220px] object-contain" />
            </RouterLink>
            <h2 class="mt-6 text-3xl font-bold leading-tight tracking-normal text-slate-950">Tạo tài khoản mới</h2>
            <p class="mt-3 text-base leading-7 text-slate-600">Vui lòng nhập thông tin để bắt đầu sử dụng dịch vụ</p>
          </div>

          <form class="mt-7 space-y-4" novalidate @submit.prevent="submitRegister">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-800">Họ và tên <span class="text-red-500">*</span></span>
              <span class="flex h-12 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <UserRound class="h-5 w-5 shrink-0 text-slate-500" />
                <input
                  v-model="registerData.fullName"
                  class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                  type="text"
                  autocomplete="name"
                  placeholder="Nhập họ và tên"
                  maxlength="100"
                  required
                />
              </span>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-800">Tên đăng nhập <span class="text-red-500">*</span></span>
                <span class="flex h-12 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <UserRound class="h-5 w-5 shrink-0 text-slate-500" />
                  <input
                    v-model="registerData.username"
                    class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                    type="text"
                    autocomplete="username"
                    placeholder="Tên đăng nhập"
                    maxlength="50"
                    required
                  />
                </span>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-800">Số điện thoại</span>
                <span class="flex h-12 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <Phone class="h-5 w-5 shrink-0 text-slate-500" />
                  <input
                    v-model="registerData.phoneNumber"
                    class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                    type="tel"
                    autocomplete="tel"
                    placeholder="Số điện thoại"
                  />
                </span>
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-800">Email <span class="text-red-500">*</span></span>
              <span class="flex h-12 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <Mail class="h-5 w-5 shrink-0 text-slate-500" />
                <input
                  v-model="registerData.email"
                  class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                  type="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  maxlength="100"
                  required
                />
              </span>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-800">Mật khẩu <span class="text-red-500">*</span></span>
                <span class="flex h-12 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <LockKeyhole class="h-5 w-5 shrink-0 text-slate-500" />
                  <input
                    v-model="registerData.password"
                    class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                    type="password"
                    autocomplete="new-password"
                    placeholder="••••••••"
                    minlength="6"
                    maxlength="100"
                    required
                  />
                </span>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-800">Xác nhận mật khẩu <span class="text-red-500">*</span></span>
                <span class="flex h-12 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <ShieldCheck class="h-5 w-5 shrink-0 text-slate-500" />
                  <input
                    v-model="registerData.confirmPassword"
                    class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                    type="password"
                    autocomplete="new-password"
                    placeholder="••••••••"
                    minlength="6"
                    maxlength="100"
                    required
                  />
                </span>
              </label>
            </div>

            <button
              type="submit"
              class="flex h-14 w-full items-center justify-center rounded-lg bg-[#0F52BA] px-6 text-base font-semibold text-white transition hover:bg-[#0B4296] disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="mr-2 h-5 w-5 animate-spin" />
              Đăng ký tài khoản
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-700">
            Đã có tài khoản?
            <RouterLink to="/login" class="font-semibold text-[#003c90] hover:text-[#0f52ba]">
              Đăng nhập ngay
            </RouterLink>
          </p>
        </div>
      </section>
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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, LockKeyhole, Mail, Phone, ShieldCheck, UserPlus, UserRound } from 'lucide-vue-next'
import Toast from '@/components/ui/Toast.vue'
import { authApi } from '@/services/authApi'
import { useAuthStore } from '@/stores/authStore'
import { RoleId } from '@/types/user'
import { getApiErrorMessage } from '@/services/apiClient'
import logoUrl from '@/assets/logo.png'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const registerData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  email: '',
  phoneNumber: '',
})

const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error',
})
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^(0|\+84)(\d[\s.-]?){8,10}$/

function showValidationError(message: string) {
  toast.title = 'Thông tin chưa hợp lệ'
  toast.message = message
  toast.type = 'error'
  toast.show = true
}

async function submitRegister() {
  const fullName = registerData.fullName.trim()
  const username = registerData.username.trim()
  const email = registerData.email.trim()
  const password = registerData.password
  const confirmPassword = registerData.confirmPassword

  if (!fullName) {
    showValidationError('Họ và tên là bắt buộc')
    return
  }
  if (fullName.length > 100) {
    showValidationError('Họ và tên không được vượt quá 100 ký tự')
    return
  }
  if (!username) {
    showValidationError('Tên đăng nhập là bắt buộc')
    return
  }
  if (username.length < 3) {
    showValidationError('Tên đăng nhập phải có ít nhất 3 ký tự')
    return
  }
  if (username.length > 50) {
    showValidationError('Tên đăng nhập không được vượt quá 50 ký tự')
    return
  }
  if (registerData.phoneNumber.trim() && !phonePattern.test(registerData.phoneNumber.trim())) {
    showValidationError('Số điện thoại không đúng định dạng')
    return
  }
  if (!email) {
    showValidationError('Email là bắt buộc')
    return
  }
  if (email.length > 100) {
    showValidationError('Email không được vượt quá 100 ký tự')
    return
  }
  if (!emailPattern.test(email)) {
    showValidationError('Email không đúng định dạng')
    return
  }
  if (!password) {
    showValidationError('Mật khẩu là bắt buộc')
    return
  }
  if (password.length < 6) {
    showValidationError('Mật khẩu phải có ít nhất 6 ký tự')
    return
  }
  if (password.length > 100) {
    showValidationError('Mật khẩu không được vượt quá 100 ký tự')
    return
  }
  if (!confirmPassword) {
    showValidationError('Xác nhận mật khẩu là bắt buộc')
    return
  }
  if (password !== confirmPassword) {
    showValidationError('Mật khẩu xác nhận không khớp')
    return
  }

  loading.value = true
  try {
    await authApi.register({
      username,
      password,
      fullName,
      email,
      phoneNumber: registerData.phoneNumber.trim(),
      roleId: RoleId.Patient,
    })
    await authStore.login({ identifier: email, password })

    toast.title = 'Thành công'
    toast.message = 'Đăng ký tài khoản thành công'
    toast.type = 'success'
    toast.show = true

    setTimeout(() => {
      router.push('/patient/dashboard')
    }, 500)
  } catch (error) {
    toast.title = 'Lỗi đăng ký'
    const message = getApiErrorMessage(error)
    toast.message = message.includes('Missing or invalid JWT token')
      ? 'API đăng ký đang yêu cầu JWT. Cần mở public POST /api/auth/register trên N3 để người dùng tự đăng ký.'
      : message
    toast.type = 'error'
    toast.show = true
  } finally {
    loading.value = false
  }
}
</script>
