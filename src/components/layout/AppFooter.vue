<template>
  <footer class="border-t border-slate-200 bg-[#f7f9fb]">
    <div class="container-page grid gap-10 py-16 md:grid-cols-4">
      <div>
        <img :src="logoUrl" alt="MedicareDNU" class="h-16 w-auto max-w-[300px] object-contain md:h-20" />
        <p class="mt-4 max-w-xs text-sm leading-6 text-slate-600">
          Dịch vụ chăm sóc sức khỏe chuyên nghiệp. Tận tâm, an toàn và đáng tin cậy.
        </p>
      </div>

      <div>
        <h4 class="text-sm font-semibold text-[#003c90]">Về chúng tôi</h4>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li><a href="/#services" class="hover:text-[#003c90]">Giới thiệu</a></li>
          <li><a href="/#doctors" class="hover:text-[#003c90]">Đội ngũ bác sĩ</a></li>
          <li><a href="/#why-us" class="hover:text-[#003c90]">Cơ sở vật chất</a></li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold text-[#003c90]">Hỗ trợ</h4>
        <ul class="mt-4 space-y-2 text-sm text-slate-600">
          <li><RouterLink to="/booking" class="hover:text-[#003c90]">Đặt lịch khám</RouterLink></li>
          <li><RouterLink to="/doctors" class="hover:text-[#003c90]">Danh sách bác sĩ</RouterLink></li>
          <li><a href="/#testimonials" class="hover:text-[#003c90]">Đánh giá</a></li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold text-[#003c90]">Liên hệ</h4>
        <ul class="mt-4 space-y-3 text-sm text-slate-600">
          <li class="flex items-center gap-2"><Phone class="h-4 w-4" />1900 1234</li>
          <li class="flex items-start gap-2"><MapPin class="mt-0.5 h-4 w-4 shrink-0" />123 Medical Ave, TP. Hồ Chí Minh</li>
        </ul>
      </div>
    </div>
    <div class="container-page border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      © 2026 MedicareDNU. Dịch vụ chăm sóc sức khỏe chuyên nghiệp.
    </div>
  </footer>
</template>

<script setup lang="ts">
import { MapPin, Phone } from 'lucide-vue-next'
import logoUrl from '@/assets/logo.png'
</script>
