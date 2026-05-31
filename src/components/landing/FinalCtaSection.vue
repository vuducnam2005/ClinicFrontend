<template>
  <section class="bg-[#f7f9fb] py-24">
    <div class="container-page">
      <div v-reveal class="shine-sweep relative overflow-hidden rounded-xl bg-[#003c90] px-6 py-16 text-center text-white">
        <div class="float-soft absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5"></div>
        <div class="float-soft absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" style="animation-delay: 700ms"></div>
        <div class="relative mx-auto max-w-2xl">
          <h2 class="text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            Sẵn sàng để bắt đầu hành trình chăm sóc sức khỏe?
          </h2>
          <p class="mt-5 text-sm text-blue-100">
            Hãy đặt lịch ngay hôm nay để được tư vấn bởi các bác sĩ hàng đầu.
          </p>
          <RouterLink to="/booking" class="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-7 text-sm font-semibold text-[#003c90] transition hover:bg-blue-50">
            Đặt lịch khám ngay
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
