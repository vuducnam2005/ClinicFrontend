<template>
  <div class="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section class="rounded-3xl bg-slate-950 p-8 text-white shadow-card">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-card">
            <HeartPulse class="h-6 w-6" />
          </div>
          <div>
            <p class="text-xl font-bold">ClinicCare</p>
            <p class="text-sm text-slate-300">Smart Clinic Platform</p>
          </div>
        </div>
        <h1 class="mt-10 text-3xl font-bold leading-tight">&#272;&#259;ng nh&#7853;p theo vai tr&#242; &#273;&#7875; xem &#273;&#250;ng nghi&#7879;p v&#7909;.</h1>
        <p class="mt-4 text-sm leading-6 text-slate-300">
          V&#7899;i mock N3, t&#224;i kho&#7843;n b&#225;c s&#297; &#273;&#432;&#7907;c g&#7855;n v&#7899;i doctorId c&#7911;a N1. Khi &#273;&#259;ng nh&#7853;p, b&#225;c s&#297; ch&#7881; th&#7845;y l&#7883;ch h&#7865;n, h&#224;ng &#273;&#7907;i v&#224; l&#7883;ch l&#224;m vi&#7879;c c&#7911;a ch&#237;nh m&#236;nh.
        </p>

        <div class="mt-8 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-teal-200">T&#224;i kho&#7843;n b&#225;c s&#297; mock</p>
          <button
            v-for="account in doctorAccounts"
            :key="account.username"
            type="button"
            class="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-teal-300/60 hover:bg-teal-400/10"
            @click="fillDemo(account.username, account.password)"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-white">{{ account.name }}</p>
                <p class="mt-1 text-xs text-slate-300">DoctorId #{{ account.doctorId }} ? {{ account.specialty }}</p>
              </div>
              <span class="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-100">{{ account.username }}</span>
            </div>
            <p class="mt-2 font-mono text-xs text-slate-400">M&#7853;t kh&#7849;u: {{ account.password }} ho&#7863;c 123456</p>
          </button>
        </div>
      </section>

      <section>
        <div class="mx-auto max-w-md">
          <h2 class="text-center text-3xl font-bold tracking-tight text-slate-900">&#272;&#259;ng nh&#7853;p h&#7879; th&#7889;ng</h2>
          <p class="mt-2 text-center text-sm text-slate-600">
            Ch&#432;a c&#243; t&#224;i kho&#7843;n?
            <RouterLink :to="{ path: '/register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }" class="font-medium text-teal-600 hover:text-teal-500">
              &#272;&#259;ng k&#253; ngay
            </RouterLink>
          </p>
        </div>

        <div class="mt-8 mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <form class="space-y-6" @submit.prevent="submitLogin">
            <BaseInput v-model="loginData.identifier" label="T&#234;n &#273;&#259;ng nh&#7853;p ho&#7863;c Email" required />
            <BaseInput v-model="loginData.password" label="M&#7853;t kh&#7849;u" type="password" required />

            <div class="flex items-center justify-between">
              <label class="flex items-center text-sm text-slate-700">
                <input id="remember-me" v-model="remember" name="remember-me" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500">
                <span class="ml-2">Ghi nh&#7899; t&#244;i</span>
              </label>
              <a href="#" class="text-sm font-medium text-teal-600 hover:text-teal-500">Qu&#234;n m&#7853;t kh&#7849;u?</a>
            </div>

            <BaseButton class="flex w-full justify-center" size="lg" type="submit" :loading="authStore.loading">
              <template #icon><LogIn class="h-4 w-4" /></template>
              &#272;&#259;ng nh&#7853;p
            </BaseButton>
          </form>
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
import { useRoute, useRouter } from 'vue-router'
import { HeartPulse, LogIn } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const remember = ref(true)
const loginData = reactive({ identifier: '', password: '' })

const doctorAccounts = [
  { doctorId: 1, name: 'Bác sĩ Nguyễn Văn A', specialty: 'Tim mạch', username: 'doctor1', password: 'doctor1123' },
  { doctorId: 2, name: 'Bác sĩ Trần Thị B', specialty: 'Nhi khoa', username: 'doctor2', password: 'doctor2123' },
  { doctorId: 3, name: 'Bác sĩ Lê Văn C', specialty: 'Da liễu', username: 'doctor3', password: 'doctor3123' },
]

const toast = reactive({ show: false, title: '', message: '', type: 'success' as 'success' | 'error' })

function fillDemo(username: string, password: string) {
  loginData.identifier = username
  loginData.password = password
}

async function submitLogin() {
  try {
    await authStore.login({ identifier: loginData.identifier, password: loginData.password })
    toast.title = 'Thành công'
    toast.message = 'Đăng nhập thành công'
    toast.type = 'success'
    toast.show = true
    setTimeout(() => {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
      if (redirect && redirect !== '/login' && redirect !== '/register') { router.push(redirect); return }
      if (authStore.isAdmin) router.push('/admin/dashboard')
      else if (authStore.isDoctor) router.push('/doctor/dashboard')
      else if (authStore.isReceptionist) router.push('/nurse/dashboard')
      else if (authStore.isPatient) router.push('/patient/dashboard')
      else router.push('/')
    }, 500)
  } catch (error) {
    toast.title = 'Lỗi đăng nhập'
    toast.message = getApiErrorMessage(error)
    toast.type = 'error'
    toast.show = true
  }
}
</script>
