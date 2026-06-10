<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <component :is="config.icon || Stethoscope" class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ config.service }}</p>
            <h1 class="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{{ config.title }}</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
            <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-500">{{ config.endpoint }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="canCreate" @click="openForm()">
            <template #icon><Plus class="h-4 w-4" /></template>
            Thêm mới
          </BaseButton>
          <BaseButton v-if="key === 'schedules'" variant="outline" @click="openBulkScheduleForm">
            <template #icon><CalendarPlus class="h-4 w-4" /></template>
            Tạo hàng loạt
          </BaseButton>
          <BaseButton variant="outline" :disabled="loading" @click="loadData">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-if="note" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{{ error }}</div>

    <div v-if="loading && key === 'schedules'" class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <LoadingSkeleton v-for="item in 5" :key="item" />
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <LoadingSkeleton v-for="item in 6" :key="item" />
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="item in 3" :key="item" />
    </div>

    <div v-else-if="key === 'schedules'" class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div
          v-for="stat in scheduleStats"
          :key="stat.label"
          :class="['rounded-2xl border p-4 shadow-sm', scheduleStatToneClass(stat.tone)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ stat.label }}</p>
              <p class="mt-2 text-2xl font-black text-slate-950">{{ stat.value }}</p>
            </div>
            <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', scheduleStatIconClass(stat.tone)]">
              <component :is="stat.icon" class="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <label class="block">
            <span class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Tìm bác sĩ</span>
            <span class="relative block">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="query"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                placeholder="Tên bác sĩ"
              />
            </span>
          </label>

          <label class="block">
            <span class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Bác sĩ</span>
            <select v-model="scheduleDoctorFilter" class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100">
              <option value="">Tất cả</option>
              <option v-for="option in doctorOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label class="block">
            <span class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Chuyên khoa</span>
            <select v-model="scheduleSpecialtyFilter" class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100">
              <option value="">Tất cả</option>
              <option v-for="option in specialtyOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label class="block">
            <span class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</span>
            <select v-model="scheduleStatusFilter" class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100">
              <option value="">Tất cả</option>
              <option value="open">Đang mở</option>
              <option value="paused">Tạm ngưng</option>
            </select>
          </label>

          <BaseInput v-model="scheduleDateFrom" label="Từ ngày" type="date" />
          <BaseInput v-model="scheduleDateTo" label="Đến ngày" type="date" />
        </div>

        <div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="button in scheduleQuickButtons"
              :key="button.value"
              type="button"
              :class="scheduleQuickButtonClass(button.value)"
              @click="applyScheduleQuickRange(button.value)"
            >
              {{ button.label }}
            </button>
          </div>
          <span class="inline-flex h-10 items-center justify-center rounded-xl bg-teal-50 px-4 text-sm font-bold text-teal-700">
            {{ filteredRows.length }} lịch
          </span>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div class="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 sm:w-auto">
            <button type="button" :class="scheduleViewTabClass('week')" @click="scheduleTab = 'week'">
              <CalendarDays class="h-4 w-4" />
              Lịch tuần
            </button>
            <button type="button" :class="scheduleViewTabClass('table')" @click="scheduleTab = 'table'">
              <Table2 class="h-4 w-4" />
              Bảng
            </button>
          </div>

          <div v-if="scheduleTab === 'week'" class="flex flex-wrap items-center gap-2">
            <button type="button" class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" @click="moveScheduleWeek(-1)">
              <ChevronLeft class="h-4 w-4" />
              Tuần trước
            </button>
            <button type="button" class="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700" @click="goToCurrentScheduleWeek">Tuần này</button>
            <button type="button" class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" @click="moveScheduleWeek(1)">
              Tuần sau
              <ChevronRight class="h-4 w-4" />
            </button>
            <span class="inline-flex h-10 items-center rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700">{{ weekRangeLabel }}</span>
          </div>
        </div>

        <div v-if="scheduleTab === 'week'" class="p-4">
          <div v-if="weeklyScheduleCount" class="hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
            <div class="grid grid-cols-7 divide-x divide-slate-200 bg-slate-50">
              <div v-for="day in weeklyDays" :key="day.key" class="px-3 py-3">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-black text-slate-900">{{ day.label }}</p>
                  <span :class="['rounded-full px-2 py-1 text-xs font-bold', day.isToday ? 'bg-blue-600 text-white' : 'bg-white text-slate-500']">{{ day.shortDate }}</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-7 divide-x divide-slate-100 bg-white">
              <div v-for="day in weeklyDays" :key="`${day.key}-items`" class="min-h-[420px] space-y-3 p-3">
                <button
                  v-for="item in day.items"
                  :key="String(item.id)"
                  type="button"
                  :class="scheduleCardClass(item)"
                  @click="openForm(item)"
                >
                  <span class="flex items-start justify-between gap-2">
                    <span class="min-w-0">
                      <span class="block break-words text-sm font-black text-slate-950">{{ item.doctorName }}</span>
                      <span class="mt-1 block break-words text-xs font-semibold text-slate-500">{{ item.specialtyName }}</span>
                    </span>
                    <span :class="scheduleStatusBadgeClass(item)">{{ item.status }}</span>
                  </span>
                  <span class="mt-3 flex items-center gap-2 text-sm font-black text-slate-800">
                    <Clock class="h-4 w-4 shrink-0 text-slate-500" />
                    {{ item.timeRange }}
                  </span>
                  <span class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">{{ item.duration }}</span>
                    <span class="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">{{ item.slotCountLabel }} slot</span>
                    <span v-if="item.hasConflict" class="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-black text-white">Trùng ca</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="weeklyScheduleCount" class="space-y-3 lg:hidden">
            <div v-for="day in weeklyDays" :key="`${day.key}-mobile`" class="rounded-xl border border-slate-200 bg-white">
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <p class="font-black text-slate-950">{{ day.label }}</p>
                <span :class="['rounded-full px-2.5 py-1 text-xs font-bold', day.isToday ? 'bg-blue-600 text-white' : 'bg-white text-slate-500']">{{ day.shortDate }}</span>
              </div>
              <div class="space-y-3 p-3">
                <button
                  v-for="item in day.items"
                  :key="String(item.id)"
                  type="button"
                  :class="scheduleCardClass(item)"
                  @click="openForm(item)"
                >
                  <span class="flex items-start justify-between gap-2">
                    <span class="min-w-0">
                      <span class="block break-words text-sm font-black text-slate-950">{{ item.doctorName }}</span>
                      <span class="mt-1 block break-words text-xs font-semibold text-slate-500">{{ item.specialtyName }}</span>
                    </span>
                    <span :class="scheduleStatusBadgeClass(item)">{{ item.status }}</span>
                  </span>
                  <span class="mt-3 flex items-center gap-2 text-sm font-black text-slate-800">
                    <Clock class="h-4 w-4 shrink-0 text-slate-500" />
                    {{ item.timeRange }}
                  </span>
                  <span class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">{{ item.duration }}</span>
                    <span class="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">{{ item.slotCountLabel }} slot</span>
                    <span v-if="item.hasConflict" class="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-black text-white">Trùng ca</span>
                  </span>
                </button>
                <p v-if="!day.items.length" class="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm font-semibold text-slate-400">Chưa có lịch</p>
              </div>
            </div>
          </div>

          <div v-if="!weeklyScheduleCount" class="px-4 py-14 text-center">
            <CalendarX class="mx-auto h-11 w-11 text-slate-300" />
            <h2 class="mt-4 text-lg font-black text-slate-950">Chưa có lịch trong khoảng này</h2>
          </div>
        </div>

        <div v-else>
          <div v-if="filteredRows.length" class="overflow-x-auto">
            <table class="min-w-[1120px] divide-y divide-slate-100 text-sm">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Mã</th>
                  <th class="px-4 py-3">Bác sĩ</th>
                  <th class="px-4 py-3">Chuyên khoa</th>
                  <th class="px-4 py-3">Ngày</th>
                  <th class="px-4 py-3">Thứ</th>
                  <th class="px-4 py-3">Ca</th>
                  <th class="px-4 py-3 text-right">Thời lượng slot</th>
                  <th class="px-4 py-3 text-right">Số slot</th>
                  <th class="px-4 py-3">Trạng thái</th>
                  <th class="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in paginatedRows" :key="String(row.id)" :class="scheduleTableRowClass(row)">
                  <td class="px-4 py-4 font-semibold text-slate-500">#{{ row.id }}</td>
                  <td class="px-4 py-4">
                    <div class="flex flex-col gap-2">
                      <span class="font-black text-slate-950">{{ row.doctorName }}</span>
                      <span v-if="row.hasConflict" class="inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">Trùng ca</span>
                    </div>
                  </td>
                  <td class="px-4 py-4 font-semibold text-slate-600">{{ row.specialtyName }}</td>
                  <td class="px-4 py-4 font-semibold text-slate-700">{{ row.workDate }}</td>
                  <td class="px-4 py-4 font-semibold text-slate-600">{{ row.weekdayLabel }}</td>
                  <td class="px-4 py-4 font-black text-slate-900">{{ row.timeRange }}</td>
                  <td class="px-4 py-4 text-right font-semibold text-slate-700">{{ row.duration }}</td>
                  <td class="px-4 py-4 text-right font-black text-slate-900">{{ row.slotCountLabel }}</td>
                  <td class="px-4 py-4">
                    <span :class="['inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black', statusClass(row.status)]">{{ row.status }}</span>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <div class="flex flex-wrap items-center justify-end gap-2">
                      <button
                        v-for="action in actions(row)"
                        :key="action.key"
                        type="button"
                        :disabled="actingId === row.id || action.key === 'noop'"
                        :class="['inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60', action.className]"
                        @click.stop="runAction(action.key, row)"
                      >
                        {{ action.label }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2 text-sm text-slate-500">
                <span>Hiển thị</span>
                <select v-model="itemsPerPage" class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100">
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
                <span>bản ghi mỗi trang</span>
              </div>

              <div class="text-sm font-medium text-slate-500">
                Hiển thị {{ Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredRows.length, currentPage * itemsPerPage) }} trên {{ filteredRows.length }} kết quả
              </div>

              <div v-if="totalPages > 1" class="flex items-center gap-1.5">
                <button type="button" :disabled="currentPage === 1" class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500" @click="currentPage--">
                  <ChevronLeft class="h-4 w-4" />
                </button>
                <button
                  v-for="page in totalPages"
                  :key="page"
                  type="button"
                  :class="[
                    'h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition',
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800',
                  ]"
                  @click="currentPage = page"
                >
                  {{ page }}
                </button>
                <button type="button" :disabled="currentPage === totalPages" class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500" @click="currentPage++">
                  <ChevronRight class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="px-4 py-14 text-center">
            <CalendarX class="mx-auto h-11 w-11 text-slate-300" />
            <h2 class="mt-4 text-lg font-black text-slate-950">Chưa có lịch trong khoảng này</h2>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div class="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="query"
            class="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            :placeholder="key === 'medicines' ? 'Nhập tên thuốc...' : 'Tìm kiếm'"
          />
        </label>
        <select
          v-if="key === 'medicines'"
          v-model="medicineTypeFilter"
          class="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
        >
          <option value="">Tất cả chuyên khoa</option>
          <option v-for="option in medicineTypeOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
        </select>
        <span class="inline-flex h-12 items-center justify-center rounded-xl bg-teal-50 px-4 text-sm font-bold text-teal-700">{{ filteredRows.length }} dòng</span>
      </div>
      <div v-if="filteredRows.length" class="overflow-x-auto">
        <table :class="['min-w-full divide-y divide-slate-100 text-sm', key === 'medicines' ? 'min-w-[1420px] table-fixed' : '']">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th v-for="col in config.columns" :key="col.key" :class="columnHeaderClass(col)">{{ col.label }}</th>
              <th v-if="hasActions" :class="actionHeaderClass">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="row in paginatedRows"
              :key="String(row.id)"
              :class="['hover:bg-slate-50', key === 'appointments' ? 'cursor-pointer' : '']"
              @click="openAppointmentDetails(row)"
            >
              <td v-for="col in config.columns" :key="col.key" :class="columnCellClass(col)">
                <span v-if="col.badge" :class="['inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(row[col.key])]">{{ value(row[col.key]) }}</span>
                <span v-else :class="[col.strong ? 'font-semibold text-slate-950' : 'text-slate-700', compactTextClass(col)]">{{ value(row[col.key]) }}</span>
              </td>
              <td v-if="hasActions" :class="actionCellClass">
                <div class="flex items-center justify-end gap-2 whitespace-nowrap">
                  <button
                    v-for="action in actions(row)"
                    :key="action.key"
                    type="button"
                    :disabled="actingId === row.id || action.key === 'noop'"
                    :class="['inline-flex h-9 min-w-14 items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition disabled:opacity-100', action.className]"
                    @click.stop="runAction(action.key, row)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <span>Hiển thị</span>
            <select
              v-model="itemsPerPage"
              class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span>bản ghi mỗi trang</span>
          </div>

          <div class="text-sm font-medium text-slate-500">
            Hiển thị {{ Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredRows.length, currentPage * itemsPerPage) }} trên {{ filteredRows.length }} kết quả
          </div>

          <div v-if="totalPages > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
              @click="currentPage--"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              :class="[
                'h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition',
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800',
              ]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
              @click="currentPage++"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="p-10 text-center">
        <SearchX class="mx-auto h-10 w-10 text-slate-400" />
        <h2 class="mt-4 text-lg font-semibold text-slate-950">Chưa có dữ liệu</h2>
        <p class="mt-2 text-sm text-slate-500">Service có thể chưa có dữ liệu hoặc endpoint chưa sẵn sàng.</p>
      </div>
    </div>

    <div v-if="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p class="text-sm font-bold uppercase tracking-wide text-teal-700">{{ config.service }}</p>
            <h2 class="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{{ formTitle }}</h2>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100" @click="closeForm">
            <X class="h-5 w-5" />
          </button>
        </div>

        <form v-if="key === 'schedules' && scheduleFormMode === 'single'" class="mt-6 space-y-6" @submit.prevent="submitForm">
          <div v-if="formError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{{ formError }}</div>

          <div>
            <p class="mb-2 text-sm font-bold text-slate-700">Preset ca</p>
            <div class="grid gap-2 sm:grid-cols-4">
              <button
                v-for="preset in schedulePresets"
                :key="preset.key"
                type="button"
                :class="schedulePresetButtonClass(preset.key, schedulePreset)"
                @click="applySchedulePreset(preset.key)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BaseSelect v-model="form.doctorId" label="Bác sĩ" :options="doctorOptions" placeholder="Chọn bác sĩ" required />
            <BaseInput v-model="form.workDate" label="Ngày làm" type="date" required />
            <BaseInput v-model="form.startTime" label="Giờ bắt đầu" type="time" required />
            <BaseInput v-model="form.endTime" label="Giờ kết thúc" type="time" required />
            <BaseInput v-model="form.slotDurationMinutes" label="Phút/slot" type="number" required min="5" />
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Trạng thái</span>
              <span class="grid grid-cols-2 gap-2">
                <button type="button" :class="scheduleAvailabilityButtonClass(true, form.isAvailable !== 'false')" @click="form.isAvailable = 'true'">
                  <CheckCircle2 class="h-4 w-4" />
                  Đang mở
                </button>
                <button type="button" :class="scheduleAvailabilityButtonClass(false, form.isAvailable === 'false')" @click="form.isAvailable = 'false'">
                  <Ban class="h-4 w-4" />
                  Tạm ngưng
                </button>
              </span>
            </label>
          </div>

          <div v-if="scheduleFormConflicts.length" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div class="flex gap-3">
              <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p class="text-sm font-black text-amber-900">Có thể trùng ca</p>
                <p class="mt-1 text-sm font-semibold text-amber-800">
                  {{ scheduleFormConflicts.length }} lịch cùng bác sĩ/ngày đang giao nhau.
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">Lưu</BaseButton>
          </div>
        </form>

        <form v-else-if="key === 'schedules' && scheduleFormMode === 'bulk'" class="mt-6 space-y-6" @submit.prevent="submitBulkSchedules">
          <div v-if="formError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{{ formError }}</div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BaseSelect v-model="bulkScheduleForm.doctorId" label="Bác sĩ" :options="doctorOptions" placeholder="Chọn bác sĩ" required />
            <BaseInput v-model="bulkScheduleForm.rangeStart" label="Từ ngày" type="date" required />
            <BaseInput v-model="bulkScheduleForm.rangeEnd" label="Đến ngày" type="date" required />
          </div>

          <div>
            <p class="mb-2 text-sm font-bold text-slate-700">Các thứ trong tuần</p>
            <div class="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <button
                v-for="day in weekdayOptions"
                :key="day.value"
                type="button"
                :class="bulkWeekdayButtonClass(day.value)"
                @click="toggleBulkWeekday(day.value)"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <div>
            <p class="mb-2 text-sm font-bold text-slate-700">Preset ca</p>
            <div class="grid gap-2 sm:grid-cols-4">
              <button
                v-for="preset in schedulePresets"
                :key="`bulk-${preset.key}`"
                type="button"
                :class="schedulePresetButtonClass(preset.key, bulkSchedulePreset)"
                @click="applyBulkSchedulePreset(preset.key)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BaseInput v-model="bulkScheduleForm.startTime" label="Giờ bắt đầu" type="time" required />
            <BaseInput v-model="bulkScheduleForm.endTime" label="Giờ kết thúc" type="time" required />
            <BaseInput v-model="bulkScheduleForm.slotDurationMinutes" label="Phút/slot" type="number" required min="5" />
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Trạng thái</span>
              <span class="grid grid-cols-2 gap-2">
                <button type="button" :class="scheduleAvailabilityButtonClass(true, bulkScheduleForm.isAvailable !== 'false')" @click="bulkScheduleForm.isAvailable = 'true'">
                  <CheckCircle2 class="h-4 w-4" />
                  Đang mở
                </button>
                <button type="button" :class="scheduleAvailabilityButtonClass(false, bulkScheduleForm.isAvailable === 'false')" @click="bulkScheduleForm.isAvailable = 'false'">
                  <Ban class="h-4 w-4" />
                  Tạm ngưng
                </button>
              </span>
            </label>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm font-black text-slate-950">Sẽ tạo {{ bulkSchedulePreview.length }} lịch làm việc</p>
                <p v-if="bulkConflictCount" class="mt-1 text-sm font-bold text-amber-700">{{ bulkConflictCount }} lịch có thể trùng ca</p>
              </div>
              <span class="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{{ selectedBulkDoctorName }}</span>
            </div>
            <div v-if="bulkSchedulePreview.length" class="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
              <div v-for="item in bulkSchedulePreview.slice(0, 10)" :key="item.key" class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span class="text-sm font-bold text-slate-800">{{ item.weekdayLabel }} · {{ item.workDateLabel }} · {{ item.timeRange }}</span>
                <span v-if="item.hasConflict" class="inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">Trùng ca</span>
              </div>
              <p v-if="bulkSchedulePreview.length > 10" class="px-1 text-sm font-semibold text-slate-500">+{{ bulkSchedulePreview.length - 10 }} lịch khác</p>
            </div>
            <p v-else class="mt-4 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-400">Chưa có lịch trong khoảng này</p>
          </div>

          <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving" :disabled="!bulkSchedulePreview.length">Tạo lịch</BaseButton>
          </div>
        </form>

        <form v-else class="mt-6 space-y-6" @submit.prevent="submitForm">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <template v-for="field in fields" :key="field.key">
              <BaseSelect v-if="field.type === 'select'" v-model="form[field.key]" :label="field.label" :options="field.options || []" :placeholder="field.placeholder || 'Chọn'" :required="field.required" />
              <div v-else-if="field.type === 'textarea'" class="col-span-1 sm:col-span-2 lg:col-span-3 block">
                <label class="block">
                  <span class="mb-2 block text-sm font-medium text-slate-700">
                    {{ field.label }} <span v-if="field.required" class="text-rose-600" aria-hidden="true">*</span>
                  </span>
                  <textarea
                    v-model="form[field.key]"
                    rows="3"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100"
                    :placeholder="field.placeholder || 'Nhập...'"
                    :required="field.required"
                  ></textarea>
                </label>
              </div>
              <BaseInput v-else v-model="form[field.key]" :label="field.label" :type="field.type || 'text'" :required="field.required" :min="field.type === 'number' ? 0 : undefined" />
            </template>
          </div>
          <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">Lưu</BaseButton>
          </div>
        </form>
      </div>
    </div>

    <div v-if="appointmentDetailOpen && selectedAppointment" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p class="text-sm font-bold uppercase tracking-wide text-teal-700">Chi tiết lịch hẹn</p>
            <h2 class="mt-2 text-2xl font-bold text-slate-950">{{ selectedAppointment.patientName || 'Chưa cập nhật' }}</h2>
            <p class="mt-2 text-sm text-slate-500">Mã lịch hẹn #{{ selectedAppointment.id || '-' }}</p>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="closeAppointmentDetails">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-5 px-6 py-5">
          <div class="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Bệnh nhân" :value="selectedAppointment.patientName" />
            <DetailItem label="Số điện thoại" :value="selectedAppointment.patientPhone" />
            <DetailItem label="Mã bệnh nhân" :value="selectedAppointment.patientId" />
            <DetailItem label="Trạng thái" :value="selectedAppointment.status" badge />
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Lý do khám</p>
            <p class="mt-2 text-sm font-semibold leading-6 text-slate-800">{{ selectedAppointment.reason || 'Chưa ghi lý do khám' }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Bác sĩ" :value="selectedAppointment.doctorName" />
            <DetailItem label="Chuyên khoa" :value="selectedAppointment.specialtyName" />
            <DetailItem label="Mã bác sĩ" :value="selectedAppointment.doctorId" />
            <DetailItem label="Phí khám" :value="selectedAppointment.examFeeLabel" />
            <DetailItem label="Ngày khám" :value="selectedAppointment.appointmentDateLabel" />
            <DetailItem label="Giờ khám" :value="selectedAppointment.slotTime" />
            <DetailItem label="Số thứ tự" :value="selectedAppointment.queueNumber" />
            <DetailItem label="Check-in lúc" :value="selectedAppointment.checkedInAtLabel" />
          </div>
        </div>

        <div class="border-t border-slate-100 px-6 py-5">
          <p v-if="!canDeleteSelectedAppointment" class="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Chỉ xóa được lịch chưa xác nhận, đã hủy hoặc đã khám xong. Lịch đã xác nhận nhưng chưa check-in không thể xóa.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <BaseButton type="button" variant="outline" @click="closeAppointmentDetails">Đóng</BaseButton>
            <button
              type="button"
              :disabled="saving || !canDeleteSelectedAppointment"
              class="inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              @click="deleteSelectedAppointment"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CalendarX,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileHeart,
  Pill,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Settings,
  Stethoscope,
  Table2,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { authApi } from '@/services/authApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { medicineApi } from '@/services/medicineApi'
import type { MedicinePayload } from '@/services/medicineApi'
import { getApiErrorMessage } from '@/services/apiClient'
import { fallbackAppointments, fallbackDoctors, fallbackSpecialties } from '@/services/fallbackData'
import { useAuthStore } from '@/stores/authStore'
import { RoleId } from '@/types/user'
import type { Appointment } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { Doctor, DoctorSchedule } from '@/types/doctor'
import type { Patient, MedicalRecord } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import type { Specialty } from '@/types/specialty'
import type { User } from '@/types/user'
import { displayText } from '@/utils/displayText'

type Key = 'doctors' | 'specialties' | 'schedules' | 'patients' | 'appointments' | 'medicines' | 'prescriptions' | 'bills' | 'accounts' | 'nurses' | 'reports'
type Row = Record<string, any>
type Action = 'edit' | 'delete' | 'confirm' | 'checkin' | 'start' | 'cancel' | 'complete' | 'pay' | 'noop' | 'toggle'
type ScheduleTab = 'week' | 'table'
type ScheduleQuickRange = 'today' | 'week' | 'month' | 'clear'
type SchedulePresetKey = 'custom' | 'morning' | 'afternoon' | 'evening'
type ScheduleTone = 'blue' | 'teal' | 'slate' | 'amber' | 'rose'

interface Column { key: string; label: string; right?: boolean; badge?: boolean; strong?: boolean }
interface Config { title: string; service: string; description: string; endpoint: string; icon: Component; columns: Column[] }
interface Field { key: string; label: string; type?: string; required?: boolean; placeholder?: string; options?: SelectOption[] }
interface SchedulePreset { key: SchedulePresetKey; label: string; startTime?: string; endTime?: string }

const adminKeys: Key[] = ['doctors', 'specialties', 'schedules', 'patients', 'appointments', 'medicines', 'prescriptions', 'bills', 'accounts', 'nurses', 'reports']
const route = useRoute()
const authStore = useAuthStore()
const key = computed<Key>(() => adminKeys.includes(route.meta.adminResource as Key) ? route.meta.adminResource as Key : 'doctors')
const config = computed(() => configs[key.value] || configs.doctors)

const hiddenAppointmentsStorageKey = 'admin.hiddenAppointmentIds'
const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const note = ref('')
const query = ref('')
const actingId = ref<string | number | null>(null)
const formOpen = ref(false)
const editingRow = ref<Row | null>(null)
const form = reactive<Record<string, string>>({})
const formError = ref('')
const medicineTypeFilter = ref('')
const appointmentDetailOpen = ref(false)
const selectedAppointmentRow = ref<Row | null>(null)
const hiddenAppointmentIds = ref<Set<string>>(readHiddenAppointmentIds())

const scheduleTab = ref<ScheduleTab>('week')
const scheduleWeekStart = ref(startOfWeek(new Date()))
const scheduleDoctorFilter = ref('')
const scheduleSpecialtyFilter = ref('')
const scheduleStatusFilter = ref('')
const scheduleDateFrom = ref('')
const scheduleDateTo = ref('')
const scheduleFormMode = ref<'single' | 'bulk'>('single')
const schedulePreset = ref<SchedulePresetKey>('custom')
const bulkSchedulePreset = ref<SchedulePresetKey>('morning')
const bulkScheduleForm = reactive<Record<string, string>>({
  doctorId: '',
  rangeStart: localDateIso(startOfWeek(new Date())),
  rangeEnd: localDateIso(addDaysFrom(startOfWeek(new Date()), 6)),
  startTime: '08:00',
  endTime: '11:00',
  slotDurationMinutes: '30',
  isAvailable: 'true',
})
const bulkWeekdays = ref<number[]>([1, 2, 3, 4, 5])

const fallbackSchedules: DoctorSchedule[] = fallbackDoctors.map((doctor, index) => ({ scheduleId: 900 + index, doctorId: doctor.doctorId, doctorName: doctor.doctorName, workDate: addDays(index).toISOString().slice(0, 10), startTime: index % 2 === 0 ? '08:00' : '13:00', endTime: index % 2 === 0 ? '16:00' : '17:00', slotDurationMinutes: 30, isAvailable: true }))
const fallbackPatients: Patient[] = [{ patientId: 'BN001', fullName: 'Nguyễn Minh An', phone: '0901001001', gender: 'Male', medicalHistory: 'Tăng huyết áp' }]
const fallbackRecords: MedicalRecord[] = [{ recordId: 'MR001', patientId: 'BN001', diagnosis: 'Theo dõi tim mạch', doctorNotes: 'Tái khám sau 7 ngày', createdAt: new Date().toISOString() }]
const fallbackMedicines: Medicine[] = [{ medicineId: 1, medicineName: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', medicineType: 'Nội tổng quát', unit: 'Viên', price: 1500, stockQuantity: 200, minStockLevel: 20, expiryDate: addDays(365).toISOString(), status: 'Active', createdAt: new Date().toISOString() }]
const fallbackInvoices: Invoice[] = [{ invoiceId: 1001, appointmentId: 2201, patientId: 12, amount: 300000, status: 'Unpaid', createdAt: new Date().toISOString() }]
const fallbackAccounts: User[] = [{ id: 'u-admin', username: 'admin', fullName: 'Quản trị viên Hệ thống', email: 'admin@cliniccare.vn', phoneNumber: 'Chưa cập nhật', roleId: 1, roleName: 'Admin', createdAt: new Date().toISOString() }]
const doctorCatalog = ref<Doctor[]>(fallbackDoctors)
const specialtyCatalog = ref<Specialty[]>(fallbackSpecialties)
const specialtyOptions = ref<SelectOption[]>(fallbackSpecialties.map((s) => ({ label: s.specialtyName, value: s.specialtyId })))
const doctorOptions = ref<SelectOption[]>(fallbackDoctors.map((d) => ({ label: d.doctorName, value: d.doctorId })))

const configs: Record<Key, Config> = {
  doctors: cfg('Quản lý bác sĩ', 'N1 Appointment', 'Thêm, sửa, xóa bác sĩ thuộc Appointment Service.', 'GET/POST/PUT/DELETE /api/doctors', Stethoscope, cols(['id','ID'], ['name','Bác sĩ', false, false, true], ['specialty','Chuyên khoa'], ['degree','Học vị'], ['fee','Phí khám', true], ['phone','SĐT'], ['email','Email'], ['roomNumber','Phòng'], ['status','Trạng thái', false, true])),
  specialties: cfg('Quản lý chuyên khoa', 'N1 Appointment', 'Thêm, sửa, xóa chuyên khoa.', 'GET/POST/PUT/DELETE /api/specialties', Settings, cols(['id','ID'], ['name','Chuyên khoa', false, false, true], ['status','Trạng thái', false, true])),
  schedules: cfg('Lịch làm việc', 'N1 Appointment', 'Điều phối ca làm, slot khám và trạng thái nhận lịch của bác sĩ.', 'GET/POST/PUT/DELETE /api/doctor-schedules', CalendarDays, cols(['id','Mã'], ['doctorName','Bác sĩ', false, false, true], ['specialtyName','Chuyên khoa'], ['workDate','Ngày'], ['weekdayLabel','Thứ'], ['timeRange','Ca'], ['duration','Thời lượng slot', true], ['slotCountLabel','Số slot', true], ['status','Trạng thái', false, true])),
  patients: cfg('Quản lý bệnh nhân', 'N2 Medical Record', 'Thêm, sửa, xóa thật hồ sơ bệnh nhân.', 'GET/POST/PUT/DELETE /api/patients', UserRound, cols(['patientCode','Mã BN'], ['name','Bệnh nhân', false, false, true], ['phone','SĐT'], ['gender','Giới tính'], ['history','Tiền sử'])),
  appointments: cfg('Quản lý lịch hẹn', 'N1 Appointment', 'Xác nhận, hủy và hoàn tất lịch hẹn. Hóa đơn được N3 tạo sau event prescription.created.', 'GET /api/appointments', ClipboardList, cols(['id','Mã'], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['dateTime','Ngày giờ'], ['status','Trạng thái', false, true])),
  medicines: cfg('Kho thuốc', 'N3 Pharmacy', 'Tìm kiếm nhanh theo ký tự đầu, lọc theo chuyên khoa/nhóm thuốc, thêm sửa xóa thuốc và tồn kho.', 'GET/POST/PUT/DELETE /api/medicines', Pill, cols(['id','ID'], ['name','Tên thuốc', false, false, true], ['activeIngredient','Hoạt chất'], ['medicineType','Chuyên khoa'], ['unit','Đơn vị'], ['price','Đơn giá', true], ['stock','Tồn', true], ['minStockLevel','Cảnh báo', true], ['expiryDate','Hạn dùng'], ['stockStatus','Trạng thái', false, true])),
  prescriptions: cfg('Đơn thuốc', 'N2 Medical Record', 'Theo dõi ghi chú kê đơn từ bệnh án.', 'GET /api/medical-records', FileHeart, cols(['id','Mã BA'], ['patientId','Bệnh nhân', false, false, true], ['diagnosis','Chẩn đoán'], ['doctorNotes','Ghi chú'], ['status','Trạng thái', false, true])),
  bills: cfg('Hóa đơn viện phí', 'N3 Billing', 'Theo dõi và thu tiền hóa đơn.', 'GET /api/billing/invoices', CreditCard, cols(['id','Mã HĐ'], ['patientId','Bệnh nhân'], ['appointmentId','Lịch hẹn'], ['amount','Số tiền', true], ['status','Trạng thái', false, true])),
  accounts: cfg('Tài khoản hệ thống', 'N3 Auth', 'Thêm, sửa, xóa tài khoản người dùng.', 'GET/POST/PUT/DELETE /api/auth/users', UserCog, cols(['id','ID'], ['fullName','Họ tên', false, false, true], ['username','Username'], ['email','Email'], ['phoneNumber','SĐT'], ['roleName','Vai trò', false, true], ['status','Trạng thái', false, true])),
  nurses: cfg('Quản lý y tá', 'N3 Auth', 'Thêm, sửa, xóa tài khoản y tá.', 'GET /api/auth/users/nurses · POST/PUT/DELETE /api/auth/users', Users, cols(['id','ID'], ['fullName','Họ tên', false, false, true], ['username','Username'], ['email','Email'], ['phoneNumber','SĐT'], ['roleName','Vai trò', false, true], ['status','Trạng thái', false, true])),
  reports: cfg('Báo cáo vận hành', 'N1 + N2 + N3', 'Tổng hợp dữ liệu vận hành từ các service.', 'N1/N2/N3 health data', ClipboardList, cols(['metric','Chỉ số', false, false, true], ['value','Giá trị', true], ['source','Nguồn'], ['status','Trạng thái', false, true])),
}

const schedulePresets: SchedulePreset[] = [
  { key: 'custom', label: 'Tùy chỉnh' },
  { key: 'morning', label: 'Ca sáng', startTime: '08:00', endTime: '11:00' },
  { key: 'afternoon', label: 'Ca chiều', startTime: '13:00', endTime: '17:00' },
  { key: 'evening', label: 'Ca tối', startTime: '18:00', endTime: '21:00' },
]
const weekdayOptions = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 7, label: 'CN' },
]
const scheduleQuickButtons: Array<{ value: ScheduleQuickRange; label: string }> = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'clear', label: 'Xóa lọc' },
]
const commonMedicineTypes = ['Nội tổng quát', 'Tim mạch', 'Hô hấp', 'Tiêu hóa', 'Nhi khoa', 'Da liễu', 'Cơ xương khớp', 'Thần kinh', 'Sản phụ khoa', 'Mắt', 'Tai mũi họng', 'Khác']

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const selectedMedicineType = medicineTypeFilter.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    if (key.value === 'medicines') {
      const nameMatches = !q || String(row.name || '').toLowerCase().startsWith(q)
      const typeMatches = !selectedMedicineType || String(row.medicineType || '').toLowerCase() === selectedMedicineType
      return nameMatches && typeMatches
    }
    if (key.value === 'schedules') return matchesScheduleFilters(row, q)
    if (!q) return true
    return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
  })
})

const currentPage = ref(1)
const itemsPerPage = ref(10)

watch([key, query, medicineTypeFilter, scheduleDoctorFilter, scheduleSpecialtyFilter, scheduleStatusFilter, scheduleDateFrom, scheduleDateTo], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredRows.value.length / itemsPerPage.value))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRows.value.slice(start, end)
})
const canCreate = computed(() => ['doctors', 'specialties', 'schedules', 'patients', 'medicines', 'accounts', 'nurses'].includes(key.value))
const hasActions = computed(() => ['doctors', 'specialties', 'schedules', 'patients', 'appointments', 'medicines', 'bills', 'accounts', 'nurses'].includes(key.value))
const canDeleteResource = computed(() => authStore.isAdmin)
const fields = computed(() => buildFields(key.value))
const selectedAppointment = computed(() => selectedAppointmentRow.value ? appointmentDetails(selectedAppointmentRow.value) : null)
const canDeleteSelectedAppointment = computed(() => selectedAppointmentRow.value ? canDeleteAppointment(selectedAppointmentRow.value) : false)
const formTitle = computed(() => {
  if (key.value === 'schedules') {
    if (scheduleFormMode.value === 'bulk') return 'Tạo lịch hàng loạt'
    return editingRow.value ? 'Cập nhật lịch làm việc' : 'Thêm lịch làm việc'
  }
  return `${editingRow.value ? 'Cập nhật' : 'Thêm mới'} ${config.value.title.toLowerCase()}`
})

const medicineTypeOptions = computed<SelectOption[]>(() => {
  const values = new Set<string>()
  rows.value.forEach((row) => {
    const type = String(row.medicineType || '').trim()
    if (type) values.add(type)
  })
  commonMedicineTypes.forEach((type) => values.add(type))
  return Array.from(values).sort((a, b) => a.localeCompare(b, 'vi')).map((type) => ({ label: type, value: type }))
})

const scheduleStats = computed(() => {
  const visible = filteredRows.value
  const doctorIds = new Set(visible.map((row) => String(row.doctorId || '')).filter(Boolean))
  const slotTotal = visible.reduce((sum, row) => sum + Number(row.slotCount || 0), 0)
  return [
    { label: 'Lịch hiển thị', value: visible.length, icon: CalendarDays, tone: 'blue' as ScheduleTone },
    { label: 'Bác sĩ có lịch', value: doctorIds.size, icon: Users, tone: 'teal' as ScheduleTone },
    { label: 'Slot ước tính', value: slotTotal, icon: CalendarRange, tone: 'slate' as ScheduleTone },
    { label: 'Trùng ca', value: visible.filter((row) => row.hasConflict).length, icon: AlertTriangle, tone: 'amber' as ScheduleTone },
    { label: 'Tạm ngưng', value: visible.filter((row) => row.isAvailable === false).length, icon: Ban, tone: 'rose' as ScheduleTone },
  ]
})

const weeklyDays = computed(() => {
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateValue = addDaysFrom(scheduleWeekStart.value, index)
    const iso = localDateIso(dateValue)
    const items = filteredRows.value
      .filter((row) => row.workDateRaw === iso)
      .slice()
      .sort((a, b) => Number(a.startMinutes || 0) - Number(b.startMinutes || 0))
    return {
      key: iso,
      iso,
      label: weekdayLabel(iso),
      shortDate: formatShortDate(iso),
      isToday: iso === localDateIso(new Date()),
      items,
    }
  })
  return days
})

const weeklyScheduleCount = computed(() => weeklyDays.value.reduce((sum, day) => sum + day.items.length, 0))
const weekRangeLabel = computed(() => {
  const start = localDateIso(scheduleWeekStart.value)
  const end = localDateIso(addDaysFrom(scheduleWeekStart.value, 6))
  return `${formatShortDate(start)} - ${formatShortDate(end)}`
})

const scheduleFormConflicts = computed(() => {
  if (key.value !== 'schedules' || scheduleFormMode.value !== 'single') return []
  const candidate = scheduleCandidateFromForm()
  if (!candidate) return []
  return rows.value.filter((row) => scheduleOverlaps(candidate, row))
})

const bulkSchedulePreview = computed(() => buildBulkSchedulePreview())
const bulkConflictCount = computed(() => bulkSchedulePreview.value.filter((item) => item.hasConflict).length)
const selectedBulkDoctorName = computed(() => {
  const option = doctorOptions.value.find((item) => String(item.value) === String(bulkScheduleForm.doctorId))
  return option?.label || 'Chưa chọn bác sĩ'
})

watch(key, () => {
  query.value = ''
  medicineTypeFilter.value = ''
  clearScheduleFilters(false)
  closeForm()
  void loadData()
}, { immediate: true })

watch(() => `${form.startTime || ''}-${form.endTime || ''}`, () => {
  if (key.value === 'schedules' && scheduleFormMode.value === 'single') schedulePreset.value = matchedSchedulePreset(form.startTime, form.endTime)
})

watch(() => `${bulkScheduleForm.startTime || ''}-${bulkScheduleForm.endTime || ''}`, () => {
  if (scheduleFormMode.value === 'bulk') bulkSchedulePreset.value = matchedSchedulePreset(bulkScheduleForm.startTime, bulkScheduleForm.endTime)
})

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  try {
    if (key.value === 'doctors') {
      const [doctors, specialties] = await Promise.all([
        appointmentApi.getDoctors(),
        appointmentApi.getSpecialties().catch(() => {
          note.value = 'Không tải được danh sách chuyên khoa; đang dùng dữ liệu mẫu cho bộ chọn.'
          return fallbackSpecialties
        }),
      ])
      updateSpecialtyCatalog(specialties)
      updateDoctorCatalog(doctors)
      rows.value = mapList(doctors, fallbackDoctors, mapDoctor)
    } else if (key.value === 'specialties') {
      const specialties = await appointmentApi.getSpecialties()
      updateSpecialtyCatalog(specialties)
      rows.value = mapList(specialties, fallbackSpecialties, mapSpecialty)
    } else if (key.value === 'schedules') {
      await loadScheduleData()
    } else if (key.value === 'patients') {
      rows.value = mapList(await medicalRecordApi.getPatients(), fallbackPatients, mapPatient)
    } else if (key.value === 'appointments') {
      rows.value = visibleAppointmentRows(mapList(await appointmentApi.getAppointments(), fallbackAppointments, mapAppointment))
    } else if (key.value === 'medicines') {
      rows.value = mapList(await medicineApi.getMedicines({ pageSize: 200 }), fallbackMedicines, mapMedicine)
    } else if (key.value === 'prescriptions') {
      const remoteRows = (await medicalRecordApi.getMedicalRecords().catch(() => [])).map(mapPrescription)
      rows.value = uniqueRows(remoteRows)
      if (!rows.value.length) {
        note.value = 'API chưa có dữ liệu đơn thuốc; đang hiển thị dữ liệu mẫu an toàn.'
        rows.value = fallbackRecords.map(mapPrescription)
      }
    } else if (key.value === 'bills') {
      const remoteRows = (await billingApi.getInvoices().catch(() => [])).map(mapInvoice)
      rows.value = uniqueRows(remoteRows)
      if (!rows.value.length) {
        note.value = 'API chưa có dữ liệu hóa đơn; đang hiển thị dữ liệu mẫu an toàn.'
        rows.value = fallbackInvoices.map(mapInvoice)
      }
    } else if (key.value === 'accounts') {
      rows.value = mapList(await authApi.getUsers(), fallbackAccounts, mapUser)
    } else if (key.value === 'nurses') {
      rows.value = mapList(await authApi.getNurses(), fallbackAccounts.filter((user) => user.roleId === RoleId.Receptionist), mapUser)
    } else if (key.value === 'reports') {
      rows.value = await loadReports()
    }
  } catch (e) {
    error.value = getApiErrorMessage(e)
    rows.value = key.value === 'schedules' ? [] : fallbackRows(key.value)
  } finally {
    loading.value = false
  }
}

async function loadScheduleData() {
  const [scheduleResult, doctorResult, specialtyResult] = await Promise.allSettled([
    appointmentApi.getDoctorSchedules(),
    appointmentApi.getDoctors(),
    appointmentApi.getSpecialties(),
  ])

  const warnings: string[] = []
  if (doctorResult.status === 'fulfilled') updateDoctorCatalog(doctorResult.value)
  else {
    updateDoctorCatalog(fallbackDoctors)
    warnings.push('Không tải được danh sách bác sĩ; đang dùng dữ liệu mẫu cho bộ chọn.')
  }

  if (specialtyResult.status === 'fulfilled') updateSpecialtyCatalog(specialtyResult.value)
  else {
    updateSpecialtyCatalog(fallbackSpecialties)
    warnings.push('Không tải được danh sách chuyên khoa; đang dùng dữ liệu mẫu cho bộ lọc.')
  }

  if (scheduleResult.status === 'rejected') throw scheduleResult.reason
  rows.value = withScheduleConflicts(scheduleResult.value.map(mapSchedule))
  if (warnings.length) note.value = warnings.join(' ')
}

function mapList<T>(data: T[], fallback: T[], mapper: (item: T) => Row) {
  if (data.length) return data.map(mapper)
  if (fallback.length) note.value = 'API chưa có dữ liệu; đang hiển thị dữ liệu mẫu an toàn.'
  return (data.length ? data : fallback).map(mapper)
}
function fallbackRows(k: Key) {
  return ({
    doctors: fallbackDoctors.map(mapDoctor),
    specialties: fallbackSpecialties.map(mapSpecialty),
    schedules: withScheduleConflicts(fallbackSchedules.map(mapSchedule)),
    patients: fallbackPatients.map(mapPatient),
    appointments: visibleAppointmentRows(fallbackAppointments.map(mapAppointment)),
    medicines: fallbackMedicines.map(mapMedicine),
    prescriptions: fallbackRecords.map(mapPrescription),
    bills: fallbackInvoices.map(mapInvoice),
    accounts: fallbackAccounts.map(mapUser),
    nurses: fallbackAccounts.filter((user) => user.roleId === RoleId.Receptionist).map(mapUser),
    reports: [],
  } as Record<Key, Row[]>)[k]
}
async function loadReports() { const [doctors, appointments, patients, invoices] = await Promise.all([appointmentApi.getDoctors().catch(() => fallbackDoctors), appointmentApi.getAppointments().catch(() => fallbackAppointments), medicalRecordApi.getPatients().catch(() => fallbackPatients), billingApi.getInvoices().catch(() => fallbackInvoices)]); return [{ id: 'R1', metric: 'Bác sĩ', value: doctors.length, source: 'N1', status: 'OK' }, { id: 'R2', metric: 'Lịch hẹn', value: appointments.length, source: 'N1', status: 'OK' }, { id: 'R3', metric: 'Bệnh nhân', value: patients.length, source: 'N2', status: 'OK' }, { id: 'R4', metric: 'Hóa đơn', value: invoices.length, source: 'N3', status: 'OK' }] }

function updateDoctorCatalog(doctors: Doctor[]) {
  doctorCatalog.value = doctors
  doctorOptions.value = doctors.map((d) => ({ label: d.doctorName || d.fullName || `Bác sĩ #${d.doctorId}`, value: d.doctorId }))
}
function updateSpecialtyCatalog(specialties: Specialty[]) {
  specialtyCatalog.value = specialties
  specialtyOptions.value = specialties.map((s) => ({ label: s.specialtyName, value: s.specialtyId }))
}

function buildFields(k: Key): Field[] {
  if (k === 'doctors') return [
    field('doctorName','Tên bác sĩ','text',true),
    field('specialtyId','Chuyên khoa','select',true, specialtyOptions.value),
    field('degree','Học vị'),
    field('experienceYears','Số năm kinh nghiệm','number'),
    field('gender','Giới tính','select',false,[{label:'Nam',value:'Nam'},{label:'Nữ',value:'Nữ'},{label:'Khác',value:'Khác'}]),
    field('dateOfBirth','Ngày sinh','date'),
    field('examFee','Phí khám','number',true),
    field('phone','Số điện thoại'),
    field('email','Email','email'),
    field('roomNumber','Phòng khám'),
    field('avatarUrl','Ảnh đại diện (URL)'),
    field('isActive','Trạng thái hoạt động','select',true,[{label:'Đang hoạt động',value:'true'},{label:'Tạm ngưng',value:'false'}]),
    field('description','Mô tả','textarea'),
  ]
  if (k === 'specialties') return [field('specialtyName','Tên chuyên khoa','text',true)]
  if (k === 'schedules') return [field('doctorId','Bác sĩ','select',true, doctorOptions.value), field('workDate','Ngày làm','date',true), field('startTime','Giờ bắt đầu','time',true), field('endTime','Giờ kết thúc','time',true), field('slotDurationMinutes','Phút/slot','number', true), field('isAvailable','Trạng thái','select',true,[{label:'Đang mở',value:'true'},{label:'Tạm ngưng',value:'false'}])]
  if (k === 'patients') return [field('fullName','Họ tên','text',true), field('phone','Số điện thoại','text',true), field('gender','Giới tính','select',false,[{label:'Nam',value:'Male'},{label:'Nữ',value:'Female'}]), field('medicalHistory','Tiền sử bệnh')]
  if (k === 'medicines') return [field('medicineName','Tên thuốc','text',true), field('activeIngredient','Hoạt chất'), field('medicineType','Chuyên khoa/nhóm thuốc','select',false, medicineTypeOptions.value), field('unit','Đơn vị tính','text',true), field('price','Đơn giá','number',true), field('stockQuantity','Tồn kho','number',true), field('minStockLevel','Ngưỡng cảnh báo','number',true), field('expiryDate','Hạn dùng','date'), field('status','Trạng thái','select',true,[{label:'Đang bán',value:'Active'},{label:'Tạm ngưng',value:'Inactive'},{label:'Hết hàng',value:'OutOfStock'}])]
  if (k === 'accounts') return [field('username','Username','text',true), field('password','Mật khẩu','password',!editingRow.value), field('fullName','Họ tên','text',true), field('email','Email','email',true), field('phoneNumber','Số điện thoại'), field('roleId','Vai trò','select',true,[{label:'Admin',value:RoleId.Admin},{label:'Bác sĩ',value:RoleId.Doctor},{label:'Y tá',value:RoleId.Receptionist},{label:'Bệnh nhân',value:RoleId.Patient}]), field('status','Trạng thái','select',true,[{label:'Đang hoạt động',value:'Active'},{label:'Đã khóa',value:'Locked'}])]
  if (k === 'nurses') return [field('username','Username','text',true), field('password','Mật khẩu','password',!editingRow.value), field('fullName','Họ tên','text',true), field('email','Email','email',true), field('phoneNumber','Số điện thoại'), field('status','Trạng thái','select',true,[{label:'Đang hoạt động',value:'Active'},{label:'Đã khóa',value:'Locked'}])]
  return []
}
function field(key: string, label: string, type = 'text', required = false, options?: SelectOption[]): Field { return { key, label, type, required, options } }

function openForm(row?: Row) {
  scheduleFormMode.value = 'single'
  formError.value = ''
  editingRow.value = row || null
  Object.keys(form).forEach((k) => delete form[k])
  for (const f of fields.value) form[f.key] = formValue(row, f.key)
  if (key.value === 'schedules') {
    form.slotDurationMinutes ||= '30'
    form.isAvailable ||= 'true'
    form.workDate ||= localDateIso(new Date())
    schedulePreset.value = matchedSchedulePreset(form.startTime, form.endTime)
  }
  formOpen.value = true
}
function openBulkScheduleForm() {
  scheduleFormMode.value = 'bulk'
  editingRow.value = null
  formError.value = ''
  resetBulkScheduleForm()
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
  editingRow.value = null
  formError.value = ''
  scheduleFormMode.value = 'single'
}
async function submitForm() {
  formError.value = ''
  if (key.value === 'schedules' && !validateScheduleForm()) return

  saving.value = true
  error.value = ''
  const wasEditing = Boolean(editingRow.value)
  try {
    const id = Number(editingRow.value?.id)
    if (key.value === 'doctors') wasEditing ? await appointmentApi.updateDoctor(id, doctorPayload()) : await appointmentApi.createDoctor(doctorPayload())
    if (key.value === 'specialties') wasEditing ? await appointmentApi.updateSpecialty(id, { specialtyName: form.specialtyName }) : await appointmentApi.createSpecialty({ specialtyName: form.specialtyName })
    if (key.value === 'schedules') wasEditing ? await appointmentApi.updateDoctorSchedule(id, schedulePayload()) : await appointmentApi.createDoctorSchedule(schedulePayload())
    if (key.value === 'patients') wasEditing ? await medicalRecordApi.updatePatient(id, patientPayload()) : await medicalRecordApi.createPatient(patientPayload())
    if (key.value === 'medicines') wasEditing ? await medicineApi.updateMedicine(id, medicinePayload()) : await medicineApi.createMedicine(medicinePayload())
    if (key.value === 'accounts') wasEditing ? await authApi.updateUser(id, userPayload()) : await authApi.createUser(userPayload())
    if (key.value === 'nurses') wasEditing ? await authApi.updateUser(id, nursePayload()) : await authApi.createUser(nursePayload())
    closeForm()
    await loadData()
    note.value = wasEditing ? 'Đã cập nhật dữ liệu thành công.' : 'Đã thêm dữ liệu thành công.'
  } catch(e) {
    const message = getApiErrorMessage(e)
    error.value = message
    formError.value = message
  } finally {
    saving.value = false
  }
}

async function submitBulkSchedules() {
  formError.value = ''
  error.value = ''
  if (!validateBulkScheduleForm()) return

  const payloads = bulkSchedulePreview.value.map((item) => bulkSchedulePayload(item.workDateRaw))
  saving.value = true
  try {
    const results = await Promise.allSettled(payloads.map((payload) => appointmentApi.createDoctorSchedule(payload)))
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failedResults = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (successCount > 0) closeForm()
    await loadData()
    note.value = `Tạo thành công ${successCount}/${payloads.length} lịch làm việc.`
    if (failedResults.length) {
      const messages = failedResults.slice(0, 3).map((result) => getApiErrorMessage(result.reason))
      error.value = `Có ${failedResults.length} lịch tạo lỗi: ${messages.join(' | ')}`
      formError.value = error.value
    }
  } catch (e) {
    const message = getApiErrorMessage(e)
    error.value = message
    formError.value = message
  } finally {
    saving.value = false
  }
}

function doctorPayload() {
  const sp = specialtyOptions.value.find((s) => Number(s.value) === Number(form.specialtyId))
  return {
    doctorName: form.doctorName,
    fullName: form.doctorName,
    specialtyId: Number(form.specialtyId),
    specialtyName: sp?.label,
    degree: form.degree || '',
    examFee: Number(form.examFee || 0),
    phone: form.phone || '',
    email: form.email || '',
    roomNumber: form.roomNumber || '',
    isActive: form.isActive !== 'false',
    experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
    gender: form.gender || '',
    dateOfBirth: form.dateOfBirth || undefined,
    description: form.description || '',
    avatarUrl: form.avatarUrl || '',
  }
}
function schedulePayload() { return { doctorId: Number(form.doctorId), workDate: form.workDate, startTime: normalizeTime(form.startTime), endTime: normalizeTime(form.endTime), slotDurationMinutes: Number(form.slotDurationMinutes || 30), isAvailable: form.isAvailable !== 'false' } }
function schedulePayloadFromRow(row: Row, isAvailable = row.isAvailable !== false) { return { doctorId: Number(row.doctorId), workDate: row.workDateRaw, startTime: normalizeTime(row.startTime), endTime: normalizeTime(row.endTime), slotDurationMinutes: Number(row.slotDurationMinutes || 30), isAvailable } }
function bulkSchedulePayload(workDate: string) { return { doctorId: Number(bulkScheduleForm.doctorId), workDate, startTime: normalizeTime(bulkScheduleForm.startTime), endTime: normalizeTime(bulkScheduleForm.endTime), slotDurationMinutes: Number(bulkScheduleForm.slotDurationMinutes || 30), isAvailable: bulkScheduleForm.isAvailable !== 'false' } }
function patientPayload() { return { fullName: form.fullName, phone: form.phone, phoneNumber: form.phone, gender: form.gender, medicalHistory: form.medicalHistory } }
function userPayload() { return { username: form.username, password: form.password || undefined, fullName: form.fullName, email: form.email, phoneNumber: form.phoneNumber, roleId: Number(form.roleId) as RoleId, status: form.status || 'Active' } }
function nursePayload() { return { username: form.username, password: form.password || undefined, fullName: form.fullName, email: form.email, phoneNumber: form.phoneNumber, roleId: RoleId.Receptionist, roleName: 'Nurse', status: form.status || 'Active' } }
function medicinePayload(): MedicinePayload { return { medicineName: (form.medicineName || '').trim(), activeIngredient: (form.activeIngredient || '').trim() || undefined, medicineType: form.medicineType || 'Khác', unit: (form.unit || '').trim(), price: Number(form.price || 0), stockQuantity: Number(form.stockQuantity || 0), minStockLevel: Number(form.minStockLevel || 10), expiryDate: form.expiryDate || undefined, status: Number(form.stockQuantity || 0) === 0 ? 'OutOfStock' : (form.status || 'Active') } }

function actions(row: Row) {
  const a: Array<{key: Action; label: string; className: string}> = []
  const st = String(row.status || '').toLowerCase()
  if (key.value === 'schedules') {
    a.push(btn('edit','Sửa','bg-slate-100 text-slate-700 hover:bg-slate-200'))
    a.push(row.isAvailable === false ? btn('toggle','Mở lại','bg-teal-50 text-teal-700 hover:bg-teal-100') : btn('toggle','Tạm ngưng','bg-amber-50 text-amber-800 hover:bg-amber-100'))
    if (canDeleteResource.value) a.push(btn('delete','Xóa','bg-rose-50 text-rose-700 hover:bg-rose-100'))
    return a
  }
  if (['doctors','specialties','patients','medicines','accounts','nurses'].includes(key.value)) {
    a.push(btn('edit','Sửa','bg-slate-100 text-slate-700 hover:bg-slate-200'))
    if (canDeleteResource.value) a.push(btn('delete','Xóa','bg-rose-50 text-rose-700 hover:bg-rose-100'))
  }
  if (key.value === 'appointments') {
    if (st.includes('pending')) a.push(btn('confirm','Xác nhận','bg-teal-600 text-white hover:bg-teal-700'))
    if (st.includes('confirmed')) a.push(btn('checkin','Check-in','bg-emerald-600 text-white hover:bg-emerald-700'))
    if (st.includes('checked')) a.push(btn('noop','Đã check-in','bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'))
    if (!st.includes('cancel') && !st.includes('completed') && !st.includes('checked')) a.push(btn('cancel','Hủy','bg-rose-50 text-rose-700 hover:bg-rose-100'))
    if (st.includes('inprogress')) a.push(btn('complete','Hoàn tất','bg-indigo-600 text-white hover:bg-indigo-700'))
  }
  if (key.value === 'bills' && !st.includes('paid')) a.push(btn('pay','Thu tiền','bg-teal-600 text-white hover:bg-teal-700'))
  return a
}
function btn(key: Action, label: string, className: string) { return { key, label, className } }
async function runAction(action: Action, row: Row) {
  if (action === 'noop') return
  if (action === 'edit') return openForm(row)
  if (action === 'delete' && !window.confirm(deleteConfirmMessage())) return
  const wasAvailable = row.isAvailable !== false
  actingId.value = row.id
  error.value = ''
  try {
    const id = Number(row.invoiceId || row.id)
    if (action === 'delete') await deleteRow(id)
    if (action === 'toggle') await appointmentApi.updateDoctorSchedule(id, schedulePayloadFromRow(row, !wasAvailable))
    if (action === 'confirm') await appointmentApi.confirmAppointment(id)
    if (action === 'checkin') { await appointmentApi.checkInAppointment(id); row.status = 'CheckedIn'; if (row.raw) row.raw.status = 'CheckedIn' }
    if (action === 'start') await appointmentApi.ensureAppointmentInProgress(id, String(row.raw?.appointmentDate || row.appointmentDate || ''))
    if (action === 'cancel') await appointmentApi.cancelAppointment(id)
    if (action === 'complete') await appointmentApi.completeAppointmentSafely(id, String(row.raw?.appointmentDate || row.appointmentDate || ''))
    if (action === 'pay') await billingApi.payInvoice(id, row.amountValue)
    await loadData()
    if (action === 'delete') note.value = key.value === 'schedules' ? 'Đã xóa lịch làm việc khỏi database.' : 'Đã xóa dữ liệu thành công khỏi database.'
    if (action === 'toggle') note.value = wasAvailable ? 'Đã tạm ngưng lịch làm việc.' : 'Đã mở lại lịch làm việc.'
    if (action === 'pay') note.value = 'Đã gửi yêu cầu thanh toán sang N3.'
  } catch(e) {
    const message = getApiErrorMessage(e)
    error.value = key.value === 'schedules' && action === 'delete' ? scheduleDeleteErrorMessage(message) : message
  } finally {
    actingId.value = null
  }
}
async function deleteRow(id: number) { if (key.value === 'doctors') await appointmentApi.deleteDoctor(id); if (key.value === 'specialties') await appointmentApi.deleteSpecialty(id); if (key.value === 'schedules') await appointmentApi.deleteDoctorSchedule(id); if (key.value === 'patients') await medicalRecordApi.deletePatient(id); if (key.value === 'medicines') await medicineApi.deleteMedicine(id); if (key.value === 'accounts' || key.value === 'nurses') await authApi.deleteUser(id) }
function deleteConfirmMessage() {
  if (key.value === 'schedules') return 'Bạn chắc chắn muốn xóa lịch làm việc này? Nếu lịch đã có cuộc hẹn liên quan, backend có thể từ chối để bảo toàn dữ liệu.'
  return 'Bạn chắc chắn muốn xóa dữ liệu này? Thao tác này sẽ xóa khỏi database.'
}
function scheduleDeleteErrorMessage(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('appointment') || lower.includes('lịch hẹn') || lower.includes('cuộc hẹn')) return `${message} Không thể xóa lịch vì đã có lịch hẹn liên quan. Hãy tạm ngưng lịch nếu không muốn nhận thêm đặt lịch.`
  return message
}
function openAppointmentDetails(row: Row) { if (key.value !== 'appointments') return; selectedAppointmentRow.value = row; appointmentDetailOpen.value = true }
function closeAppointmentDetails() { appointmentDetailOpen.value = false; selectedAppointmentRow.value = null }
async function deleteSelectedAppointment() {
  const row = selectedAppointmentRow.value
  if (!row || !canDeleteAppointment(row)) return
  const id = Number(row.id)
  saving.value = true
  error.value = ''
  try {
    hideAppointmentId(id)
    rows.value = visibleAppointmentRows(rows.value)
    note.value = deleteAppointmentMessage(row.status)
    closeAppointmentDetails()
  } catch (e) {
    error.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

function mapDoctor(x: Doctor): Row { return { id: x.doctorId, name: displayText(x.doctorName || x.fullName), specialty: displayText(x.specialtyName), degree: x.degree || 'Chưa cập nhật', fee: money(x.examFee), feeValue: x.examFee, phone: x.phone || 'Chưa cập nhật', email: x.email || 'Chưa cập nhật', roomNumber: x.roomNumber || 'Chưa cập nhật', status: x.isActive === false ? 'Tạm ngưng' : 'Đang hoạt động', raw: x } }
function mapSpecialty(x: Specialty): Row { return { id: x.specialtyId, name: displayText(x.specialtyName), specialtyName: x.specialtyName, status: 'Đang hoạt động', raw: x } }
function mapSchedule(x: DoctorSchedule & Record<string, any>): Row {
  const scheduleId = toNumber(x.scheduleId, x.ScheduleId, x.id, x.Id)
  const doctorId = toNumber(x.doctorId, x.DoctorId)
  const doctor = doctorCatalog.value.find((item) => Number(item.doctorId) === doctorId)
  const specialtyId = toNumber(x.specialtyId, x.SpecialtyId, doctor?.specialtyId)
  const specialty = specialtyCatalog.value.find((item) => Number(item.specialtyId) === specialtyId)
  const workDateRaw = scheduleDateValue(x.workDate || x.WorkDate)
  const startTime = normalizeTime(x.startTime || x.StartTime)
  const endTime = normalizeTime(x.endTime || x.EndTime)
  const slotDurationMinutes = toNumber(x.slotDurationMinutes, x.SlotDurationMinutes) || 30
  const slotCount = estimateSlotCount(startTime, endTime, slotDurationMinutes)
  const isAvailable = toBoolean(x.isAvailable ?? x.IsAvailable, true)
  return {
    id: scheduleId,
    scheduleId,
    doctorId,
    doctorName: displayText(x.doctorName || x.DoctorName || doctor?.doctorName || doctor?.fullName || `Bác sĩ #${doctorId}`),
    specialtyId,
    specialtyName: displayText(x.specialtyName || x.SpecialtyName || doctor?.specialtyName || specialty?.specialtyName || 'Chưa cập nhật'),
    workDateRaw,
    workDate: date(workDateRaw),
    weekdayLabel: weekdayLabel(workDateRaw),
    startTime,
    endTime,
    startMinutes: minutesFromTime(startTime),
    endMinutes: minutesFromTime(endTime),
    timeRange: `${startTime || '-'} - ${endTime || '-'}`,
    slotDurationMinutes,
    duration: `${slotDurationMinutes} phút`,
    slotCount,
    slotCountLabel: slotCount > 0 ? String(slotCount) : '-',
    isAvailable,
    status: isAvailable ? 'Đang mở' : 'Tạm ngưng',
    hasConflict: false,
    raw: x,
  }
}
function mapPatient(x: Patient): Row { const id = toNumber(x.id, x.patientId); return { id: id || x.patientId, patientCode: x.patientCode || x.patientIdCode || x.patientId || id, name: displayText(x.fullName), phone: x.phone || x.phoneNumber || 'Chưa cập nhật', gender: x.gender || 'Chưa cập nhật', history: x.medicalHistory || 'Chưa ghi nhận', raw: x } }
function mapAppointment(x: Appointment & Record<string, any>): Row { return { id: toNumber(x.appointmentId, x.AppointmentId, x.id), appointmentDate: x.appointmentDate || x.AppointmentDate, patientId: toNumber(x.patientId, x.PatientId), doctorId: toNumber(x.doctorId, x.DoctorId), patientName: displayText(x.patientName || x.PatientName || x.patientNameSnapshot), doctorName: displayText(x.doctorName || x.DoctorName), dateTime: `${date(x.appointmentDate || x.AppointmentDate)} · ${x.slotTime || x.SlotTime || '-'}`, status: x.status || x.Status, feeValue: toNumber(x.examFee, x.ExamFee, x.doctor?.examFee, x.Doctor?.ExamFee), raw: x } }
function mapMedicine(x: Medicine & Record<string, any>): Row { const price = toNumber(x.price, x.Price, x.unitPrice, x.UnitPrice); const stock = toNumberAllowZero(x.stockQuantity, x.StockQuantity, x.stock, x.Stock); const minStock = toNumberAllowZero(x.minStockLevel, x.MinStockLevel) || 10; const status = String(x.status || x.Status || (stock <= 0 ? 'OutOfStock' : 'Active')); return { id: toNumber(x.medicineId, x.MedicineId, x.id), name: x.medicineName || x.MedicineName || x.name, activeIngredient: x.activeIngredient || x.ActiveIngredient || 'Chưa cập nhật', medicineType: x.medicineType || x.MedicineType || 'Khác', unit: x.unit || x.Unit || x.dosageForm || x.DosageForm || 'Chưa cập nhật', price: money(price), priceValue: price, stock, minStockLevel: minStock, expiryDate: dateOnly(x.expiryDate || x.ExpiryDate), stockStatus: medicineStatusLabel(status, stock, minStock), status, raw: x } }
function mapPrescription(x: MedicalRecord): Row { return { id: x.medicalRecordCode || x.medicalRecordIdCode || x.recordIdCode || x.recordId || x.medicalRecordId || 'MR', patientId: x.patientCode || x.patientIdCode || x.patientId, diagnosis: x.diagnosis || 'Chưa chẩn đoán', doctorNotes: x.doctorNotes || 'Chưa ghi chú', status: 'Chờ kê đơn', raw: x } }
function mapInvoice(x: Invoice & Record<string, any>): Row { const amount = invoiceAmount(x); const invoiceId = toNumber(x.invoiceId, x.InvoiceId, x.id, x.Id); return { id: x.invoiceCode || x.invoiceIdCode || x.InvoiceCode || x.InvoiceIdCode || invoiceId, invoiceId, patientId: x.patientCode || x.patientIdCode || x.PatientCode || x.PatientIdCode || x.patientId || x.PatientId || 'Chưa cập nhật', appointmentId: x.appointmentId || x.AppointmentId ? `#${x.appointmentId || x.AppointmentId}` : '-', amount: money(amount), amountValue: amount, status: x.status || x.Status || 'Unpaid', raw: x } }
function mapUser(x: User): Row { return { id: x.id, fullName: displayText(x.fullName), username: x.username, email: x.email || 'Chưa cập nhật', phoneNumber: x.phoneNumber || 'Chưa cập nhật', roleName: x.roleName, status: (x as any).status || 'Active', raw: x } }

function matchesScheduleFilters(row: Row, q: string) {
  const doctorMatches = !q || [row.doctorName, row.specialtyName, row.timeRange].some((value) => String(value || '').toLowerCase().includes(q))
  const doctorFilterMatches = !scheduleDoctorFilter.value || String(row.doctorId) === String(scheduleDoctorFilter.value)
  const specialtyFilterMatches = !scheduleSpecialtyFilter.value || String(row.specialtyId) === String(scheduleSpecialtyFilter.value) || String(row.specialtyName || '').toLowerCase() === selectedSpecialtyName().toLowerCase()
  const statusFilterMatches = !scheduleStatusFilter.value || (scheduleStatusFilter.value === 'open' ? row.isAvailable !== false : row.isAvailable === false)
  const dateFromMatches = !scheduleDateFrom.value || String(row.workDateRaw || '') >= scheduleDateFrom.value
  const dateToMatches = !scheduleDateTo.value || String(row.workDateRaw || '') <= scheduleDateTo.value
  return doctorMatches && doctorFilterMatches && specialtyFilterMatches && statusFilterMatches && dateFromMatches && dateToMatches
}
function selectedSpecialtyName() {
  return String(specialtyOptions.value.find((item) => String(item.value) === String(scheduleSpecialtyFilter.value))?.label || '')
}
function withScheduleConflicts(items: Row[]) {
  return items.map((item) => ({ ...item, hasConflict: items.some((other) => scheduleOverlaps(item, other)) }))
}
function scheduleOverlaps(a: Row, b: Row) {
  const sameId = a.id !== undefined && b.id !== undefined && String(a.id) === String(b.id)
  if (sameId) return false
  if (!a.doctorId || !b.doctorId || Number(a.doctorId) !== Number(b.doctorId)) return false
  if (!a.workDateRaw || !b.workDateRaw || a.workDateRaw !== b.workDateRaw) return false
  const startA = minutesFromTime(a.startTime)
  const endA = minutesFromTime(a.endTime)
  const startB = minutesFromTime(b.startTime)
  const endB = minutesFromTime(b.endTime)
  if ([startA, endA, startB, endB].some((value) => value === null)) return false
  return Number(startA) < Number(endB) && Number(startB) < Number(endA)
}
function scheduleCandidateFromForm() {
  if (!form.doctorId || !form.workDate || !form.startTime || !form.endTime) return null
  return {
    id: editingRow.value?.id || '__new_schedule__',
    doctorId: Number(form.doctorId),
    workDateRaw: form.workDate,
    startTime: normalizeTime(form.startTime),
    endTime: normalizeTime(form.endTime),
  }
}
function buildBulkSchedulePreview() {
  if (!bulkScheduleForm.doctorId || !bulkScheduleForm.rangeStart || !bulkScheduleForm.rangeEnd || !bulkWeekdays.value.length) return []
  const start = parseInputDate(bulkScheduleForm.rangeStart)
  const end = parseInputDate(bulkScheduleForm.rangeEnd)
  if (!start || !end || start > end) return []
  const items: Array<Row & { key: string; workDateLabel: string }> = []
  const cursor = new Date(start)
  while (cursor <= end && items.length < 370) {
    const iso = localDateIso(cursor)
    const day = isoWeekday(cursor)
    if (bulkWeekdays.value.includes(day)) {
      const candidate = {
        id: `bulk-${iso}`,
        key: `bulk-${iso}`,
        doctorId: Number(bulkScheduleForm.doctorId),
        doctorName: selectedBulkDoctorName.value,
        workDateRaw: iso,
        workDateLabel: date(iso),
        weekdayLabel: weekdayLabel(iso),
        startTime: normalizeTime(bulkScheduleForm.startTime),
        endTime: normalizeTime(bulkScheduleForm.endTime),
        timeRange: `${normalizeTime(bulkScheduleForm.startTime)} - ${normalizeTime(bulkScheduleForm.endTime)}`,
      }
      items.push({ ...candidate, hasConflict: rows.value.some((row) => scheduleOverlaps(candidate, row)) })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return items
}

function validateScheduleForm() {
  const message = validateScheduleValues(form.doctorId, form.workDate, form.startTime, form.endTime, form.slotDurationMinutes)
  if (message) {
    formError.value = message
    return false
  }
  return true
}
function validateBulkScheduleForm() {
  const message = validateScheduleValues(bulkScheduleForm.doctorId, bulkScheduleForm.rangeStart, bulkScheduleForm.startTime, bulkScheduleForm.endTime, bulkScheduleForm.slotDurationMinutes)
  if (message) {
    formError.value = message
    return false
  }
  if (!bulkScheduleForm.rangeEnd) {
    formError.value = 'Vui lòng chọn ngày kết thúc.'
    return false
  }
  if (String(bulkScheduleForm.rangeStart) > String(bulkScheduleForm.rangeEnd)) {
    formError.value = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
    return false
  }
  if (!bulkWeekdays.value.length) {
    formError.value = 'Vui lòng chọn ít nhất một thứ trong tuần.'
    return false
  }
  if (!bulkSchedulePreview.value.length) {
    formError.value = 'Chưa có lịch trong khoảng này.'
    return false
  }
  return true
}
function validateScheduleValues(doctorId: unknown, workDate: unknown, startTime: unknown, endTime: unknown, slotDurationMinutes: unknown) {
  if (!doctorId) return 'Vui lòng chọn bác sĩ.'
  if (!workDate) return 'Vui lòng chọn ngày làm.'
  const start = minutesFromTime(startTime)
  const end = minutesFromTime(endTime)
  if (start === null || end === null) return 'Vui lòng nhập giờ bắt đầu và giờ kết thúc hợp lệ.'
  if (start >= end) return 'Giờ bắt đầu phải trước giờ kết thúc.'
  const duration = Number(slotDurationMinutes || 0)
  if (!Number.isFinite(duration) || duration <= 0) return 'Phút/slot phải là số dương.'
  if (duration < 5 || duration > 240) return 'Phút/slot phải nằm trong khoảng 5 đến 240.'
  return ''
}

function applySchedulePreset(key: SchedulePresetKey) {
  schedulePreset.value = key
  const preset = schedulePresets.find((item) => item.key === key)
  if (preset?.startTime && preset.endTime) {
    form.startTime = preset.startTime
    form.endTime = preset.endTime
  }
}
function applyBulkSchedulePreset(key: SchedulePresetKey) {
  bulkSchedulePreset.value = key
  const preset = schedulePresets.find((item) => item.key === key)
  if (preset?.startTime && preset.endTime) {
    bulkScheduleForm.startTime = preset.startTime
    bulkScheduleForm.endTime = preset.endTime
  }
}
function matchedSchedulePreset(start?: string, end?: string): SchedulePresetKey {
  const matched = schedulePresets.find((item) => item.startTime === normalizeTime(start) && item.endTime === normalizeTime(end))
  return matched?.key || 'custom'
}
function resetBulkScheduleForm() {
  const start = scheduleDateFrom.value || localDateIso(scheduleWeekStart.value)
  const end = scheduleDateTo.value || localDateIso(addDaysFrom(scheduleWeekStart.value, 6))
  bulkScheduleForm.doctorId = scheduleDoctorFilter.value || ''
  bulkScheduleForm.rangeStart = start
  bulkScheduleForm.rangeEnd = end
  bulkScheduleForm.startTime = '08:00'
  bulkScheduleForm.endTime = '11:00'
  bulkScheduleForm.slotDurationMinutes = '30'
  bulkScheduleForm.isAvailable = 'true'
  bulkWeekdays.value = [1, 2, 3, 4, 5]
  bulkSchedulePreset.value = 'morning'
}
function toggleBulkWeekday(day: number) {
  bulkWeekdays.value = bulkWeekdays.value.includes(day)
    ? bulkWeekdays.value.filter((item) => item !== day)
    : [...bulkWeekdays.value, day].sort((a, b) => a - b)
}

function applyScheduleQuickRange(range: ScheduleQuickRange) {
  const today = new Date()
  if (range === 'clear') {
    clearScheduleFilters(true)
    return
  }
  if (range === 'today') {
    const iso = localDateIso(today)
    scheduleDateFrom.value = iso
    scheduleDateTo.value = iso
    scheduleWeekStart.value = startOfWeek(today)
    return
  }
  if (range === 'week') {
    const start = startOfWeek(today)
    scheduleDateFrom.value = localDateIso(start)
    scheduleDateTo.value = localDateIso(addDaysFrom(start, 6))
    scheduleWeekStart.value = start
    return
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  scheduleDateFrom.value = localDateIso(first)
  scheduleDateTo.value = localDateIso(last)
  scheduleWeekStart.value = startOfWeek(today)
}
function clearScheduleFilters(clearQuery = true) {
  if (clearQuery) query.value = ''
  scheduleDoctorFilter.value = ''
  scheduleSpecialtyFilter.value = ''
  scheduleStatusFilter.value = ''
  scheduleDateFrom.value = ''
  scheduleDateTo.value = ''
  scheduleTab.value = 'week'
  scheduleWeekStart.value = startOfWeek(new Date())
}
function moveScheduleWeek(direction: -1 | 1) {
  scheduleWeekStart.value = addDaysFrom(scheduleWeekStart.value, direction * 7)
}
function goToCurrentScheduleWeek() {
  scheduleWeekStart.value = startOfWeek(new Date())
}

function cfg(title: string, service: string, description: string, endpoint: string, icon: Component, columns: Column[]): Config { return { title, service, description, endpoint, icon, columns } }
function cols(...xs: [string, string, boolean?, boolean?, boolean?][]): Column[] { return xs.map(([key,label,right,badge,strong]) => ({ key, label, right, badge, strong })) }
function columnHeaderClass(col: Column) { return ['px-4 py-3 align-middle', col.right ? 'text-right' : 'text-left', columnWidthClass(col), compactColumnClass(col)] }
function columnCellClass(col: Column) { return ['px-4 py-4 align-middle', col.right ? 'text-right' : 'text-left', columnWidthClass(col), compactColumnClass(col)] }
function columnWidthClass(col: Column) {
  if (key.value !== 'medicines') return ''
  const widths: Record<string, string> = {
    id: 'w-16',
    name: 'w-64',
    activeIngredient: 'w-52',
    medicineType: 'w-44',
    unit: 'w-24',
    price: 'w-32',
    stock: 'w-20',
    minStockLevel: 'w-24',
    expiryDate: 'w-32',
    stockStatus: 'w-36',
  }
  return widths[col.key] || ''
}
function compactColumnClass(col: Column) { return key.value === 'medicines' && ['id', 'unit', 'price', 'stock', 'minStockLevel', 'expiryDate', 'stockStatus'].includes(col.key) ? 'whitespace-nowrap' : '' }
function compactTextClass(col: Column) { return key.value === 'medicines' && ['medicineType', 'activeIngredient'].includes(col.key) ? 'break-words leading-6' : '' }
const actionHeaderClass = computed(() => ['px-4 py-3 text-right align-middle', key.value === 'medicines' ? 'sticky right-0 z-20 w-36 bg-slate-50 shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.6)]' : ''])
const actionCellClass = computed(() => ['px-4 py-4 text-right align-middle', key.value === 'medicines' ? 'sticky right-0 z-10 w-36 bg-white shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.6)]' : ''])

function scheduleViewTabClass(tab: ScheduleTab) {
  return [
    'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition sm:flex-none',
    scheduleTab.value === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
  ]
}
function scheduleQuickButtonClass(range: ScheduleQuickRange) {
  const active = isScheduleQuickRangeActive(range)
  return [
    'inline-flex h-9 items-center rounded-lg px-3 text-sm font-bold transition',
    active ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
  ]
}
function isScheduleQuickRangeActive(range: ScheduleQuickRange) {
  const today = new Date()
  if (range === 'clear') return !query.value && !scheduleDoctorFilter.value && !scheduleSpecialtyFilter.value && !scheduleStatusFilter.value && !scheduleDateFrom.value && !scheduleDateTo.value
  if (range === 'today') {
    const iso = localDateIso(today)
    return scheduleDateFrom.value === iso && scheduleDateTo.value === iso
  }
  if (range === 'week') {
    const start = startOfWeek(today)
    return scheduleDateFrom.value === localDateIso(start) && scheduleDateTo.value === localDateIso(addDaysFrom(start, 6))
  }
  const first = localDateIso(new Date(today.getFullYear(), today.getMonth(), 1))
  const last = localDateIso(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  return scheduleDateFrom.value === first && scheduleDateTo.value === last
}
function scheduleCardClass(row: Row) {
  const base = 'group w-full rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4'
  if (row.hasConflict) return [base, 'border-amber-300 bg-amber-50 focus:ring-amber-100']
  if (row.isAvailable === false) return [base, 'border-rose-200 bg-rose-50/80 focus:ring-rose-100']
  return [base, 'border-teal-200 bg-teal-50/80 focus:ring-teal-100']
}
function scheduleStatusBadgeClass(row: Row) {
  return [
    'shrink-0 rounded-full px-2.5 py-1 text-xs font-black',
    row.isAvailable === false ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700',
  ]
}
function scheduleTableRowClass(row: Row) {
  return ['transition hover:bg-slate-50', row.hasConflict ? 'bg-amber-50/60' : '']
}
function scheduleStatToneClass(tone: ScheduleTone) {
  return ({
    blue: 'border-blue-100 bg-blue-50/60',
    teal: 'border-teal-100 bg-teal-50/60',
    slate: 'border-slate-200 bg-white',
    amber: 'border-amber-100 bg-amber-50/70',
    rose: 'border-rose-100 bg-rose-50/70',
  } as Record<ScheduleTone, string>)[tone]
}
function scheduleStatIconClass(tone: ScheduleTone) {
  return ({
    blue: 'bg-blue-600 text-white',
    teal: 'bg-teal-600 text-white',
    slate: 'bg-slate-800 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white',
  } as Record<ScheduleTone, string>)[tone]
}
function schedulePresetButtonClass(key: SchedulePresetKey, activeKey: SchedulePresetKey) {
  return [
    'inline-flex h-11 items-center justify-center rounded-xl border px-3 text-sm font-black transition',
    key === activeKey ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
  ]
}
function scheduleAvailabilityButtonClass(open: boolean, active: boolean) {
  const activeClass = open ? 'border-teal-600 bg-teal-600 text-white' : 'border-rose-500 bg-rose-500 text-white'
  return [
    'inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition',
    active ? activeClass : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ]
}
function bulkWeekdayButtonClass(day: number) {
  const active = bulkWeekdays.value.includes(day)
  return [
    'inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-black transition',
    active ? 'border-teal-600 bg-teal-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700',
  ]
}

function value(v: unknown) { return v === undefined || v === null || v === '' ? 'Chưa cập nhật' : String(v) }
function toNumber(...values: unknown[]) { for (const value of values) { const numberValue = Number(value); if (Number.isFinite(numberValue) && numberValue > 0) return numberValue } return 0 }
function toNumberAllowZero(...values: unknown[]) { for (const value of values) { const numberValue = Number(value); if (Number.isFinite(numberValue) && numberValue >= 0) return numberValue } return 0 }
function toBoolean(value: unknown, fallback = false) { if (value === undefined || value === null || value === '') return fallback; if (typeof value === 'boolean') return value; return !['false', '0', 'no', 'không'].includes(String(value).toLowerCase()) }
function invoiceAmount(item: Record<string, any>) { return toNumber(item.amount, item.Amount, item.totalAmount, item.TotalAmount, item.examinationFee, item.ExaminationFee, item.examFee, item.ExamFee) }
function uniqueRows(items: Row[]) { const seen = new Set<string>(); return items.filter((item, index) => { const rowKey = String(item.id || item.appointmentId || index); if (seen.has(rowKey)) return false; seen.add(rowKey); return true }) }
function readHiddenAppointmentIds(): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(hiddenAppointmentsStorageKey) || '[]')
    return new Set<string>(Array.isArray(value) ? value.map(String) : [])
  } catch {
    return new Set<string>()
  }
}
function persistHiddenAppointmentIds() {
  localStorage.setItem(hiddenAppointmentsStorageKey, JSON.stringify(Array.from(hiddenAppointmentIds.value)))
}
function hideAppointmentId(id: number | string) {
  hiddenAppointmentIds.value.add(String(id))
  persistHiddenAppointmentIds()
}
function visibleAppointmentRows(items: Row[]) {
  return items.filter((item) => !hiddenAppointmentIds.value.has(String(item.id)))
}
function appointmentDetails(row: Row) {
  const raw = row.raw || {}
  const appointmentDate = getAny(row, raw, 'appointmentDate', 'AppointmentDate')
  const checkedInAt = getAny(row, raw, 'checkedInAt', 'CheckedInAt')
  return {
    id: row.id,
    patientId: getAny(row, raw, 'patientId', 'PatientId') || 'Chưa cập nhật',
    patientName: displayText(getAny(row, raw, 'patientName', 'PatientName', 'patientNameSnapshot', 'PatientNameSnapshot')) || 'Chưa cập nhật',
    patientPhone: getAny(row, raw, 'patientPhone', 'PatientPhone', 'patientPhoneSnapshot', 'PatientPhoneSnapshot') || 'Chưa cập nhật',
    doctorId: getAny(row, raw, 'doctorId', 'DoctorId') || 'Chưa cập nhật',
    doctorName: displayText(getAny(row, raw, 'doctorName', 'DoctorName')) || 'Chưa cập nhật',
    specialtyName: displayText(getAny(row, raw, 'specialtyName', 'SpecialtyName')) || 'Chưa cập nhật',
    reason: getAny(row, raw, 'reason', 'Reason') || '',
    status: getAny(row, raw, 'status', 'Status') || row.status || 'Chưa cập nhật',
    appointmentDateLabel: date(toOptionalString(appointmentDate)),
    slotTime: getAny(row, raw, 'slotTime', 'SlotTime') || '-',
    queueNumber: getAny(row, raw, 'queueNumber', 'QueueNumber') || '-',
    examFeeLabel: money(toNumber(getAny(row, raw, 'feeValue', 'examFee', 'ExamFee', 'doctor.examFee', 'Doctor.ExamFee'))),
    checkedInAtLabel: checkedInAt ? dateTime(toOptionalString(checkedInAt)) : 'Chưa check-in',
  }
}
function canDeleteAppointment(row: Row) { return ['pending', 'cancelled', 'completed'].includes(statusBucket(row.status)) }
function deleteAppointmentMessage(status: unknown) {
  const bucket = statusBucket(status)
  if (bucket === 'completed') return 'Đã xóa lịch đã khám xong khỏi danh sách quản trị.'
  if (bucket === 'cancelled') return 'Đã xóa lịch đã hủy khỏi danh sách quản trị.'
  return 'Đã xóa lịch chưa xác nhận khỏi danh sách quản trị.'
}
function statusBucket(status: unknown) {
  const s = String(status || '').toLowerCase()
  if (s.includes('completed') || s.includes('hoàn tất') || s.includes('da kham') || s.includes('đã khám')) return 'completed'
  if (s.includes('pending') || s.includes('chưa xác nhận') || s.includes('cho xac nhan') || s.includes('chờ xác nhận')) return 'pending'
  if (s.includes('confirmed') || s.includes('xác nhận')) return 'confirmed'
  if (s.includes('checked')) return 'checkedin'
  if (s.includes('progress')) return 'inprogress'
  if (s.includes('cancel')) return 'cancelled'
  return 'other'
}
function getAny(...values: any[]) {
  const sources = values.slice(0, 2)
  const keys = values.slice(2)
  for (const key of keys) {
    for (const source of sources) {
      const value = key.includes('.')
        ? key.split('.').reduce((acc: any, part: string) => acc?.[part], source)
        : source?.[key]
      if (value !== undefined && value !== null && value !== '') return value
    }
  }
  return undefined
}
function toOptionalString(value: unknown) { return value === undefined || value === null || value === '' ? undefined : String(value) }
function statusClass(v: unknown) { const s = String(v || '').toLowerCase(); if (s.includes('đang') || s.includes('paid') || s.includes('confirmed') || s.includes('completed') || s.includes('đủ')) return 'bg-teal-100 text-teal-700'; if (s.includes('pending') || s.includes('unpaid') || s.includes('chờ') || s.includes('tồn thấp')) return 'bg-amber-100 text-amber-700'; if (s.includes('cancel') || s.includes('hết') || s.includes('tạm')) return 'bg-rose-100 text-rose-700'; return 'bg-slate-100 text-slate-700' }
function money(v: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0)) }
function date(v?: string) { if (!v) return 'Chưa cập nhật'; const d = parseInputDate(v); return d ? new Intl.DateTimeFormat('vi-VN').format(d) : v }
function dateTime(v?: string) { if (!v) return 'Chưa cập nhật'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(d) }
function dateOnly(v?: string) { if (!v) return 'Chưa cập nhật'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10) }
function formValue(row: Row | undefined, key: string) {
  if (!row) {
    if (key === 'status') return 'Active'
    if (key === 'isActive' || key === 'isAvailable') return 'true'
    if (key === 'minStockLevel') return '10'
    if (key === 'slotDurationMinutes') return '30'
    if (key === 'workDate') return localDateIso(new Date())
    if (key === 'experienceYears') return '0'
    if (key === 'gender') return 'Nam'
    return ''
  }
  if (key === 'password') return ''
  const raw = row.raw || {}
  if (key === 'doctorName') return String(raw.doctorName ?? raw.DoctorName ?? raw.fullName ?? raw.FullName ?? row.name ?? '')
  if (key === 'doctorId') return String(raw.doctorId ?? raw.DoctorId ?? row.doctorId ?? '')
  if (key === 'workDate') return String(row.workDateRaw ?? raw.workDate ?? raw.WorkDate ?? '')
  if (key === 'startTime') return normalizeTime(row.startTime ?? raw.startTime ?? raw.StartTime)
  if (key === 'endTime') return normalizeTime(row.endTime ?? raw.endTime ?? raw.EndTime)
  if (key === 'slotDurationMinutes') return String(row.slotDurationMinutes ?? raw.slotDurationMinutes ?? raw.SlotDurationMinutes ?? 30)
  if (key === 'isAvailable') return String(row.isAvailable ?? raw.isAvailable ?? raw.IsAvailable ?? true)
  if (key === 'phone') return String(raw.phone ?? raw.Phone ?? raw.phoneNumber ?? raw.PhoneNumber ?? row.phone ?? '')
  if (key === 'isActive') return String(raw.isActive ?? raw.IsActive ?? !String(row.status || '').toLowerCase().includes('tạm'))
  const value = raw[key] ?? raw[pascal(key)] ?? row[key] ?? ''
  if (key === 'roleId') return String(raw.roleId ?? row.raw?.roleId ?? value ?? RoleId.Receptionist)
  if (key === 'price') return String(row.priceValue ?? value ?? '')
  if (key === 'expiryDate' || key === 'dateOfBirth') return dateInputValue(value)
  return String(value ?? '')
}
function dateInputValue(v: unknown) { if (!v) return ''; const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? String(v).slice(0, 10) : d.toISOString().slice(0, 10) }
function medicineStatusLabel(status: string, stock: number, minStock: number) { const normalized = status.toLowerCase(); if (normalized === 'inactive') return 'Tạm ngưng'; if (normalized === 'outofstock' || stock <= 0) return 'Hết hàng'; if (stock <= minStock) return 'Tồn thấp'; return 'Đủ hàng' }
function pascal(value: string) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : value }
function addDays(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d }
function addDaysFrom(dateValue: Date, days: number) { const d = new Date(dateValue); d.setDate(d.getDate() + days); return d }
function startOfWeek(value: Date) { const dateValue = new Date(value); const day = dateValue.getDay(); const diff = day === 0 ? -6 : 1 - day; dateValue.setHours(0, 0, 0, 0); dateValue.setDate(dateValue.getDate() + diff); return dateValue }
function localDateIso(value: Date) { const year = value.getFullYear(); const month = String(value.getMonth() + 1).padStart(2, '0'); const day = String(value.getDate()).padStart(2, '0'); return `${year}-${month}-${day}` }
function parseInputDate(value?: string) {
  if (!value) return null
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.slice(0, 10).split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}
function scheduleDateValue(value?: string) {
  const raw = String(value || '')
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const d = parseInputDate(raw)
  return d ? localDateIso(d) : raw
}
function normalizeTime(value: unknown) {
  const raw = String(value || '').trim()
  const match = raw.match(/(\d{1,2}):(\d{2})/)
  if (!match) return ''
  return `${match[1].padStart(2, '0')}:${match[2]}`
}
function minutesFromTime(value: unknown) {
  const time = normalizeTime(value)
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}
function estimateSlotCount(startTime: string, endTime: string, slotDuration: number) {
  const start = minutesFromTime(startTime)
  const end = minutesFromTime(endTime)
  if (start === null || end === null || end <= start || slotDuration <= 0) return 0
  return Math.floor((end - start) / slotDuration)
}
function isoWeekday(value: Date) { const day = value.getDay(); return day === 0 ? 7 : day }
function weekdayLabel(value?: string) {
  const dateValue = parseInputDate(value)
  if (!dateValue) return '-'
  return weekdayOptions.find((item) => item.value === isoWeekday(dateValue))?.label || '-'
}
function formatShortDate(value: string) {
  const dateValue = parseInputDate(value)
  if (!dateValue) return value
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(dateValue)
}

const DetailItem = (props: { label: string; value: unknown; badge?: boolean }) => h('div', { class: 'rounded-xl border border-slate-200 bg-white px-4 py-3' }, [
  h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-500' }, props.label),
  props.badge
    ? h('span', { class: ['mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(props.value)] }, value(props.value))
    : h('p', { class: 'mt-2 text-sm font-semibold leading-6 text-slate-800' }, value(props.value)),
])
</script>
