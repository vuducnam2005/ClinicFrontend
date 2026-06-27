<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <div class="grid min-h-[650px] w-full max-w-[1180px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] lg:grid-cols-[0.98fr_1fr]">
    <section class="relative hidden overflow-hidden bg-[#08264c] lg:flex lg:items-center lg:justify-center">
      <img
        class="absolute inset-0 h-full w-full object-cover opacity-45"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyRtwvy8Z_0g8e99r-EzqhWt7QHKuXCFZNIVwnS6vhQEmVlrn0EKKugW3U1XUclfMcTovrIn3KjK2MXOzIsGMcPbuvprwPBC5-xPBUaG67A1_b4ZjTl_ogmUxRNa2Yf4qEoiXK_p_dZpjLQgaySKtCpHcQlN0D4BlaR-76GGmnaYsG7DPLZddE8O4LLdAHTlq7C51FQRUyXyvtGUqKrdUw95QAhPZmhYLanSxO-na1183viqpTnY914TXzpVr_7vzGXdxfcTEvxfXS"
        alt="Không gian phòng khám MedicareDNU"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-[#173d70]/90 via-[#0f52ba]/70 to-[#001b3d]/95"></div>

      <div class="relative z-10 mx-auto max-w-lg px-10 text-center text-white">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-white/90 bg-white/10 shadow-2xl backdrop-blur">
          <BriefcaseMedical class="h-9 w-9" />
        </div>
        <h1 class="mt-7 text-4xl font-bold leading-tight tracking-normal">
          Chào mừng trở lại<br />với MedicareDNU
        </h1>
        <p class="mx-auto mt-6 max-w-md text-lg leading-8 text-blue-100">
          Hệ thống quản lý y tế chuyên nghiệp giúp bạn kết nối với bác sĩ và quản lý hồ sơ sức khỏe một cách an toàn và tinh gọn.
        </p>
      </div>
    </section>

    <section class="flex items-center justify-center bg-white px-5 py-8 sm:px-8">
      <div class="w-full max-w-[470px]">
        <div class="text-center">
          <RouterLink to="/" class="inline-flex items-center justify-center">
            <img :src="logoUrl" alt="MedicareDNU" class="h-12 w-auto max-w-[220px] object-contain" />
          </RouterLink>
          <h2 class="mt-7 text-3xl font-bold leading-tight tracking-normal text-slate-950">Đăng nhập tài khoản</h2>
          <p class="mt-3 text-base leading-7 text-slate-600">Vui lòng nhập thông tin để tiếp tục</p>
        </div>

        <form class="mt-8 space-y-6" novalidate @submit.prevent="submitLogin">
          <label class="block">
            <span class="mb-3 block text-base font-medium text-slate-800">Email hoặc tên đăng nhập <span class="text-red-500">*</span></span>
            <span class="flex h-14 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
              <Mail class="h-5 w-5 shrink-0 text-slate-500" />
              <input
                v-model="loginData.identifier"
                class="h-full min-w-0 flex-1 bg-transparent pl-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                type="text"
                autocomplete="username"
                placeholder="email@example.com hoặc username"
                maxlength="100"
                required
              />
            </span>
          </label>

          <label class="block">
            <span class="mb-3 block text-base font-medium text-slate-800">Mật khẩu <span class="text-red-500">*</span></span>
            <span class="flex h-14 items-center rounded-lg border border-slate-300 bg-slate-50 px-4 transition focus-within:border-[#0F52BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
              <LockKeyhole class="h-5 w-5 shrink-0 text-slate-500" />
              <input
                v-model="loginData.password"
                class="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                class="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Hiện hoặc ẩn mật khẩu"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </span>
          </label>

          <div class="flex items-center justify-between gap-4">
            <label class="flex items-center gap-3 text-base text-slate-800">
              <input
                v-model="remember"
                type="checkbox"
                class="h-5 w-5 rounded-md border-slate-300 text-[#0F52BA] focus:ring-[#0F52BA]"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" class="text-base font-medium text-[#003c90] transition hover:text-[#0f52ba]">Quên mật khẩu?</a>
          </div>

          <button
            type="submit"
            class="flex h-14 w-full items-center justify-center rounded-lg bg-[#0F52BA] px-6 text-base font-semibold text-white transition hover:bg-[#0B4296] disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="authStore.loading"
          >
            <Loader2 v-if="authStore.loading" class="mr-2 h-5 w-5 animate-spin" />
            Đăng nhập ngay
          </button>
        </form>

        <!-- Hoặc đăng nhập bằng -->
        <div class="relative flex items-center justify-center my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <span class="relative bg-white px-4 text-sm text-slate-500">Hoặc đăng nhập bằng</span>
        </div>

        <!-- Nút Google -->
        <div class="flex justify-center mb-4">
          <div id="google-btn" class="min-h-[40px]"></div>
        </div>

        <p class="mt-8 text-center text-sm text-slate-700">
          Chưa có tài khoản?
          <RouterLink
            :to="{ path: '/register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
            class="font-semibold text-[#003c90] hover:text-[#0f52ba]"
          >
            Đăng ký ngay
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
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BriefcaseMedical, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-vue-next'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import logoUrl from '@/assets/logo.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const remember = ref(true)
const showPassword = ref(false)
const loginData = reactive({ identifier: '', password: '' })
const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })

onMounted(() => {
  if (typeof window !== 'undefined') {
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: '807372784575-4efmnootusg8irvv4kai866gucskqh7v.apps.googleusercontent.com',
          callback: handleGoogleLoginCallback
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          { theme: 'outline', size: 'large', text: 'signin_with', alignment: 'center' }
        );
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    initGoogle();
  }
})

async function handleGoogleLoginCallback(response: any) {
  const idToken = response.credential
  if (!idToken) return

  try {
    await authStore.loginWithGoogle(idToken)
    toast.title = 'Thành công'
    toast.message = 'Đăng nhập bằng Google thành công'
    toast.type = 'success'
    toast.show = true
    setTimeout(() => {
      router.push(resolveRedirectPath())
    }, 500)
  } catch (error) {
    toast.title = 'Lỗi đăng nhập Google'
    toast.message = getApiErrorMessage(error)
    toast.type = 'error'
    toast.show = true
  }
}

function showValidationError(message: string) {
  toast.title = 'Thông tin chưa hợp lệ'
  toast.message = message
  toast.type = 'error'
  toast.show = true
}

function resolveDashboardPath() {
  if (authStore.isAdmin) return '/admin/dashboard'
  if (authStore.isDoctor) return '/doctor/dashboard'
  if (authStore.isReceptionist) return '/nurse/dashboard'
  if (authStore.isPatient) return '/patient/dashboard'
  return '/'
}

function resolveRedirectPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (redirect && redirect !== '/login' && redirect !== '/register') return redirect
  return resolveDashboardPath()
}

async function submitLogin() {
  const identifier = loginData.identifier.trim()
  const password = loginData.password

  if (!identifier) {
    showValidationError('Email hoặc tên đăng nhập là bắt buộc')
    return
  }
  if (identifier.length > 100) {
    showValidationError('Email hoặc tên đăng nhập không được vượt quá 100 ký tự')
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

  try {
    await authStore.login({ identifier, password })
    toast.title = 'Thành công'
    toast.message = 'Đăng nhập thành công'
    toast.type = 'success'
    toast.show = true
    setTimeout(() => {
      router.push(resolveRedirectPath())
    }, 500)
  } catch (error) {
    toast.title = 'Lỗi đăng nhập'
    toast.message = getApiErrorMessage(error)
    toast.type = 'error'
    toast.show = true
  }
}

</script>
