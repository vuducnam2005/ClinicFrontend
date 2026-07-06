<template>
  <section class="min-h-screen bg-[#f8fafc] py-2 sm:py-3">
    <FullscreenLoader :show="loading" />

    <div class="mx-auto max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-[1.75rem] font-bold leading-tight tracking-normal text-slate-950">{{ config.title }}</h1>
          <p class="mt-1.5 text-[13px] font-medium leading-5 text-slate-500">{{ config.description }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="canCreate"
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F52BA] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003c90]"
            @click="openForm()"
          >
            <Plus class="h-4 w-4" />
            {{ createButtonLabel }}
          </button>
          <button
            v-if="key === 'schedules'"
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0F52BA]"
            @click="openBulkScheduleForm"
          >
            <CalendarPlus class="h-4 w-4" />
            Tạo hàng loạt
          </button>
          <button
            type="button"
            :disabled="loading"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0F52BA] disabled:cursor-not-allowed disabled:opacity-60"
            @click="loadData"
          >
            <RefreshCw :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
            Tải lại
          </button>
        </div>
      </header>

    <div v-if="key === 'schedules'" class="schedule-workspace space-y-4">
      <div class="schedule-summary">
        <div v-for="stat in scheduleStats" :key="stat.label" class="schedule-summary-item">
          <span :class="['schedule-summary-icon', scheduleStatIconClass(stat.tone)]">
            <component :is="stat.icon" class="h-4 w-4" />
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] font-semibold text-slate-500">{{ stat.label }}</span>
            <span class="mt-0.5 block text-lg font-bold text-slate-950">{{ stat.value }}</span>
          </span>
        </div>
      </div>

      <div class="schedule-filter-panel">
        <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <label class="block">
            <span class="schedule-field-label">Tìm bác sĩ</span>
            <span class="relative block">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="query"
                class="schedule-control pl-10"
                placeholder="Tên bác sĩ"
              />
            </span>
          </label>

          <label class="block">
            <span class="schedule-field-label">Bác sĩ</span>
            <select v-model="scheduleDoctorFilter" class="schedule-control px-3">
              <option value="">Tất cả</option>
              <option v-for="option in doctorOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label class="block">
            <span class="schedule-field-label">Chuyên khoa</span>
            <select v-model="scheduleSpecialtyFilter" class="schedule-control px-3">
              <option value="">Tất cả</option>
              <option v-for="option in specialtyOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label class="block">
            <span class="schedule-field-label">Trạng thái</span>
            <select v-model="scheduleStatusFilter" class="schedule-control px-3">
              <option value="">Tất cả</option>
              <option value="open">Đang mở</option>
              <option value="paused">Tạm ngưng</option>
            </select>
          </label>

          <BaseInput v-model="scheduleDateFrom" label="Từ ngày" type="date" />
          <BaseInput v-model="scheduleDateTo" label="Đến ngày" type="date" />
        </div>

        <div class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
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
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span><strong class="font-bold text-slate-900">{{ filteredRows.length }}</strong> lịch phù hợp</span>
          </div>
        </div>
      </div>

      <div class="schedule-board-shell">
        <div class="schedule-board-toolbar">
          <div class="inline-flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1 sm:w-auto">
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
            <button type="button" class="schedule-icon-button" title="Tuần trước" @click="moveScheduleWeek(-1)">
              <ChevronLeft class="h-4 w-4" />
            </button>
            <div class="min-w-[170px] text-center">
              <p class="text-[11px] font-semibold text-slate-400">Tuần làm việc</p>
              <p class="mt-0.5 text-sm font-bold text-slate-900">{{ weekRangeLabel }}</p>
            </div>
            <button type="button" class="schedule-icon-button" title="Tuần sau" @click="moveScheduleWeek(1)">
              <ChevronRight class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex h-9 items-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100" @click="goToCurrentScheduleWeek">Hôm nay</button>
          </div>
        </div>

        <div v-if="scheduleTab === 'week'">
          <div v-if="weeklyScheduleCount" class="hidden overflow-x-auto lg:block">
            <div class="schedule-calendar min-w-[1180px]">
              <div class="schedule-calendar-corner">
                <Clock class="h-4 w-4 text-slate-400" />
                <span>Ca làm việc</span>
              </div>
              <div
                v-for="day in weeklyDays"
                :key="day.key"
                :class="['schedule-day-header', day.isToday ? 'schedule-day-header--today' : '']"
              >
                <span class="text-xs font-semibold text-slate-500">{{ day.label }}</span>
                <span :class="['schedule-day-number', day.isToday ? 'schedule-day-number--today' : '']">{{ day.dayNumber }}</span>
                <span class="text-[11px] font-medium text-slate-400">{{ day.monthLabel }}</span>
              </div>

              <template v-for="shift in scheduleShiftDefinitions" :key="shift.key">
                <div class="schedule-shift-label">
                  <span :class="['schedule-shift-dot', shift.dotClass]"></span>
                  <span class="font-bold text-slate-800">{{ shift.label }}</span>
                  <span class="text-[11px] font-medium text-slate-400">{{ shift.timeLabel }}</span>
                </div>
                <div
                  v-for="day in weeklyDays"
                  :key="`${shift.key}-${day.key}`"
                  :class="['schedule-calendar-cell', day.isToday ? 'schedule-calendar-cell--today' : '']"
                >
                  <button
                    v-for="item in scheduleItemsForShift(day.items, shift.key)"
                    :key="String(item.id)"
                    type="button"
                    :class="scheduleCardClass(item)"
                    @click="openForm(item)"
                  >
                    <span class="flex items-start justify-between gap-2">
                      <span class="min-w-0">
                        <span class="block truncate text-[13px] font-bold text-slate-950">{{ item.doctorName }}</span>
                        <span class="mt-0.5 block truncate text-[11px] font-medium text-slate-500">{{ item.specialtyName }}</span>
                      </span>
                      <span :class="scheduleStatusDotClass(item)" :title="item.status"></span>
                    </span>
                    <span class="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Clock class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {{ item.timeRange }}
                    </span>
                    <span class="mt-2 flex items-center justify-between gap-2 border-t border-current/10 pt-2 text-[10px] font-semibold text-slate-500">
                      <span>{{ item.slotCountLabel }} slot</span>
                      <span>{{ item.duration }}</span>
                    </span>
                    <span v-if="item.hasConflict" class="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <AlertTriangle class="h-3 w-3" />
                      Trùng ca
                    </span>
                  </button>
                  <span v-if="!scheduleItemsForShift(day.items, shift.key).length" class="schedule-empty-cell">—</span>
                </div>
              </template>
            </div>
          </div>

          <div v-if="weeklyScheduleCount" class="space-y-3 p-3 lg:hidden">
            <div v-for="day in weeklyDays" :key="`${day.key}-mobile`" :class="['schedule-mobile-day', day.isToday ? 'border-blue-300' : '']">
              <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div class="flex items-center gap-3">
                  <span :class="['schedule-day-number', day.isToday ? 'schedule-day-number--today' : '']">{{ day.dayNumber }}</span>
                  <span>
                    <span class="block text-sm font-bold text-slate-900">{{ day.label }}</span>
                    <span class="block text-[11px] font-medium text-slate-400">{{ day.monthLabel }}</span>
                  </span>
                </div>
                <span class="text-xs font-semibold text-slate-500">{{ day.items.length }} lịch</span>
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
                      <span class="block break-words text-sm font-bold text-slate-950">{{ item.doctorName }}</span>
                      <span class="mt-1 block break-words text-xs font-medium text-slate-500">{{ item.specialtyName }}</span>
                    </span>
                    <span :class="scheduleStatusBadgeClass(item)">{{ item.status }}</span>
                  </span>
                  <span class="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Clock class="h-4 w-4 shrink-0 text-slate-500" />
                    {{ item.timeRange }}
                  </span>
                  <span class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-slate-500">{{ item.duration }}</span>
                    <span class="text-slate-300">·</span>
                    <span class="text-xs font-semibold text-slate-500">{{ item.slotCountLabel }} slot</span>
                    <span v-if="item.hasConflict" class="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">Trùng ca</span>
                  </span>
                </button>
                <p v-if="!day.items.length" class="px-4 py-5 text-center text-sm font-medium text-slate-400">Chưa có lịch</p>
              </div>
            </div>
          </div>

          <div v-if="!weeklyScheduleCount" class="px-4 py-16 text-center">
            <CalendarX class="mx-auto h-11 w-11 text-slate-300" />
            <h2 class="mt-4 text-lg font-bold text-slate-950">Chưa có lịch trong tuần này</h2>
            <p class="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc chuyển sang tuần khác.</p>
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

    <div v-else class="admin-table-shell">
      <div v-if="key === 'medicines'" class="grid gap-3 border-b border-slate-100 bg-white px-3 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <select
          v-model="medicineTypeFilter"
          class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Tất cả chuyên khoa</option>
          <option v-for="option in medicineTypeOptions" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
        </select>
        <span class="inline-flex h-10 items-center justify-center rounded-lg bg-blue-50 px-3 text-xs font-semibold text-[#0F52BA]">{{ filteredRows.length }} dòng</span>
      </div>
      <ATable
        :columns="adminTableColumns"
        :custom-row="adminTableCustomRow"
        :data-source="filteredRows"
        :pagination="adminTablePagination"
        :scroll="{ x: adminTableScrollX }"
        row-key="id"
        size="middle"
        @change="handleAdminTableChange"
      >
        <template #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
          <div class="admin-filter">
            <p class="admin-filter-title">Tìm theo {{ String(column.title).toLowerCase() }}</p>
            <AInput
              :value="selectedKeys[0]"
              :placeholder="`Nhập ${String(column.title).toLowerCase()}...`"
              allow-clear
              autofocus
              @change="setSelectedKeys(getFilterKeys($event))"
              @press-enter="confirm()"
            >
              <template #prefix><Search class="h-3.5 w-3.5 text-slate-400" /></template>
            </AInput>
            <div class="admin-filter-actions">
              <AButton size="small" @click="clearAdminFilter(clearFilters, confirm)">Đặt lại</AButton>
              <AButton type="primary" size="small" @click="confirm()">Áp dụng</AButton>
            </div>
          </div>
        </template>
        <template #customFilterIcon="{ filtered, column }">
          <CheckSquare v-if="column.key === 'status'" :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
          <Search v-else :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
        </template>
        <template #emptyText>
          <div class="py-8 text-center">
            <SearchX class="mx-auto h-9 w-9 text-slate-300" />
            <p class="mt-3 font-semibold text-slate-800">Chưa có dữ liệu phù hợp</p>
            <p class="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc tải lại dữ liệu.</p>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <div class="flex items-center justify-center gap-2 whitespace-nowrap">
              <button
                v-for="action in actions(record)"
                :key="action.key"
                type="button"
                :disabled="actingId === record.id || action.key === 'noop'"
                :class="adminActionButtonClass(action)"
                :title="action.label"
                @click.stop="runAction(action.key, record)"
              >
                <component :is="actionIcon(action.key)" class="h-4 w-4" />
                <span :class="adminActionTextClass(action.key)">{{ action.label }}</span>
              </button>
            </div>
          </template>
          <template v-else-if="adminColumnKey(column) === 'id' || adminColumnKey(column) === 'patientCode'">
            <span class="font-mono text-xs font-semibold text-[#0F52BA]">{{ value(record[adminColumnKey(column)]) }}</span>
          </template>
          <template v-else-if="isAdminBadgeColumn(column)">
            <ATag :bordered="false" :class="['admin-status', statusClass(record[adminColumnKey(column)])]">{{ value(record[adminColumnKey(column)]) }}</ATag>
          </template>
          <template v-else>
            <span :class="[isAdminStrongColumn(column) ? 'font-semibold text-slate-950' : 'text-slate-700', compactTextClassByKey(adminColumnKey(column))]">{{ value(record[adminColumnKey(column)]) }}</span>
          </template>
        </template>
      </ATable>
    </div>
    <Teleport to="body">
      <Transition name="admin-drawer-fade">
        <div v-if="formOpen" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm" @click="closeForm"></div>
      </Transition>
      <Transition name="admin-drawer-slide">
        <div v-if="formOpen" :class="['admin-form-drawer', key === 'schedules' ? 'admin-form-drawer--wide' : '']">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ config.title }}</p>
              <h2 class="mt-0.5 text-xl font-bold text-slate-950">{{ formTitle }}</h2>
              <p class="mt-1 text-xs leading-5 text-slate-500">{{ config.description }}</p>
            </div>
            <button type="button" class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" @click="closeForm">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-5 py-4">
        <form v-if="key === 'schedules' && scheduleFormMode === 'single'" class="space-y-6" @submit.prevent="submitForm">
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

        <form v-else-if="key === 'schedules' && scheduleFormMode === 'bulk'" class="space-y-6" @submit.prevent="submitBulkSchedules">
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

        <form v-else class="space-y-5" @submit.prevent="submitForm">
          <div class="grid gap-4 sm:grid-cols-2">
            <template v-for="field in fields" :key="field.key">
              <BaseSelect v-if="field.type === 'select'" v-model="form[field.key]" :label="field.label" :options="field.options || []" :placeholder="field.placeholder || 'Chọn'" :required="field.required" />
              <div v-else-if="field.type === 'textarea'" class="col-span-1 sm:col-span-2 block">
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
          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <BaseButton type="button" variant="outline" @click="closeForm">Đóng</BaseButton>
            <BaseButton type="submit" :loading="saving">Lưu</BaseButton>
          </div>
        </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="admin-confirm-fade">
        <div v-if="passwordResetOpen" class="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" @click="closePasswordReset">
          <form class="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]" @click.stop @submit.prevent="submitPasswordReset">
            <div class="flex items-start gap-4 border-b border-slate-100 px-5 py-4">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0F52BA]">
                <KeyRound class="h-5 w-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-slate-400">Bảo mật tài khoản</p>
                <h2 class="mt-1 text-lg font-bold text-slate-950">Đặt lại mật khẩu</h2>
                <p class="mt-1 truncate text-sm text-slate-500">{{ passwordResetTarget?.fullName || passwordResetTarget?.username }}</p>
              </div>
              <button type="button" :disabled="saving" class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60" @click="closePasswordReset">
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-4 px-5 py-5">
              <div v-if="passwordResetError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{{ passwordResetError }}</div>
              <BaseInput v-model="passwordResetForm.newPassword" label="Mật khẩu mới" type="password" required />
              <BaseInput v-model="passwordResetForm.confirmPassword" label="Xác nhận mật khẩu mới" type="password" required />
              <p class="text-xs leading-5 text-slate-500">Mật khẩu cần tối thiểu 6 ký tự. Người dùng sẽ đăng nhập bằng mật khẩu mới ngay sau khi cập nhật.</p>
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" :disabled="saving" class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60" @click="closePasswordReset">Hủy</button>
              <button type="submit" :disabled="saving" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F52BA] px-4 text-sm font-semibold text-white transition hover:bg-[#003c90] disabled:cursor-not-allowed disabled:opacity-60">
                <KeyRound class="h-4 w-4" />
                {{ saving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="admin-confirm-fade">
        <div v-if="deleteConfirmOpen" class="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" @click="closeDeleteConfirm">
          <div class="admin-confirm-card w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]" @click.stop>
            <div class="flex items-start gap-4 border-b border-slate-100 px-5 py-4">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 class="h-5 w-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-rose-500">Xác nhận xóa</p>
                <h2 class="mt-1 text-lg font-bold text-slate-950">{{ deleteConfirmTitle }}</h2>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ deleteConfirmText }}</p>
              </div>
              <button type="button" :disabled="saving" class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60" @click="closeDeleteConfirm">
                <X class="h-4 w-4" />
              </button>
            </div>

            <div v-if="deleteConfirmTarget" class="px-5 pt-4">
              <div class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-semibold text-slate-400">Dữ liệu sẽ xóa</p>
                <p class="mt-1 truncate text-sm font-semibold text-slate-800">{{ deleteConfirmTarget }}</p>
              </div>
            </div>

            <div class="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" :disabled="saving" class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" @click="closeDeleteConfirm">
                Hủy
              </button>
              <button type="button" :disabled="saving" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60" @click="confirmDeleteAction">
                <Trash2 class="h-4 w-4" />
                {{ saving ? 'Đang xóa...' : 'Xóa dữ liệu' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
    <Toast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
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
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileHeart,
  KeyRound,
  LogIn,
  Pill,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Settings,
  Stethoscope,
  Table2,
  Trash2,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue'
import FullscreenLoader from '@/components/ui/FullscreenLoader.vue'
import Toast from '@/components/ui/Toast.vue'
import { Button as AButton, Input as AInput, Table as ATable, Tag as ATag } from 'ant-design-vue'
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
type Action = 'edit' | 'delete' | 'confirm' | 'checkin' | 'start' | 'cancel' | 'complete' | 'pay' | 'noop' | 'toggle' | 'lock' | 'unlock' | 'password'
type ScheduleTab = 'week' | 'table'
type ScheduleQuickRange = 'today' | 'week' | 'month' | 'clear'
type SchedulePresetKey = 'custom' | 'morning' | 'afternoon' | 'evening'
type ScheduleTone = 'blue' | 'teal' | 'slate' | 'amber' | 'rose'
type ScheduleShiftKey = 'morning' | 'afternoon' | 'evening'

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
const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error',
})
const formOpen = ref(false)
const deleteConfirmOpen = ref(false)
const passwordResetOpen = ref(false)
const editingRow = ref<Row | null>(null)
const form = reactive<Record<string, string>>({})
const formError = ref('')
const medicineTypeFilter = ref('')
const appointmentDetailOpen = ref(false)
const selectedAppointmentRow = ref<Row | null>(null)
const pendingDeleteRow = ref<Row | null>(null)
const passwordResetTarget = ref<Row | null>(null)
const passwordResetError = ref('')
const passwordResetForm = reactive({
  newPassword: '',
  confirmPassword: '',
})
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
const doctorUserOptions = ref<SelectOption[]>([])

const configs: Record<Key, Config> = {
  doctors: cfg('Bác sĩ', 'Lịch hẹn & Ca khám', 'Quản lý hồ sơ bác sĩ, chuyên khoa, phòng khám và phí khám.', 'GET/POST/PUT/DELETE /api/doctors', Stethoscope, cols(['id','ID'], ['name','Bác sĩ', false, false, true], ['specialty','Chuyên khoa'], ['degree','Học vị'], ['fee','Phí khám', true], ['phone','SĐT'], ['email','Email'], ['roomNumber','Phòng'], ['status','Trạng thái', false, true])),
  specialties: cfg('Chuyên khoa', 'Lịch hẹn & Ca khám', 'Quản lý danh sách chuyên khoa đang phục vụ đặt lịch và khám bệnh.', 'GET/POST/PUT/DELETE /api/specialties', Settings, cols(['id','ID'], ['name','Chuyên khoa', false, false, true], ['doctorCount','Bác sĩ', true], ['activeDoctorCount','BS hoạt động', true], ['rooms','Phòng'], ['feeRange','Khoảng phí'], ['status','Trạng thái', false, true])),
  schedules: cfg('Lịch làm việc', 'Lịch hẹn & Ca khám', 'Điều phối ca làm việc, slot khám và trạng thái nhận lịch của bác sĩ.', 'GET/POST/PUT/DELETE /api/doctor-schedules', CalendarDays, cols(['id','Mã'], ['doctorName','Bác sĩ', false, false, true], ['specialtyName','Chuyên khoa'], ['workDate','Ngày'], ['weekdayLabel','Thứ'], ['timeRange','Ca'], ['duration','Thời lượng slot', true], ['slotCountLabel','Số slot', true], ['status','Trạng thái', false, true])),
  patients: cfg('Bệnh nhân', 'Hồ sơ bệnh án', 'Quản lý thông tin bệnh nhân, liên hệ và tiền sử bệnh.', 'GET/POST/PUT/DELETE /api/patients', UserRound, cols(['patientCode','Mã BN'], ['name','Bệnh nhân', false, false, true], ['dateOfBirth','Ngày sinh'], ['age','Tuổi', true], ['gender','Giới tính'], ['phone','SĐT'], ['email','Email'], ['citizenId','CCCD'], ['bloodType','Nhóm máu'], ['address','Địa chỉ'], ['allergyNote','Dị ứng'], ['history','Tiền sử'], ['status','Trạng thái', false, true])),
  appointments: cfg('Lịch hẹn', 'Lịch hẹn & Ca khám', 'Theo dõi, xác nhận, hủy và cập nhật trạng thái lịch khám.', 'GET /api/appointments', ClipboardList, cols(['id','Mã'], ['patientName','Bệnh nhân', false, false, true], ['doctorName','Bác sĩ'], ['dateTime','Ngày giờ'], ['status','Trạng thái', false, true])),
  medicines: cfg('Kho thuốc', 'Kho dược phẩm', 'Quản lý danh mục thuốc, hoạt chất, chuyên khoa, đơn giá và tồn kho.', 'GET/POST/PUT/DELETE /api/medicines', Pill, cols(['id','ID'], ['name','Tên thuốc', false, false, true], ['activeIngredient','Hoạt chất'], ['medicineType','Chuyên khoa'], ['unit','Đơn vị'], ['price','Đơn giá', true], ['stock','Tồn', true], ['minStockLevel','Cảnh báo', true], ['expiryDate','Hạn dùng'], ['stockStatus','Trạng thái', false, true])),
  prescriptions: cfg('Đơn thuốc', 'Hồ sơ bệnh án', 'Theo dõi bệnh án và ghi chú kê đơn của bác sĩ.', 'GET /api/medical-records', FileHeart, cols(['id','Mã BA'], ['patientId','Bệnh nhân', false, false, true], ['diagnosis','Chẩn đoán'], ['doctorNotes','Ghi chú'], ['status','Trạng thái', false, true])),
  bills: cfg('Hóa đơn viện phí', 'Thanh toán viện phí', 'Theo dõi trạng thái thanh toán và thu viện phí của bệnh nhân.', 'GET /api/billing/invoices', CreditCard, cols(['id','Mã HĐ'], ['patientId','Bệnh nhân'], ['appointmentId','Lịch hẹn'], ['amount','Số tiền', true], ['status','Trạng thái', false, true])),
  accounts: cfg('Tài khoản hệ thống', 'Hệ thống', 'Quản lý danh sách và phân quyền tài khoản người dùng hệ thống.', 'GET/POST/PUT/DELETE /api/auth/users', UserCog, cols(['id','ID'], ['fullName','Họ tên', false, false, true], ['username','Username'], ['email','Email'], ['phoneNumber','SĐT'], ['roleName','Vai trò', false, true], ['status','Trạng thái', false, true])),
  nurses: cfg('Quản lý y tá', 'Hệ thống', 'Quản lý thông tin tài khoản của nhân viên y tá.', 'GET /api/auth/users/nurses · POST/PUT/DELETE /api/auth/users', Users, cols(['id','ID'], ['fullName','Họ tên', false, false, true], ['username','Username'], ['email','Email'], ['phoneNumber','SĐT'], ['roleName','Vai trò', false, true], ['status','Trạng thái', false, true])),
  reports: cfg('Báo cáo vận hành', 'Báo cáo chung', 'Tổng hợp và thống kê số liệu hoạt động thực tế trên toàn hệ thống phòng khám.', 'N1/N2/N3 health data', ClipboardList, cols(['metric','Chỉ số', false, false, true], ['value','Giá trị', true], ['source','Nguồn'], ['status','Trạng thái', false, true])),
}

const schedulePresets: SchedulePreset[] = [
  { key: 'custom', label: 'Tùy chỉnh' },
  { key: 'morning', label: 'Ca sáng', startTime: '08:00', endTime: '11:00' },
  { key: 'afternoon', label: 'Ca chiều', startTime: '13:00', endTime: '17:00' },
  { key: 'evening', label: 'Ca tối', startTime: '18:00', endTime: '21:00' },
]
const scheduleShiftDefinitions: Array<{ key: ScheduleShiftKey; label: string; timeLabel: string; dotClass: string }> = [
  { key: 'morning', label: 'Ca sáng', timeLabel: '06:00 - 12:00', dotClass: 'bg-amber-400' },
  { key: 'afternoon', label: 'Ca chiều', timeLabel: '12:00 - 18:00', dotClass: 'bg-blue-500' },
  { key: 'evening', label: 'Ca tối', timeLabel: '18:00 - 22:00', dotClass: 'bg-indigo-500' },
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

watch(note, (message) => {
  if (message) showToast('Thành công', message, 'success')
})

watch(error, (message) => {
  if (message) showToast('Không thể thực hiện', message, 'error')
})

const totalPages = computed(() => Math.ceil(filteredRows.value.length / itemsPerPage.value))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRows.value.slice(start, end)
})
const adminActionsWidth = computed(() => key.value === 'accounts' ? 176 : key.value === 'appointments' ? 132 : 96)
const adminTableScrollX = computed(() => key.value === 'medicines' ? 1420 : Math.max(1080, config.value.columns.length * 150 + (hasActions.value ? adminActionsWidth.value : 0)))
const adminTablePagination = computed(() => ({
  current: currentPage.value,
  pageSize: itemsPerPage.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showLessItems: true,
  showTitle: false,
  responsive: true,
  showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} trong ${total} ${resourceUnitLabel.value}`,
  locale: { items_per_page: ' / trang' },
}))
const adminTableColumns = computed(() => {
  const columns = config.value.columns.map((col) => {
    const column: Row = {
      title: col.label,
      dataIndex: col.key,
      key: col.key,
      width: adminColumnWidth(col),
      align: col.right ? 'right' : 'left',
      badge: col.badge,
      strong: col.strong,
      customFilterDropdown: !col.badge,
      onFilter: adminColumnFilter(col.key),
      sorter: adminColumnSorter(col),
    }

    if (col.badge) {
      column.filters = adminColumnFilters(col.key)
      column.filterReset = 'Đặt lại'
      column.filterConfirm = 'Áp dụng'
      delete column.customFilterDropdown
    }

    return column
  })

  if (hasActions.value) {
    columns.push({
      title: 'Thao tác',
      key: 'actions',
      width: adminActionsWidth.value,
      align: 'center',
      fixed: 'right',
    })
  }

  return columns
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
const createButtonLabel = computed(() => {
  if (key.value === 'doctors') return 'Thêm bác sĩ'
  if (key.value === 'specialties') return 'Thêm chuyên khoa'
  if (key.value === 'patients') return 'Thêm bệnh nhân'
  if (key.value === 'medicines') return 'Thêm thuốc'
  if (key.value === 'accounts') return 'Thêm tài khoản'
  if (key.value === 'nurses') return 'Thêm y tá'
  if (key.value === 'schedules') return 'Thêm lịch'
  return 'Thêm mới'
})
const paginationSummary = computed(() => {
  if (!filteredRows.value.length) return `0 ${resourceUnitLabel.value}`
  const start = Math.min(filteredRows.value.length, (currentPage.value - 1) * itemsPerPage.value + 1)
  const end = Math.min(filteredRows.value.length, currentPage.value * itemsPerPage.value)
  return `${start}-${end} trong ${filteredRows.value.length} ${resourceUnitLabel.value}`
})
const resourceUnitLabel = computed(() => {
  if (key.value === 'doctors') return 'bác sĩ'
  if (key.value === 'specialties') return 'chuyên khoa'
  if (key.value === 'patients') return 'bệnh nhân'
  if (key.value === 'appointments') return 'lịch hẹn'
  if (key.value === 'medicines') return 'thuốc'
  if (key.value === 'bills') return 'hóa đơn'
  if (key.value === 'accounts') return 'tài khoản'
  if (key.value === 'nurses') return 'y tá'
  return 'dòng'
})
const deleteConfirmTitle = computed(() => {
  if (key.value === 'schedules') return 'Xóa lịch làm việc?'
  if (key.value === 'doctors') return 'Xóa bác sĩ?'
  if (key.value === 'specialties') return 'Xóa chuyên khoa?'
  if (key.value === 'patients') return 'Xóa bệnh nhân?'
  if (key.value === 'appointments') return 'Xóa lịch hẹn?'
  if (key.value === 'medicines') return 'Xóa thuốc?'
  if (key.value === 'accounts') return 'Xóa tài khoản?'
  if (key.value === 'nurses') return 'Xóa y tá?'
  return 'Xóa dữ liệu?'
})
const deleteConfirmText = computed(() => deleteConfirmMessage())
const deleteConfirmTarget = computed(() => {
  const row = pendingDeleteRow.value
  if (!row) return ''
  const label = row.name || row.fullName || row.patientName || row.doctorName || row.username || row.patientCode
  const id = row.patientCode || row.id
  if (label && id && String(label) !== String(id)) return `${label} · ${id}`
  return String(label || id || '')
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
      dayNumber: String(dateValue.getDate()).padStart(2, '0'),
      monthLabel: `Tháng ${dateValue.getMonth() + 1}`,
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
      const [doctors, specialties, users] = await Promise.all([
        appointmentApi.getDoctors(),
        appointmentApi.getSpecialties().catch(() => {
          note.value = 'Đang hiển thị danh mục chuyên khoa mặc định do lỗi kết nối máy chủ.'
          return fallbackSpecialties
        }),
        authApi.getUsers().catch(() => []),
      ])
      updateSpecialtyCatalog(specialties)
      updateDoctorCatalog(doctors)
      rows.value = mapList(doctors, fallbackDoctors, mapDoctor)
      doctorUserOptions.value = [
        { label: 'Không liên kết (hoặc tạo tài khoản sau)', value: '' },
        ...users
          .filter((u) => u.roleId === RoleId.Doctor)
          .map((u) => ({ label: `${u.fullName} (${u.username})`, value: String(u.id) }))
      ]
    } else if (key.value === 'specialties') {
      const [specialties, doctors] = await Promise.all([
        appointmentApi.getSpecialties(),
        appointmentApi.getDoctors().catch(() => fallbackDoctors),
      ])
      updateDoctorCatalog(doctors)
      updateSpecialtyCatalog(specialties)
      rows.value = mapList(specialties, fallbackSpecialties, mapSpecialty)
    } else if (key.value === 'schedules') {
      await loadScheduleData()
    } else if (key.value === 'patients') {
      rows.value = mapList(await medicalRecordApi.getPatients(), fallbackPatients, mapPatient)
    } else if (key.value === 'appointments') {
      rows.value = visibleAppointmentRows(mapList(await appointmentApi.getAppointments(), fallbackAppointments, mapAppointment).filter(isValidAppointmentRow))
    } else if (key.value === 'medicines') {
      rows.value = mapList(await medicineApi.getMedicines({ pageSize: 200 }), fallbackMedicines, mapMedicine)
    } else if (key.value === 'prescriptions') {
      const remoteRows = (await medicalRecordApi.getMedicalRecords().catch(() => [])).map(mapPrescription)
      rows.value = uniqueRows(remoteRows)
      if (!rows.value.length) {
        note.value = 'Hệ thống hiện chưa có dữ liệu đơn thuốc được ghi nhận.'
        rows.value = fallbackRecords.map(mapPrescription)
      }
    } else if (key.value === 'bills') {
      const remoteRows = (await billingApi.getInvoices().catch(() => [])).map(mapInvoice)
      rows.value = uniqueRows(remoteRows)
      if (!rows.value.length) {
        note.value = 'Hệ thống hiện chưa có dữ liệu hóa đơn được ghi nhận.'
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
    warnings.push('Đang hiển thị danh sách bác sĩ mặc định do lỗi kết nối máy chủ.')
  }

  if (specialtyResult.status === 'fulfilled') updateSpecialtyCatalog(specialtyResult.value)
  else {
    updateSpecialtyCatalog(fallbackSpecialties)
    warnings.push('Đang hiển thị danh mục chuyên khoa mặc định do lỗi kết nối máy chủ.')
  }

  if (scheduleResult.status === 'rejected') throw scheduleResult.reason
  rows.value = withScheduleConflicts(scheduleResult.value.map(mapSchedule))
  if (warnings.length) note.value = warnings.join(' ')
}

function mapList<T>(data: T[], fallback: T[], mapper: (item: T) => Row) {
  if (data.length) return data.map(mapper)
  if (fallback.length) note.value = 'Hệ thống hiện chưa có dữ liệu được ghi nhận. Dữ liệu đang hiển thị ở chế độ mặc định.'
  return (data.length ? data : fallback).map(mapper)
}
function fallbackRows(k: Key) {
  return ({
    doctors: fallbackDoctors.map(mapDoctor),
    specialties: fallbackSpecialties.map(mapSpecialty),
    schedules: withScheduleConflicts(fallbackSchedules.map(mapSchedule)),
    patients: fallbackPatients.map((patient) => mapPatient(patient)),
    appointments: visibleAppointmentRows(fallbackAppointments.map(mapAppointment).filter(isValidAppointmentRow)),
    medicines: fallbackMedicines.map(mapMedicine),
    prescriptions: fallbackRecords.map(mapPrescription),
    bills: fallbackInvoices.map(mapInvoice),
    accounts: fallbackAccounts.map(mapUser),
    nurses: fallbackAccounts.filter((user) => user.roleId === RoleId.Receptionist).map(mapUser),
    reports: [],
  } as Record<Key, Row[]>)[k]
}
async function loadReports() { const [doctors, appointments, patients, invoices] = await Promise.all([appointmentApi.getDoctors().catch(() => fallbackDoctors), appointmentApi.getAppointments().catch(() => fallbackAppointments), medicalRecordApi.getPatients().catch(() => fallbackPatients), billingApi.getInvoices().catch(() => fallbackInvoices)]); return [{ id: 'R1', metric: 'Bác sĩ', value: doctors.length, source: 'Đặt lịch khám', status: 'OK' }, { id: 'R2', metric: 'Lịch hẹn', value: appointments.length, source: 'Đặt lịch khám', status: 'OK' }, { id: 'R3', metric: 'Bệnh nhân', value: patients.length, source: 'Hồ sơ bệnh án', status: 'OK' }, { id: 'R4', metric: 'Hóa đơn', value: invoices.length, source: 'Dược & Viện phí', status: 'OK' }] }

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
    field('userId', 'Tài khoản liên kết', 'select', false, doctorUserOptions.value),
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
  if (k === 'patients') return [
    field('fullName','Họ tên','text',true),
    field('phone','Số điện thoại','text',true),
    field('email','Email','email'),
    field('dateOfBirth','Ngày sinh','date'),
    field('gender','Giới tính','select',false,[{label:'Nam',value:'Nam'},{label:'Nữ',value:'Nữ'},{label:'Khác',value:'Khác'}]),
    field('citizenId','Số CCCD'),
    field('bloodType','Nhóm máu','select',false,[{label:'Chưa cập nhật',value:''},{label:'O+',value:'O+'},{label:'O-',value:'O-'},{label:'A+',value:'A+'},{label:'A-',value:'A-'},{label:'B+',value:'B+'},{label:'B-',value:'B-'},{label:'AB+',value:'AB+'},{label:'AB-',value:'AB-'}]),
    field('status','Trạng thái','select',false,[{label:'Đang hoạt động',value:'Đang hoạt động'},{label:'Đã khóa',value:'Đã khóa'}]),
    field('address','Địa chỉ','textarea'),
    field('allergyNote','Ghi chú dị ứng','textarea'),
    field('medicalHistory','Tiền sử bệnh','textarea'),
  ]
  if (k === 'medicines') return [field('medicineName','Tên thuốc','text',true), field('activeIngredient','Hoạt chất'), field('medicineType','Chuyên khoa/nhóm thuốc','select',false, medicineTypeOptions.value), field('unit','Đơn vị tính','text',true), field('price','Đơn giá','number',true), field('stockQuantity','Tồn kho','number',true), field('minStockLevel','Ngưỡng cảnh báo','number',true), field('expiryDate','Hạn dùng','date'), field('status','Trạng thái','select',true,[{label:'Đang bán',value:'Active'},{label:'Tạm ngưng',value:'Inactive'},{label:'Hết hàng',value:'OutOfStock'}])]
  if (k === 'accounts') return [field('username','Username','text',true), ...(!editingRow.value ? [field('password','Mật khẩu','password',true)] : []), field('fullName','Họ tên','text',true), field('email','Email','email',true), field('phoneNumber','Số điện thoại'), field('roleId','Vai trò','select',true,[{label:'Admin',value:RoleId.Admin},{label:'Bác sĩ',value:RoleId.Doctor},{label:'Y tá',value:RoleId.Receptionist},{label:'Bệnh nhân',value:RoleId.Patient}]), field('status','Trạng thái','select',true,[{label:'Đang hoạt động',value:'Active'},{label:'Đã khóa',value:'Locked'}])]
  if (k === 'nurses') return [field('username','Username','text',true), ...(!editingRow.value ? [field('password','Mật khẩu','password',true)] : []), field('fullName','Họ tên','text',true), field('email','Email','email',true), field('phoneNumber','Số điện thoại'), field('status','Trạng thái','select',true,[{label:'Đang hoạt động',value:'Active'},{label:'Đã khóa',value:'Locked'}])]
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
    userId: form.userId ? Number(form.userId) : null,
  }
}
function schedulePayload() { return { doctorId: Number(form.doctorId), workDate: form.workDate, startTime: normalizeTime(form.startTime), endTime: normalizeTime(form.endTime), slotDurationMinutes: Number(form.slotDurationMinutes || 30), isAvailable: form.isAvailable !== 'false' } }
function schedulePayloadFromRow(row: Row, isAvailable = row.isAvailable !== false) { return { doctorId: Number(row.doctorId), workDate: row.workDateRaw, startTime: normalizeTime(row.startTime), endTime: normalizeTime(row.endTime), slotDurationMinutes: Number(row.slotDurationMinutes || 30), isAvailable } }
function bulkSchedulePayload(workDate: string) { return { doctorId: Number(bulkScheduleForm.doctorId), workDate, startTime: normalizeTime(bulkScheduleForm.startTime), endTime: normalizeTime(bulkScheduleForm.endTime), slotDurationMinutes: Number(bulkScheduleForm.slotDurationMinutes || 30), isAvailable: bulkScheduleForm.isAvailable !== 'false' } }
function patientPayload() {
  return {
    fullName: form.fullName,
    dateOfBirth: form.dateOfBirth || undefined,
    gender: form.gender || undefined,
    phoneNumber: form.phone || undefined,
    email: form.email || undefined,
    address: form.address || undefined,
    citizenId: form.citizenId || undefined,
    bloodType: form.bloodType || undefined,
    allergyNote: form.allergyNote || undefined,
    medicalHistory: form.medicalHistory || undefined,
    status: form.status || undefined,
  }
}
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
  if (key.value === 'patients') {
    a.push(btn('edit','Sửa','bg-slate-100 text-slate-700 hover:bg-slate-200'))
    return a
  }
  if (key.value === 'accounts') {
    a.push(btn('edit','Sửa','bg-slate-100 text-slate-700 hover:bg-slate-200'))
    a.push(btn('password','Đặt lại mật khẩu','bg-blue-50 text-blue-700 hover:bg-blue-100'))
    if (!isAdminAccount(row)) {
      a.push(isLockedAccount(row) ? btn('unlock','Mở khóa','bg-teal-50 text-teal-700 hover:bg-teal-100') : btn('lock','Khóa','bg-amber-50 text-amber-800 hover:bg-amber-100'))
      if (canDeleteResource.value) a.push(btn('delete','Xóa','bg-rose-50 text-rose-700 hover:bg-rose-100'))
    }
    return a
  }
  if (['doctors','specialties','medicines','nurses'].includes(key.value)) {
    a.push(btn('edit','Sửa','bg-slate-100 text-slate-700 hover:bg-slate-200'))
    if (canDeleteResource.value) a.push(btn('delete','Xóa','bg-rose-50 text-rose-700 hover:bg-rose-100'))
  }
  if (key.value === 'appointments') {
    const bucket = statusBucket(row.statusRaw || row.status)
    if (bucket === 'pending') a.push(btn('confirm','Duyệt lịch','bg-blue-50 text-blue-700 hover:bg-blue-100'))
    if (bucket === 'confirmed') a.push(btn('checkin','Check-in','bg-emerald-50 text-emerald-700 hover:bg-emerald-100'))
    if (canDeleteResource.value) a.push(btn('delete','Xóa','bg-rose-50 text-rose-700 hover:bg-rose-100'))
  }
  if (key.value === 'bills' && !st.includes('paid')) a.push(btn('pay','Thu tiền','bg-teal-600 text-white hover:bg-teal-700'))
  return a
}
function btn(key: Action, label: string, className: string) { return { key, label, className } }
function actionIcon(action: Action) {
  const icons: Record<Action, Component> = {
    edit: Pencil,
    delete: Trash2,
    confirm: CheckCircle2,
    checkin: LogIn,
    start: Clock,
    cancel: X,
    complete: CheckCircle2,
    pay: CreditCard,
    noop: CheckCircle2,
    toggle: Ban,
    lock: Ban,
    unlock: CheckCircle2,
    password: KeyRound,
  }
  return icons[action] || CheckCircle2
}
function adminActionButtonClass(action: { key: Action; className: string }) {
  if (key.value === 'appointments' && ['confirm', 'checkin', 'delete'].includes(action.key)) {
    const colors: Partial<Record<Action, string>> = {
      confirm: 'border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100',
      checkin: 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100',
      delete: 'border-rose-100 bg-rose-50 text-rose-600 hover:border-rose-200 hover:bg-rose-100',
    }
    return ['inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60', colors[action.key]]
  }
  if (action.key === 'edit') {
    return 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60'
  }
  if (action.key === 'delete') {
    return 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 transition hover:border-rose-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60'
  }
  if (action.key === 'lock') {
    return 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700 transition hover:border-amber-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60'
  }
  if (action.key === 'unlock') {
    return 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700 transition hover:border-teal-200 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60'
  }
  if (action.key === 'password') {
    return 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60'
  }
  return ['inline-flex h-9 min-w-14 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60', action.className]
}
function adminActionTextClass(action: Action) {
  return ['edit', 'delete', 'confirm', 'checkin', 'lock', 'unlock', 'password'].includes(action) ? 'sr-only' : ''
}
async function runAction(action: Action, row: Row) {
  if (action === 'noop') return
  if (action === 'edit') return openForm(row)
  if (action === 'password') return openPasswordReset(row)
  if (action === 'delete') return openDeleteConfirm(row)
  const wasAvailable = row.isAvailable !== false
  actingId.value = row.id
  error.value = ''
  try {
    const id = Number(row.invoiceId || row.id)
    if (action === 'toggle') await appointmentApi.updateDoctorSchedule(id, schedulePayloadFromRow(row, !wasAvailable))
    if (action === 'confirm') await appointmentApi.confirmAppointment(id)
    if (action === 'checkin') { await appointmentApi.checkInAppointment(id); row.status = 'CheckedIn'; if (row.raw) row.raw.status = 'CheckedIn' }
    if (action === 'start') await appointmentApi.ensureAppointmentInProgress(id, String(row.raw?.appointmentDate || row.appointmentDate || ''))
    if (action === 'cancel') await appointmentApi.cancelAppointment(id)
    if (action === 'complete') await appointmentApi.completeAppointmentSafely(id, String(row.raw?.appointmentDate || row.appointmentDate || ''))
    if (action === 'pay') await billingApi.payInvoice(id, row.amountValue)
    if (action === 'lock' || action === 'unlock') await updateAccountLock(row, action === 'lock')
    await loadData()
    if (action === 'confirm') note.value = 'Đã duyệt lịch hẹn.'
    if (action === 'checkin') note.value = 'Đã check-in lịch hẹn.'
    if (action === 'toggle') note.value = wasAvailable ? 'Đã tạm ngưng lịch làm việc.' : 'Đã mở lại lịch làm việc.'
    if (action === 'pay') note.value = 'Đã gửi yêu cầu thanh toán thành công.'
    if (action === 'lock') note.value = 'Đã khóa tài khoản.'
    if (action === 'unlock') note.value = 'Đã mở khóa tài khoản.'
  } catch(e) {
    const message = getApiErrorMessage(e)
    error.value = message
  } finally {
    actingId.value = null
  }
}
function openDeleteConfirm(row: Row) {
  pendingDeleteRow.value = row
  deleteConfirmOpen.value = true
}
function closeDeleteConfirm() {
  if (saving.value) return
  deleteConfirmOpen.value = false
  pendingDeleteRow.value = null
}
function openPasswordReset(row: Row) {
  passwordResetTarget.value = row
  passwordResetForm.newPassword = ''
  passwordResetForm.confirmPassword = ''
  passwordResetError.value = ''
  passwordResetOpen.value = true
}
function clearPasswordResetState() {
  passwordResetOpen.value = false
  passwordResetTarget.value = null
  passwordResetError.value = ''
  passwordResetForm.newPassword = ''
  passwordResetForm.confirmPassword = ''
}
function closePasswordReset() {
  if (saving.value) return
  clearPasswordResetState()
}
async function submitPasswordReset() {
  const row = passwordResetTarget.value
  if (!row) return
  if (passwordResetForm.newPassword.length < 6) {
    passwordResetError.value = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
    return
  }
  if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
    passwordResetError.value = 'Xác nhận mật khẩu mới không khớp.'
    return
  }

  saving.value = true
  passwordResetError.value = ''
  try {
    await authApi.resetUserPassword(row.raw?.id || row.id, {
      newPassword: passwordResetForm.newPassword,
      confirmPassword: passwordResetForm.confirmPassword,
    })
    clearPasswordResetState()
    note.value = `Đã cập nhật mật khẩu cho tài khoản ${row.username || row.fullName || row.id}.`
  } catch (apiError) {
    passwordResetError.value = getApiErrorMessage(apiError)
  } finally {
    saving.value = false
  }
}
async function confirmDeleteAction() {
  const row = pendingDeleteRow.value
  if (!row) return
  const deletingSchedule = key.value === 'schedules'
  const deletingAppointment = key.value === 'appointments'
  actingId.value = row.id
  saving.value = true
  error.value = ''
  try {
    await deleteRow(Number(row.invoiceId || row.id))
    deleteConfirmOpen.value = false
    pendingDeleteRow.value = null
    await loadData()
    note.value = deletingSchedule
      ? 'Đã xóa lịch làm việc thành công.'
      : deletingAppointment
        ? deleteAppointmentMessage(row.statusRaw || row.status)
        : 'Đã xóa dữ liệu thành công.'
  } catch (e) {
    const message = getApiErrorMessage(e)
    deleteConfirmOpen.value = false
    pendingDeleteRow.value = null
    error.value = deletingSchedule ? scheduleDeleteErrorMessage(message) : message
  } finally {
    saving.value = false
    actingId.value = null
  }
}
async function updateAccountLock(row: Row, locked: boolean) {
  const accountId = row.raw?.id || row.id
  if (locked) await authApi.lockUser(accountId)
  else await authApi.unlockUser(accountId)
}
async function deleteRow(id: number) {
  if (key.value === 'doctors') await appointmentApi.deleteDoctor(id)
  if (key.value === 'specialties') await appointmentApi.deleteSpecialty(id)
  if (key.value === 'schedules') await appointmentApi.deleteDoctorSchedule(id)
  if (key.value === 'appointments') {
    hideAppointmentId(id)
  }
  if (key.value === 'medicines') await medicineApi.deleteMedicine(id)
  if (key.value === 'accounts' || key.value === 'nurses') await authApi.deleteUser(id)
}
function deleteConfirmMessage() {
  if (key.value === 'schedules') return 'Bạn chắc chắn muốn xóa lịch làm việc này? Nếu lịch đã có cuộc hẹn liên quan, backend có thể từ chối để bảo toàn dữ liệu.'
  if (key.value === 'appointments') return 'Bạn chắc chắn muốn xóa lịch hẹn này? Nếu backend chưa hỗ trợ xóa, lịch sẽ được ẩn khỏi danh sách quản trị.'
  if (key.value === 'accounts' && normalizeSearchText(pendingDeleteRow.value?.roleName).includes('patient')) {
    return 'Tài khoản bệnh nhân và hồ sơ bệnh nhân liên kết sẽ được xóa khỏi hệ thống. Dữ liệu khám đã phát sinh vẫn được lưu trữ an toàn.'
  }
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
function mapSpecialty(x: Specialty): Row {
  const relatedDoctors = doctorsForSpecialty(x)
  const activeDoctors = relatedDoctors.filter(isActiveDoctorProfile)
  const rooms = specialtyRoomSummary(relatedDoctors)
  const feeRange = specialtyFeeRange(relatedDoctors)

  return {
    id: x.specialtyId,
    name: displayText(x.specialtyName),
    specialtyName: x.specialtyName,
    doctorCount: relatedDoctors.length,
    doctorCountValue: relatedDoctors.length,
    activeDoctorCount: activeDoctors.length,
    activeDoctorCountValue: activeDoctors.length,
    rooms,
    feeRange,
    status: relatedDoctors.length ? (activeDoctors.length ? 'Đang hoạt động' : 'Tạm ngưng') : 'Chưa có bác sĩ',
    raw: x,
  }
}
function doctorsForSpecialty(specialty: Specialty) {
  const id = Number(specialty.specialtyId)
  const name = normalizeSearchText(specialty.specialtyName)
  return doctorCatalog.value.filter((doctor) =>
    Number(doctor.specialtyId) === id || normalizeSearchText(doctor.specialtyName) === name)
}
function isActiveDoctorProfile(doctor: Doctor & Record<string, any>) {
  const explicit = doctor.isActive ?? doctor.IsActive
  if (explicit === false || explicit === 'false') return false
  const status = normalizeSearchText(doctor.status || doctor.Status)
  return !status.includes('tam ngung') && !status.includes('inactive') && !status.includes('khoa')
}
function specialtyRoomSummary(doctors: Doctor[]) {
  const rooms = Array.from(new Set(doctors.map((doctor) => displayText(doctor.roomNumber)).filter((room) => room && room !== 'Chưa cập nhật')))
  if (!rooms.length) return 'Chưa cập nhật'
  return rooms.length <= 3 ? rooms.join(', ') : `${rooms.slice(0, 3).join(', ')} +${rooms.length - 3}`
}
function specialtyFeeRange(doctors: Doctor[]) {
  const fees = doctors.map((doctor) => Number(doctor.examFee || 0)).filter((fee) => Number.isFinite(fee) && fee > 0)
  if (!fees.length) return 'Chưa cập nhật'
  const min = Math.min(...fees)
  const max = Math.max(...fees)
  return min === max ? money(min) : `${money(min)} - ${money(max)}`
}
function patientGenderLabel(gender?: string) {
  const valueToCheck = normalizeSearchText(gender)
  if (valueToCheck === 'male' || valueToCheck === 'nam') return 'Nam'
  if (valueToCheck === 'female' || valueToCheck === 'nu') return 'Nữ'
  return gender || 'Chưa cập nhật'
}
function patientStatusLabel(status?: string) {
  const valueToCheck = normalizeSearchText(status)
  if (!valueToCheck || valueToCheck === 'active' || valueToCheck.includes('dang hoat dong')) return 'Đang hoạt động'
  if (valueToCheck === 'inactive' || valueToCheck === 'locked' || valueToCheck.includes('tam ngung') || valueToCheck.includes('khoa')) return 'Đã khóa'
  return status || 'Đang hoạt động'
}
function accountStatusLabel(status?: string) {
  const valueToCheck = normalizeSearchText(status)
  if (valueToCheck === 'locked' || valueToCheck.includes('khoa') || valueToCheck === 'inactive') return 'Đã khóa'
  return 'Đang hoạt động'
}
function isLockedAccount(row: Row) {
  const status = normalizeSearchText(row.raw?.status || row.raw?.Status || row.status)
  return status.includes('khoa') || status.includes('locked') || status.includes('inactive')
}
function isAdminAccount(row: Row) {
  const role = normalizeSearchText(row.raw?.roleName || row.raw?.role || row.roleName)
  return role === 'admin'
}
function patientAgeValue(dateOfBirth?: string) {
  const birthDate = parseInputDate(dateOfBirth)
  if (!birthDate) return 0
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1
  return Math.max(age, 0)
}
function patientAgeLabel(dateOfBirth?: string) {
  const age = patientAgeValue(dateOfBirth)
  return age > 0 ? `${age}` : 'Chưa cập nhật'
}
function appointmentStatusLabel(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'pending') return 'Chờ duyệt'
  if (bucket === 'confirmed') return 'Đã duyệt'
  if (bucket === 'checkedin') return 'Đã check-in'
  if (bucket === 'inprogress') return 'Đang khám'
  if (bucket === 'completed') return 'Hoàn tất'
  if (bucket === 'cancelled') return 'Đã hủy'
  if (bucket === 'expired') return 'Quá hạn'
  if (bucket === 'noshow') return 'Không đến'
  return status || 'Chờ duyệt'
}
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
function mapPatient(x: Patient): Row {
  const id = toNumber(x.id, x.patientId)
  const dateOfBirth = x.dateOfBirth || ''
  return {
    id: id || x.patientId,
    patientCode: x.patientCode || x.patientIdCode || x.patientId || id,
    name: displayText(x.fullName),
    dateOfBirth: date(dateOfBirth),
    age: patientAgeLabel(dateOfBirth),
    ageValue: patientAgeValue(dateOfBirth),
    phone: x.phone || x.phoneNumber || 'Chưa cập nhật',
    email: x.email || 'Chưa cập nhật',
    gender: patientGenderLabel(x.gender),
    citizenId: x.citizenId || 'Chưa cập nhật',
    bloodType: x.bloodType || 'Chưa cập nhật',
    address: x.address || 'Chưa cập nhật',
    allergyNote: x.allergyNote || x.allergies || 'Không ghi nhận',
    history: x.medicalHistory || 'Không ghi nhận',
    status: patientStatusLabel(x.status),
    raw: x,
  }
}
function mapAppointment(x: Appointment & Record<string, any>): Row {
  const appointmentId = toNumber(x.appointmentId, x.AppointmentId, x.id, x.Id)
  const patient = x.patient || x.Patient
  const doctor = x.doctor || x.Doctor
  const specialty = x.specialty || x.Specialty
  const appointmentDate = x.appointmentDate || x.AppointmentDate
  const slotTime = x.slotTime || x.SlotTime || x.time || x.Time || ''
  const statusRaw = String(x.status || x.Status || 'Pending')
  const patientId = x.patientId ?? x.PatientId ?? patient?.patientId ?? patient?.PatientId ?? patient?.id ?? patient?.Id
  const doctorId = toNumber(x.doctorId, x.DoctorId, doctor?.doctorId, doctor?.DoctorId, doctor?.id, doctor?.Id)
  const patientName = displayText(x.patientName || x.PatientName || x.patientNameSnapshot || x.PatientNameSnapshot || patient?.fullName || patient?.FullName || '')
  const doctorName = displayText(x.doctorName || x.DoctorName || doctor?.doctorName || doctor?.DoctorName || doctor?.fullName || doctor?.FullName || '')
  return {
    id: appointmentId,
    appointmentId,
    appointmentCode: x.appointmentCode || x.AppointmentCode || '',
    appointmentDate,
    patientId,
    patientPhone: x.patientPhone || x.PatientPhone || x.patientPhoneSnapshot || x.PatientPhoneSnapshot || patient?.phoneNumber || patient?.PhoneNumber || patient?.phone || patient?.Phone || '',
    doctorId,
    specialtyId: toNumber(x.specialtyId, x.SpecialtyId, specialty?.specialtyId, specialty?.SpecialtyId),
    specialtyName: displayText(x.specialtyName || x.SpecialtyName || specialty?.specialtyName || specialty?.SpecialtyName || doctor?.specialtyName || doctor?.SpecialtyName || ''),
    patientName,
    doctorName,
    dateTime: `${date(appointmentDate)} · ${slotTime ? String(slotTime).slice(0, 5) : '-'}`,
    slotTime,
    queueNumber: x.queueNumber ?? x.QueueNumber ?? null,
    reason: x.reason || x.Reason || '',
    status: appointmentStatusLabel(statusRaw),
    statusRaw,
    feeValue: toNumber(x.examFee, x.ExamFee, doctor?.examFee, doctor?.ExamFee),
    raw: x,
  }
}
function isValidAppointmentRow(row: Row) {
  const appointmentId = Number(row.appointmentId || row.id)
  const hasPatient = Boolean(row.patientId || String(row.patientName || '').trim())
  const hasDoctor = Boolean(row.doctorId || String(row.doctorName || '').trim())
  return Number.isFinite(appointmentId) && appointmentId > 0 && hasPatient && hasDoctor
}
function mapMedicine(x: Medicine & Record<string, any>): Row { const price = toNumber(x.price, x.Price, x.unitPrice, x.UnitPrice); const stock = toNumberAllowZero(x.stockQuantity, x.StockQuantity, x.stock, x.Stock); const minStock = toNumberAllowZero(x.minStockLevel, x.MinStockLevel) || 10; const status = String(x.status || x.Status || (stock <= 0 ? 'OutOfStock' : 'Active')); return { id: toNumber(x.medicineId, x.MedicineId, x.id), name: x.medicineName || x.MedicineName || x.name, activeIngredient: x.activeIngredient || x.ActiveIngredient || 'Chưa cập nhật', medicineType: x.medicineType || x.MedicineType || 'Khác', unit: x.unit || x.Unit || x.dosageForm || x.DosageForm || 'Chưa cập nhật', price: money(price), priceValue: price, stock, minStockLevel: minStock, expiryDate: dateOnly(x.expiryDate || x.ExpiryDate), stockStatus: medicineStatusLabel(status, stock, minStock), status, raw: x } }
function mapPrescription(x: MedicalRecord): Row { return { id: x.medicalRecordCode || x.medicalRecordIdCode || x.recordIdCode || x.recordId || x.medicalRecordId || 'MR', patientId: x.patientCode || x.patientIdCode || x.patientId, diagnosis: x.diagnosis || 'Chưa chẩn đoán', doctorNotes: x.doctorNotes || 'Chưa ghi chú', status: 'Chờ kê đơn', raw: x } }
function mapInvoice(x: Invoice & Record<string, any>): Row { const amount = invoiceAmount(x); const invoiceId = toNumber(x.invoiceId, x.InvoiceId, x.id, x.Id); return { id: x.invoiceCode || x.invoiceIdCode || x.InvoiceCode || x.InvoiceIdCode || invoiceId, invoiceId, patientId: x.patientCode || x.patientIdCode || x.PatientCode || x.PatientIdCode || x.patientId || x.PatientId || 'Chưa cập nhật', appointmentId: x.appointmentId || x.AppointmentId ? `#${x.appointmentId || x.AppointmentId}` : '-', amount: money(amount), amountValue: amount, status: x.status || x.Status || 'Unpaid', raw: x } }
function mapUser(x: User): Row { return { id: x.id, fullName: displayText(x.fullName), username: x.username, email: x.email || 'Chưa cập nhật', phoneNumber: x.phoneNumber || 'Chưa cập nhật', roleName: x.roleName, status: accountStatusLabel(x.status), raw: x } }

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
function adminColumnWidth(col: Column) {
  const widths: Partial<Record<Key, Record<string, number>>> = {
    doctors: { id: 90, name: 220, specialty: 190, degree: 130, fee: 140, phone: 140, email: 220, roomNumber: 110, status: 150 },
    specialties: { id: 90, name: 240, doctorCount: 110, activeDoctorCount: 140, rooms: 180, feeRange: 220, status: 150 },
    patients: { patientCode: 130, name: 230, dateOfBirth: 140, age: 90, gender: 110, phone: 145, email: 220, citizenId: 160, bloodType: 110, address: 260, allergyNote: 240, history: 280, status: 150 },
    appointments: { id: 110, patientName: 240, doctorName: 220, dateTime: 210, status: 160 },
    medicines: { id: 80, name: 260, activeIngredient: 210, medicineType: 180, unit: 110, price: 140, stock: 100, minStockLevel: 120, expiryDate: 140, stockStatus: 150 },
    bills: { id: 130, patientId: 140, appointmentId: 140, amount: 160, status: 160 },
    accounts: { id: 120, fullName: 220, username: 160, email: 240, phoneNumber: 150, roleName: 150, status: 150 },
    nurses: { id: 120, fullName: 220, username: 160, email: 240, phoneNumber: 150, roleName: 150, status: 150 },
  }
  return widths[key.value]?.[col.key] || (col.right ? 140 : 180)
}
function adminColumnFilter(columnKey: string) {
  return (filterValue: string | number | boolean, record: Row) =>
    normalizeSearchText(record[columnKey]).includes(normalizeSearchText(filterValue))
}
function adminColumnSorter(col: Column) {
  if (col.right) {
    return (a: Row, b: Row) => toNumberAllowZero(a[`${col.key}Value`], a[col.key]) - toNumberAllowZero(b[`${col.key}Value`], b[col.key])
  }
  return (a: Row, b: Row) => String(a[col.key] || '').localeCompare(String(b[col.key] || ''), 'vi')
}
function adminColumnFilters(columnKey: string) {
  const values = new Set<string>()
  rows.value.forEach((row) => {
    const label = value(row[columnKey])
    if (label) values.add(label)
  })
  return Array.from(values)
    .sort((a, b) => a.localeCompare(b, 'vi'))
    .map((item) => ({ text: item, value: item }))
}
function handleAdminTableChange(pagination: { current?: number; pageSize?: number }) {
  currentPage.value = pagination.current || 1
  itemsPerPage.value = pagination.pageSize || 10
}
function adminTableCustomRow(record: Row) {
  if (key.value !== 'appointments') return {}
  return {
    class: 'cursor-pointer',
    onClick: () => openAppointmentDetails(record),
  }
}
function getFilterKeys(event: Event) {
  const filterValue = (event.target as HTMLInputElement)?.value || ''
  return filterValue ? [filterValue] : []
}
function clearAdminFilter(clearFilters: (() => void) | undefined, confirm: () => void) {
  clearFilters?.()
  confirm()
}
function adminColumnKey(column: Row) {
  return String(column.key || column.dataIndex || '')
}
function isAdminBadgeColumn(column: Row) {
  return Boolean(column.badge)
}
function isAdminStrongColumn(column: Row) {
  return Boolean(column.strong)
}
function normalizeSearchText(valueToNormalize: unknown) {
  return String(valueToNormalize || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}
function columnHeaderClass(col: Column) { return ['h-11 px-4 py-2.5 align-middle', col.right ? 'text-right' : 'text-left', columnWidthClass(col), compactColumnClass(col)] }
function columnCellClass(col: Column) { return ['h-[58px] px-4 py-3 align-middle', col.right ? 'text-right' : 'text-left', columnWidthClass(col), compactColumnClass(col)] }
function columnWidthClass(col: Column) {
  if (key.value !== 'medicines') {
    const commonWidths: Partial<Record<Key, Record<string, string>>> = {
      doctors: { id: 'w-24', name: 'w-64', specialty: 'w-52', degree: 'w-36', fee: 'w-36', phone: 'w-36', email: 'w-56', roomNumber: 'w-28', status: 'w-36' },
      specialties: { id: 'w-24', name: 'w-64', doctorCount: 'w-28', activeDoctorCount: 'w-36', rooms: 'w-48', feeRange: 'w-56', status: 'w-36' },
      patients: { patientCode: 'w-32', name: 'w-64', dateOfBirth: 'w-36', age: 'w-24', gender: 'w-28', phone: 'w-36', email: 'w-56', citizenId: 'w-40', bloodType: 'w-28', address: 'w-64', allergyNote: 'w-60', history: 'w-72', status: 'w-36' },
      appointments: { id: 'w-28', patientName: 'w-72', doctorName: 'w-64', dateTime: 'w-56', status: 'w-40' },
    }
    return commonWidths[key.value]?.[col.key] || ''
  }
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
function compactTextClassByKey(columnKey: string) { return key.value === 'medicines' && ['medicineType', 'activeIngredient'].includes(columnKey) ? 'break-words leading-6' : '' }
const actionHeaderClass = computed(() => ['sticky right-0 z-20 h-11 w-32 bg-slate-50 px-4 py-2.5 text-center align-middle shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.65)]'])
const actionCellClass = computed(() => ['sticky right-0 z-10 h-[58px] w-32 bg-white px-4 py-3 text-center align-middle shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.65)]'])

function scheduleViewTabClass(tab: ScheduleTab) {
  return [
    'inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition sm:flex-none',
    scheduleTab.value === tab ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900',
  ]
}
function scheduleQuickButtonClass(range: ScheduleQuickRange) {
  const active = isScheduleQuickRangeActive(range)
  return [
    'inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition',
    active ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
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
  const base = 'schedule-event group w-full border text-left transition focus:outline-none focus:ring-2'
  if (row.hasConflict) return [base, 'border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-400 focus:ring-amber-200']
  if (row.isAvailable === false) return [base, 'border-rose-200 bg-rose-50 text-rose-950 hover:border-rose-300 focus:ring-rose-200']
  return [base, 'border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:border-emerald-300 focus:ring-emerald-200']
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
function scheduleStatusDotClass(row: Row) {
  return [
    'mt-1 h-2 w-2 shrink-0 rounded-full',
    row.hasConflict ? 'bg-amber-500' : row.isAvailable === false ? 'bg-rose-500' : 'bg-emerald-500',
  ]
}
function scheduleItemsForShift(items: Row[], shift: ScheduleShiftKey) {
  return items.filter((item) => {
    const start = Number(item.startMinutes || 0)
    if (shift === 'morning') return start < 12 * 60
    if (shift === 'afternoon') return start >= 12 * 60 && start < 18 * 60
    return start >= 18 * 60
  })
}

function showToast(title: string, message: string, type: 'success' | 'error') {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
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
    status: appointmentStatusLabel(getAny(row, raw, 'statusRaw', 'status', 'Status') || row.status),
    appointmentDateLabel: date(toOptionalString(appointmentDate)),
    slotTime: getAny(row, raw, 'slotTime', 'SlotTime') || '-',
    queueNumber: getAny(row, raw, 'queueNumber', 'QueueNumber') || '-',
    examFeeLabel: money(toNumber(getAny(row, raw, 'feeValue', 'examFee', 'ExamFee', 'doctor.examFee', 'Doctor.ExamFee'))),
    checkedInAtLabel: checkedInAt ? dateTime(toOptionalString(checkedInAt)) : 'Chưa check-in',
  }
}
function canDeleteAppointment(row: Row) { return Boolean(row.id || row.appointmentId) }
function deleteAppointmentMessage(status: unknown) {
  const bucket = statusBucket(status)
  if (bucket === 'completed') return 'Đã xóa lịch đã khám xong khỏi danh sách quản trị.'
  if (bucket === 'cancelled') return 'Đã xóa lịch đã hủy khỏi danh sách quản trị.'
  return 'Đã xóa lịch chưa xác nhận khỏi danh sách quản trị.'
}
function statusBucket(status: unknown) {
  const s = normalizeSearchText(status)
  if (s.includes('completed') || s === 'done' || s.includes('hoan tat') || s.includes('da kham')) return 'completed'
  if (s.includes('pending') || s.includes('waiting') || s.includes('cho duyet') || s.includes('dang cho') || s.includes('chua xac nhan') || s.includes('cho xac nhan')) return 'pending'
  if (s.includes('confirmed') || s.includes('da duyet') || s.includes('xac nhan')) return 'confirmed'
  if (s.includes('checkedin') || s.includes('checked in') || s.includes('check-in') || s.includes('tiep nhan')) return 'checkedin'
  if (s.includes('inprogress') || s.includes('in progress') || s.includes('dang kham')) return 'inprogress'
  if (s.includes('cancel') || s.includes('da huy')) return 'cancelled'
  if (s.includes('expired') || s.includes('qua han')) return 'expired'
  if (s.includes('noshow') || s.includes('no show') || s.includes('khong den')) return 'noshow'
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
function statusClass(v: unknown) {
  const s = normalizeSearchText(v)
  if (s.includes('cho') || s.includes('pending') || s.includes('waiting') || s.includes('unpaid') || s.includes('ton thap')) return 'bg-amber-100 text-amber-700'
  if (s.includes('duyet') || s.includes('xac nhan') || s.includes('confirmed')) return 'bg-blue-100 text-blue-700'
  if (s.includes('check') || s.includes('tiep nhan') || s.includes('paid') || s.includes('du hang')) return 'bg-emerald-100 text-emerald-700'
  if (s.includes('dang') || s.includes('progress')) return 'bg-indigo-100 text-indigo-700'
  if (s.includes('hoan tat') || s.includes('completed') || s.includes('done') || s.includes('da kham')) return 'bg-teal-100 text-teal-700'
  if (s.includes('cancel') || s.includes('huy') || s.includes('het') || s.includes('tam') || s.includes('khoa') || s.includes('locked') || s.includes('qua han') || s.includes('khong den')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
function money(v: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0)) }
function date(v?: string) { if (!v) return 'Chưa cập nhật'; const d = parseInputDate(v); return d ? new Intl.DateTimeFormat('vi-VN').format(d) : v }
function dateTime(v?: string) { if (!v) return 'Chưa cập nhật'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(d) }
function dateOnly(v?: string) { if (!v) return 'Chưa cập nhật'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10) }
function formValue(row: Row | undefined, key: string) {
  if (!row) {
    if (key === 'status') return route.meta.adminResource === 'patients' ? 'Đang hoạt động' : 'Active'
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
  if (key === 'dateOfBirth') return dateInputValue(raw.dateOfBirth ?? raw.DateOfBirth ?? row.dateOfBirth)
  if (key === 'allergyNote') return String(raw.allergyNote ?? raw.AllergyNote ?? raw.allergies ?? row.allergyNote ?? '')
  if (key === 'status' && (row.patientCode || raw.patientCode || raw.PatientCode)) return patientStatusLabel(raw.status ?? raw.Status ?? row.status)
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

<style scoped>
.schedule-workspace {
  color: #0f172a;
}

.schedule-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.035);
}

.schedule-summary-item {
  display: flex;
  min-height: 74px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-right: 1px solid #eef2f7;
}

.schedule-summary-item:last-child {
  border-right: 0;
}

.schedule-summary-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.schedule-filter-panel,
.schedule-board-shell {
  overflow: hidden;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.04);
}

.schedule-field-label {
  display: block;
  margin-bottom: 7px;
  color: #64748b;
  font-size: 11px;
  font-weight: 650;
  line-height: 16px;
}

.schedule-control {
  width: 100%;
  height: 40px;
  border: 1px solid #dfe5ec;
  border-radius: 7px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 550;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.schedule-control::placeholder {
  color: #94a3b8;
  font-weight: 450;
}

.schedule-control:focus {
  border-color: #6b9ddd;
  box-shadow: 0 0 0 3px rgb(15 82 186 / 0.08);
}

.schedule-board-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #fbfcfe;
}

.schedule-icon-button {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dfe5ec;
  border-radius: 7px;
  background: #ffffff;
  color: #475569;
  transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
}

.schedule-icon-button:hover {
  border-color: #b8c5d6;
  background: #f8fafc;
  color: #0f172a;
}

.schedule-calendar {
  display: grid;
  grid-template-columns: 126px repeat(7, minmax(0, 1fr));
}

.schedule-calendar-corner,
.schedule-day-header {
  min-height: 82px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #dfe5ec;
  background: #f8fafc;
}

.schedule-calendar-corner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #64748b;
  font-size: 11px;
  font-weight: 650;
}

.schedule-day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.schedule-day-header:last-child {
  border-right: 0;
}

.schedule-day-header--today {
  background: #eff6ff;
}

.schedule-day-number {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  margin-block: 3px;
  border-radius: 50%;
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
}

.schedule-day-number--today {
  background: #0f52ba;
  color: #ffffff;
  box-shadow: 0 4px 10px rgb(15 82 186 / 0.22);
}

.schedule-shift-label {
  display: flex;
  min-height: 178px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 18px 14px;
  border-right: 1px solid #dfe5ec;
  border-bottom: 1px solid #e2e8f0;
  background: #fbfcfe;
  font-size: 12px;
}

.schedule-shift-dot {
  width: 8px;
  height: 8px;
  margin-bottom: 4px;
  border-radius: 50%;
}

.schedule-calendar-cell {
  position: relative;
  min-width: 0;
  min-height: 178px;
  padding: 8px;
  border-right: 1px solid #eef2f7;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.schedule-calendar-cell:nth-child(8n) {
  border-right: 0;
}

.schedule-calendar-cell--today {
  background: #f8fbff;
}

.schedule-event {
  display: block;
  margin-bottom: 7px;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.035);
}

.schedule-event:last-of-type {
  margin-bottom: 0;
}

.schedule-empty-cell {
  position: absolute;
  top: 50%;
  left: 50%;
  color: #cbd5e1;
  font-size: 13px;
  transform: translate(-50%, -50%);
}

.schedule-mobile-day {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

@media (min-width: 1280px) {
  .schedule-board-toolbar {
    flex-direction: row;
    align-items: center;
  }
}

@media (max-width: 1023px) {
  .schedule-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .schedule-summary-item {
    border-bottom: 1px solid #eef2f7;
  }

  .schedule-summary-item:nth-child(2n) {
    border-right: 0;
  }

  .schedule-summary-item:last-child {
    grid-column: 1 / -1;
    border-bottom: 0;
  }
}

@media (max-width: 639px) {
  .schedule-summary-item {
    min-height: 66px;
    padding: 11px 12px;
  }
}

.admin-form-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 121;
  display: flex;
  width: min(100vw, 42rem);
  height: 100vh;
  height: 100dvh;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: -24px 0 54px rgb(15 23 42 / 0.18);
}

.admin-form-drawer--wide {
  width: min(100vw, 56rem);
}

.admin-drawer-slide-enter-active,
.admin-drawer-slide-leave-active {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease;
}

.admin-drawer-slide-enter-from,
.admin-drawer-slide-leave-to {
  opacity: 0.98;
  transform: translateX(100%);
}

.admin-drawer-slide-enter-to,
.admin-drawer-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.admin-drawer-fade-enter-active,
.admin-drawer-fade-leave-active {
  transition: opacity 220ms ease;
}

.admin-drawer-fade-enter-from,
.admin-drawer-fade-leave-to {
  opacity: 0;
}

.admin-drawer-fade-enter-to,
.admin-drawer-fade-leave-from {
  opacity: 1;
}

.admin-confirm-fade-enter-active,
.admin-confirm-fade-leave-active {
  transition: opacity 180ms ease;
}

.admin-confirm-fade-enter-from,
.admin-confirm-fade-leave-to {
  opacity: 0;
}

.admin-confirm-fade-enter-active .admin-confirm-card,
.admin-confirm-fade-leave-active .admin-confirm-card {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease;
}

.admin-confirm-fade-enter-from .admin-confirm-card,
.admin-confirm-fade-leave-to .admin-confirm-card {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.admin-table-shell {
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.035);
}

.admin-table-shell table {
  border-collapse: separate;
  border-spacing: 0;
}

.admin-filter {
  width: 270px;
  padding: 16px;
  border: 1px solid #e8edf3;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 14px 36px rgb(15 23 42 / 0.1);
}

.admin-filter-title {
  margin-bottom: 10px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
}

.admin-filter :deep(.ant-input-affix-wrapper),
.admin-filter :deep(.ant-input) {
  font-size: 12px;
}

.admin-filter :deep(.ant-input-affix-wrapper) {
  height: 38px;
  padding-inline: 11px;
  border-color: #dfe5ec;
  border-radius: 8px;
  box-shadow: none;
}

.admin-filter :deep(.ant-input-affix-wrapper:hover),
.admin-filter :deep(.ant-input-affix-wrapper-focused) {
  border-color: #93b4e6;
  box-shadow: 0 0 0 3px rgb(15 82 186 / 0.08);
}

.admin-filter-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.admin-filter :deep(.ant-btn) {
  height: 34px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 650;
}

.admin-filter :deep(.ant-btn-primary) {
  background: #0f52ba;
  box-shadow: none;
}

.admin-filter :deep(.ant-btn-primary:hover) {
  background: #003c90;
}

:global(.ant-table-filter-dropdown .admin-filter) {
  margin: -4px;
}

:global(.ant-table-filter-dropdown .ant-dropdown-menu-title-content),
:global(.ant-table-filter-dropdown .ant-checkbox-wrapper) {
  font-size: 12px;
  font-weight: 400;
}

:global(.ant-table-filter-dropdown-btns .ant-btn) {
  font-size: 12px;
  font-weight: 500;
}

:deep(.admin-table-shell .ant-table) {
  color: #334155;
  font-size: 13px;
}

:deep(.admin-table-shell .ant-table-thead > tr > th) {
  height: 44px;
  padding-block: 10px;
  border-bottom: 1px solid #e8edf3;
  background: #f9fbfd;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 650;
}

:deep(.admin-table-shell .ant-table-tbody > tr > td) {
  height: 58px;
  padding-block: 11px;
  border-bottom-color: #eef2f7;
}

:deep(.admin-table-shell .ant-table-tbody > tr:last-child > td) {
  border-bottom: 0;
}

:deep(.admin-table-shell .ant-table-tbody > tr:hover > td) {
  background: #f7faff;
}

:deep(.admin-table-shell .ant-table-tbody > tr > td.ant-table-cell-fix-right),
:deep(.admin-table-shell .ant-table-thead > tr > th.ant-table-cell-fix-right) {
  background: #ffffff;
}

:deep(.admin-table-shell .ant-table-thead > tr > th.ant-table-cell-fix-right) {
  background: #f9fbfd;
}

:deep(.admin-table-shell .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right) {
  background: #f7faff;
}

:deep(.admin-table-shell .ant-table-cell-fix-right-first::after) {
  box-shadow: inset -8px 0 8px -8px rgb(15 23 42 / 0.16);
}

:deep(.admin-table-shell .ant-table-column-sorter),
:deep(.admin-table-shell .ant-table-filter-trigger) {
  color: #94a3b8;
  opacity: 0.45;
  transition: color 160ms ease, opacity 160ms ease;
}

:deep(.admin-table-shell th:hover .ant-table-column-sorter),
:deep(.admin-table-shell th:hover .ant-table-filter-trigger),
:deep(.admin-table-shell .ant-table-filter-trigger.active) {
  opacity: 1;
}

:deep(.admin-table-shell .ant-table-filter-trigger:hover),
:deep(.admin-table-shell .ant-table-filter-trigger.active),
:deep(.admin-table-shell .ant-table-column-sorter-up.active),
:deep(.admin-table-shell .ant-table-column-sorter-down.active) {
  color: #0f52ba;
}

:deep(.admin-table-shell .ant-pagination) {
  min-height: 58px;
  margin: 0;
  padding: 13px 16px;
  border-top: 1px solid #eef2f7;
  background: #fbfcfe;
  gap: 4px;
}

:deep(.admin-table-shell .ant-pagination-total-text) {
  margin-right: auto;
  color: #64748b;
  font-size: 12px;
  line-height: 30px;
}

:deep(.admin-table-shell .ant-pagination-item),
:deep(.admin-table-shell .ant-pagination-prev .ant-pagination-item-link),
:deep(.admin-table-shell .ant-pagination-next .ant-pagination-item-link) {
  min-width: 30px;
  height: 30px;
  margin-inline-end: 0;
  border-color: transparent;
  border-radius: 8px;
  background: transparent;
  line-height: 28px;
  transition: background 160ms ease, color 160ms ease;
}

:deep(.admin-table-shell .ant-pagination-item:hover),
:deep(.admin-table-shell .ant-pagination-prev:not(.ant-pagination-disabled) .ant-pagination-item-link:hover),
:deep(.admin-table-shell .ant-pagination-next:not(.ant-pagination-disabled) .ant-pagination-item-link:hover) {
  border-color: transparent;
  background: #eaf2ff;
  color: #0f52ba;
}

:deep(.admin-table-shell .ant-pagination-item-active) {
  border-color: transparent;
  background: #0f52ba;
  box-shadow: 0 4px 12px rgb(15 82 186 / 0.2);
}

:deep(.admin-table-shell .ant-pagination-item-active:hover) {
  border-color: transparent;
  background: #003c90;
}

:deep(.admin-table-shell .ant-pagination-item-active a),
:deep(.admin-table-shell .ant-pagination-item-active:hover a),
:deep(.admin-table-shell .ant-pagination-item-active:focus a) {
  color: #ffffff;
}

:deep(.admin-table-shell .ant-pagination-options) {
  margin-inline-start: 8px;
}

:deep(.admin-table-shell .ant-pagination-options .ant-select-selector) {
  height: 30px;
  border-color: #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
  font-size: 12px;
}

:deep(.admin-table-shell .ant-pagination-options .ant-select-selection-item) {
  line-height: 28px;
}

:deep(.admin-status) {
  margin: 0;
  border-radius: 999px;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
}

.admin-table-shell thead th {
  border-bottom: 1px solid #e8edf3;
}

.admin-table-shell tbody td {
  border-bottom: 1px solid #eef2f7;
}

.admin-table-shell tbody tr:last-child td {
  border-bottom: 0;
}

.admin-table-shell tbody tr:hover td {
  background: #f7faff;
}

.admin-table-shell tbody tr:hover td:last-child {
  background: #f7faff;
}

.admin-table-shell ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.admin-table-shell ::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.admin-table-shell ::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #94a3b8;
}

.admin-table-shell ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
