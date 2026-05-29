<template>
 <section class="bg-white py-12">
 <div class="container-page">
 <div class="rounded-2xl bg-indigo-950 p-6 text-white shadow-soft sm:p-8">
 <p class="text-sm font-semibold text-indigo-200">N3 - Pharmacy & Billing Service</p>
 <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">Dược, hóa đơn và viện phí</h1>
 <p class="mt-4 max-w-3xl text-indigo-50">
 Khu vực này dành cho Auth JWT, quản lý thuốc, hóa đơn và thanh toán. Khi có link thật của N3, chỉ cần cấu hình proxy `/n3`.
 </p>
 </div>

 <div class="mt-6 rounded-xl border p-4 text-sm" :class="healthOk ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-amber-200 bg-amber-50 text-amber-800'">
 {{ statusMessage }}
 </div>

 <div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
 <BaseCard v-for="module in modules" :key="module.title" class="p-5">
 <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
 <component :is="module.icon" class="h-6 w-6" />
 </div>
 <h2 class="mt-5 text-lg font-semibold text-slate-950">{{ module.title }}</h2>
 <p class="mt-3 text-sm leading-6 text-slate-600">{{ module.description }}</p>
 <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">{{ module.endpoint }}</p>
 </BaseCard>
 </div>

 <div class="mt-8 grid gap-6 lg:grid-cols-2">
 <BaseCard class="p-6">
 <h2 class="text-xl font-semibold text-slate-950">Cấu hình hiện tại</h2>
 <dl class="mt-5 space-y-4 text-sm">
 <div>
 <dt class="text-slate-500">Frontend gọi</dt>
 <dd class="mt-1 font-mono font-semibold text-slate-900">/n3</dd>
 </div>
 <div>
 <dt class="text-slate-500">Proxy dev hiện trỏ tới</dt>
 <dd class="mt-1 font-mono font-semibold text-slate-900">https://localhost:7003</dd>
 </div>
 <div>
 <dt class="text-slate-500">Gateway routes chuẩn bị</dt>
 <dd class="mt-1 font-mono font-semibold text-slate-900">/api/auth, /api/billing</dd>
 </div>
 </dl>
 </BaseCard>

 <BaseCard class="p-6">
 <h2 class="text-xl font-semibold text-slate-950">Việc cần làm khi có N3</h2>
 <ol class="mt-5 space-y-3 text-sm leading-6 text-slate-600">
 <li>1. Cập nhật target `/n3` trong `vite.config.ts` sang link thật của N3.</li>
 <li>2. Giữ `.env` dùng `VITE_PHARMACY_BILLING_SERVICE_URL=/n3` khi chạy local.</li>
 <li>3. Restart frontend rồi kiểm tra badge health của trang này.</li>
 <li>4. Sau khi API ổn, thêm bảng thuốc, hóa đơn và thanh toán thật vào page này.</li>
 </ol>
 </BaseCard>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { onMounted, ref, type Component } from 'vue'
import { CreditCard, KeyRound, Pill, ReceiptText } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { billingApi } from '@/services/billingApi'

const healthOk = ref(false)
const statusMessage = ref('Đang kiểm tra kết nối N3...')

const modules: Array<{ title: string; description: string; endpoint: string; icon: Component }> = [
 {
 title: 'Auth JWT',
 description: 'Đăng nhập và quản lý tài khoản theo vai trò.',
 endpoint: '/api/auth/**',
 icon: KeyRound,
 },
 {
 title: 'Kho thuốc',
 description: 'Quản lý thuốc, hoạt chất, đơn vị, giá và tồn kho.',
 endpoint: '/api/medicines/**',
 icon: Pill,
 },
 {
 title: 'Hóa đơn',
 description: 'Tạo hóa đơn từ phí khám và thuốc theo đơn.',
 endpoint: '/api/billing/**',
 icon: ReceiptText,
 },
 {
 title: 'Thanh toán',
 description: 'Theo dõi trạng thái thanh toán và biên nhận.',
 endpoint: '/api/payments/**',
 icon: CreditCard,
 },
]

onMounted(async () => {
 try {
 await billingApi.getHealth()
 healthOk.value = true
 statusMessage.value = 'N3 đang chạy và frontend đọc được health endpoint.'
 } catch (error) {
 healthOk.value = false
 statusMessage.value = `Chưa kết nối được N3. ${getApiErrorMessage(error)}`
 }
})
</script>
