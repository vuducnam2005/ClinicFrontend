<template>
 <footer class="border-t border-slate-200/50 bg-white transition-colors">
 <div class="container-page grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
 <!-- Brand column -->
 <div class="space-y-4">
 <div class="flex items-center gap-3">
 <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-medical">
 <HeartPulse class="h-5 w-5" />
 </span>
 <span class="text-xl font-extrabold tracking-tight text-slate-950 ">ClinicCare</span>
 </div>
 <p class="max-w-sm text-sm leading-relaxed text-slate-500 ">
 Hệ điều hành đặt lịch khám bệnh thông minh, tối ưu hóa hàng chờ lâm sàng và liên thông kết quả y tế thời gian thực.
 </p>
 </div>

 <!-- Contact column -->
 <div>
 <h3 class="font-bold text-xs uppercase tracking-wider text-slate-400 ">Thông tin liên hệ</h3>
 <ul class="mt-4 space-y-3.5 text-sm text-slate-600 ">
 <li class="flex items-center gap-2.5">
 <Phone class="h-4 w-4 text-teal-600 " />
 <span class="font-semibold text-slate-800 ">1900 8686</span>
 </li>
 <li class="flex items-center gap-2.5">
 <Mail class="h-4 w-4 text-teal-600 " />
 <span>hello@cliniccare.vn</span>
 </li>
 <li class="flex items-start gap-2.5">
 <MapPin class="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
 <span class="leading-relaxed">24 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</span>
 </li>
 </ul>
 </div>

 <!-- Tech column & Swagger links -->
 <div>
 <h3 class="font-bold text-xs uppercase tracking-wider text-slate-400 ">Cổng phát triển API</h3>
 <ul class="mt-4 space-y-3 text-sm text-slate-600 ">
 <li>
 <a class="hover:text-teal-600 flex items-center gap-2 transition" href="https://appointmentservice-pn1a.onrender.com/api/health" target="_blank">
 <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
 N1 Appointment Health
 </a>
 </li>
 <li>
 <a class="hover:text-teal-600 flex items-center gap-2 transition" href="https://medicalrecordservice.onrender.com/api/health" target="_blank">
 <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
 N2 Medical Record Health
 </a>
 </li>
 <li>
 <a class="hover:text-teal-600 flex items-center gap-2 transition" href="https://phamacybilling.onrender.com/api/health" target="_blank">
 <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
 N3 Pharmacy Health
 </a>
 </li>
 </ul>
 </div>
 </div>
 
 <!-- Sub footer -->
 <div class="border-t border-slate-100 py-6 text-center text-xs text-slate-400 ">
 &copy; 2026 ClinicCare OS. Được mã hóa bảo mật chuẩn lâm sàng toàn diện.
 </div>
 </footer>
</template>

<script setup lang="ts">
import { HeartPulse, Mail, MapPin, Phone } from 'lucide-vue-next'
</script>
