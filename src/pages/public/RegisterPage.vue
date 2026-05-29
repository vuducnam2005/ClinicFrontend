<template>
 <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
 <div class="sm:mx-auto sm:w-full sm:max-w-md">
 <div class="flex justify-center">
 <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-card">
 <HeartPulse class="h-6 w-6" />
 </div>
 </div>
 <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
 Tạo tài khoản mới
 </h2>
 <p class="mt-2 text-center text-sm text-slate-600">
 Đã có tài khoản?
 <RouterLink to="/login" class="font-medium text-teal-600 hover:text-teal-500">
 Đăng nhập
 </RouterLink>
 </p>
 </div>

 <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
 <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
 <form class="space-y-6" @submit.prevent="submitRegister">
 <BaseInput v-model="registerData.fullName" label="Họ và tên" placeholder="Nhập họ và tên" required />
 <BaseInput v-model="registerData.username" label="Tên đăng nhập" placeholder="Nhập tên đăng nhập" required />
 <BaseInput v-model="registerData.email" label="Email" type="email" placeholder="Email của bạn" />
 <BaseInput v-model="registerData.phoneNumber" label="Số điện thoại" placeholder="Số điện thoại" />
 
 <BaseInput v-model="registerData.password" label="Mật khẩu" type="password" placeholder="Mật khẩu" required />
 <BaseInput v-model="registerData.confirmPassword" label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" required />
 
 <div>
 <BaseButton class="w-full flex justify-center" size="lg" type="submit" :loading="loading">
 <template #icon><UserPlus class="h-4 w-4" /></template>
 Đăng ký
 </BaseButton>
 </div>
 </form>
 </div>
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
import { HeartPulse, UserPlus } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import Toast from '@/components/ui/Toast.vue'
import { authApi } from '@/services/authApi'
import { RoleId } from '@/types/user'
import { getApiErrorMessage } from '@/services/apiClient'

const router = useRouter()
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

async function submitRegister() {
 if (registerData.password !== registerData.confirmPassword) {
 toast.title = 'Lỗi'
 toast.message = 'Mật khẩu xác nhận không khớp'
 toast.type = 'error'
 toast.show = true
 return
 }

 loading.value = true
 try {
 await authApi.register({
 username: registerData.username,
 password: registerData.password,
 fullName: registerData.fullName,
 email: registerData.email,
 phoneNumber: registerData.phoneNumber,
 roleId: RoleId.Patient, // Default to Patient for public registration
 })
 
 toast.title = 'Thành công'
 toast.message = 'Đăng ký tài khoản thành công'
 toast.type = 'success'
 toast.show = true

 setTimeout(() => {
 router.push('/login')
 }, 1500)
 
 } catch (error) {
 toast.title = 'Lỗi đăng ký'
 toast.message = getApiErrorMessage(error)
 toast.type = 'error'
 toast.show = true
 } finally {
 loading.value = false
 }
}
</script>
