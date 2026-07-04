<template>
  <section class="space-y-6">
    <FullscreenLoader :show="loading" />

    <div v-if="isExamDetailMode" class="sticky top-0 z-20 -mx-2 border-b border-slate-200 bg-white/95 px-2 py-3 backdrop-blur">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            @click="backToAppointments"
          >
            <X class="h-5 w-5 rotate-45" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-slate-950">Chi tiết lượt khám</h1>
            <p class="mt-1 text-sm text-slate-500">Dữ liệu hồ sơ lịch hẹn, lượt khám và thông tin bệnh án của bệnh nhân.</p>
          </div>
        </div>
        <StatusChip :status="activeVisit?.status || selectedRow?.status" />
      </div>
    </div>

    <div v-if="!isExamDetailMode && resource === 'schedule'" class="doctor-schedule-page">
      <header class="schedule-page-header">
        <div class="schedule-title-row">
          <div>
            <p class="schedule-page-kicker">Lịch trực cá nhân</p>
            <h1>Lịch làm việc</h1>
            <p>Theo dõi ca trực, phòng khám và trạng thái nhận lịch trong tuần.</p>
          </div>
          <div class="schedule-page-actions">
            <button type="button" class="schedule-icon-action" :disabled="loading" title="Tuần trước" @click="moveScheduleWeek(-1)">
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button type="button" class="schedule-week-button" @click="goToCurrentScheduleWeek">Tuần này</button>
            <button type="button" class="schedule-icon-action" :disabled="loading" title="Tuần sau" @click="moveScheduleWeek(1)">
              <ChevronRight class="h-4 w-4" />
            </button>
            <button type="button" class="schedule-icon-action" :disabled="loading" title="Tải lại" @click="loadData">
              <RefreshCw class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="schedule-header-controls">
          <div class="schedule-toolbar-main">
            <span class="relative block">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="filters.keyword"
                class="schedule-search-input"
                placeholder="Tìm phòng, giờ làm, trạng thái..."
              />
            </span>
            <select v-model="filters.status" class="schedule-select">
              <option value="">Tất cả trạng thái</option>
              <option value="available">Còn nhận lịch</option>
              <option value="full">Đã kín lịch</option>
            </select>
          </div>
          <div class="schedule-range-controls">
            <label>
              <span>Từ ngày</span>
              <input v-model="filters.fromDate" type="date" />
            </label>
            <label>
              <span>Đến ngày</span>
              <input v-model="filters.toDate" type="date" />
            </label>
          </div>
        </div>

        <div class="schedule-week-summary">
          <div>
            <p>Khoảng lịch</p>
            <strong>{{ scheduleRangeLabel }}</strong>
          </div>
          <div>
            <p>Tổng ca</p>
            <strong>{{ filteredRows.length }}</strong>
          </div>
          <div>
            <p>Còn nhận lịch</p>
            <strong>{{ scheduleAvailableCount }}</strong>
          </div>
          <div>
            <p>Tổng giờ trực</p>
            <strong>{{ scheduleTotalHours }}</strong>
          </div>
        </div>
      </header>
    </div>

    <div v-if="!isExamDetailMode && resource !== 'schedule' && resource !== 'records' && resource !== 'queue'" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{{ config.kicker }}</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{{ config.title }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ config.description }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Bác sĩ: {{ doctorName }}
            </span>
            <!-- <span class="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700">
              {{ config.endpoint }}
            </span> -->
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="outline" :disabled="loading" @click="resetFilters">
            <template #icon><RotateCcw class="h-4 w-4" /></template>
            Đặt lại bộ lọc
          </BaseButton>
          <BaseButton variant="outline" :loading="loading" @click="loadData">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-if="!isExamDetailMode && resource !== 'schedule' && resource !== 'records' && resource !== 'queue'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard v-for="metric in metrics" :key="metric.label" :metric="metric" />
    </div>

    <div v-if="!isExamDetailMode && resource !== 'schedule' && resource !== 'records' && resource !== 'queue'" class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 xl:grid-cols-[1.4fr_180px_180px_180px_180px_auto] xl:items-end">
        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-slate-700">Tìm kiếm</span>
          <span class="relative block">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="filters.keyword"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              :placeholder="config.searchPlaceholder"
            />
          </span>
        </label>

        <BaseInput v-model="filters.date" label="Ngày khám" type="date" />
        <BaseInput v-model="filters.fromDate" label="Từ ngày" type="date" />
        <BaseInput v-model="filters.toDate" label="Đến ngày" type="date" />
        <BaseSelect v-model="filters.status" label="Trạng thái" :options="statusOptions" placeholder="Tất cả" />

        <BaseButton variant="secondary" :loading="loading" @click="loadData">
          Lọc dữ liệu
        </BaseButton>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        Mặc định chỉ hiển thị dữ liệu ngày hôm nay của bác sĩ đang đăng nhập. Chọn khoảng ngày nếu cần đối chiếu dữ liệu cũ.
      </p>
    </div>

    <div v-if="note" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{{ note }}</div>
    <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {{ error }}
      <button type="button" class="ml-2 font-bold text-blue-700 underline" @click="loadData">Thử lại</button>
    </div>

    <div v-if="resource === 'records'" class="doctor-records-page">
      <header class="doctor-records-header">
        <div>
          <h1>Hồ sơ bệnh án</h1>
          <p>Theo dõi bệnh án đã lưu theo bác sĩ đang đăng nhập, gồm chẩn đoán, tái khám và trạng thái xử lý.</p>
        </div>
        <div class="doctor-records-header-actions">
          <BaseButton variant="outline" :disabled="loading || !filteredRows.length" @click="exportDoctorRecordsExcel">
            <template #icon><Download class="h-4 w-4" /></template>
            Xuất Excel
          </BaseButton>
        </div>
      </header>

      <div class="doctor-records-stats">
        <div class="doctor-record-stat-card is-total">
          <div class="flex items-center justify-between">
            <span>Tổng số hồ sơ</span>
            <span class="doctor-record-stat-icon"><FileHeart class="h-5 w-5" /></span>
          </div>
          <p>{{ doctorRecordStats.total }}</p>
          <small>Tất cả hồ sơ bệnh án</small>
        </div>
        <div class="doctor-record-stat-card is-completed">
          <div class="flex items-center justify-between">
            <span>Đã hoàn tất</span>
            <span class="doctor-record-stat-icon"><CheckCircle2 class="h-5 w-5" /></span>
          </div>
          <p>{{ doctorRecordStats.completed }}</p>
          <small>Khám xong & lưu kết quả</small>
        </div>
        <div class="doctor-record-stat-card is-draft">
          <div class="flex items-center justify-between">
            <span>Bản nháp</span>
            <span class="doctor-record-stat-icon"><FilePenLine class="h-5 w-5" /></span>
          </div>
          <p>{{ doctorRecordStats.draft }}</p>
          <small>Bệnh án chưa hoàn thành</small>
        </div>
        <div class="doctor-record-stat-card is-follow">
          <div class="flex items-center justify-between">
            <span>Có lịch tái khám</span>
            <span class="doctor-record-stat-icon"><CalendarClock class="h-5 w-5" /></span>
          </div>
          <p>{{ doctorRecordStats.followUp }}</p>
          <small>Bệnh nhân có lịch hẹn tới</small>
        </div>
      </div>

      <div class="doctor-record-table-shell">
        <ATable
          :columns="doctorRecordTableColumns"
          :data-source="filteredRows"
          :pagination="doctorRecordPagination"
          :row-key="doctorRecordIdentity"
          size="middle"
          table-layout="fixed"
          @change="handleDoctorRecordTableChange"
        >
          <template #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
            <div class="doctor-record-filter">
              <p class="doctor-record-filter-title">Tìm theo {{ String(column.title).toLowerCase() }}</p>
              <AInput
                :value="selectedKeys[0]"
                :placeholder="`Nhập ${String(column.title).toLowerCase()}...`"
                allow-clear
                autofocus
                @change="setSelectedKeys(getDoctorRecordFilterKeys($event))"
                @press-enter="confirm()"
              >
                <template #prefix><Search class="h-3.5 w-3.5 text-slate-400" /></template>
              </AInput>
              <div class="doctor-record-filter-actions">
                <AButton size="small" class="doctor-record-filter-reset" @click="clearDoctorRecordFilter(clearFilters, confirm)">Đặt lại</AButton>
                <AButton type="primary" size="small" class="doctor-record-filter-submit" @click="confirm()">Áp dụng</AButton>
              </div>
            </div>
          </template>
          <template #customFilterIcon="{ filtered, column }">
            <CheckSquare v-if="column.key === 'status'" :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
            <Search v-else :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
          </template>
          <template #emptyText>
            <div class="py-8 text-center">
              <FileHeart class="mx-auto h-9 w-9 text-slate-300" />
              <p class="mt-3 font-bold text-slate-800">Không có hồ sơ bệnh án phù hợp</p>
              <p class="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm trong từng cột.</p>
            </div>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'code'">
              <span class="font-mono text-xs font-semibold text-[#0F52BA]">{{ doctorRecordCode(record) }}</span>
            </template>
            <template v-else-if="column.key === 'patientName'">
              <span class="line-clamp-2 text-[13px] font-bold leading-5 text-slate-800" :title="doctorRecordPatientName(record)">
                {{ doctorRecordPatientName(record) }}
              </span>
            </template>
            <template v-else-if="column.key === 'diagnosis'">
              <span class="line-clamp-2 max-w-sm text-[13px] font-medium leading-5 text-slate-700" :title="doctorRecordDiagnosis(record)">
                {{ doctorRecordDiagnosis(record) }}
              </span>
            </template>
            <template v-else-if="column.key === 'diagnosisCode'">
              <span class="font-mono text-xs font-medium text-slate-600">{{ record.diagnosisCode || '-' }}</span>
            </template>
            <template v-else-if="column.key === 'createdAt'">
              <div class="flex items-center gap-2 whitespace-nowrap">
                <CalendarClock class="h-3.5 w-3.5 text-slate-400" />
                <span class="text-[13px] font-medium text-slate-600">{{ formatDate(record.date || record.raw?.createdAt) }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'followUpDate'">
              <ATag v-if="doctorRecordFollowUpDate(record)" :bordered="false" class="doctor-record-follow-tag">{{ formatDate(doctorRecordFollowUpDate(record)) }}</ATag>
              <span v-else class="text-xs font-semibold text-slate-400">Chưa có</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <ATag :bordered="false" :class="['doctor-record-status-tag', doctorRecordStatusClass(record.status)]">
                {{ statusText(record.status) }}
              </ATag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <div class="doctor-record-actions">
                <button type="button" class="doctor-record-action-button doctor-record-action-primary" title="Xem chi tiết bệnh án" @click="openRecord(record)">
                  <Eye class="h-4 w-4" />
                </button>
                <button type="button" class="doctor-record-action-button doctor-record-action-muted" title="In hồ sơ bệnh án" @click="printDoctorRecord(record)">
                  <Printer class="h-4 w-4" />
                </button>
              </div>
            </template>
          </template>
        </ATable>
      </div>
    </div>

    <div v-else-if="resource === 'examine' && isExamDetailMode">
      <ExaminationWorkspace
        :row="selectedRow"
        :active-visit="activeVisit"
        :active-record="activeRecord"
        :active-patient="activePatient"
        :clinical-orders="clinicalOrders"
        :medicines="medicines"
        :medicine-loading="medicineLoading"
        :saving="savingExam"
        :exam-form="examForm"
        :vitals-form="vitalsForm"
        :history-form="historyForm"
        :order-form="orderForm"
        :clinical-checklist="clinicalChecklist"
        :prescription-items="prescriptionItems"
        @start="startVisit"
        @save-draft="saveDraft"
        @save-vitals="saveVitals"
        @save-record="saveMedicalRecord"
        @add-order="addClinicalOrder"
        @save-order-result="saveClinicalOrderResult"
        @add-prescription-row="addPrescriptionRow"
        @select-prescription-medicine="selectPrescriptionMedicine"
        @toggle-medicine="toggleMedicine"
        @remove-medicine="removeMedicine"
        @submit="submitExamination"
      />
    </div>

    <div v-else-if="resource === 'examine'" class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 p-4">
          <h2 class="font-bold text-slate-950">Bệnh nhân cần khám</h2>
          <p class="mt-1 text-sm text-slate-500">Chọn một lượt khám đã check-in để ghi bệnh án và kê đơn.</p>
        </div>
        <div v-if="loading" class="space-y-3 p-4">
          <LoadingSkeleton v-for="item in 4" :key="item" />
        </div>
        <div v-else-if="filteredRows.length" class="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
          <button
            v-for="row in filteredRows"
            :key="row.key"
            type="button"
            :class="[
              'block w-full p-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100',
              selectedRow?.key === row.key ? 'bg-blue-50' : 'bg-white',
            ]"
            @click="selectVisit(row)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-bold text-slate-950">{{ row.patientName }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ row.timeLabel }} · {{ row.reason }}</p>
              </div>
              <StatusChip :status="row.status" />
            </div>
          </button>
        </div>
        <EmptyState v-else title="Không có lượt khám phù hợp" text="Chưa có lượt khám hôm nay cho bác sĩ này hoặc bệnh nhân chưa được làm thủ tục tiếp nhận." />
      </div>

      <ExaminationWorkspace
        :row="selectedRow"
        :active-visit="activeVisit"
        :active-record="activeRecord"
        :active-patient="activePatient"
        :clinical-orders="clinicalOrders"
        :medicines="medicines"
        :medicine-loading="medicineLoading"
        :saving="savingExam"
        :exam-form="examForm"
        :vitals-form="vitalsForm"
        :history-form="historyForm"
        :order-form="orderForm"
        :clinical-checklist="clinicalChecklist"
        :prescription-items="prescriptionItems"
        @start="startVisit"
        @save-draft="saveDraft"
        @save-vitals="saveVitals"
        @save-record="saveMedicalRecord"
        @add-order="addClinicalOrder"
        @save-order-result="saveClinicalOrderResult"
        @add-prescription-row="addPrescriptionRow"
        @select-prescription-medicine="selectPrescriptionMedicine"
        @toggle-medicine="toggleMedicine"
        @remove-medicine="removeMedicine"
        @submit="submitExamination"
      />
    </div>

    <div v-else-if="resource === 'schedule'" class="doctor-schedule-page">
      <section class="schedule-calendar-shell">
        <div v-if="loading" class="schedule-loading">
          <LoadingSkeleton v-for="item in 7" :key="item" />
        </div>

        <div v-else class="schedule-week-grid">
          <article
            v-for="day in scheduleWeekDays"
            :key="day.iso"
            :class="['schedule-day-column', day.isToday ? 'is-today' : '']"
          >
            <header class="schedule-day-header">
              <span>{{ day.weekday }}</span>
              <strong>{{ day.dayNumber }}</strong>
              <em>{{ day.monthLabel }}</em>
            </header>

            <div class="schedule-day-body">
              <button
                v-for="shift in day.items"
                :key="shift.key"
                type="button"
                class="schedule-shift-card"
                @click="runAction('view', shift)"
              >
                <span :class="['schedule-shift-dot', shift.isAvailable === false ? 'is-full' : 'is-open']"></span>
                <span class="schedule-shift-time">{{ shift.timeRange }}</span>
                <span class="schedule-shift-room">{{ shift.room }}</span>
                <span class="schedule-shift-meta">{{ shift.slotInfo }}</span>
                <span :class="['schedule-shift-status', shift.isAvailable === false ? 'is-full' : 'is-open']">
                  {{ shift.status }}
                </span>
              </button>

              <div v-if="!day.items.length" class="schedule-empty-day">
                <CalendarClock class="h-4 w-4" />
                <span>Không có ca trực</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div v-else-if="resource === 'queue'" class="doctor-record-table-shell">
      <div class="doctor-queue-table-header">
        <div>
          <p>Hàng chờ</p>
          <h2>Hàng đợi khám</h2>
        </div>
        <div class="doctor-queue-table-actions">
          <span>{{ filteredRows.length }} lượt chờ</span>
          <button type="button" :disabled="loading" @click="loadData">
            <RefreshCw class="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>
      <ATable
        :columns="doctorQueueTableColumns"
        :data-source="filteredRows"
        :pagination="doctorQueuePagination"
        :row-key="doctorQueueIdentity"
        size="middle"
        table-layout="fixed"
        @change="handleDoctorQueueTableChange"
      >
        <template #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
          <div class="doctor-record-filter">
            <p class="doctor-record-filter-title">Tìm theo {{ String(column.title).toLowerCase() }}</p>
            <AInput
              :value="selectedKeys[0]"
              :placeholder="`Nhập ${String(column.title).toLowerCase()}...`"
              allow-clear
              autofocus
              @change="setSelectedKeys(getDoctorQueueFilterKeys($event))"
              @press-enter="confirm()"
            >
              <template #prefix><Search class="h-3.5 w-3.5 text-slate-400" /></template>
            </AInput>
            <div class="doctor-record-filter-actions">
              <AButton size="small" class="doctor-record-filter-reset" @click="clearDoctorQueueFilter(clearFilters, confirm)">Đặt lại</AButton>
              <AButton type="primary" size="small" class="doctor-record-filter-submit" @click="confirm()">Áp dụng</AButton>
            </div>
          </div>
        </template>
        <template #customFilterIcon="{ filtered, column }">
          <CheckSquare v-if="column.key === 'status' || column.key === 'vitals'" :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
          <Search v-else :class="['h-3.5 w-3.5', filtered ? 'text-[#0F52BA]' : 'text-slate-400']" />
        </template>
        <template #emptyText>
          <div class="py-8 text-center">
            <ClipboardList class="mx-auto h-9 w-9 text-slate-300" />
            <p class="mt-3 font-bold text-slate-800">Không có bệnh nhân trong hàng chờ</p>
            <p class="mt-1 text-sm text-slate-500">Bệnh nhân sẽ xuất hiện sau khi y tá tiếp nhận/check-in.</p>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'queueNo'">
            <span class="font-mono text-xs font-semibold text-[#0F52BA]">#{{ record.id || record.visitId || '--' }}</span>
          </template>
          <template v-else-if="column.key === 'patientName'">
            <div class="min-w-0">
              <p class="truncate text-[13px] font-bold text-slate-900" :title="record.patientName">{{ record.patientName }}</p>
              <p class="mt-0.5 text-[11px] font-semibold text-slate-400">BN {{ record.patientId || 'Chưa cập nhật' }}</p>
            </div>
          </template>
          <template v-else-if="column.key === 'timeLabel'">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <CalendarClock class="h-3.5 w-3.5 text-slate-400" />
              <span class="text-[13px] font-medium text-slate-600">{{ record.timeLabel || 'Chưa cập nhật' }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'room'">
            <span class="line-clamp-2 text-[13px] font-medium text-slate-700">{{ queueRoomOrSpecialty(record) }}</span>
          </template>
          <template v-else-if="column.key === 'reason'">
            <span class="line-clamp-2 text-[13px] font-medium text-slate-700" :title="record.reason">{{ record.reason || 'Chưa ghi lý do' }}</span>
          </template>
          <template v-else-if="column.key === 'vitals'">
            <ATag :bordered="false" :class="['doctor-queue-vital-tag', queueVitalClass(record)]">{{ queueVitalLabel(record) }}</ATag>
          </template>
          <template v-else-if="column.key === 'status'">
            <ATag :bordered="false" :class="['doctor-record-status-tag', doctorRecordStatusClass(record.status)]">{{ statusText(record.status) }}</ATag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="doctor-record-actions">
              <button type="button" class="doctor-record-action-button doctor-record-action-primary" title="Xem chi tiết hàng chờ" @click="runQueueAction('view', record)">
                <Eye class="h-4 w-4" />
              </button>
              <button type="button" class="doctor-record-action-button doctor-record-action-muted" title="Vào khám" @click="runQueueAction('start', record)">
                <Stethoscope class="h-4 w-4" />
              </button>
            </div>
          </template>
        </template>
      </ATable>
    </div>

    <div v-else class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="font-bold text-slate-950">{{ config.tableTitle }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ config.tableSubtitle }}</p>
        </div>
        <span class="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{{ filteredRows.length }} dòng</span>
      </div>

      <div v-if="loading" class="grid gap-4 p-4 md:grid-cols-3">
        <LoadingSkeleton v-for="item in 6" :key="item" />
      </div>

      <div v-else-if="filteredRows.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th v-for="column in config.columns" :key="column.key" class="px-5 py-3">{{ column.label }}</th>
              <th class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in pagedRows" :key="row.key" class="transition hover:bg-slate-50">
              <td v-for="column in config.columns" :key="column.key" class="px-5 py-4 align-top">
                <StatusChip v-if="column.key === 'status'" :status="row.status" />
                <span v-else :class="column.strong ? 'font-bold text-slate-950' : 'text-slate-700'">{{ row[column.key] || 'Chưa cập nhật' }}</span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    v-for="action in rowActions(row)"
                    :key="action.key"
                    type="button"
                    :disabled="actingKey === row.key"
                    :class="['inline-flex h-9 items-center rounded-lg px-3 text-xs font-bold transition disabled:opacity-60', action.className]"
                    @click="runAction(action.key, row)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-500">Hiển thị {{ pageStart }} - {{ pageEnd }} trên {{ filteredRows.length }} kết quả</p>
          <div class="flex items-center gap-2">
            <button class="pager-btn" :disabled="page === 1" @click="page--">Trước</button>
            <span class="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{{ page }} / {{ totalPages }}</span>
            <button class="pager-btn" :disabled="page === totalPages" @click="page++">Sau</button>
          </div>
        </div>
      </div>

      <EmptyState v-else :title="config.emptyTitle" :text="config.emptyText" />
    </div>

    <RecordDrawer v-if="recordDrawerOpen && resource !== 'records'" :row="selectedRecord" @close="recordDrawerOpen = false" />

    <Teleport to="body">
      <div v-if="recordDrawerOpen && resource === 'records'" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm transition-opacity" @click="closeRecordDrawer"></div>
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div v-if="recordDrawerOpen && resource === 'records'" class="fixed right-0 top-0 z-[120] flex h-screen w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
            <div class="flex items-start gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <FileHeart class="h-5 w-5" />
              </span>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-bold text-slate-900">Chi tiết bệnh án</h2>
                  <span :class="['rounded-full px-2 py-0.5 text-[10px] font-bold', doctorRecordStatusClass(selectedRecord?.status)]">
                    {{ statusText(selectedRecord?.status) }}
                  </span>
                </div>
                <p class="mt-1 font-mono text-xs font-semibold text-slate-500">Mã: {{ doctorRecordCode(selectedRecord) }}</p>
              </div>
            </div>
            <button type="button" class="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" @click="closeRecordDrawer">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="flex overflow-x-auto border-b border-slate-100 bg-slate-50/20 px-3">
            <button
              v-for="tab in doctorRecordTabs"
              :key="tab.key"
              type="button"
              :class="[
                'relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition',
                currentRecordTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700',
              ]"
              @click="currentRecordTab = tab.key"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </div>

          <div class="flex-1 space-y-6 overflow-y-auto p-6">
            <div v-if="currentRecordTab === 'overview'" class="space-y-4">
              <DoctorRecordSection title="Thông tin hồ sơ">
                <div class="grid gap-3 sm:grid-cols-2">
                  <DoctorRecordInfo label="Mã bệnh án" :value="doctorRecordCode(selectedRecord)" mono />
                  <DoctorRecordInfo label="Mã lượt khám" :value="selectedRecord?.raw?.visitId || selectedRecord?.visitId" mono />
                  <DoctorRecordInfo label="Bệnh nhân" :value="selectedRecord?.patientName" />
                  <DoctorRecordInfo label="Bác sĩ điều trị" :value="selectedRecord?.doctorName || doctorName" />
                </div>
              </DoctorRecordSection>
              <DoctorRecordSection title="Thời gian xử lý">
                <div class="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                  <div class="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span>Trạng thái:</span>
                    <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold', doctorRecordStatusClass(selectedRecord?.status)]">{{ statusText(selectedRecord?.status) }}</span>
                  </div>
                  <div class="mt-2 flex justify-between">
                    <span>Ngày lập hồ sơ:</span>
                    <span class="font-semibold text-slate-800">{{ formatDateTime(selectedRecord?.raw?.createdAt || selectedRecord?.date) }}</span>
                  </div>
                  <div v-if="selectedRecord?.raw?.updatedAt" class="mt-2 flex justify-between">
                    <span>Cập nhật lần cuối:</span>
                    <span class="font-semibold text-slate-800">{{ formatDateTime(selectedRecord.raw.updatedAt) }}</span>
                  </div>
                  <div v-if="selectedRecord?.raw?.completedAt" class="mt-2 flex justify-between">
                    <span>Hoàn tất lúc:</span>
                    <span class="font-semibold text-slate-800">{{ formatDateTime(selectedRecord.raw.completedAt) }}</span>
                  </div>
                </div>
              </DoctorRecordSection>
            </div>

            <div v-if="currentRecordTab === 'diagnosis'" class="space-y-4">
              <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Mã ICD</span>
                  <p class="mt-1 w-fit rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-sm font-bold text-blue-700">{{ selectedRecord?.diagnosisCode || 'Chưa ghi nhận mã ICD' }}</p>
                </div>
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Chẩn đoán</span>
                  <p class="mt-1 text-base font-bold leading-relaxed text-slate-800">{{ doctorRecordDiagnosis(selectedRecord) }}</p>
                </div>
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Chuyên khoa ICD</span>
                  <p class="mt-1 text-sm font-semibold text-slate-700">{{ selectedRecord?.diagnosisSpecialty || 'Chưa cập nhật' }}</p>
                </div>
              </div>
              <div class="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-5">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">Ghi chú và dặn dò của bác sĩ</span>
                <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">{{ selectedRecord?.note || 'Chưa có ghi chú' }}</p>
              </div>
            </div>

            <div v-if="currentRecordTab === 'treatment'" class="space-y-4">
              <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">Kế hoạch điều trị</span>
                <p class="whitespace-pre-line text-sm leading-relaxed text-slate-800">{{ selectedRecord?.raw?.treatmentPlan || 'Chưa có kế hoạch điều trị' }}</p>
              </div>
              <div class="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-5">
                <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">Ngày tái khám dự kiến</span>
                <div class="flex items-center gap-3">
                  <template v-if="doctorRecordFollowUpDate(selectedRecord)">
                    <p class="text-base font-bold text-slate-800">{{ formatDate(doctorRecordFollowUpDate(selectedRecord)) }}</p>
                    <span :class="['rounded-full px-2.5 py-1 text-xs font-bold', doctorRecordFollowUpStatus === 'UPCOMING' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800']">
                      {{ doctorRecordFollowUpStatus === 'UPCOMING' ? 'Sắp tái khám' : 'Đã qua lịch tái khám' }}
                    </span>
                  </template>
                  <span v-else class="text-xs font-medium text-slate-400">Chưa có lịch tái khám</span>
                </div>
              </div>
              <div class="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-700">
                <span class="shrink-0 font-bold">Lưu ý:</span>
                <p>Theo dõi lịch tái khám và hướng dẫn điều trị đã ghi trong hồ sơ.</p>
              </div>
            </div>

            <div v-if="currentRecordTab === 'history'" class="space-y-6">
              <div class="relative ml-4 space-y-8 border-l border-slate-200 py-2 pl-8">
                <DoctorRecordTimelineItem v-if="selectedRecord?.raw?.createdAt || selectedRecord?.date" tone="blue" title="Tạo hồ sơ" :time="formatDateTime(selectedRecord?.raw?.createdAt || selectedRecord?.date)" />
                <DoctorRecordTimelineItem v-if="selectedRecord?.raw?.updatedAt" tone="amber" title="Cập nhật hồ sơ" :time="formatDateTime(selectedRecord?.raw?.updatedAt)" />
                <DoctorRecordTimelineItem v-if="selectedRecord?.raw?.completedAt" tone="emerald" title="Bệnh án đã hoàn tất" :time="formatDateTime(selectedRecord?.raw?.completedAt)" />
                <DoctorRecordTimelineItem v-if="doctorRecordFollowUpDate(selectedRecord)" tone="indigo" title="Hẹn tái khám" :time="formatDate(doctorRecordFollowUpDate(selectedRecord))" />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="detailDrawerOpen" class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm transition-opacity" @click="closeDetailDrawer"></div>
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div v-if="detailDrawerOpen" class="fixed right-0 top-0 z-[120] flex h-screen w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div class="border-b border-slate-100 bg-slate-50/50 p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <span :class="['flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', detailAccentClass]">
                  <component :is="detailIcon" class="h-5 w-5" />
                </span>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-bold text-slate-900">{{ detailTitle }}</h2>
                    <StatusChip v-if="selectedDetail?.status" :status="selectedDetail.status" />
                  </div>
                  <p class="mt-1 font-mono text-xs font-semibold text-slate-500">Mã: {{ selectedDetail?.id || 'Chưa cập nhật' }}</p>
                </div>
              </div>
              <button type="button" class="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" @click="closeDetailDrawer">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-5">
              <section v-for="section in detailSections" :key="section.title" class="space-y-3">
                <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <component :is="section.icon" class="h-4 w-4 text-[#0F52BA]" />
                  {{ section.title }}
                </h3>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    v-for="item in section.items"
                    :key="item.label"
                    :class="['rounded-xl border border-slate-100 bg-slate-50 p-4', item.full ? 'sm:col-span-2' : '']"
                  >
                    <p class="text-xs font-semibold text-slate-400">{{ item.label }}</p>
                    <p class="mt-1.5 whitespace-pre-line break-words text-sm font-semibold text-slate-900">{{ item.value }}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <div v-if="recordToPrint" class="print-area">
      <div class="print-container p-6 bg-white max-w-2xl mx-auto text-slate-800">
        <div class="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <p class="text-lg font-bold text-[#0F52BA]">MedicareDNU</p>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Care. Safety. Trust. Always.</p>
          </div>
          <div class="text-right text-xs text-slate-500">
            <p>Hệ thống quản lý phòng khám MedicareDNU</p>
            <p>Thời gian in: {{ currentPrintDateTime() }}</p>
          </div>
        </div>

        <div class="text-center mb-6">
          <h1 class="text-xl font-bold uppercase tracking-wide text-slate-900">Hồ sơ bệnh án</h1>
          <p class="mt-1 font-mono text-xs text-slate-500">Mã số bệnh án: {{ doctorRecordCode(recordToPrint) }}</p>
        </div>

        <div class="mb-5 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin bệnh nhân</h2>
          <div class="grid grid-cols-2 gap-y-2 text-xs">
            <div><span class="font-bold text-slate-500">Mã bệnh nhân:</span> <span class="font-semibold text-slate-800">{{ printPatientCode(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Họ và tên:</span> <span class="font-semibold text-slate-800">{{ printPatientName(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Ngày sinh:</span> <span class="font-semibold text-slate-800">{{ formatDate(printPatientDateOfBirth()) }}</span></div>
            <div><span class="font-bold text-slate-500">Giới tính:</span> <span class="font-semibold text-slate-800">{{ printGenderLabel(printPatientGender()) }}</span></div>
            <div><span class="font-bold text-slate-500">Số điện thoại:</span> <span class="font-semibold text-slate-800">{{ printPatientPhone() }}</span></div>
            <div><span class="font-bold text-slate-500">Email:</span> <span class="font-semibold text-slate-800">{{ printPatientEmail() }}</span></div>
            <div><span class="font-bold text-slate-500">CCCD:</span> <span class="font-semibold text-slate-800">{{ printPatientCitizenId() }}</span></div>
            <div><span class="font-bold text-slate-500">Nhóm máu:</span> <span class="font-semibold text-slate-800">{{ printPatientBloodType() }}</span></div>
            <div class="col-span-2"><span class="font-bold text-slate-500">Địa chỉ:</span> <span class="font-semibold text-slate-800">{{ printPatientAddress() }}</span></div>
            <div class="col-span-2"><span class="font-bold text-slate-500">Tiền sử bệnh:</span> <span class="font-semibold text-slate-800">{{ printPatientMedicalHistory() }}</span></div>
            <div class="col-span-2"><span class="font-bold text-slate-500">Dị ứng:</span> <span class="font-semibold text-slate-800">{{ printPatientAllergy() }}</span></div>
          </div>
        </div>

        <div class="mb-5 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin lượt khám</h2>
          <div class="grid grid-cols-2 gap-y-2 text-xs">
            <div><span class="font-bold text-slate-500">Mã lịch hẹn:</span> <span class="font-semibold text-slate-800 font-mono">{{ printAppointmentId(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Ngày giờ khám:</span> <span class="font-semibold text-slate-800">{{ printAppointmentTimeLabel(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Chuyên khoa:</span> <span class="font-semibold text-slate-800">{{ printAppointmentSpecialty(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Số thứ tự:</span> <span class="font-semibold text-slate-800">{{ printQueueNumber(recordToPrint) }}</span></div>
            <div class="col-span-2"><span class="font-bold text-slate-500">Lý do khám:</span> <span class="font-semibold text-slate-800">{{ printChiefComplaint(recordToPrint) }}</span></div>
          </div>
        </div>

        <div class="mb-5 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin bệnh án</h2>
          <div class="grid grid-cols-2 gap-y-2 text-xs">
            <div><span class="font-bold text-slate-500">Mã lượt khám:</span> <span class="font-semibold text-slate-800 font-mono">{{ printVisitId(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Bác sĩ điều trị:</span> <span class="font-semibold text-slate-800">{{ printDoctorName(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Ngày lập bệnh án:</span> <span class="font-semibold text-slate-800">{{ formatDateTime(printRecordCreatedAt(recordToPrint)) }}</span></div>
            <div><span class="font-bold text-slate-500">Cập nhật lần cuối:</span> <span class="font-semibold text-slate-800">{{ formatDateTime(printRecordUpdatedAt(recordToPrint)) }}</span></div>
            <div><span class="font-bold text-slate-500">Hoàn tất lúc:</span> <span class="font-semibold text-slate-800">{{ formatDateTime(printRecordCompletedAt(recordToPrint)) }}</span></div>
            <div><span class="font-bold text-slate-500">Trạng thái:</span> <span class="font-semibold text-slate-800">{{ statusText(recordToPrint.status) }}</span></div>
            <div class="col-span-2"><span class="font-bold text-slate-500">Triệu chứng:</span> <span class="font-semibold text-slate-800">{{ printSymptoms(recordToPrint) }}</span></div>
          </div>
        </div>

        <div class="mb-5 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Sinh hiệu</h2>
          <div v-if="printVitalItems.length" class="grid grid-cols-4 gap-2 text-xs">
            <div v-for="item in printVitalItems" :key="item.label" class="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <p class="font-bold text-slate-500">{{ item.label }}</p>
              <p class="mt-1 font-bold text-slate-900">{{ item.value }}</p>
            </div>
          </div>
          <p v-else class="text-xs italic text-slate-500">Chưa ghi nhận sinh hiệu cho lượt khám này.</p>
          <div v-if="printVitalNote" class="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
            <span class="font-bold">Ghi chú điều dưỡng:</span> {{ printVitalNote }}
          </div>
        </div>

        <div class="mb-5 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Chẩn đoán</h2>
          <div class="space-y-2 text-xs">
            <div><span class="font-bold text-slate-500">Mã ICD:</span> <span class="font-mono font-bold rounded bg-slate-50 px-1.5 py-0.5">{{ recordToPrint.diagnosisCode || 'Chưa có thông tin' }}</span></div>
            <div><span class="font-bold text-slate-500">Chuyên khoa ICD:</span> <span class="font-semibold text-slate-800">{{ recordToPrint.diagnosisSpecialty || 'Chưa có thông tin' }}</span></div>
            <div><span class="font-bold text-slate-500">Chẩn đoán bệnh:</span> <span class="mt-0.5 block border-l-2 border-slate-200 pl-3 font-semibold text-slate-800">{{ doctorRecordDiagnosis(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Ghi chú & dặn dò:</span> <span class="mt-0.5 block whitespace-pre-line border-l-2 border-slate-200 pl-3 font-semibold text-slate-700">{{ printDoctorNote(recordToPrint) }}</span></div>
          </div>
        </div>

        <div class="mb-6 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Kế hoạch điều trị & tái khám</h2>
          <div class="space-y-2 text-xs">
            <div><span class="font-bold text-slate-500">Phương án điều trị:</span> <span class="mt-0.5 block whitespace-pre-line border-l-2 border-slate-200 pl-3 font-semibold text-slate-800">{{ printTreatmentPlan(recordToPrint) }}</span></div>
            <div><span class="font-bold text-slate-500">Lịch hẹn tái khám:</span> <span class="font-bold text-slate-800">{{ formatDate(doctorRecordFollowUpDate(recordToPrint)) }}</span></div>
          </div>
        </div>

        <div class="mb-6 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Cận lâm sàng</h2>
          <table v-if="printClinicalOrders.length" class="min-w-full border border-slate-200 text-xs">
            <thead class="bg-slate-50 text-left font-bold text-slate-600">
              <tr>
                <th class="border-r border-slate-200 px-2 py-1.5">Chỉ định</th>
                <th class="border-r border-slate-200 px-2 py-1.5">Kết quả</th>
                <th class="border-r border-slate-200 px-2 py-1.5">Kết luận</th>
                <th class="px-2 py-1.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="order in printClinicalOrders" :key="printClinicalOrderKey(order)">
                <td class="border-r border-slate-200 px-2 py-1.5">
                  <p class="font-bold text-slate-800">{{ printClinicalOrderName(order) }}</p>
                  <p class="text-slate-500">{{ printClinicalOrderType(order) }}</p>
                </td>
                <td class="border-r border-slate-200 px-2 py-1.5">{{ printClinicalOrderResult(order) }}</td>
                <td class="border-r border-slate-200 px-2 py-1.5">{{ printClinicalOrderConclusion(order) }}</td>
                <td class="px-2 py-1.5 font-semibold">{{ statusText(printClinicalOrderStatus(order)) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-xs italic text-slate-500">Không có chỉ định cận lâm sàng trong bệnh án này.</p>
        </div>

        <div class="mb-6 print-section">
          <h2 class="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Đơn thuốc</h2>
          <template v-if="activePrintPrescription">
            <div class="mb-3 grid grid-cols-2 gap-y-2 text-xs">
              <div><span class="font-bold text-slate-500">Mã đơn thuốc:</span> <span class="font-mono font-semibold text-slate-800">{{ printPrescriptionCode(activePrintPrescription) }}</span></div>
              <div><span class="font-bold text-slate-500">Ngày kê đơn:</span> <span class="font-semibold text-slate-800">{{ formatDateTime(printPrescriptionCreatedAt(activePrintPrescription)) }}</span></div>
              <div><span class="font-bold text-slate-500">Trạng thái:</span> <span class="font-semibold text-slate-800">{{ statusText(printPrescriptionStatus(activePrintPrescription)) }}</span></div>
              <div><span class="font-bold text-slate-500">Bác sĩ kê đơn:</span> <span class="font-semibold text-slate-800">{{ printDoctorName(recordToPrint) }}</span></div>
            </div>
            <table v-if="printPrescriptionItems(activePrintPrescription).length" class="mb-3 min-w-full border border-slate-200 text-xs">
              <thead class="border-b border-slate-200 bg-slate-50 text-left font-bold text-slate-600">
                <tr>
                  <th class="w-10 border-r border-slate-200 px-2 py-1.5 text-center">STT</th>
                  <th class="border-r border-slate-200 px-2 py-1.5">Tên thuốc</th>
                  <th class="w-20 border-r border-slate-200 px-2 py-1.5 text-center">Số lượng</th>
                  <th class="border-r border-slate-200 px-2 py-1.5">Liều dùng</th>
                  <th class="w-20 border-r border-slate-200 px-2 py-1.5 text-center">Số ngày</th>
                  <th class="px-2 py-1.5">Hướng dẫn</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr v-for="(item, index) in printPrescriptionItems(activePrintPrescription)" :key="printPrescriptionItemKey(item, index)">
                  <td class="border-r border-slate-200 px-2 py-1.5 text-center font-medium">{{ index + 1 }}</td>
                  <td class="border-r border-slate-200 px-2 py-1.5 font-bold text-slate-800">{{ printPrescriptionItemMedicineName(item) }}</td>
                  <td class="border-r border-slate-200 px-2 py-1.5 text-center font-bold">{{ printPrescriptionItemQuantity(item) }}</td>
                  <td class="border-r border-slate-200 px-2 py-1.5 font-medium">{{ printPrescriptionItemDosage(item) }}</td>
                  <td class="border-r border-slate-200 px-2 py-1.5 text-center font-medium">{{ printPrescriptionItemDuration(item) }}</td>
                  <td class="px-2 py-1.5 font-medium">{{ printPrescriptionItemInstruction(item) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="printPrescriptionNote(activePrintPrescription)" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              <span class="font-bold">Ghi chú đơn thuốc:</span> {{ printPrescriptionNote(activePrintPrescription) }}
            </div>
          </template>
          <p v-else class="text-xs italic text-slate-500">Chưa có đơn thuốc được ghi nhận cho bệnh án này.</p>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 text-center text-xs">
          <div>
            <p class="font-bold uppercase tracking-wide text-slate-500">Bệnh nhân</p>
            <p class="mt-0.5 text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
            <div class="h-16"></div>
            <p class="font-bold text-slate-800">{{ printPatientName(recordToPrint) }}</p>
          </div>
          <div>
            <p class="font-bold uppercase tracking-wide text-slate-500">Bác sĩ điều trị</p>
            <p class="mt-0.5 text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
            <div class="h-16"></div>
            <p class="font-bold text-slate-800">{{ printDoctorName(recordToPrint) }}</p>
          </div>
        </div>
      </div>
    </div>

    <Toast :show="toast.show" :title="toast.title" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, reactive, ref, watch, type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button as AButton, Input as AInput, Table as ATable, Tag as ATag } from 'ant-design-vue'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  FileHeart,
  FilePenLine,
  FileText,
  FlaskConical,
  HeartPulse,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Ruler,
  Save,
  Search,
  SearchX,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Trash2,
  UserRound,
  Weight,
  Wind,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import FullscreenLoader from '@/components/ui/FullscreenLoader.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { medicineApi } from '@/services/medicineApi'
import { medicalRecordApi, type MedicalVisit, type PrescriptionItemPayload } from '@/services/medicalRecordApi'
import { fallbackSpecialties } from '@/services/fallbackData'
import { currentDoctorId, filterAppointmentsForDoctor, filterQueueForDoctor, filterRecordsForDoctor, filterSchedulesForDoctor } from '@/utils/doctorScope'
import type { Appointment, WaitingQueueItem } from '@/types/appointment'
import type { Doctor, DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import type { Specialty } from '@/types/specialty'
import { displayText } from '@/utils/displayText'

type Resource = 'appointments' | 'queue' | 'examine' | 'records' | 'schedule'
type ActionKey = 'view' | 'start' | 'checkin' | 'complete' | 'cancel' | 'record'
type ToastType = 'success' | 'error'

interface Row {
  key: string | number
  id?: string | number
  appointmentId?: number
  visitId?: number
  medicalRecordId?: number
  patientId?: number | string
  doctorId?: number
  patientName?: string
  patientPhone?: string
  doctorName?: string
  date?: string
  time?: string
  timeLabel?: string
  reason?: string
  diagnosis?: string
  diagnosisCode?: string
  diagnosisSpecialty?: string
  note?: string
  status?: string
  room?: string
  raw?: any
  [key: string]: any
}

interface Column { key: string; label: string; strong?: boolean }
interface IcdCodeOption { code: string; name: string; specialty: string }
interface DetailItem { label: string; value: string; full?: boolean }
interface DetailSection { title: string; icon: any; items: DetailItem[] }
type VitalFieldType = 'number' | 'text'
interface VitalFieldConfig {
  key: string
  label: string
  unit?: string
  type: VitalFieldType
  min?: number
  max?: number
  step?: string
  maxLength?: number
  placeholder?: string
}
interface VitalSpecialtyProfile {
  baseKeys: string[]
  requiredKeys: string[]
}
interface Config {
  kicker: string
  title: string
  description: string
  endpoint: string
  searchPlaceholder: string
  tableTitle: string
  tableSubtitle: string
  emptyTitle: string
  emptyText: string
  detailTitle: string
  columns: Column[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const note = ref('')
const rows = ref<Row[]>([])
const page = ref(1)
const pageSize = 10
const actingKey = ref<string | number | null>(null)
const selectedRow = ref<Row | null>(null)
const activeVisit = ref<MedicalVisit | null>(null)
const activeRecord = ref<MedicalRecord | null>(null)
const activePatient = ref<Patient | null>(null)
const clinicalOrders = ref<Record<string, any>[]>([])
const medicines = ref<(Medicine & Record<string, any>)[]>([])
const prescriptionSpecialties = ref<Specialty[]>([])
const medicineLoading = ref(false)
const savingExam = ref(false)
const recordDrawerOpen = ref(false)
const detailDrawerOpen = ref(false)
const selectedRecord = ref<Row | null>(null)
const selectedDetail = ref<Row | null>(null)
const recordToPrint = ref<Row | null>(null)
const printPatient = ref<Record<string, any> | null>(null)
const printAppointment = ref<Record<string, any> | null>(null)
const printVisit = ref<Record<string, any> | null>(null)
const printClinicalOrders = ref<Record<string, any>[]>([])
const printPrescriptions = ref<Record<string, any>[]>([])
const currentRecordTab = ref('overview')
const doctorRecordCurrentPage = ref(1)
const doctorRecordPageSize = ref(10)
const doctorQueueCurrentPage = ref(1)
const doctorQueuePageSize = ref(10)
const toast = reactive({ show: false, title: '', message: '', type: 'success' as ToastType })

const filters = reactive({
  keyword: '',
  date: today(),
  fromDate: '',
  toDate: '',
  status: '',
})

const examForm = reactive({
  chiefComplaint: '',
  symptoms: '',
  clinicalExam: '',
  diagnosisCode: '',
  diagnosisSpecialty: '',
  diagnosis: '',
  doctorNote: '',
  treatmentPlan: '',
  followUpDate: '',
  conclusionStatus: 'Hoàn thành',
})

const vitalsForm = reactive<Record<string, string>>({
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  respiratoryRate: '',
  spo2: '',
  height: '',
  weight: '',
  note: '',
})

const historyForm = reactive({
  diabetes: false,
  hypertension: false,
  cardiovascular: false,
  asthma: false,
  other: '',
  allergies: '',
})

const orderForm = reactive({
  orderType: 'Xét nghiệm',
  orderName: '',
  reason: '',
})

const clinicalChecklist = reactive({
  bloodTest: false,
  urineTest: false,
  ultrasound: false,
  xray: false,
  ecg: false,
})

const prescriptionMedicineType = ref('')

const formInputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
const formTextareaClass = 'w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
const compactOptionClass = 'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold leading-5 transition'

const prescriptionItems = ref<PrescriptionItemPayload[]>([])

const baseVitalFields: VitalFieldConfig[] = [
  { key: 'temperature', label: 'Nhiệt độ', unit: '°C', type: 'number', min: 30, max: 45, step: '0.1', placeholder: '36.8' },
  { key: 'bloodPressure', label: 'Huyết áp', unit: 'mmHg', type: 'text', maxLength: 30, placeholder: '120/80' },
  { key: 'heartRate', label: 'Mạch', unit: 'lần/phút', type: 'number', min: 1, max: 250, step: '1' },
  { key: 'respiratoryRate', label: 'Nhịp thở', unit: 'lần/phút', type: 'number', min: 1, max: 100, step: '1' },
  { key: 'spo2', label: 'SpO2', unit: '%', type: 'number', min: 1, max: 100, step: '1' },
  { key: 'height', label: 'Chiều cao', unit: 'cm', type: 'number', min: 1, max: 300, step: '0.1' },
  { key: 'weight', label: 'Cân nặng', unit: 'kg', type: 'number', min: 1, max: 500, step: '0.1' },
]

const specialtyExtraVitalFields: Record<string, VitalFieldConfig[]> = {
  'tim mach': [
    { key: 'chestPainScore', label: 'Mức đau ngực', unit: '/10', type: 'number', min: 0, max: 10, step: '1', placeholder: '0-10' },
    { key: 'ecgNote', label: 'Ghi chú ECG nhanh', type: 'text', maxLength: 120 },
  ],
  'nhi khoa': [
    { key: 'headCircumference', label: 'Vòng đầu', unit: 'cm', type: 'number', min: 20, max: 80, step: '0.1' },
    { key: 'feedingNote', label: 'Ăn bú/ăn uống', type: 'text', maxLength: 120 },
  ],
  'da lieu': [
    { key: 'lesionArea', label: 'Vùng tổn thương da', type: 'text', maxLength: 120 },
    { key: 'itchScore', label: 'Mức ngứa', unit: '/10', type: 'number', min: 0, max: 10, step: '1' },
  ],
  'tai mui hong': [
    { key: 'painScore', label: 'Mức đau họng/tai', unit: '/10', type: 'number', min: 0, max: 10, step: '1' },
    { key: 'hearingNote', label: 'Ghi nhận nghe/nói', type: 'text', maxLength: 120 },
  ],
  'co xuong khop': [
    { key: 'painScore', label: 'Mức đau', unit: '/10', type: 'number', min: 0, max: 10, step: '1' },
    { key: 'mobilityNote', label: 'Vận động', type: 'text', maxLength: 120 },
  ],
  'mat': [
    { key: 'visualAcuityLeft', label: 'Thị lực mắt trái', type: 'text', maxLength: 30 },
    { key: 'visualAcuityRight', label: 'Thị lực mắt phải', type: 'text', maxLength: 30 },
  ],
  'san phu khoa': [
    { key: 'lastMenstrualPeriod', label: 'Kỳ kinh cuối', type: 'text', maxLength: 60 },
    { key: 'pregnancyWeek', label: 'Tuần thai', unit: 'tuần', type: 'number', min: 1, max: 42, step: '1' },
  ],
}

const defaultVitalProfile: VitalSpecialtyProfile = {
  baseKeys: ['temperature', 'bloodPressure', 'heartRate', 'spo2'],
  requiredKeys: ['temperature', 'bloodPressure', 'heartRate', 'spo2'],
}

const specialtyVitalProfiles: Record<string, VitalSpecialtyProfile> = {
  'tim mach': { baseKeys: ['bloodPressure', 'heartRate', 'spo2', 'temperature', 'respiratoryRate'], requiredKeys: ['bloodPressure', 'heartRate', 'spo2'] },
  'nhi khoa': { baseKeys: ['temperature', 'heartRate', 'respiratoryRate', 'spo2', 'height', 'weight'], requiredKeys: ['temperature', 'heartRate', 'spo2', 'weight'] },
  'da lieu': { baseKeys: ['temperature', 'bloodPressure', 'heartRate'], requiredKeys: ['lesionArea'] },
  'tai mui hong': { baseKeys: ['temperature', 'heartRate', 'spo2'], requiredKeys: [] },
  'co xuong khop': { baseKeys: ['bloodPressure', 'heartRate', 'temperature'], requiredKeys: ['painScore'] },
  'mat': { baseKeys: ['bloodPressure', 'heartRate'], requiredKeys: ['visualAcuityLeft', 'visualAcuityRight'] },
  'san phu khoa': { baseKeys: ['bloodPressure', 'heartRate', 'temperature', 'height', 'weight'], requiredKeys: ['bloodPressure', 'heartRate'] },
}

const icdCodes: IcdCodeOption[] = [
  { specialty: 'Tim mạch', code: 'I10', name: 'Tăng huyết áp' },
  { specialty: 'Tim mạch', code: 'I21.0', name: 'Nhồi máu cơ tim cấp' },
  { specialty: 'Tim mạch', code: 'I20.0', name: 'Đau thắt ngực không ổn định' },
  { specialty: 'Tim mạch', code: 'I25.1', name: 'Bệnh tim thiếu máu cục bộ' },
  { specialty: 'Tim mạch', code: 'I48', name: 'Rung nhĩ' },
  { specialty: 'Tim mạch', code: 'I50', name: 'Suy tim' },
  { specialty: 'Tim mạch', code: 'I70', name: 'Xơ vữa động mạch' },
  { specialty: 'Nhi khoa', code: 'A09', name: 'Tiêu chảy cấp' },
  { specialty: 'Nhi khoa', code: 'B08.5', name: 'Tay chân miệng' },
  { specialty: 'Nhi khoa', code: 'J03.9', name: 'Viêm amidan cấp' },
  { specialty: 'Nhi khoa', code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp' },
  { specialty: 'Nhi khoa', code: 'J11.1', name: 'Cúm có triệu chứng hô hấp' },
  { specialty: 'Nhi khoa', code: 'P07.3', name: 'Nhẹ cân sơ sinh' },
  { specialty: 'Nhi khoa', code: 'R50.9', name: 'Sốt không rõ nguyên nhân' },
  { specialty: 'Da liễu', code: 'L20', name: 'Viêm da cơ địa (chàm thể tạng)' },
  { specialty: 'Da liễu', code: 'L21', name: 'Viêm da tiết bã' },
  { specialty: 'Da liễu', code: 'L30', name: 'Viêm da khác' },
  { specialty: 'Da liễu', code: 'L40', name: 'Bệnh vảy nến' },
  { specialty: 'Da liễu', code: 'L50', name: 'Mề đay (nổi mề đay)' },
  { specialty: 'Da liễu', code: 'B02', name: 'Zona (giời leo)' },
  { specialty: 'Tai mũi họng', code: 'J00', name: 'Viêm mũi họng cấp' },
  { specialty: 'Tai mũi họng', code: 'J01', name: 'Viêm xoang cấp' },
  { specialty: 'Tai mũi họng', code: 'J03.9', name: 'Viêm amidan cấp' },
  { specialty: 'Tai mũi họng', code: 'J30.1', name: 'Viêm mũi dị ứng' },
  { specialty: 'Tai mũi họng', code: 'H65', name: 'Viêm tai giữa' },
  { specialty: 'Tai mũi họng', code: 'R04.0', name: 'Chảy máu cam' },
  { specialty: 'Cơ xương khớp', code: 'M15', name: 'Thoái hóa khớp (đa khớp)' },
  { specialty: 'Cơ xương khớp', code: 'M17', name: 'Thoái hóa khớp gối' },
  { specialty: 'Cơ xương khớp', code: 'M25.5', name: 'Đau khớp (không rõ nguyên nhân)' },
  { specialty: 'Cơ xương khớp', code: 'M54.4', name: 'Đau thắt lưng' },
  { specialty: 'Cơ xương khớp', code: 'M54.5', name: 'Đau lưng dưới' },
  { specialty: 'Cơ xương khớp', code: 'M79.1', name: 'Đau cơ' },
  { specialty: 'Cơ xương khớp', code: 'M80', name: 'Loãng xương' },
  { specialty: 'Nội tổng quát', code: 'E11', name: 'Đái tháo đường type 2 (tiểu đường)' },
  { specialty: 'Nội tổng quát', code: 'E10', name: 'Đái tháo đường type 1' },
  { specialty: 'Nội tổng quát', code: 'E78', name: 'Rối loạn lipid máu (mỡ máu cao)' },
  { specialty: 'Nội tổng quát', code: 'K29', name: 'Viêm dạ dày' },
  { specialty: 'Nội tổng quát', code: 'K30', name: 'Khó tiêu' },
  { specialty: 'Nội tổng quát', code: 'N18', name: 'Suy thận mạn' },
  { specialty: 'Nội tổng quát', code: 'R53', name: 'Mệt mỏi, suy nhược' },
  { specialty: 'Sản phụ khoa', code: 'N70', name: 'Viêm vòi trứng' },
  { specialty: 'Sản phụ khoa', code: 'N71', name: 'Viêm tử cung' },
  { specialty: 'Sản phụ khoa', code: 'N72', name: 'Viêm cổ tử cung' },
  { specialty: 'Sản phụ khoa', code: 'N94.3', name: 'Hội chứng tiền kinh nguyệt' },
  { specialty: 'Sản phụ khoa', code: 'N95', name: 'Rối loạn mãn kinh' },
  { specialty: 'Sản phụ khoa', code: 'O80', name: 'Sinh thường' },
  { specialty: 'Sản phụ khoa', code: 'Z34', name: 'Thai kỳ bình thường (khám thai)' },
  { specialty: 'Mắt', code: 'H25', name: 'Đục thủy tinh thể' },
  { specialty: 'Mắt', code: 'H40', name: 'Glôcôm (thiên đầu thống)' },
  { specialty: 'Mắt', code: 'H52', name: 'Tật khúc xạ (cận/viễn/loạn thị)' },
  { specialty: 'Mắt', code: 'H53', name: 'Rối loạn thị giác' },
  { specialty: 'Mắt', code: 'B30', name: 'Viêm kết mạc do virus' },
  { specialty: 'Mắt', code: 'H10', name: 'Viêm kết mạc' },
]

const icdSpecialtyOptions = computed(() => [
  { label: 'Tất cả chuyên khoa', value: '' },
  ...Array.from(new Set(icdCodes.map((item) => item.specialty))).map((specialty) => ({ label: specialty, value: specialty })),
])

const filteredIcdCodes = computed(() => {
  const list = examForm.diagnosisSpecialty
    ? icdCodes.filter((item) => item.specialty === examForm.diagnosisSpecialty)
    : icdCodes
  const seen = new Set<string>()
  return list.filter((item) => {
    const key = `${item.code}-${item.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

function updateDiagnosisCode(value: string, form: typeof examForm) {
  form.diagnosisCode = value
  const normalizedValue = value.trim().toLowerCase()
  const matched = filteredIcdCodes.value.find((item) =>
    normalizedValue === item.code.toLowerCase()
    || normalizedValue === icdOptionValue(item).toLowerCase()
  ) || icdCodes.find((item) =>
    normalizedValue === item.code.toLowerCase()
    || normalizedValue === icdOptionValue(item).toLowerCase()
  )
  if (matched) form.diagnosisSpecialty = matched.specialty
}

function icdOptionValue(item: IcdCodeOption) {
  return `${item.code} - ${item.name}`
}

const configs: Record<Resource, Config> = {
  appointments: {
    kicker: 'Lịch khám',
    title: 'Lịch hẹn sắp tới',
    description: 'Xem trước lịch khám đã được điều phối cho bác sĩ. Các thao tác tiếp nhận, check-in và hủy lịch do y tá xử lý.',
    endpoint: 'GET /appointment/api/appointments/doctor/{doctorId}',
    searchPlaceholder: 'Tìm tên bệnh nhân, mã lịch hẹn, lý do khám, trạng thái...',
    tableTitle: 'Danh sách lịch hẹn readonly',
    tableSubtitle: 'Mặc định hiển thị lịch từ hôm nay trở đi để bác sĩ chuẩn bị trước ca khám.',
    emptyTitle: 'Không có lịch hẹn phù hợp',
    emptyText: 'Không tìm thấy lịch hẹn sắp tới phù hợp với bộ lọc hiện tại.',
    detailTitle: 'Chi tiết lịch hẹn',
    columns: cols(['id', 'Mã lịch hẹn'], ['patientName', 'Bệnh nhân', true], ['timeLabel', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái']),
  },
  queue: {
    kicker: 'Hàng chờ',
    title: 'Hàng đợi khám',
    description: 'Theo dõi bệnh nhân đang chờ và điều phối quá trình khám.',
    endpoint: 'GET /appointment/api/waiting-queue?date=YYYY-MM-DD',
    searchPlaceholder: 'Tìm bệnh nhân, bác sĩ, lý do khám...',
    tableTitle: 'Danh sách hàng chờ',
    tableSubtitle: 'Chỉ hiển thị hàng chờ của bác sĩ hiện tại trong ngày đã chọn.',
    emptyTitle: 'Không có bệnh nhân trong hàng chờ',
    emptyText: 'Bệnh nhân cần được tiếp nhận/check-in trước khi vào hàng chờ.',
    detailTitle: 'Chi tiết hàng chờ',
    columns: cols(['id', 'STT'], ['patientName', 'Bệnh nhân', true], ['timeLabel', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái']),
  },
  examine: {
    kicker: 'Lâm sàng',
    title: 'Khám & kê đơn',
    description: 'Mở lượt khám đã check-in, ghi bệnh án, tạo chỉ định, kê đơn và hoàn tất lượt khám.',
    endpoint: 'GET /medical/api/v1/medical/visits/today?doctorId=...',
    searchPlaceholder: 'Tìm bệnh nhân cần khám...',
    tableTitle: 'Lượt khám',
    tableSubtitle: 'Chọn một lượt khám để thao tác.',
    emptyTitle: 'Không có lượt khám phù hợp',
    emptyText: 'Chưa có lượt khám hôm nay cho bác sĩ này.',
    detailTitle: 'Chi tiết lượt khám',
    columns: cols(['id', 'Visit'], ['patientName', 'Bệnh nhân', true], ['timeLabel', 'Ngày giờ'], ['reason', 'Lý do'], ['status', 'Trạng thái']),
  },
  records: {
    kicker: 'Bệnh án',
    title: 'Lịch sử bệnh án',
    description: 'Tra cứu bệnh án, chẩn đoán và ghi chú điều trị đã lưu theo bác sĩ đang đăng nhập.',
    endpoint: 'GET /medical/api/v1/medical/patients/{id}/history',
    searchPlaceholder: 'Tìm mã bệnh án, bệnh nhân, mã ICD, chẩn đoán...',
    tableTitle: 'Danh sách bệnh án',
    tableSubtitle: 'Dữ liệu được hiển thị từ lịch sử khám bệnh án của bệnh nhân.',
    emptyTitle: 'Chưa có bệnh án phù hợp',
    emptyText: 'Không tìm thấy bệnh án của bác sĩ này trong bộ lọc hiện tại.',
    detailTitle: 'Chi tiết bệnh án',
    columns: cols(
      ['id', 'Mã bệnh án'],
      ['patientName', 'Bệnh nhân', true],
      ['timeLabel', 'Ngày khám'],
      ['completedLabel', 'Ngày hoàn tất'],
      ['diagnosisCode', 'Mã ICD'],
      ['diagnosisSpecialty', 'Chuyên khoa ICD'],
      ['diagnosis', 'Chẩn đoán'],
      ['status', 'Trạng thái']
    ),
  },
  schedule: {
    kicker: 'Lịch trực',
    title: 'Lịch làm việc',
    description: 'Theo dõi ca làm, thời gian bắt đầu-kết thúc và trạng thái nhận lịch của bác sĩ.',
    endpoint: 'GET /appointment/api/doctor-schedules/doctor/{doctorId}',
    searchPlaceholder: 'Tìm ngày, ca làm, phòng khám...',
    tableTitle: 'Lịch làm việc cá nhân',
    tableSubtitle: 'Dữ liệu lịch trực theo bác sĩ đang đăng nhập.',
    emptyTitle: 'Chưa có lịch làm việc',
    emptyText: 'Không tìm thấy lịch làm việc phù hợp với bộ lọc hiện tại.',
    detailTitle: 'Chi tiết lịch làm việc',
    columns: cols(['timeLabel', 'Ngày'], ['timeRange', 'Ca làm', true], ['room', 'Phòng'], ['slotInfo', 'Slot'], ['status', 'Trạng thái']),
  },
}

const resource = computed<Resource>(() => isResource(route.meta.doctorResource) ? route.meta.doctorResource : 'queue')
const config = computed(() => configs[resource.value])
const doctorId = computed(() => currentDoctorId(authStore.user))
const doctorName = computed(() => authStore.user?.fullName || 'Bác sĩ')
const isExamDetailMode = computed(() => resource.value === 'examine' && Boolean(selectedRow.value))

const statusOptions = computed(() => [
  { label: 'Tất cả', value: '' },
  { label: 'Đang chờ', value: 'waiting' },
  { label: 'Đang khám', value: 'progress' },
  { label: 'Đã hoàn tất', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
])

const filteredRows = computed(() => {
  const keyword = normalize(filters.keyword)
  return rows.value
    .filter((row) => {
      const rowDate = row.date || ''
      const byDate = filters.fromDate || filters.toDate
        ? (!filters.fromDate || rowDate >= filters.fromDate) && (!filters.toDate || rowDate <= filters.toDate)
        : !filters.date || rowDate === filters.date
      const byStatus = resource.value === 'schedule'
        ? (!filters.status || (filters.status === 'available' ? row.isAvailable !== false : row.isAvailable === false))
        : (!filters.status || statusBucket(row.status) === filters.status)
      const haystack = normalize([row.id, row.patientName, row.doctorName, row.reason, row.diagnosis, row.diagnosisCode, row.diagnosisSpecialty, row.status, row.room, row.timeRange, row.slotInfo, row.timeLabel].join(' '))
      return byDate && byStatus && (!keyword || haystack.includes(keyword))
    })
    .sort(sortRows)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
const pagedRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const pageStart = computed(() => filteredRows.value.length ? (page.value - 1) * pageSize + 1 : 0)
const pageEnd = computed(() => Math.min(filteredRows.value.length, page.value * pageSize))

const metrics = computed(() => {
  const total = filteredRows.value.length
  const waiting = filteredRows.value.filter((row) => ['waiting', 'confirmed'].includes(statusBucket(row.status))).length
  const progress = filteredRows.value.filter((row) => statusBucket(row.status) === 'progress').length
  const done = filteredRows.value.filter((row) => statusBucket(row.status) === 'completed').length
  return [
    { label: 'Tổng dữ liệu', value: total, note: 'Theo bộ lọc hiện tại', icon: CalendarClock, className: 'bg-blue-50 text-blue-700' },
    { label: 'Đang chờ', value: waiting, note: 'Chờ hoặc đã xác nhận', icon: Clock3, className: 'bg-amber-50 text-amber-700' },
    { label: 'Đang khám', value: progress, note: 'Đang xử lý', icon: Stethoscope, className: 'bg-cyan-50 text-cyan-700' },
    { label: 'Hoàn tất', value: done, note: 'Đã xử lý xong', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  ]
})

const scheduleWeekDays = computed(() => {
  const start = parseIsoDate(filters.fromDate || today())
  const weekStart = startOfWeek(start)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    const iso = localDateIso(date)
    const items = filteredRows.value.filter((row) => row.date === iso)
    return {
      iso,
      weekday: new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date),
      dayNumber: new Intl.DateTimeFormat('vi-VN', { day: '2-digit' }).format(date),
      monthLabel: new Intl.DateTimeFormat('vi-VN', { month: '2-digit', year: 'numeric' }).format(date),
      isToday: iso === today(),
      items,
    }
  })
})

const scheduleAvailableCount = computed(() => filteredRows.value.filter((row) => row.isAvailable !== false).length)
const scheduleTotalHours = computed(() => {
  const hours = filteredRows.value.reduce((sum, row) => sum + scheduleDurationHours(row), 0)
  return `${formatHourNumber(hours)} giờ`
})
const scheduleRangeLabel = computed(() => {
  const from = filters.fromDate || scheduleWeekDays.value[0]?.iso || today()
  const to = filters.toDate || scheduleWeekDays.value[6]?.iso || from
  return `${formatDate(from)} - ${formatDate(to)}`
})

const doctorRecordStats = computed(() => {
  const total = filteredRows.value.length
  const completed = filteredRows.value.filter((row) => statusBucket(row.status) === 'completed').length
  const draft = filteredRows.value.filter((row) => {
    const value = normalize(row.status)
    return value.includes('draft') || value.includes('nhap') || value.includes('nháp')
  }).length
  const followUp = filteredRows.value.filter((row) => Boolean(doctorRecordFollowUpDate(row))).length
  return { total, completed, draft, followUp }
})

const doctorRecordTabs = [
  { key: 'overview', label: 'Tổng quan', icon: ClipboardList },
  { key: 'diagnosis', label: 'Chẩn đoán', icon: FileHeart },
  { key: 'treatment', label: 'Điều trị', icon: FilePenLine },
  { key: 'history', label: 'Lịch sử', icon: CalendarClock },
]

const doctorRecordTableColumns = [
  {
    title: 'Mã BA',
    key: 'code',
    width: 110,
    customFilterDropdown: true,
    onFilter: doctorRecordColumnFilter('code'),
    sorter: (a: Row, b: Row) => doctorRecordCode(a).localeCompare(doctorRecordCode(b), 'vi'),
  },
  {
    title: 'Bệnh nhân',
    key: 'patientName',
    width: 180,
    customFilterDropdown: true,
    onFilter: doctorRecordColumnFilter('patientName'),
    sorter: (a: Row, b: Row) => doctorRecordPatientName(a).localeCompare(doctorRecordPatientName(b), 'vi'),
  },
  {
    title: 'Chẩn đoán',
    key: 'diagnosis',
    width: 230,
    customFilterDropdown: true,
    onFilter: doctorRecordColumnFilter('diagnosis'),
    sorter: (a: Row, b: Row) => doctorRecordDiagnosis(a).localeCompare(doctorRecordDiagnosis(b), 'vi'),
  },
  {
    title: 'Mã ICD',
    dataIndex: 'diagnosisCode',
    key: 'diagnosisCode',
    width: 138,
    customFilterDropdown: true,
    onFilter: doctorRecordColumnFilter('diagnosisCode'),
  },
  {
    title: 'Ngày tạo',
    key: 'createdAt',
    width: 132,
    customFilterDropdown: true,
    onFilter: doctorRecordColumnFilter('createdAt'),
    sorter: (a: Row, b: Row) => recordTimestamp(a.date || a.raw?.createdAt) - recordTimestamp(b.date || b.raw?.createdAt),
    defaultSortOrder: 'descend' as const,
  },
  {
    title: 'Tái khám',
    key: 'followUpDate',
    width: 126,
    customFilterDropdown: true,
    onFilter: doctorRecordColumnFilter('followUpDate'),
    sorter: (a: Row, b: Row) => recordTimestamp(doctorRecordFollowUpDate(a)) - recordTimestamp(doctorRecordFollowUpDate(b)),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 136,
    filters: [
      { text: 'Hoàn thành', value: 'Hoàn thành' },
      { text: 'Đang khám', value: 'Đang khám' },
      { text: 'Chờ khám', value: 'Chờ khám' },
      { text: 'Chưa cập nhật', value: 'Chưa cập nhật' },
    ],
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: Row) => statusText(record.status) === String(filterValue),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 104,
    align: 'center' as const,
  },
]

const doctorRecordPagination = computed(() => ({
  current: doctorRecordCurrentPage.value,
  pageSize: doctorRecordPageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showLessItems: true,
  showTitle: false,
  responsive: true,
  showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} trong ${total} bệnh án`,
  locale: { items_per_page: ' / trang' },
}))

const doctorQueueTableColumns = [
  {
    title: 'STT',
    key: 'queueNo',
    width: 92,
    customFilterDropdown: true,
    onFilter: doctorQueueColumnFilter('queueNo'),
    sorter: (a: Row, b: Row) => Number(a.id || a.visitId || 0) - Number(b.id || b.visitId || 0),
  },
  {
    title: 'Bệnh nhân',
    key: 'patientName',
    width: 190,
    customFilterDropdown: true,
    onFilter: doctorQueueColumnFilter('patientName'),
    sorter: (a: Row, b: Row) => String(a.patientName || '').localeCompare(String(b.patientName || ''), 'vi'),
  },
  {
    title: 'Giờ hẹn',
    key: 'timeLabel',
    width: 150,
    customFilterDropdown: true,
    onFilter: doctorQueueColumnFilter('timeLabel'),
    sorter: (a: Row, b: Row) => recordTimestamp(a.date || a.raw?.appointmentDate || a.raw?.AppointmentDate) - recordTimestamp(b.date || b.raw?.appointmentDate || b.raw?.AppointmentDate),
  },
  {
    title: 'Phòng/Khoa',
    key: 'room',
    width: 160,
    customFilterDropdown: true,
    onFilter: doctorQueueColumnFilter('room'),
    sorter: (a: Row, b: Row) => queueRoomOrSpecialty(a).localeCompare(queueRoomOrSpecialty(b), 'vi'),
  },
  {
    title: 'Lý do',
    key: 'reason',
    width: 220,
    customFilterDropdown: true,
    onFilter: doctorQueueColumnFilter('reason'),
  },
  {
    title: 'Sinh hiệu',
    key: 'vitals',
    width: 150,
    filters: [
      { text: 'Đã đo sinh hiệu', value: 'Đã đo sinh hiệu' },
      { text: 'Chưa đo sinh hiệu', value: 'Chưa đo sinh hiệu' },
      { text: 'Đang khám', value: 'Đang khám' },
    ],
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: Row) => queueVitalLabel(record) === String(filterValue),
    sorter: (a: Row, b: Row) => queueVitalLabel(a).localeCompare(queueVitalLabel(b), 'vi'),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 140,
    filters: [
      { text: 'Chờ khám', value: 'Chờ khám' },
      { text: 'Đã check-in', value: 'Đã check-in' },
      { text: 'Đang khám', value: 'Đang khám' },
      { text: 'Hoàn thành', value: 'Hoàn thành' },
    ],
    filterReset: 'Đặt lại',
    filterConfirm: 'Áp dụng',
    onFilter: (filterValue: string | number | boolean, record: Row) => statusText(record.status) === String(filterValue),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 104,
    align: 'center' as const,
  },
]

const doctorQueuePagination = computed(() => ({
  current: doctorQueueCurrentPage.value,
  pageSize: doctorQueuePageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showLessItems: true,
  showTitle: false,
  responsive: true,
  showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} trong ${total} lượt chờ`,
  locale: { items_per_page: ' / trang' },
}))

const doctorRecordFollowUpStatus = computed(() => {
  const followUpDate = doctorRecordFollowUpDate(selectedRecord.value)
  if (!followUpDate) return 'NONE'
  const followDate = new Date(followUpDate)
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  return followDate >= todayDate ? 'UPCOMING' : 'OVERDUE'
})

const printVitalSigns = computed(() => parsePrintVitalSigns(objectValue(recordToPrint.value, 'vitalSignsJson', 'VitalSignsJson') || objectValue(printVisit.value, 'vitalSignsJson', 'VitalSignsJson')))
const printVitalItems = computed(() => {
  const vitals = printVitalSigns.value
  const items = [
    { label: 'Nhiệt độ', value: printVitalDisplay(vitals, ['temperature', 'Temperature'], '°C') },
    { label: 'Huyết áp', value: printVitalDisplay(vitals, ['bloodPressure', 'BloodPressure']) },
    { label: 'Mạch', value: printVitalDisplay(vitals, ['heartRate', 'HeartRate'], 'lần/phút') },
    { label: 'Nhịp thở', value: printVitalDisplay(vitals, ['respiratoryRate', 'RespiratoryRate'], 'lần/phút') },
    { label: 'SpO2', value: printVitalDisplay(vitals, ['spo2', 'Spo2', 'spO2', 'SpO2'], '%') },
    { label: 'Cân nặng', value: printVitalDisplay(vitals, ['weight', 'Weight'], 'kg') },
    { label: 'Chiều cao', value: printVitalDisplay(vitals, ['height', 'Height'], 'cm') },
    { label: 'BMI', value: printVitalBmiDisplay(vitals) },
  ]
  return items.filter((item) => item.value)
})
const printVitalNote = computed(() => String(readFirst(printVitalSigns.value, 'note', 'Note') || '').trim())
const activePrintPrescription = computed(() => printPrescriptions.value[0] || null)

const detailTitle = computed(() => {
  if (resource.value === 'schedule') return 'Chi tiết lịch làm việc'
  return config.value.detailTitle
})
const detailIcon = computed(() => {
  if (resource.value === 'schedule') return CalendarClock
  if (resource.value === 'records') return FileText
  if (resource.value === 'appointments') return CalendarClock
  return ClipboardList
})
const detailAccentClass = computed(() => {
  if (resource.value === 'schedule') return 'bg-emerald-50 text-emerald-700'
  if (resource.value === 'records') return 'bg-indigo-50 text-indigo-700'
  if (resource.value === 'queue') return 'bg-amber-50 text-amber-700'
  return 'bg-blue-50 text-[#0F52BA]'
})
const detailSections = computed<DetailSection[]>(() => {
  const row = selectedDetail.value
  if (!row) return []
  if (resource.value === 'schedule') {
    return [
      {
        title: 'Thông tin ca trực',
        icon: CalendarClock,
        items: [
          { label: 'Mã lịch', value: detailText(row.id) },
          { label: 'Bác sĩ', value: detailText(row.doctorName || doctorName.value) },
          { label: 'Trạng thái', value: detailText(row.status) },
          { label: 'Slot', value: detailText(row.slotInfo) },
        ],
      },
      {
        title: 'Thời gian & phòng khám',
        icon: ClipboardList,
        items: [
          { label: 'Ngày trực', value: detailText(row.timeLabel || formatDate(row.date)) },
          { label: 'Giờ làm việc', value: detailText(row.timeRange) },
          { label: 'Bắt đầu', value: detailText(row.startTime) },
          { label: 'Kết thúc', value: detailText(row.endTime) },
          { label: 'Phòng khám', value: detailText(row.room), full: true },
        ],
      },
    ]
  }
  if (resource.value === 'appointments') {
    return [
      {
        title: 'Thông tin lịch hẹn',
        icon: CalendarClock,
        items: [
          { label: 'Mã lịch', value: detailText(row.appointmentId || row.id) },
          { label: 'Bệnh nhân', value: detailText(row.patientName) },
          { label: 'Số điện thoại', value: detailText(row.patientPhone) },
          { label: 'Trạng thái', value: detailText(row.status) },
        ],
      },
      {
        title: 'Thời gian khám',
        icon: ClipboardList,
        items: [
          { label: 'Ngày giờ hẹn', value: detailText(row.timeLabel) },
          { label: 'Bác sĩ', value: detailText(row.doctorName || doctorName.value) },
          { label: 'Lý do khám', value: detailText(row.reason), full: true },
        ],
      },
    ]
  }
  if (resource.value === 'queue') {
    return [
      {
        title: 'Thông tin hàng chờ',
        icon: ClipboardList,
        items: [
          { label: 'Số thứ tự', value: detailText(row.id) },
          { label: 'Bệnh nhân', value: detailText(row.patientName) },
          { label: 'Ngày giờ', value: detailText(row.timeLabel) },
          { label: 'Trạng thái', value: detailText(row.status) },
          { label: 'Lý do khám', value: detailText(row.reason), full: true },
        ],
      },
    ]
  }
  return [
    {
      title: 'Thông tin chi tiết',
      icon: FileText,
      items: [
        { label: 'Mã', value: detailText(row.id) },
        { label: 'Bệnh nhân', value: detailText(row.patientName) },
        { label: 'Ngày khám', value: detailText(row.timeLabel) },
        { label: 'Trạng thái', value: detailText(row.status) },
        { label: 'Chẩn đoán', value: detailText(row.diagnosis), full: true },
        { label: 'Ghi chú', value: detailText(row.note), full: true },
      ],
    },
  ]
})

watch([resource, () => authStore.user?.id], () => {
  clearWorkingState()
  resetFilters(false)
  loadData()
}, { immediate: true })

watch(filteredRows, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

async function loadData() {
  loading.value = true
  error.value = ''
  note.value = ''
  rows.value = []
  page.value = 1

  try {
    if (!doctorId.value) {
      note.value = 'Không xác định được DoctorId của tài khoản hiện tại. Vui lòng đăng xuất và đăng nhập lại để lấy đúng hồ sơ bác sĩ.'
      return
    }

    if (resource.value === 'appointments') rows.value = await loadAppointmentRows()
    if (resource.value === 'queue') rows.value = await loadQueueRows()
    if (resource.value === 'examine') rows.value = await loadVisitRows()
    if (resource.value === 'records') rows.value = await loadRecordRows()
    if (resource.value === 'schedule') rows.value = await loadScheduleRows()

    if (resource.value === 'examine') await openRequestedExam()

    showToast('Tải dữ liệu thành công', 'Dữ liệu đã được lọc theo bác sĩ và bộ lọc hiện tại.', 'success')
  } catch (apiError) {
    error.value = businessError(apiError)
    showToast('Tải dữ liệu thất bại', error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function loadAppointmentRows() {
  const data = await appointmentApi.getAppointmentsByDoctor(doctorId.value)
  return filterAppointmentsForDoctor(data, authStore.user).map(mapAppointment)
}

async function loadQueueRows() {
  const selectedDate = filters.date || today()
  const queueData = await appointmentApi.getWaitingQueue({
    date: selectedDate,
    doctorId: doctorId.value,
    keyword: filters.keyword || undefined,
  }).catch(() => [] as WaitingQueueItem[])

  return filterQueueForDoctor(queueData, authStore.user)
    .map((item) => mapQueue(item))
    .filter((row) => isQueueVisibleAppointmentStatus(row.status))
    .sort(compareQueueRows)
}

async function loadVisitRows() {
  try {
    const data = await medicalRecordApi.getVisitsToday(doctorId.value)
    const visitRows = data.map(mapVisit)
    const appointmentId = Number(route.query.appointmentId || 0)
    const hasRequestedVisit = appointmentId && visitRows.some((row) => Number(row.appointmentId) === appointmentId)
    if (appointmentId && !hasRequestedVisit) {
      const requestedVisit = await medicalRecordApi.getVisitByAppointment(appointmentId).catch(() => null)
      if (requestedVisit?.visitId) visitRows.unshift(mapVisit(requestedVisit))
    }
    return visitRows
  } catch (apiError) {
    note.value = `Không thể kết nối đến máy chủ lâm sàng (${getApiErrorMessage(apiError)}). Hệ thống tự động chuyển sang hiển thị hàng chờ tiếp nhận.`
    const queueRows = await loadQueueRows()
    return queueRows
  }
}

async function loadRecordRows() {
  const data = await medicalRecordApi.getMedicalRecords()
  return filterRecordsForDoctor(data, authStore.user).map(mapRecord)
}

async function loadScheduleRows() {
  const [data, doctor] = await Promise.all([
    appointmentApi.getDoctorSchedulesByDoctor(doctorId.value),
    appointmentApi.getDoctor(doctorId.value).catch(() => null as Doctor | null),
  ])
  const room = doctorRoom(doctor)
  return filterSchedulesForDoctor(data, authStore.user).map((schedule) => mapSchedule({ ...schedule, roomNumber: schedule.roomNumber || room }))
}

function resetFilters(reload = true) {
  filters.keyword = ''
  if (resource.value === 'schedule') {
    const start = startOfWeek(new Date())
    filters.date = ''
    filters.fromDate = localDateIso(start)
    filters.toDate = localDateIso(addDays(start, 6))
  } else {
    filters.date = resource.value === 'appointments' || resource.value === 'records' || route.query.appointmentId ? '' : today()
    filters.fromDate = resource.value === 'appointments' ? today() : ''
    filters.toDate = ''
  }
  filters.status = ''
  page.value = 1
  if (reload) loadData()
}

function moveScheduleWeek(direction: number) {
  const base = parseIsoDate(filters.fromDate || today())
  const start = addDays(startOfWeek(base), direction * 7)
  filters.fromDate = localDateIso(start)
  filters.toDate = localDateIso(addDays(start, 6))
  filters.date = ''
}

function goToCurrentScheduleWeek() {
  const start = startOfWeek(new Date())
  filters.fromDate = localDateIso(start)
  filters.toDate = localDateIso(addDays(start, 6))
  filters.date = ''
}

function rowActions(row: Row) {
  if (resource.value === 'appointments') {
    return [{ key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' }]
  }
  if (resource.value === 'queue') {
    return [
      { key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' },
      { key: 'start' as ActionKey, label: 'Khám bệnh', className: 'bg-blue-600 text-white hover:bg-blue-700' },
    ]
  }
  if (resource.value === 'records') {
    return [{ key: 'record' as ActionKey, label: 'Chi tiết', className: 'bg-blue-600 text-white hover:bg-blue-700' }]
  }
  return [{ key: 'view' as ActionKey, label: 'Chi tiết', className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' }]
}

function queueVitalLabel(row: Row | Record<string, any>) {
  if (queueHasVitals(row)) return 'Đã đo sinh hiệu'
  if (statusBucket(row.status) === 'progress') return 'Đang khám'
  return 'Chưa đo sinh hiệu'
}

function queueVitalClass(row: Row | Record<string, any>) {
  if (queueHasVitals(row)) return 'is-done'
  if (statusBucket(row.status) === 'progress') return 'is-progress'
  return 'is-missing'
}

function queueHasVitals(row: Row | Record<string, any>) {
  const raw = row.raw || {}
  const vitals = parseVitalSignsValue(raw.vitalSignsJson ?? raw.VitalSignsJson)
  return [
    raw.temperature, raw.Temperature, vitals.temperature, vitals.Temperature,
    raw.bloodPressure, raw.BloodPressure, vitals.bloodPressure, vitals.BloodPressure,
    raw.heartRate, raw.HeartRate, vitals.heartRate, vitals.HeartRate,
    raw.respiratoryRate, raw.RespiratoryRate, vitals.respiratoryRate, vitals.RespiratoryRate,
    raw.spo2, raw.Spo2, raw.spO2, raw.SpO2, vitals.spo2, vitals.Spo2, vitals.spO2, vitals.SpO2,
    raw.height, raw.Height, vitals.height, vitals.Height,
    raw.weight, raw.Weight, vitals.weight, vitals.Weight,
    raw.note, raw.Note, vitals.note, vitals.Note,
  ].some((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

function queueVitalSummary(row: Row | Record<string, any>) {
  const raw = row.raw || {}
  const vitals = parseVitalSignsValue(raw.vitalSignsJson ?? raw.VitalSignsJson)
  const parts = [
    vitals.bloodPressure || vitals.BloodPressure || raw.bloodPressure || raw.BloodPressure,
    vitalNumberText(vitals.temperature ?? vitals.Temperature ?? raw.temperature ?? raw.Temperature, '°C'),
    vitalNumberText(vitals.heartRate ?? vitals.HeartRate ?? raw.heartRate ?? raw.HeartRate, 'l/p'),
    vitalNumberText(vitals.spo2 ?? vitals.Spo2 ?? vitals.spO2 ?? vitals.SpO2 ?? raw.spo2 ?? raw.Spo2 ?? raw.spO2 ?? raw.SpO2, '%'),
  ].map((item) => String(item || '').trim()).filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Chưa có'
}

function vitalNumberText(value: unknown, unit: string) {
  const textValue = String(value ?? '').trim()
  return textValue ? `${textValue}${unit}` : ''
}

function queueWaitLabel(row: Row | Record<string, any>) {
  const raw = row.raw || {}
  const value = raw.checkedInAt || raw.CheckedInAt || raw.queueDate || raw.QueueDate || raw.appointmentDate || raw.AppointmentDate || row.date
  const timestamp = recordTimestamp(value)
  if (!timestamp) return 'Mới'
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Mới'
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}g ${rest}p` : `${hours} giờ`
}

function queueRoomOrSpecialty(row: Row | Record<string, any>) {
  return meaningful(row.room)
    || meaningful(row.specialtyName)
    || meaningful(row.raw?.specialtyName || row.raw?.SpecialtyName)
    || 'Chưa cập nhật'
}

async function runAction(action: ActionKey, row: Row) {
  actingKey.value = row.key
  try {
    if (action === 'view') openDetail(row)
    if (action === 'record') openRecord(row)
    if (action === 'start') await openExamFromRow(row)
    if (action === 'checkin') await checkInAndOpenExam(row)
    if (action === 'complete') await completeAppointment(row)
    if (action === 'cancel') await cancelAppointment(row)
  } finally {
    actingKey.value = null
  }
}

function openDetail(row: Row) {
  selectedDetail.value = row
  detailDrawerOpen.value = true
}

function closeDetailDrawer() {
  detailDrawerOpen.value = false
  selectedDetail.value = null
}

function backToAppointments() {
  clearWorkingState()
  router.push('/doctor/queue')
}

function openRecord(row: Row | Record<string, any>) {
  selectedRecord.value = row as Row
  currentRecordTab.value = 'overview'
  recordDrawerOpen.value = true
}

function closeRecordDrawer() {
  recordDrawerOpen.value = false
  selectedRecord.value = null
}

async function printDoctorRecord(row: Row | Record<string, any>) {
  const baseRow = row as Row
  clearPrintState()
  recordToPrint.value = baseRow
  const recordId = doctorRecordNumericId(baseRow)

  if (recordId) {
    try {
      const completeRecord = await medicalRecordApi.getCompleteMedicalRecord(recordId)
      applyCompleteRecordForPrint(baseRow, completeRecord)
    } catch (apiError) {
      showToast('Chưa tải đủ dữ liệu in', businessError(apiError), 'error')
      recordToPrint.value = baseRow
    }
  }

  await nextTick()
  window.setTimeout(() => window.print(), 200)
  window.setTimeout(clearPrintState, 1200)
}

function currentPrintDateTime() {
  return formatDateTime(new Date().toISOString())
}

function exportDoctorRecordsExcel() {
  const records = filteredRows.value
  if (!records.length) return showToast('Không có dữ liệu', 'Không có bệnh án để xuất Excel.', 'error')

  const headers = ['Mã BA', 'Bệnh nhân', 'Mã bệnh nhân', 'Chẩn đoán', 'Mã ICD', 'Chuyên khoa ICD', 'Ngày tạo', 'Tái khám', 'Trạng thái', 'Bác sĩ', 'Ghi chú']
  const columnWidths = [86, 150, 120, 260, 190, 150, 110, 110, 120, 170, 420]
  const body = records.map((record) => [
    doctorRecordCode(record),
    doctorRecordPatientName(record),
    record.patientId || record.raw?.patientCode || record.raw?.patientIdCode || '',
    doctorRecordDiagnosis(record),
    record.diagnosisCode || '',
    record.diagnosisSpecialty || '',
    formatDate(record.date || record.raw?.createdAt),
    doctorRecordFollowUpDate(record) ? formatDate(doctorRecordFollowUpDate(record)) : '',
    statusText(record.status),
    record.doctorName || doctorName.value,
    record.note || '',
  ])
  const colGroup = columnWidths.map((width) => `<col style="width:${width}px" />`).join('')
  const headerHtml = headers
    .map((header) => `<th class="table-header">${escapeExcelCell(header)}</th>`)
    .join('')
  const rowsHtml = body
    .map((cells, index) => `<tr class="${index % 2 ? 'row-even' : 'row-odd'}">${cells.map((cell, cellIndex) => `<td class="${cellIndex === 10 ? 'wrap-cell' : 'text-cell'}">${escapeExcelCell(cell)}</td>`).join('')}</tr>`)
    .join('')
  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0f172a; }
    table { border-collapse: collapse; table-layout: fixed; font-family: Arial, Helvetica, sans-serif; font-size: 13px; }
    th, td { border: 1px solid #94a3b8; padding: 7px 9px; vertical-align: middle; mso-number-format:"\\@"; }
    .report-title { background: #0F52BA; color: #ffffff; font-size: 18px; font-weight: 700; text-align: center; height: 34px; }
    .report-meta { background: #EAF2FF; color: #1e3a8a; font-size: 13px; font-weight: 600; text-align: center; height: 26px; }
    .table-header { background: #D9EAFD; color: #0f172a; font-weight: 700; text-align: center; white-space: normal; }
    .row-odd td { background: #ffffff; }
    .row-even td { background: #F8FBFF; }
    .text-cell { white-space: nowrap; }
    .wrap-cell { white-space: normal; mso-style-parent: style0; }
  </style>
</head>
<body>
  <table>
    ${colGroup}
    <tr><td class="report-title" colspan="${headers.length}">DANH SÁCH HỒ SƠ BỆNH ÁN</td></tr>
    <tr><td class="report-meta" colspan="${headers.length}">Bác sĩ: ${escapeExcelCell(doctorName.value)} | Ngày xuất: ${escapeExcelCell(formatDate(today()))} | Tổng: ${records.length} hồ sơ</td></tr>
    <tr>${headerHtml}</tr>
    ${rowsHtml}
  </table>
</body>
</html>`
  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  downloadBlob(blob, `ho-so-benh-an-bac-si-${today()}.xls`)
  showToast('Đã xuất Excel', `Đã xuất ${records.length} hồ sơ bệnh án.`, 'success')
}

function runQueueAction(action: ActionKey, row: Row | Record<string, any>) {
  return runAction(action, row as Row)
}

async function openExamFromRow(row: Row) {
  if (resource.value !== 'examine') {
    selectedRow.value = row
  }
  const opened = await selectVisit(row)
  if (!opened) return
  if (resource.value !== 'examine') showToast('Đã mở lượt khám', 'Chuyển sang trang Khám & kê đơn nếu cần thao tác đầy đủ.', 'success')
}

async function checkInAndOpenExam(row: Row) {
  const appointmentId = Number(row.appointmentId || row.id)
  if (!appointmentId) return showToast('Thiếu lịch hẹn', 'Không xác định được mã lịch hẹn để check-in.', 'error')
  try {
    const visit = await medicalRecordApi.getVisitByAppointment(appointmentId).catch(() => null)
    if (!visit?.visitId && !visit?.id) {
      throw new Error('Lịch hẹn chưa được check-in hoặc chưa tạo lượt khám lâm sàng. Vui lòng chuyển bệnh nhân qua y tá tiếp nhận trước.')
    }
    showToast('Đã tạo lượt khám', 'Bệnh nhân đã được check-in và có thể khám trong màn Khám & kê đơn.', 'success')
    await router.push({
      path: '/doctor/examine',
      query: {
        appointmentId: String(appointmentId),
        visitId: String(visit.visitId || visit.id || ''),
      },
    })
  } catch (apiError) {
    showToast('Chưa thể vào khám', businessError(apiError), 'error')
  }
}

async function openRequestedExam() {
  const appointmentId = Number(route.query.appointmentId || 0)
  const visitId = Number(route.query.visitId || 0)
  if (!appointmentId && !visitId) return
  const target = rows.value.find((row) =>
    (visitId && Number(row.visitId || row.id) === visitId)
    || (appointmentId && Number(row.appointmentId) === appointmentId)
  )
  if (target) await selectVisit(target)
}

async function selectVisit(row: Row) {
  selectedRow.value = row
  clearExamOnly()
  examForm.chiefComplaint = meaningful(row.reason)
  try {
    const visit = row.visitId
      ? await medicalRecordApi.getVisit(row.visitId)
      : row.appointmentId
        ? await medicalRecordApi.getVisitByAppointment(row.appointmentId)
        : null
    if (!visit?.visitId) throw new Error('Lịch hẹn chưa được check-in hoặc chưa tạo lượt khám lâm sàng.')
    activeVisit.value = visit
    await hydrateSelectedRowFromAppointment(visit.appointmentId || row.appointmentId)
    await hydrateSelectedRowFromDoctor(selectedRow.value?.doctorId || visit.doctorId || row.doctorId)
    examForm.chiefComplaint = meaningful(visit.chiefComplaint) || meaningful(selectedRow.value?.reason) || meaningful(row.reason)
    hydrateVitalsFromVisit(visit)
    await Promise.all([loadActivePatient(), loadExistingRecord(), loadMedicines(), loadPrescriptionSpecialties()])
    applyDefaultPrescriptionFilter()
    return true
  } catch (apiError) {
    showToast('Không mở được lượt khám', businessError(apiError), 'error')
    return false
  }
}

async function hydrateSelectedRowFromAppointment(appointmentId?: number | string) {
  if (!appointmentId || !selectedRow.value) return
  const appointment = await appointmentApi.getAppointment(appointmentId).catch(() => null)
  if (!appointment) return
  selectedRow.value = {
    ...selectedRow.value,
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId || selectedRow.value.patientId,
    patientName: displayText(appointment.patientName) || selectedRow.value.patientName,
    patientPhone: appointment.patientPhone || selectedRow.value.patientPhone,
    doctorId: appointment.doctorId || selectedRow.value.doctorId,
    doctorName: displayText(appointment.doctorName) || selectedRow.value.doctorName,
    date: normalizeDate(appointment.appointmentDate) || selectedRow.value.date,
    time: appointment.slotTime || selectedRow.value.time,
    timeLabel: `${formatDate(appointment.appointmentDate)} · ${appointment.slotTime || selectedRow.value.time || '--:--'}`,
    reason: appointment.reason || appointment.specialtyName || selectedRow.value.reason,
    room: visitRoom({ raw: appointment } as Row) || selectedRow.value.room,
    raw: { ...(selectedRow.value.raw || {}), ...appointment },
  }
}

async function hydrateSelectedRowFromDoctor(doctorIdValue?: number | string) {
  if (!doctorIdValue || !selectedRow.value) return
  const doctor = await appointmentApi.getDoctor(Number(doctorIdValue)).catch(() => null as Doctor | null)
  if (!doctor) return
  const room = doctorRoom(doctor) || selectedRow.value.room
  selectedRow.value = {
    ...selectedRow.value,
    doctorName: displayText(doctor.doctorName || doctor.fullName) || selectedRow.value.doctorName,
    room,
    raw: {
      ...(selectedRow.value.raw || {}),
      doctorRoomNumber: doctor.roomNumber,
      doctorRoom: room,
      doctor,
    },
  }
}

async function startVisit() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Lịch hẹn chưa được check-in hoặc chưa tạo lượt khám lâm sàng.', 'error')
  if (!examForm.chiefComplaint.trim()) return showToast('Thiếu lý do khám', 'Vui lòng nhập lý do khám trước khi bắt đầu lượt khám.', 'error')
  savingExam.value = true
  try {
    await medicalRecordApi.startVisit(activeVisit.value.visitId, { doctorId: doctorId.value, chiefComplaint: examForm.chiefComplaint.trim() })
    activeVisit.value = await medicalRecordApi.getVisit(activeVisit.value.visitId)
    hydrateVitalsFromVisit(activeVisit.value)
    showToast('Đã bắt đầu khám', 'Tiếp theo nhập bệnh án ở tab Bệnh án.', 'success')
  } catch (apiError) {
    showToast('Chưa thể bắt đầu khám', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function saveMedicalRecord() {
  if (!activeVisit.value?.visitId) {
    showToast('Thiếu lượt khám', 'Cần có lượt khám lâm sàng trước khi lưu bệnh án.', 'error')
    return false
  }
  if (!examForm.diagnosis.trim()) {
    showToast('Thiếu chẩn đoán', 'Vui lòng nhập chẩn đoán trước khi lưu bệnh án.', 'error')
    return false
  }
  savingExam.value = true
  try {
    await savePatientHistory()
    const payload = {
      visitId: activeVisit.value.visitId,
      diagnosisCode: examForm.diagnosisCode.trim() || undefined,
      diagnosisSpecialty: examForm.diagnosisSpecialty.trim() || undefined,
      diagnosisText: examForm.diagnosis.trim(),
      doctorNote: clinicalDoctorNote(),
      treatmentPlan: clinicalTreatmentPlan(),
      followUpDate: examForm.followUpDate || undefined,
    }
    const existingRecord = activeRecord.value?.medicalRecordId
      ? activeRecord.value
      : await findMedicalRecordByVisit(activeVisit.value.visitId)
    activeRecord.value = existingRecord?.medicalRecordId
      ? await medicalRecordApi.updateMedicalRecord(existingRecord.medicalRecordId, payload)
      : await medicalRecordApi.createMedicalRecord(payload)
    await loadClinicalOrders()
    showToast('Lưu bệnh án thành công', 'Tiếp theo có thể tạo chỉ định hoặc kê đơn thuốc.', 'success')
    return true
  } catch (apiError) {
    showToast('Lưu bệnh án thất bại', businessError(apiError), 'error')
    return false
  } finally {
    savingExam.value = false
  }
}

async function addClinicalOrder() {
  if (!activeRecord.value?.medicalRecordId) return showToast('Chưa có bệnh án', 'Cần lưu bệnh án trước khi tạo chỉ định lâm sàng.', 'error')
  const selectedOrders = selectedClinicalOrderNames()
  const manualName = orderForm.orderName.trim()
  const orders = manualName ? [{ orderType: orderForm.orderType, orderName: manualName }] : selectedOrders
  if (!orders.length) return showToast('Thiếu chỉ định', 'Vui lòng chọn hoặc nhập tên chỉ định cận lâm sàng.', 'error')
  savingExam.value = true
  try {
    for (const order of orders) {
      await medicalRecordApi.createClinicalOrder({
        medicalRecordId: activeRecord.value.medicalRecordId,
        orderType: order.orderType,
        orderName: order.orderName,
        reason: orderForm.reason.trim() || undefined,
      })
    }
    orderForm.orderName = ''
    orderForm.reason = ''
    Object.assign(clinicalChecklist, { bloodTest: false, urineTest: false, ultrasound: false, xray: false, ecg: false })
    await loadClinicalOrders()
    showToast('Đã tạo chỉ định', 'Chỉ định lâm sàng đã được ghi nhận thành công.', 'success')
  } catch (apiError) {
    showToast('Tạo chỉ định thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function saveClinicalOrderResult(order: Record<string, any>) {
  const orderId = order.clinicalOrderId || order.ClinicalOrderId || order.orderId || order.OrderId || order.id || order.Id
  if (!orderId) return showToast('Thiếu chỉ định', 'Không xác định được mã chỉ định cận lâm sàng.', 'error')
  const resultText = window.prompt('Nhập kết quả cận lâm sàng', order.resultText || order.ResultText || '')
  if (resultText === null) return
  if (!resultText.trim()) return showToast('Thiếu kết quả', 'Vui lòng nhập nội dung kết quả cận lâm sàng.', 'error')
  const conclusion = window.prompt('Kết luận', order.conclusion || order.Conclusion || 'Bình thường') || undefined
  savingExam.value = true
  try {
    await medicalRecordApi.updateClinicalOrderResult(orderId, {
      resultText: resultText.trim(),
      conclusion: conclusion?.trim() || undefined,
      resultedBy: doctorName.value,
    })
    await loadClinicalOrders()
    showToast('Đã lưu kết quả', 'Kết quả cận lâm sàng đã được cập nhật vào hồ sơ.', 'success')
  } catch (apiError) {
    showToast('Lưu kết quả thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

function selectedClinicalOrderNames() {
  return [
    clinicalChecklist.bloodTest ? { orderType: 'Xét nghiệm', orderName: 'Xét nghiệm máu' } : null,
    clinicalChecklist.urineTest ? { orderType: 'Xét nghiệm', orderName: 'Xét nghiệm nước tiểu' } : null,
    clinicalChecklist.ultrasound ? { orderType: 'Siêu âm', orderName: 'Siêu âm' } : null,
    clinicalChecklist.xray ? { orderType: 'X-Quang', orderName: 'X-Quang' } : null,
    clinicalChecklist.ecg ? { orderType: 'Điện tim', orderName: 'Điện tim' } : null,
  ].filter(Boolean) as { orderType: string; orderName: string }[]
}

async function submitExamination() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Cần mở lượt khám lâm sàng trước khi hoàn tất.', 'error')
  savingExam.value = true
  try {
    const saved = await saveMedicalRecord()
    if (!saved) return
    const recordId = Number(activeRecord.value?.medicalRecordId)
    if (!recordId) throw new Error('Cần lưu bệnh án trước khi hoàn tất lượt khám.')

    if (prescriptionItems.value.length) {
      validatePrescriptionItems()
      const draft = await medicalRecordApi.createPrescription({ medicalRecordId: recordId, note: prescriptionNote() })
      const prescriptionId = Number((draft as any).prescriptionId || (draft as any).id)
      for (const item of prescriptionItems.value) await medicalRecordApi.addPrescriptionItem(prescriptionId, item)
      await medicalRecordApi.submitPrescription(prescriptionId, { medicalRecordId: recordId, note: prescriptionNote(), items: prescriptionItems.value })
    }

    await medicalRecordApi.completeMedicalRecord(recordId)
    await medicalRecordApi.completeVisit(activeVisit.value.visitId)
    if (activeVisit.value.appointmentId) await appointmentApi.completeAppointmentSafely(activeVisit.value.appointmentId, selectedRow.value?.date).catch(() => undefined)
    showToast(
      'Hoàn tất khám',
      prescriptionItems.value.length
        ? 'Đơn thuốc đã được chốt và cập nhật thành công vào hồ sơ bệnh án.'
        : 'Bệnh án và lượt khám đã hoàn tất.',
      'success',
    )
    clearWorkingState()
    await router.push('/doctor/records')
  } catch (apiError) {
    showToast('Chưa hoàn tất khám', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function completeAppointment(row: Row) {
  if (!row.appointmentId) return
  try {
    await appointmentApi.completeAppointmentSafely(row.appointmentId, row.date)
    showToast('Cập nhật trạng thái thành công', 'Lịch hẹn đã được hoàn tất.', 'success')
    await loadData()
  } catch (apiError) {
    showToast('Cập nhật thất bại', businessError(apiError), 'error')
  }
}

async function cancelAppointment(row: Row) {
  if (!row.appointmentId) return
  try {
    await appointmentApi.cancelAppointment(row.appointmentId)
    showToast('Đã hủy lịch hẹn', 'Lịch hẹn đã chuyển sang trạng thái hủy.', 'success')
    await loadData()
  } catch (apiError) {
    showToast('Hủy lịch thất bại', businessError(apiError), 'error')
  }
}

async function loadActivePatient() {
  const patientId = activeVisit.value?.patientId || selectedRow.value?.patientId
  if (!patientId) {
    activePatient.value = null
    hydrateHistoryFromPatient(null)
    return
  }

  activePatient.value = await medicalRecordApi.getPatient(patientId).catch(() => null)
  hydrateHistoryFromPatient(activePatient.value)
}

async function loadExistingRecord() {
  if (!activeVisit.value?.visitId) return
  let record: MedicalRecord | null
  try {
    record = await findMedicalRecordByVisit(activeVisit.value.visitId)
  } catch (apiError) {
    note.value = `Chưa tải được bệnh án theo lượt khám: ${getApiErrorMessage(apiError)}`
    return
  }
  if (!record) {
    activeRecord.value = null
    clinicalOrders.value = []
    return
  }
  activeRecord.value = record
  examForm.diagnosis = record.diagnosisText || record.diagnosis || ''
  examForm.diagnosisCode = record.diagnosisCode || ''
  examForm.diagnosisSpecialty = record.diagnosisSpecialty || ''
  examForm.doctorNote = record.doctorNote || record.doctorNotes || ''
  examForm.treatmentPlan = record.treatmentPlan || ''
  examForm.followUpDate = String(record.followUpDate || '').slice(0, 10)
  hydrateClinicalTextFromRecord(record)
  await loadClinicalOrders()
}

async function findMedicalRecordByVisit(visitId: string | number) {
  try {
    return await medicalRecordApi.getMedicalRecordByVisit(visitId)
  } catch (apiError: any) {
    if (apiError?.response?.status === 404) return null
    throw apiError
  }
}

async function saveVitals(showSuccess = true) {
  if (!activeVisit.value?.visitId) {
    if (showSuccess) showToast('Thiếu lượt khám', 'Cần mở lượt khám lâm sàng trước khi lưu sinh hiệu.', 'error')
    return false
  }

  const validationError = validateVitalsForm()
  if (validationError) {
    if (showSuccess) {
      showToast('Sinh hiệu chưa hợp lệ', validationError, 'error')
      return false
    }
    throw new Error(validationError)
  }

  const shouldToggleSaving = showSuccess && !savingExam.value
  if (shouldToggleSaving) savingExam.value = true
  try {
    await savePatientHistory()
    await medicalRecordApi.updateVisitVitals(activeVisit.value.visitId, {
      bloodPressure: textOrNull(vitalsForm.bloodPressure),
      heartRate: numberOrNull(vitalsForm.heartRate),
      temperature: numberOrNull(vitalsForm.temperature),
      respiratoryRate: numberOrNull(vitalsForm.respiratoryRate),
      spo2: numberOrNull(vitalsForm.spo2),
      height: numberOrNull(vitalsForm.height),
      weight: numberOrNull(vitalsForm.weight),
      note: textOrNull([vitalsForm.note, historyNote()].filter(Boolean).join('\n')),
    })
    activeVisit.value = await medicalRecordApi.getVisit(activeVisit.value.visitId)
    hydrateVitalsFromVisit(activeVisit.value)
    if (showSuccess) showToast('Đã lưu sinh hiệu', 'Sinh hiệu đã được cập nhật thành công.', 'success')
    return true
  } catch (apiError) {
    if (!showSuccess) throw apiError
    showToast('Lưu sinh hiệu thất bại', businessError(apiError), 'error')
    return false
  } finally {
    if (shouldToggleSaving) savingExam.value = false
  }
}

async function savePatientHistory() {
  const patient = activePatient.value
  const id = patient?.id || patient?.patientId
  if (!id || !patient?.fullName) return
  const medicalHistory = patientHistoryText()
  activePatient.value = await medicalRecordApi.updatePatient(id, {
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    phoneNumber: patient.phoneNumber || patient.phone,
    email: patient.email,
    address: patient.address,
    citizenId: patient.citizenId,
    bloodType: patient.bloodType,
    allergyNote: textOrNull(historyForm.allergies),
    medicalHistory: textOrNull(medicalHistory),
    status: patient.status,
  }).catch(() => patient)
}

async function saveDraft() {
  if (!activeVisit.value?.visitId) return showToast('Thiếu lượt khám', 'Cần mở lượt khám lâm sàng trước khi lưu nháp.', 'error')
  savingExam.value = true
  try {
    await savePatientHistory()
    if (examForm.diagnosis.trim()) await saveMedicalRecord()
    else showToast('Đã lưu nháp', 'Tiền sử, dị ứng và thông tin khám hiện có đã được lưu.', 'success')
  } catch (apiError) {
    showToast('Lưu nháp thất bại', businessError(apiError), 'error')
  } finally {
    savingExam.value = false
  }
}

async function loadClinicalOrders() {
  const medicalRecordId = Number(activeRecord.value?.medicalRecordId)
  if (!medicalRecordId) {
    clinicalOrders.value = []
    return
  }
  clinicalOrders.value = await medicalRecordApi.getClinicalOrders({ medicalRecordId }).catch(() => [])
}

async function loadMedicines() {
  if (medicines.value.length) return
  medicineLoading.value = true
  try {
    const [n2Medicines, n3Medicines] = await Promise.all([
      medicalRecordApi.getMedicines({ status: 'Active' }).catch(() => [] as Medicine[]),
      medicineApi.getMedicines({ status: 'Active', pageSize: 1000 }).catch(() => [] as Medicine[]),
    ])
    medicines.value = uniqueMedicinesById([...n3Medicines, ...n2Medicines]) as any
    if (!medicines.value.length) {
      showToast('Chưa có thuốc', 'Không tải được danh mục thuốc từ máy chủ. Kiểm tra Kho thuốc hoặc thử tải lại.', 'error')
    }
  } finally {
    medicineLoading.value = false
  }
}

async function loadPrescriptionSpecialties() {
  if (prescriptionSpecialties.value.length) return
  const data = await appointmentApi.getSpecialties().catch(() => fallbackSpecialties)
  prescriptionSpecialties.value = data.length ? data : fallbackSpecialties
}

function uniqueMedicinesById(medicineList: Array<Medicine & Record<string, any>>) {
  const map = new Map<number | string, Medicine & Record<string, any>>()
  for (const medicine of medicineList) {
    const id = medicineId(medicine)
    const key = id || normalizeSearchText(medicineName(medicine))
    if (key && !map.has(key)) map.set(key, medicine)
  }
  return Array.from(map.values()).sort((a, b) => medicineName(a).localeCompare(medicineName(b), 'vi'))
}

function toggleMedicine(medicine: Medicine & Record<string, any>) {
  const id = medicineId(medicine)
  if (!id) return
  if (prescriptionItems.value.some((item) => item.medicineId === id)) {
    removeMedicine(id)
    return
  }
  prescriptionItems.value.push({
    medicineId: id,
    medicineNameSnapshot: medicineName(medicine),
    unitSnapshot: medicineUnit(medicine),
    dosage: '',
    frequency: '',
    durationDays: 1,
    quantity: 1,
    usageInstruction: '',
  })
}

function addPrescriptionRow() {
  prescriptionItems.value.push({
    medicineId: 0,
    medicineNameSnapshot: '',
    unitSnapshot: '',
    dosage: '',
    frequency: 'Theo liều dùng',
    durationDays: 1,
    quantity: 1,
    usageInstruction: '',
    note: '',
  })
}

function selectPrescriptionMedicine(item: PrescriptionItemPayload, value: string | number) {
  const textValue = String(value ?? '').trim()
  const id = Number(textValue)
  const normalized = normalizeSearchText(textValue)
  const medicine = medicines.value.find((entry) =>
    medicineId(entry) === id || normalizeSearchText(medicineName(entry)) === normalized)
  item.medicineNameSnapshot = medicine ? medicineName(medicine) : ''
  item.medicineId = medicine ? medicineId(medicine) : 0
  item.unitSnapshot = medicine ? medicineUnit(medicine) : ''
  if (!medicine) item.medicineNameSnapshot = textValue
}

function removeMedicine(target: number | PrescriptionItemPayload, index?: number) {
  if (typeof target === 'object') {
    const rowIndex = Number.isInteger(index) ? Number(index) : prescriptionItems.value.indexOf(target)
    if (rowIndex >= 0) prescriptionItems.value.splice(rowIndex, 1)
    return
  }
  prescriptionItems.value = prescriptionItems.value.filter((item) => item.medicineId !== target)
}

function validatePrescriptionItems() {
  for (const item of prescriptionItems.value) {
    if (!item.medicineId || !item.medicineNameSnapshot) throw new Error('Đơn thuốc có dòng thuốc không hợp lệ.')
    if (!item.dosage.trim()) throw new Error('Vui lòng nhập liều dùng cho tất cả thuốc.')
    if (!item.frequency.trim()) throw new Error('Vui lòng nhập tần suất dùng thuốc.')
    if (!Number.isFinite(Number(item.durationDays)) || Number(item.durationDays) <= 0) throw new Error('Số ngày dùng thuốc phải lớn hơn 0.')
    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) throw new Error('Số lượng thuốc phải lớn hơn 0.')
  }
}

function clearWorkingState() {
  selectedRow.value = null
  selectedRecord.value = null
  selectedDetail.value = null
  recordDrawerOpen.value = false
  detailDrawerOpen.value = false
  clearExamOnly()
}

function clearExamOnly() {
  activeVisit.value = null
  activeRecord.value = null
  activePatient.value = null
  clinicalOrders.value = []
  prescriptionItems.value = []
  Object.assign(examForm, { chiefComplaint: '', symptoms: '', clinicalExam: '', diagnosisCode: '', diagnosisSpecialty: '', diagnosis: '', doctorNote: '', treatmentPlan: '', followUpDate: '', conclusionStatus: 'Hoàn thành' })
  Object.assign(vitalsForm, { bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', spo2: '', height: '', weight: '', note: '' })
  Object.assign(historyForm, { diabetes: false, hypertension: false, cardiovascular: false, asthma: false, other: '', allergies: '' })
  Object.assign(clinicalChecklist, { bloodTest: false, urineTest: false, ultrasound: false, xray: false, ecg: false })
  Object.assign(orderForm, { orderType: 'Xét nghiệm', orderName: '', reason: '' })
}

function mapAppointment(item: Appointment): Row {
  return {
    key: `A${item.appointmentId}`,
    id: item.appointmentId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    patientName: displayText(item.patientName) || 'Chưa có tên',
    patientPhone: item.patientPhone,
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.appointmentDate),
    time: item.slotTime || '',
    timeLabel: `${formatDate(item.appointmentDate)} · ${item.slotTime || '--:--'}`,
    reason: item.reason || item.specialtyName || 'Chưa ghi lý do',
    status: item.status,
    raw: item,
  }
}

function mapQueue(item: WaitingQueueItem, appointment?: Appointment): Row {
  const appointmentDate = item.appointmentDate || item.queueDate || appointment?.appointmentDate
  const slotTime = item.slotTime || appointment?.slotTime || ''
  const queueNumber = item.queueNumber || appointment?.queueNumber
  const status = item.appointmentStatus || item.status || appointment?.status
  return {
    key: `Q${item.id || item.queueId || item.appointmentId}`,
    id: queueNumber || item.id || item.appointmentId,
    appointmentId: item.appointmentId,
    visitId: (item as any).visitId || (item as any).VisitId,
    patientId: item.patientId || appointment?.patientId,
    doctorId: item.doctorId || appointment?.doctorId,
    patientName: displayText(item.patientName || appointment?.patientName) || 'Chưa có tên',
    patientPhone: item.patientPhone || appointment?.patientPhone,
    doctorName: displayText(item.doctorName || appointment?.doctorName),
    date: normalizeDate(appointmentDate),
    time: slotTime,
    timeLabel: `${formatDate(appointmentDate)} · ${slotTime || '--:--'}`,
    reason: item.reason || appointment?.reason || item.specialtyName || appointment?.specialtyName || 'Chưa ghi lý do',
    specialtyName: item.specialtyName || appointment?.specialtyName,
    room: visitRoom({ raw: { ...appointment, ...item } } as Row),
    status,
    raw: { ...appointment, ...item },
  }
}

function isQueueVisibleAppointmentStatus(status?: string) {
  return ['confirmed', 'checkedin', 'progress', 'waiting'].includes(statusBucket(status))
}

function compareQueueRows(left: Row, right: Row) {
  const leftQueue = Number(left.id)
  const rightQueue = Number(right.id)
  if (Number.isFinite(leftQueue) && Number.isFinite(rightQueue) && leftQueue !== rightQueue) return leftQueue - rightQueue
  return String(left.time || '').localeCompare(String(right.time || ''))
}

function mapVisit(item: MedicalVisit): Row {
  return {
    key: `V${item.visitId || item.id}`,
    id: item.visitId || item.id,
    visitId: item.visitId || item.id,
    medicalRecordId: item.medicalRecordId,
    appointmentId: item.appointmentId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    patientName: displayText(item.patientName) || 'Chưa có tên',
    patientPhone: item.patientPhone || item.patientPhoneSnapshot || item.PatientPhone,
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.visitDate || item.createdAt),
    time: timeOf(item.visitDate || item.createdAt),
    timeLabel: `${formatDate(item.visitDate || item.createdAt)} · ${timeOf(item.visitDate || item.createdAt) || '--:--'}`,
    reason: item.chiefComplaint || item.symptoms || 'Chưa ghi lý do',
    status: item.status,
    raw: item,
  }
}

function mapRecord(item: MedicalRecord): Row {
  const patientName = (item as any).patientName || (item as any).patient?.fullName || (item as any).Patient?.FullName || `Bệnh nhân #${item.patientId || ''}`
  const examDate = item.examDate || item.createdAt
  const diagnosisCode = item.diagnosisCode || ''
  return {
    key: `R${item.medicalRecordId || item.recordId || item.id}`,
    id: item.medicalRecordCode || item.medicalRecordIdCode || item.recordIdCode || item.recordId || item.medicalRecordId || item.id,
    medicalRecordId: item.medicalRecordId,
    patientId: item.patientId,
    doctorId: Number(item.doctorId || 0) || undefined,
    patientName: displayText(patientName),
    doctorName: displayText(item.doctorName),
    date: normalizeDate(examDate),
    timeLabel: formatDate(examDate),
    completedLabel: item.completedAt ? formatDateTime(item.completedAt) : '-',
    diagnosis: item.diagnosisText || item.diagnosis || 'Chưa có chẩn đoán',
    diagnosisCode: diagnosisCode || '-',
    diagnosisSpecialty: item.diagnosisSpecialty || specialtyFromIcdCode(diagnosisCode) || '-',
    note: item.doctorNote || item.doctorNotes || item.treatmentPlan || 'Chưa ghi chú',
    status: item.status || 'Đã lưu',
    raw: item,
  }
}

function specialtyFromIcdCode(value?: string) {
  const code = String(value || '').split('-')[0].trim().toLowerCase()
  if (!code) return ''
  return icdCodes.find((item) => item.code.toLowerCase() === code)?.specialty || ''
}

function mapSchedule(item: DoctorSchedule & Record<string, any>): Row {
  const startTime = String(item.startTime || item.StartTime || '').slice(0, 5) || '--:--'
  const endTime = String(item.endTime || item.EndTime || '').slice(0, 5) || '--:--'
  const duration = Number(item.slotDurationMinutes || item.SlotDurationMinutes || 30) || 30
  const isAvailable = item.isAvailable !== false && item.IsAvailable !== false
  return {
    key: `S${item.scheduleId || item.id}`,
    id: item.scheduleId || item.id,
    doctorId: item.doctorId,
    doctorName: displayText(item.doctorName),
    date: normalizeDate(item.workDate),
    timeLabel: formatDate(item.workDate),
    time: startTime,
    startTime,
    endTime,
    timeRange: `${startTime} - ${endTime}`,
    slotDurationMinutes: duration,
    slotInfo: `${duration} phút/slot`,
    room: roomDisplay(item.roomName || item.RoomName || item.roomNumber || item.RoomNumber || item.room || item.Room),
    isAvailable,
    status: isAvailable ? 'Còn nhận lịch' : 'Đã kín lịch',
    raw: item,
  }
}

function sortRows(a: Row, b: Row) {
  const dateCompare = String(a.date || '').localeCompare(String(b.date || ''))
  if (dateCompare) return dateCompare
  return String(a.time || '').localeCompare(String(b.time || ''))
}

function statusBucket(status?: string) {
  const value = normalize(status)
  if (value.includes('cancel') || value.includes('huy') || value.includes('hủy')) return 'cancelled'
  if (value.includes('complete') || value.includes('done') || value.includes('hoan') || value.includes('hoàn')) return 'completed'
  if (value.includes('progress') || value.includes('dang') || value.includes('đang')) return 'progress'
  if (value.includes('checked')) return 'checkedin'
  if (value.includes('confirm')) return 'confirmed'
  if (value.includes('wait') || value.includes('pending') || value.includes('cho') || value.includes('chờ')) return 'waiting'
  return 'other'
}

function canCheckInAppointment(status?: string) {
  const value = normalize(status)
  return value.includes('confirm') || value.includes('xac nhan') || value.includes('xác nhận') || value.includes('checked')
}

function statusText(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'cancelled') return 'Đã hủy'
  if (bucket === 'completed') return 'Hoàn thành'
  if (bucket === 'progress') return 'Đang khám'
  if (bucket === 'checkedin') return 'Đã check-in'
  if (bucket === 'confirmed') return 'Đã xác nhận'
  if (bucket === 'waiting') return 'Chờ khám'
  return status || 'Chưa cập nhật'
}

function statusClass(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (bucket === 'progress') return 'bg-blue-100 text-blue-700'
  if (bucket === 'checkedin') return 'bg-teal-100 text-teal-700'
  if (bucket === 'confirmed') return 'bg-cyan-100 text-cyan-700'
  if (bucket === 'waiting') return 'bg-amber-100 text-amber-700'
  if (bucket === 'cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function meaningful(value: unknown) {
  const textValue = String(value || '').trim()
  const normalized = normalize(textValue)
  if (!textValue || normalized.includes('chua ghi') || normalized.includes('chua cap') || normalized.includes('chua co') || normalized.includes('chua nhan')) return ''
  return textValue
}

function today() {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function localDateIso(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function parseIsoDate(value: string) {
  const date = new Date(`${String(value || today()).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function scheduleDurationHours(row: Row) {
  const start = timeToMinutes(row.startTime)
  const end = timeToMinutes(row.endTime)
  if (start === null || end === null || end <= start) return 0
  return (end - start) / 60
}

function timeToMinutes(value: unknown) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null
}

function formatHourNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',')
}

function normalizeDate(value?: string) {
  return String(value || '').slice(0, 10)
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : new Intl.DateTimeFormat('vi-VN').format(date)
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function timeOf(value?: string) {
  if (!value) return ''
  const match = String(value).match(/T(\d{2}:\d{2})/)
  return match?.[1] || ''
}

function medicineId(medicine: Medicine & Record<string, any>) {
  return Number(medicine.medicineId ?? medicine.MedicineId ?? medicine.id ?? 0)
}

function medicineName(medicine: Medicine & Record<string, any>) {
  return String(medicine.medicineName ?? medicine.MedicineName ?? medicine.name ?? `Thuốc #${medicineId(medicine)}`)
}

function medicineType(medicine: Medicine & Record<string, any>) {
  return String(medicine.medicineType ?? medicine.MedicineType ?? medicine.type ?? medicine.Type ?? 'Khác').trim() || 'Khác'
}

function specialtyName(specialty: Specialty & Record<string, any>) {
  return String(specialty.specialtyName ?? specialty.SpecialtyName ?? specialty.name ?? '').trim()
}

function prescriptionSpecialty(row?: Row | null) {
  return meaningful(
    row?.raw?.specialtyName
    || row?.raw?.SpecialtyName
    || row?.raw?.specialtyNameSnapshot
    || row?.raw?.SpecialtyNameSnapshot
    || row?.specialtyName
    || authStore.user?.specialtyName,
  )
}

function medicineTypeOptions(medicineList: Array<Medicine & Record<string, any>>, row?: Row | null) {
  const currentSpecialty = prescriptionSpecialty(row)
  const specialtyOptions = prescriptionSpecialties.value.map(specialtyName).filter(Boolean)
  const medicineTypes = medicineList.map(medicineType).filter(Boolean)
  return Array.from(new Set([currentSpecialty, ...specialtyOptions, ...medicineTypes].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'))
}

function medicineMatchesFilter(medicine: Medicine & Record<string, any>, filterValue: string) {
  const selectedType = normalizeSearchText(filterValue)
  const currentType = normalizeSearchText(medicineType(medicine))
  return !selectedType || currentType === selectedType
}

function filteredPrescriptionMedicines(medicineList: Array<Medicine & Record<string, any>>) {
  const selectedType = normalizeSearchText(prescriptionMedicineType.value)
  if (!selectedType) return medicineList
  return medicineList.filter((medicine) => medicineMatchesFilter(medicine, prescriptionMedicineType.value))
}

function medicineSearchSuggestions(item: PrescriptionItemPayload, medicineList: Array<Medicine & Record<string, any>>) {
  const query = normalizeSearchText(item.medicineNameSnapshot)
  if (!query) return []
  return medicineList
    .filter((medicine) => {
      const id = medicineId(medicine)
      const name = normalizeSearchText(medicineName(medicine))
      return id && name.startsWith(query) && id !== item.medicineId
    })
    .slice(0, 8)
}

function applyDefaultPrescriptionFilter() {
  const specialty = prescriptionSpecialty(selectedRow.value)
  prescriptionMedicineType.value = specialty && medicines.value.some((medicine) => medicineMatchesFilter(medicine, specialty)) ? specialty : ''
}

function normalizeSearchText(value: unknown) {
  return normalize(value)
}

function medicineUnit(medicine: Medicine & Record<string, any>) {
  return String(medicine.unit ?? medicine.Unit ?? medicine.dosageForm ?? medicine.DosageForm ?? 'đơn vị')
}

function medicineStock(medicine: Medicine & Record<string, any>) {
  const value = Number(medicine.stockQuantity ?? medicine.StockQuantity ?? medicine.stock ?? 0)
  return Number.isFinite(value) ? value : 0
}

function medicinePrice(medicineIdValue: number) {
  const medicine = medicines.value.find((item) => medicineId(item) === medicineIdValue)
  return Number(medicine?.unitPrice ?? medicine?.UnitPrice ?? medicine?.price ?? medicine?.Price ?? 0) || 0
}

function doctorRoom(doctor?: (Doctor & Record<string, any>) | null) {
  return meaningful(doctor?.roomNumber || doctor?.RoomNumber || doctor?.roomName || doctor?.RoomName || doctor?.room || doctor?.Room)
}

function roomDisplay(value: unknown) {
  const room = meaningful(value)
  if (!room) return 'Chưa cập nhật'
  return normalize(room).startsWith('phong') ? room : `Phòng ${room}`
}

function visitRoom(row?: Row | null) {
  return meaningful(
    row?.room
    || row?.raw?.doctorRoom
    || row?.raw?.doctorRoomNumber
    || row?.raw?.roomNumber
    || row?.raw?.RoomNumber
    || row?.raw?.roomName
    || row?.raw?.RoomName
    || row?.raw?.room
    || row?.raw?.Room
    || doctorRoom(row?.raw?.doctor || row?.raw?.Doctor),
  )
}

function prescriptionNote() {
  return prescriptionItems.value.map((item) => `${item.medicineNameSnapshot}: ${item.quantity} ${item.unitSnapshot || ''}; ${item.dosage}; ${item.frequency}; ${item.durationDays} ngày`).join('\n')
}

function parseVitals(visit?: MedicalVisit | null) {
  const raw = visit?.vitalSignsJson || visit?.VitalSignsJson
  return parseVitalSignsValue(raw)
}

function parseVitalSignsValue(raw: unknown) {
  if (!raw || typeof raw !== 'string') return {} as Record<string, any>
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function hydrateVitalsFromVisit(visit?: MedicalVisit | null) {
  const vitals = parseVitals(visit)
  vitalsForm.bloodPressure = stringValue(vitals.bloodPressure ?? vitals.BloodPressure)
  vitalsForm.heartRate = stringValue(vitals.heartRate ?? vitals.HeartRate)
  vitalsForm.temperature = stringValue(vitals.temperature ?? vitals.Temperature)
  vitalsForm.respiratoryRate = stringValue(vitals.respiratoryRate ?? vitals.RespiratoryRate)
  vitalsForm.spo2 = stringValue(vitals.spo2 ?? vitals.Spo2 ?? vitals.spO2 ?? vitals.SpO2)
  vitalsForm.height = stringValue(vitals.height ?? vitals.Height)
  vitalsForm.weight = stringValue(vitals.weight ?? vitals.Weight)
  vitalsForm.note = stringValue(vitals.note ?? vitals.Note)
  const extraFromNote = parseSpecialtyVitalsNote(vitalsForm.note)
  for (const field of doctorVitalFields(selectedRow.value, visit)) {
    if (baseVitalFields.some((baseField) => baseField.key === field.key)) continue
    vitalsForm[field.key] = stringValue(
      vitals[field.key]
      ?? vitals[pascalCase(field.key)]
      ?? extraFromNote[field.label]
      ?? extraFromNote[doctorVitalFieldLabel(field)]
    )
  }
}

function doctorVitalSpecialty(row?: Row | null, visit?: MedicalVisit | null) {
  return normalize(
    row?.raw?.specialtyName
    || row?.raw?.SpecialtyName
    || row?.raw?.specialtyNameSnapshot
    || row?.raw?.SpecialtyNameSnapshot
    || row?.specialtyName
    || (visit as any)?.specialtyName
    || (visit as any)?.SpecialtyName
    || authStore.user?.specialtyName
    || examForm.diagnosisSpecialty,
  )
}

function doctorVitalSpecialtyLabel(row?: Row | null, visit?: MedicalVisit | null) {
  return meaningful(
    row?.raw?.specialtyName
    || row?.raw?.SpecialtyName
    || row?.raw?.specialtyNameSnapshot
    || row?.raw?.SpecialtyNameSnapshot
    || row?.specialtyName
    || (visit as any)?.specialtyName
    || (visit as any)?.SpecialtyName
    || authStore.user?.specialtyName
    || examForm.diagnosisSpecialty,
  )
}

function doctorVitalFields(row?: Row | null, visit?: MedicalVisit | null) {
  const specialtyKey = doctorVitalSpecialty(row, visit)
  const profile = specialtyVitalProfiles[specialtyKey] || defaultVitalProfile
  const extra = specialtyExtraVitalFields[specialtyKey] || []
  const seen = new Set<string>()
  const baseFields = profile.baseKeys
    .map((key) => baseVitalFields.find((field) => field.key === key))
    .filter(Boolean) as VitalFieldConfig[]
  return [...baseFields, ...extra].filter((field) => {
    if (seen.has(field.key)) return false
    seen.add(field.key)
    return true
  })
}

function doctorVitalFieldLabel(field: VitalFieldConfig) {
  return `${field.label}${field.unit ? ` (${field.unit})` : ''}`
}

function doctorSpecialtyExtraFields(row?: Row | null, visit?: MedicalVisit | null) {
  return doctorVitalFields(row, visit)
    .filter((field) => !baseVitalFields.some((baseField) => baseField.key === field.key))
    .filter((field) => meaningful(vitalsForm[field.key]))
}

function parseSpecialtyVitalsNote(value: unknown) {
  const result: Record<string, string> = {}
  const lines = String(value || '').split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*([^:]+):\s*(.+)\s*$/)
    if (!match) continue
    result[match[1].trim()] = match[2].trim()
  }
  return result
}

function pascalCase(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value
}

function hydrateHistoryFromPatient(patient?: Patient | null) {
  const medicalHistory = String(patient?.medicalHistory || '').trim()
  const normalized = normalize(medicalHistory)
  historyForm.diabetes = normalized.includes('tieu duong') || normalized.includes('diabetes')
  historyForm.hypertension = normalized.includes('tang huyet ap') || normalized.includes('hypertension')
  historyForm.cardiovascular = normalized.includes('tim mach') || normalized.includes('cardio')
  historyForm.asthma = normalized.includes('hen') || normalized.includes('asthma')
  historyForm.other = medicalHistory || ''
  historyForm.allergies = String(patient?.allergyNote || patient?.allergies || '').trim()
}

function hydrateClinicalTextFromRecord(record?: MedicalRecord | null) {
  const note = record?.doctorNote || record?.doctorNotes || ''
  const plan = record?.treatmentPlan || ''
  if (!examForm.clinicalExam && note) examForm.clinicalExam = note
  if (!examForm.doctorNote && plan) examForm.doctorNote = plan
}

function textOrNull(value: unknown) {
  const textValue = String(value ?? '').trim()
  return textValue || null
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

function validateVitalsForm() {
  const ranges: { value: unknown; label: string; min: number; max: number; integer?: boolean; unit?: string }[] = [
    { value: vitalsForm.temperature, label: 'Nhiệt độ', min: 30, max: 45, unit: '°C' },
    { value: vitalsForm.heartRate, label: 'Mạch', min: 1, max: 250, integer: true, unit: 'lần/phút' },
    { value: vitalsForm.respiratoryRate, label: 'Nhịp thở', min: 1, max: 100, integer: true, unit: 'lần/phút' },
    { value: vitalsForm.spo2, label: 'SpO2', min: 1, max: 100, integer: true, unit: '%' },
    { value: vitalsForm.height, label: 'Chiều cao', min: 1, max: 300, unit: 'cm' },
    { value: vitalsForm.weight, label: 'Cân nặng', min: 1, max: 500, unit: 'kg' },
  ]

  for (const item of ranges) {
    const textValue = String(item.value ?? '').trim()
    if (!textValue) continue
    const numberValue = Number(textValue)
    if (!Number.isFinite(numberValue)) return `${item.label} phải là số hợp lệ.`
    if (item.integer && !Number.isInteger(numberValue)) return `${item.label} phải là số nguyên.`
    if (numberValue < item.min || numberValue > item.max) {
      return `${item.label} phải nằm trong khoảng ${item.min}-${item.max}${item.unit ? ` ${item.unit}` : ''}.`
    }
  }

  if (String(vitalsForm.bloodPressure ?? '').trim().length > 30) return 'Huyết áp tối đa 30 ký tự.'
  return ''
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value)
}

function historyNote() {
  const items = [
    historyForm.diabetes ? 'Tiểu đường' : '',
    historyForm.hypertension ? 'Tăng huyết áp' : '',
    historyForm.cardiovascular ? 'Tim mạch' : '',
    historyForm.asthma ? 'Hen suyễn' : '',
    historyForm.other ? `Khác: ${historyForm.other}` : '',
    historyForm.allergies ? `Dị ứng: ${historyForm.allergies}` : '',
  ].filter(Boolean)
  return items.join('; ')
}

function patientHistoryText() {
  return [
    historyForm.diabetes ? 'Tiểu đường' : '',
    historyForm.hypertension ? 'Tăng huyết áp' : '',
    historyForm.cardiovascular ? 'Tim mạch' : '',
    historyForm.asthma ? 'Hen suyễn' : '',
    historyForm.other,
  ].map((item) => item.trim()).filter(Boolean).join('; ')
}

function clinicalDoctorNote() {
  const parts = [
    examForm.symptoms.trim() ? `Triệu chứng: ${examForm.symptoms.trim()}` : '',
    examForm.clinicalExam.trim() ? `Khám lâm sàng: ${examForm.clinicalExam.trim()}` : '',
    examForm.doctorNote.trim() ? `Lời dặn: ${examForm.doctorNote.trim()}` : '',
  ].filter(Boolean)
  return parts.join('\n') || undefined
}

function clinicalTreatmentPlan() {
  const parts = [
    examForm.treatmentPlan.trim(),
    examForm.conclusionStatus ? `Tình trạng: ${examForm.conclusionStatus}` : '',
  ].filter(Boolean)
  return parts.join('\n') || undefined
}

function patientAge(patient?: Patient | null) {
  const birth = patient?.dateOfBirth
  if (!birth) return ''
  const date = new Date(birth)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const month = now.getMonth() - date.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1
  return age > 0 ? `${age} tuổi` : ''
}

function bmiValue(height: unknown, weight: unknown) {
  const heightCm = Number(height)
  const weightKg = Number(weight)
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) return ''
  return (weightKg / ((heightCm / 100) ** 2)).toFixed(1)
}

function displayOrEmpty(value: unknown) {
  const textValue = String(value ?? '').trim()
  return textValue || 'Chưa có'
}

function doctorRecordIdentity(record: Row | Record<string, any>) {
  return String(record.key || record.medicalRecordId || record.raw?.medicalRecordId || record.id || `${record.patientId}-${record.date}-${record.diagnosisCode}`)
}

function doctorRecordCode(record?: Row | Record<string, any> | null) {
  return String(
    record?.id
    || record?.raw?.medicalRecordCode
    || record?.raw?.medicalRecordIdCode
    || record?.raw?.recordIdCode
    || record?.raw?.recordId
    || record?.medicalRecordId
    || record?.raw?.medicalRecordId
    || 'Chưa cập nhật',
  )
}

function doctorRecordDiagnosis(record?: Row | Record<string, any> | null) {
  return String(record?.diagnosis || record?.raw?.diagnosisText || record?.raw?.diagnosis || 'Chưa cập nhật chẩn đoán')
}

function doctorRecordPatientName(record?: Row | Record<string, any> | null) {
  const value = record?.patientName || record?.raw?.patientName || record?.raw?.PatientName
  if (value) return String(value)
  const code = record?.raw?.patientCode || record?.raw?.patientIdCode || record?.patientId
  return code ? `Bệnh nhân #${code}` : 'Chưa cập nhật'
}

function doctorRecordFollowUpDate(record?: Row | Record<string, any> | null) {
  return String(record?.raw?.followUpDate || record?.raw?.FollowUpDate || record?.followUpDate || '').slice(0, 10)
}

function doctorRecordSearchField(record: Row, key: string) {
  if (key === 'code') return doctorRecordCode(record)
  if (key === 'patientName') return doctorRecordPatientName(record)
  if (key === 'diagnosis') return doctorRecordDiagnosis(record)
  if (key === 'diagnosisCode') return record.diagnosisCode || '-'
  if (key === 'createdAt') return formatDate(record.date || record.raw?.createdAt)
  if (key === 'followUpDate') return doctorRecordFollowUpDate(record) ? formatDate(doctorRecordFollowUpDate(record)) : 'Chưa có'
  if (key === 'status') return statusText(record.status)
  return ''
}

function doctorRecordColumnFilter(key: string) {
  return (filterValue: string | number | boolean, record: Row) =>
    normalize(doctorRecordSearchField(record, key)).includes(normalize(filterValue))
}

function getDoctorRecordFilterKeys(event: Event) {
  const filterValue = (event.target as HTMLInputElement)?.value || ''
  return filterValue ? [filterValue] : []
}

function clearDoctorRecordFilter(clearFilters: (() => void) | undefined, confirm: () => void) {
  clearFilters?.()
  confirm()
}

function handleDoctorRecordTableChange(pagination: { current?: number; pageSize?: number }) {
  doctorRecordCurrentPage.value = pagination.current || 1
  doctorRecordPageSize.value = pagination.pageSize || 10
}

function doctorQueueIdentity(record: Row | Record<string, any>) {
  return String(record.key || record.visitId || record.appointmentId || record.id)
}

function doctorQueueSearchField(record: Row, key: string) {
  if (key === 'queueNo') return record.id || record.visitId || ''
  if (key === 'patientName') return [record.patientName, record.patientId].filter(Boolean).join(' ')
  if (key === 'timeLabel') return record.timeLabel || formatDate(record.date)
  if (key === 'room') return queueRoomOrSpecialty(record)
  if (key === 'reason') return record.reason || ''
  if (key === 'vitals') return queueVitalLabel(record)
  if (key === 'status') return statusText(record.status)
  return ''
}

function doctorQueueColumnFilter(key: string) {
  return (filterValue: string | number | boolean, record: Row) =>
    normalize(doctorQueueSearchField(record, key)).includes(normalize(filterValue))
}

function getDoctorQueueFilterKeys(event: Event) {
  const filterValue = (event.target as HTMLInputElement)?.value || ''
  return filterValue ? [filterValue] : []
}

function clearDoctorQueueFilter(clearFilters: (() => void) | undefined, confirm: () => void) {
  clearFilters?.()
  confirm()
}

function handleDoctorQueueTableChange(pagination: { current?: number; pageSize?: number }) {
  doctorQueueCurrentPage.value = pagination.current || 1
  doctorQueuePageSize.value = pagination.pageSize || 10
}

function recordTimestamp(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function doctorRecordStatusClass(status?: string) {
  const bucket = statusBucket(status)
  if (bucket === 'completed') return 'bg-emerald-50 text-emerald-700'
  if (bucket === 'progress') return 'bg-blue-50 text-blue-700'
  if (bucket === 'waiting' || bucket === 'confirmed') return 'bg-amber-50 text-amber-700'
  if (bucket === 'cancelled') return 'bg-rose-50 text-rose-700'
  return 'bg-slate-100 text-slate-600'
}

function doctorRecordNumericId(record?: Row | Record<string, any> | null) {
  const value = objectValue(record, 'medicalRecordId', 'MedicalRecordId')
    || objectValue(record?.raw, 'medicalRecordId', 'MedicalRecordId', 'id', 'Id')
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : 0
}

function clearPrintState() {
  recordToPrint.value = null
  printPatient.value = null
  printAppointment.value = null
  printVisit.value = null
  printClinicalOrders.value = []
  printPrescriptions.value = []
}

function applyCompleteRecordForPrint(baseRow: Row, complete: Record<string, any>) {
  const patient = complete.patient || complete.Patient || null
  const appointment = complete.appointment || complete.Appointment || null
  const visit = complete.visit || complete.Visit || null
  const medicalRecord = complete.medicalRecord || complete.MedicalRecord || {}
  const clinicalOrders = complete.clinicalOrders || complete.ClinicalOrders || []
  const prescriptions = complete.prescriptions || complete.Prescriptions || []

  printPatient.value = patient
  printAppointment.value = appointment
  printVisit.value = visit
  printClinicalOrders.value = Array.isArray(clinicalOrders) ? clinicalOrders : []
  printPrescriptions.value = Array.isArray(prescriptions) ? prescriptions : []

  const mergedRaw = { ...(baseRow.raw || {}), ...medicalRecord }
  recordToPrint.value = {
    ...baseRow,
    raw: mergedRaw,
    id: objectValue(medicalRecord, 'medicalRecordCode', 'MedicalRecordCode', 'medicalRecordIdCode', 'MedicalRecordIdCode', 'recordIdCode', 'RecordIdCode')
      || baseRow.id,
    medicalRecordId: objectValue(medicalRecord, 'medicalRecordId', 'MedicalRecordId', 'id', 'Id') || baseRow.medicalRecordId,
    visitId: objectValue(medicalRecord, 'visitId', 'VisitId') || objectValue(visit, 'visitId', 'VisitId', 'id', 'Id') || baseRow.visitId,
    appointmentId: objectValue(visit, 'appointmentId', 'AppointmentId') || objectValue(appointment, 'appointmentId', 'AppointmentId') || baseRow.appointmentId,
    patientId: objectValue(medicalRecord, 'patientId', 'PatientId') || objectValue(patient, 'patientId', 'PatientId', 'id', 'Id') || baseRow.patientId,
    doctorId: objectValue(medicalRecord, 'doctorId', 'DoctorId') || objectValue(visit, 'doctorId', 'DoctorId') || objectValue(appointment, 'doctorId', 'DoctorId') || baseRow.doctorId,
    patientName: objectValue(patient, 'fullName', 'FullName', 'name', 'Name') || objectValue(medicalRecord, 'patientName', 'PatientName') || baseRow.patientName,
    doctorName: objectValue(visit, 'doctorName', 'DoctorName') || objectValue(appointment, 'doctorNameSnapshot', 'DoctorNameSnapshot', 'doctorName', 'DoctorName') || baseRow.doctorName,
    diagnosis: objectValue(medicalRecord, 'diagnosisText', 'DiagnosisText', 'diagnosis', 'Diagnosis') || baseRow.diagnosis,
    diagnosisCode: objectValue(medicalRecord, 'diagnosisCode', 'DiagnosisCode') || baseRow.diagnosisCode,
    diagnosisSpecialty: objectValue(medicalRecord, 'diagnosisSpecialty', 'DiagnosisSpecialty') || baseRow.diagnosisSpecialty,
    note: objectValue(medicalRecord, 'doctorNote', 'DoctorNote', 'doctorNotes', 'DoctorNotes') || baseRow.note,
    status: objectValue(medicalRecord, 'status', 'Status') || baseRow.status,
    date: normalizeDate(objectValue(medicalRecord, 'examDate', 'ExamDate', 'createdAt', 'CreatedAt') as string) || baseRow.date,
    followUpDate: objectValue(medicalRecord, 'followUpDate', 'FollowUpDate') || baseRow.followUpDate,
    chiefComplaint: objectValue(visit, 'chiefComplaint', 'ChiefComplaint') || objectValue(appointment, 'reason', 'Reason') || baseRow.chiefComplaint,
    symptoms: objectValue(visit, 'symptoms', 'Symptoms') || objectValue(medicalRecord, 'symptoms', 'Symptoms') || baseRow.symptoms,
    vitalSignsJson: objectValue(visit, 'vitalSignsJson', 'VitalSignsJson') || objectValue(medicalRecord, 'vitalSignsJson', 'VitalSignsJson') || baseRow.vitalSignsJson,
  }
}

function objectValue(source: unknown, ...keys: string[]) {
  const data = source as Record<string, any> | null | undefined
  if (!data) return undefined
  for (const key of keys) {
    const value = data[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return undefined
}

function readFirst(source: Record<string, any>, ...keys: string[]) {
  return objectValue(source, ...keys)
}

function parsePrintVitalSigns(value: unknown): Record<string, any> {
  if (!value) return {}
  if (typeof value === 'object') return value as Record<string, any>
  try {
    const parsed = JSON.parse(String(value))
    return parsed && typeof parsed === 'object' ? parsed as Record<string, any> : {}
  } catch {
    return {}
  }
}

function printVitalDisplay(source: Record<string, any>, keys: string[], unit = '') {
  const value = readFirst(source, ...keys)
  if (value === undefined) return ''
  return `${value}${unit ? ` ${unit}` : ''}`
}

function printVitalBmiDisplay(source: Record<string, any>) {
  const weight = Number(readFirst(source, 'weight', 'Weight'))
  const height = Number(readFirst(source, 'height', 'Height'))
  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) return ''
  const heightMeters = height / 100
  return `${(weight / (heightMeters * heightMeters)).toFixed(1)} kg/m²`
}

function printPatientCode(record?: Row | Record<string, any> | null) {
  return objectValue(printPatient.value, 'patientCode', 'PatientCode', 'patientIdCode', 'PatientIdCode', 'id', 'Id')
    || objectValue(record, 'patientId')
    || objectValue(record?.raw, 'patientCode', 'PatientCode', 'patientIdCode', 'PatientIdCode')
    || 'Chưa có thông tin'
}

function printPatientName(record?: Row | Record<string, any> | null) {
  return objectValue(printPatient.value, 'fullName', 'FullName', 'name', 'Name') || doctorRecordPatientName(record)
}

function printPatientDateOfBirth() {
  return objectValue(printPatient.value, 'dateOfBirth', 'DateOfBirth') as string | undefined
}

function printPatientGender() {
  return objectValue(printPatient.value, 'gender', 'Gender') as string | undefined
}

function printPatientPhone() {
  return objectValue(printPatient.value, 'phoneNumber', 'PhoneNumber', 'phone', 'Phone') || 'Chưa có thông tin'
}

function printPatientEmail() {
  return objectValue(printPatient.value, 'email', 'Email') || 'Chưa có thông tin'
}

function printPatientCitizenId() {
  return objectValue(printPatient.value, 'citizenId', 'CitizenId') || 'Chưa có thông tin'
}

function printPatientBloodType() {
  return objectValue(printPatient.value, 'bloodType', 'BloodType') || 'Chưa có thông tin'
}

function printPatientAddress() {
  return objectValue(printPatient.value, 'address', 'Address') || 'Chưa có thông tin'
}

function printPatientMedicalHistory() {
  return objectValue(printPatient.value, 'medicalHistory', 'MedicalHistory') || 'Chưa ghi nhận'
}

function printPatientAllergy() {
  return objectValue(printPatient.value, 'allergyNote', 'AllergyNote', 'allergies', 'Allergies') || 'Chưa ghi nhận'
}

function printGenderLabel(value?: string) {
  const normalized = normalize(value)
  if (normalized === 'male' || normalized === 'nam') return 'Nam'
  if (normalized === 'female' || normalized === 'nu') return 'Nữ'
  return value || 'Chưa cập nhật'
}

function printAppointmentId(record?: Row | Record<string, any> | null) {
  return objectValue(printAppointment.value, 'appointmentId', 'AppointmentId')
    || objectValue(printVisit.value, 'appointmentId', 'AppointmentId')
    || objectValue(record, 'appointmentId')
    || 'Chưa có thông tin'
}

function printAppointmentTimeLabel(record?: Row | Record<string, any> | null) {
  const scheduledAt = objectValue(printAppointment.value, 'scheduledAt', 'ScheduledAt')
    || objectValue(printVisit.value, 'visitDate', 'VisitDate', 'createdAt', 'CreatedAt')
    || objectValue(record?.raw, 'examDate', 'ExamDate', 'createdAt', 'CreatedAt')
    || objectValue(record, 'date')
  if (scheduledAt) return formatDateTime(scheduledAt as string)
  const appointmentDate = objectValue(printAppointment.value, 'appointmentDate', 'AppointmentDate')
  if (!appointmentDate) return 'Chưa có thông tin'
  return `${formatDate(appointmentDate as string)} · ${objectValue(printAppointment.value, 'slotTime', 'SlotTime') || '--:--'}`
}

function printAppointmentSpecialty(record?: Row | Record<string, any> | null) {
  return objectValue(printAppointment.value, 'specialtyName', 'SpecialtyName', 'specialtyNameSnapshot', 'SpecialtyNameSnapshot')
    || objectValue(record?.raw, 'specialtyName', 'SpecialtyName', 'specialtyNameSnapshot', 'SpecialtyNameSnapshot')
    || 'Chưa có thông tin'
}

function printQueueNumber(record?: Row | Record<string, any> | null) {
  return objectValue(printAppointment.value, 'queueNumber', 'QueueNumber')
    || objectValue(record?.raw, 'queueNumber', 'QueueNumber')
    || 'Chưa có thông tin'
}

function printChiefComplaint(record?: Row | Record<string, any> | null) {
  return objectValue(printAppointment.value, 'reason', 'Reason')
    || objectValue(printVisit.value, 'chiefComplaint', 'ChiefComplaint')
    || objectValue(record, 'chiefComplaint', 'reason')
    || 'Chưa ghi nhận'
}

function printVisitId(record?: Row | Record<string, any> | null) {
  return objectValue(record, 'visitId')
    || objectValue(record?.raw, 'visitId', 'VisitId')
    || objectValue(printVisit.value, 'visitId', 'VisitId', 'id', 'Id')
    || 'Chưa có thông tin'
}

function printDoctorName(record?: Row | Record<string, any> | null) {
  return objectValue(record, 'doctorName')
    || objectValue(printVisit.value, 'doctorName', 'DoctorName')
    || objectValue(printAppointment.value, 'doctorNameSnapshot', 'DoctorNameSnapshot', 'doctorName', 'DoctorName')
    || doctorName.value
}

function printRecordCreatedAt(record?: Row | Record<string, any> | null) {
  return objectValue(record?.raw, 'createdAt', 'CreatedAt') || objectValue(record, 'date') as string | undefined
}

function printRecordUpdatedAt(record?: Row | Record<string, any> | null) {
  return objectValue(record?.raw, 'updatedAt', 'UpdatedAt', 'createdAt', 'CreatedAt') || objectValue(record, 'date') as string | undefined
}

function printRecordCompletedAt(record?: Row | Record<string, any> | null) {
  return objectValue(record?.raw, 'completedAt', 'CompletedAt') || objectValue(printVisit.value, 'completedAt', 'CompletedAt') as string | undefined
}

function printSymptoms(record?: Row | Record<string, any> | null) {
  return objectValue(record, 'symptoms')
    || objectValue(printVisit.value, 'symptoms', 'Symptoms')
    || objectValue(record?.raw, 'symptoms', 'Symptoms')
    || 'Chưa ghi nhận'
}

function printDoctorNote(record?: Row | Record<string, any> | null) {
  return objectValue(record, 'note')
    || objectValue(record?.raw, 'doctorNote', 'DoctorNote', 'doctorNotes', 'DoctorNotes')
    || 'Chưa có ghi chú'
}

function printTreatmentPlan(record?: Row | Record<string, any> | null) {
  return objectValue(record?.raw, 'treatmentPlan', 'TreatmentPlan') || 'Chưa có kế hoạch điều trị'
}

function printClinicalOrderKey(order: Record<string, any>) {
  return String(objectValue(order, 'clinicalOrderId', 'ClinicalOrderId', 'id', 'Id', 'clinicalOrderCode', 'ClinicalOrderCode') || JSON.stringify(order))
}

function printClinicalOrderName(order: Record<string, any>) {
  return String(objectValue(order, 'orderName', 'OrderName', 'name', 'Name') || 'Chưa cập nhật')
}

function printClinicalOrderType(order: Record<string, any>) {
  return String(objectValue(order, 'clinicalOrderCode', 'ClinicalOrderCode', 'orderType', 'OrderType') || '')
}

function printClinicalOrderResult(order: Record<string, any>) {
  const resultText = String(objectValue(order, 'resultText', 'ResultText') || '').trim()
  if (resultText) return resultText
  const value = String(objectValue(order, 'resultValue', 'ResultValue') || '').trim()
  const unit = String(objectValue(order, 'resultUnit', 'ResultUnit') || '').trim()
  return [value, unit].filter(Boolean).join(' ') || 'Chưa có kết quả'
}

function printClinicalOrderConclusion(order: Record<string, any>) {
  return objectValue(order, 'conclusion', 'Conclusion') || 'Chưa có kết luận'
}

function printClinicalOrderStatus(order: Record<string, any>) {
  return String(objectValue(order, 'status', 'Status') || '')
}

function printPrescriptionCode(prescription?: Record<string, any> | null) {
  const code = objectValue(prescription, 'prescriptionCode', 'PrescriptionCode', 'prescriptionIdCode', 'PrescriptionIdCode', 'code', 'Code')
  if (code) return String(code)
  const id = Number(objectValue(prescription, 'prescriptionId', 'PrescriptionId', 'id', 'Id'))
  return Number.isFinite(id) && id > 0 ? `DT${String(id).padStart(3, '0')}` : 'Chưa cập nhật'
}

function printPrescriptionCreatedAt(prescription?: Record<string, any> | null) {
  return objectValue(prescription, 'createdAt', 'CreatedAt', 'submittedAt', 'SubmittedAt') as string | undefined
}

function printPrescriptionStatus(prescription?: Record<string, any> | null) {
  return String(objectValue(prescription, 'status', 'Status') || '')
}

function printPrescriptionItems(prescription?: Record<string, any> | null) {
  const items = objectValue(prescription, 'items', 'Items', 'prescriptionItems', 'PrescriptionItems')
  return Array.isArray(items) ? items as Record<string, any>[] : []
}

function printPrescriptionItemKey(item: Record<string, any>, index: number) {
  return String(objectValue(item, 'id', 'Id', 'prescriptionItemId', 'PrescriptionItemId') || index)
}

function printPrescriptionItemMedicineName(item: Record<string, any>) {
  return String(objectValue(item, 'medicineNameSnapshot', 'MedicineNameSnapshot', 'medicineName', 'MedicineName') || 'Chưa cập nhật')
}

function printPrescriptionItemQuantity(item: Record<string, any>) {
  const quantity = objectValue(item, 'quantity', 'Quantity') || '-'
  const unit = String(objectValue(item, 'unitSnapshot', 'UnitSnapshot', 'unit', 'Unit') || '').trim()
  return [quantity, unit].filter(Boolean).join(' ')
}

function printPrescriptionItemDosage(item: Record<string, any>) {
  const dosage = String(objectValue(item, 'dosage', 'Dosage') || '').trim()
  const frequency = String(objectValue(item, 'frequency', 'Frequency') || '').trim()
  return [dosage, frequency].filter(Boolean).join(' · ') || 'Chưa cập nhật'
}

function printPrescriptionItemDuration(item: Record<string, any>) {
  const days = Number(objectValue(item, 'durationDays', 'DurationDays'))
  return Number.isFinite(days) && days > 0 ? `${days} ngày` : 'Chưa cập nhật'
}

function printPrescriptionItemInstruction(item: Record<string, any>) {
  return String(objectValue(item, 'usageInstruction', 'UsageInstruction', 'note', 'Note') || '').trim() || 'Theo dặn dò của bác sĩ'
}

function printPrescriptionNote(prescription?: Record<string, any> | null) {
  return String(objectValue(prescription, 'note', 'Note') || '').trim()
}

function escapeExcelCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function detailText(value: unknown) {
  const textValue = String(value ?? '').trim()
  return textValue || 'Chưa cập nhật'
}

function patientCitizenId(patient?: (Patient & Record<string, any>) | null) {
  return patient?.citizenId || patient?.CitizenId || ''
}

function businessError(apiError: unknown) {
  const message = getApiErrorMessage(apiError)
  const normalized = normalize(message)
  const mentionsVisit = normalized.includes('visit') || normalized.includes('luot kham') || normalized.includes('by-appointment')
  const visitIsMissing = normalized.includes('not found')
    || normalized.includes('khong tim')
    || normalized.includes('khong ton tai')
    || normalized.includes('chua duoc check-in')
    || normalized.includes('chua tao')
    || normalized.includes('by-appointment')
  if (mentionsVisit && visitIsMissing) return 'Lịch hẹn chưa được check-in hoặc chưa tạo lượt khám lâm sàng.'
  if (mentionsVisit && normalized.includes('da co benh an')) return 'Lượt khám đã có bệnh án. Vui lòng tải lại để cập nhật bệnh án hiện có.'
  if (normalized.includes('record') && normalized.includes('complete')) return 'Cần hoàn tất bệnh án trước khi hoàn tất lượt khám.'
  if (normalized.includes('diagnosis')) return 'Vui lòng nhập chẩn đoán hợp lệ trước khi lưu bệnh án.'
  return message
}

function showToast(title: string, message: string, type: ToastType = 'success') {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
}

function cols(...defs: [string, string, boolean?][]): Column[] {
  return defs.map(([key, label, strong]) => ({ key, label, strong }))
}

function isResource(value: unknown): value is Resource {
  return typeof value === 'string' && value in configs
}

const StatusChip = defineComponent({
  props: { status: { type: String, default: '' } },
  setup(props) {
    return () => h('span', { class: ['inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusClass(props.status)] }, statusText(props.status))
  },
})

const MetricCard = defineComponent({
  props: { metric: { type: Object as PropType<any>, required: true } },
  setup(props) {
    return () => h('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' }, [
      h('div', { class: 'flex items-start justify-between gap-4' }, [
        h('div', null, [
          h('p', { class: 'text-sm font-medium text-slate-500' }, props.metric.label),
          h('p', { class: 'mt-3 text-3xl font-bold text-slate-950' }, String(props.metric.value)),
          h('p', { class: 'mt-1 text-xs font-semibold text-slate-500' }, props.metric.note),
        ]),
        h('span', { class: ['flex h-11 w-11 items-center justify-center rounded-xl', props.metric.className] }, [h(props.metric.icon, { class: 'h-5 w-5' })]),
      ]),
    ])
  },
})

const EmptyState = defineComponent({
  props: { title: { type: String, required: true }, text: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'p-10 text-center' }, [
      h(SearchX, { class: 'mx-auto h-10 w-10 text-slate-300' }),
      h('h2', { class: 'mt-4 text-lg font-bold text-slate-950' }, props.title),
      h('p', { class: 'mt-2 text-sm text-slate-500' }, props.text),
    ])
  },
})

const DoctorRecordSection = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('h3', { class: 'text-xs font-bold uppercase tracking-wider text-slate-400' }, props.title),
      slots.default?.(),
    ])
  },
})

const DoctorRecordInfo = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '' },
    mono: Boolean,
  },
  setup(props) {
    return () => h('div', { class: 'rounded-xl border border-slate-100 bg-slate-50 p-3' }, [
      h('span', { class: 'text-xs font-semibold text-slate-400' }, props.label),
      h('p', {
        class: [
          'mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-slate-800',
          props.mono ? 'font-mono' : '',
        ],
        title: displayOrEmpty(props.value),
      }, displayOrEmpty(props.value)),
    ])
  },
})

const DoctorRecordTimelineItem = defineComponent({
  props: {
    tone: { type: String as PropType<'blue' | 'amber' | 'emerald' | 'indigo'>, required: true },
    title: { type: String, required: true },
    time: { type: String, required: true },
  },
  setup(props) {
    const toneClass = computed(() => {
      if (props.tone === 'amber') return 'bg-amber-100 text-amber-700 [&>span]:bg-amber-600'
      if (props.tone === 'emerald') return 'bg-emerald-100 text-emerald-700 [&>span]:bg-emerald-600'
      if (props.tone === 'indigo') return 'bg-indigo-100 text-indigo-700 [&>span]:bg-indigo-600'
      return 'bg-blue-100 text-blue-700 [&>span]:bg-blue-600'
    })
    return () => h('div', { class: 'relative' }, [
      h('span', { class: ['absolute -left-[41px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white', toneClass.value] }, [
        h('span', { class: 'h-2.5 w-2.5 rounded-full' }),
      ]),
      h('div', null, [
        h('h4', { class: 'text-sm font-bold text-slate-900' }, props.title),
        h('p', { class: 'mt-1 text-xs text-slate-500' }, props.time),
      ]),
    ])
  },
})

const RecordDrawer = defineComponent({
  props: { row: { type: Object as PropType<Row | null>, default: null } },
  emits: ['close'],
  setup(props, { emit }) {
    return () => h('div', { class: 'fixed inset-0 z-50 bg-slate-950/40', onClick: () => emit('close') }, [
      h('aside', { class: 'ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl', onClick: (event: Event) => event.stopPropagation() }, [
        drawerHeader('Chi tiết bệnh án', emit),
        h('div', { class: 'mt-6 grid gap-4' }, [
          sectionBlock('Tổng quan', [
            ['Mã bệnh án', props.row?.id],
            ['Bệnh nhân', props.row?.patientName],
            ['Ngày tạo', props.row?.timeLabel],
            ['Trạng thái', statusText(props.row?.status)],
          ]),
          sectionBlock('Chẩn đoán', [
            ['Mã ICD', props.row?.diagnosisCode],
            ['Chuyên khoa ICD', props.row?.diagnosisSpecialty],
            ['Chẩn đoán', props.row?.diagnosis],
            ['Ghi chú', props.row?.note],
          ]),
          sectionBlock('Điều trị', [
            ['Kế hoạch', props.row?.raw?.treatmentPlan || props.row?.raw?.TreatmentPlan],
            ['Ngày tái khám', formatDate(props.row?.raw?.followUpDate || props.row?.raw?.FollowUpDate)],
          ]),
        ]),
      ]),
    ])
  },
})

const ExaminationWorkspace = defineComponent({
  props: {
    row: { type: Object as PropType<Row | null>, default: null },
    activeVisit: { type: Object as PropType<MedicalVisit | null>, default: null },
    activeRecord: { type: Object as PropType<MedicalRecord | null>, default: null },
    activePatient: { type: Object as PropType<Patient | null>, default: null },
    clinicalOrders: { type: Array as PropType<Record<string, any>[]>, required: true },
    medicines: { type: Array as PropType<(Medicine & Record<string, any>)[]>, required: true },
    medicineLoading: Boolean,
    saving: Boolean,
    examForm: { type: Object as PropType<typeof examForm>, required: true },
    vitalsForm: { type: Object as PropType<typeof vitalsForm>, required: true },
    historyForm: { type: Object as PropType<typeof historyForm>, required: true },
    orderForm: { type: Object as PropType<typeof orderForm>, required: true },
    clinicalChecklist: { type: Object as PropType<typeof clinicalChecklist>, required: true },
    prescriptionItems: { type: Array as PropType<PrescriptionItemPayload[]>, required: true },
  },
  emits: ['start', 'save-draft', 'save-vitals', 'save-record', 'add-order', 'save-order-result', 'add-prescription-row', 'select-prescription-medicine', 'toggle-medicine', 'remove-medicine', 'submit'],
  setup(props, { emit }) {
    return () => h('div', { class: 'min-w-0' }, [
      props.row
        ? [
            renderProgressSteps(props),
            h('div', { class: 'grid gap-6 pb-28 xl:grid-cols-[minmax(0,1fr)_360px]' }, [
              h('div', { class: 'space-y-6' }, [
                renderPatientCard(props, emit),
                renderVitalsCard(props, emit),
                h('div', { class: 'grid gap-6 2xl:grid-cols-2' }, [
                  renderHistoryCard(props),
                  renderAllergyCard(props),
                ]),
                renderMedicalRecordCard(props),
                renderPrescriptionCard(props, emit),
              ]),
              h('aside', { class: 'space-y-6 xl:sticky xl:top-28 xl:self-start' }, [
                renderVisitInfoCard(props),
                renderReasonCard(props),
                renderClinicalOrdersCard(props, emit),
                renderConclusionCard(props),
              ]),
            ]),
            renderFooterActionBar(props, emit),
          ]
        : h('div', { class: 'rounded-2xl border border-slate-200 bg-white p-10 shadow-sm' }, [
            h(EmptyState, { title: 'Chưa chọn bệnh nhân', text: 'Chọn một bệnh nhân bên trái để bắt đầu khám, lưu bệnh án và kê đơn.' }),
          ]),
    ])
  },
})

function renderProgressSteps(props: any) {
  const steps = ['Bắt đầu khám', 'Bệnh án', 'Chỉ định', 'Kê đơn', 'Hoàn thành']
  const active = statusBucket(props.activeVisit?.status || props.row?.status) === 'completed'
    ? 4
    : props.prescriptionItems.length
      ? 3
      : props.clinicalOrders.length
        ? 2
        : props.activeRecord?.medicalRecordId || props.examForm.diagnosis
          ? 1
          : statusBucket(props.activeVisit?.status || props.row?.status) === 'progress'
            ? 0
            : 0
  return h('div', { class: 'mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm' }, [
    h('div', { class: 'grid min-w-[720px] grid-cols-5 gap-3' }, steps.map((label, index) =>
      h('div', { class: ['flex items-center gap-3', index < steps.length - 1 ? 'after:h-px after:flex-1 after:bg-slate-200' : ''] }, [
        h('span', { class: ['flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold', index <= active ? 'bg-[#0F52BA] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'] }, String(index + 1)),
        h('span', { class: ['whitespace-nowrap text-sm font-bold', index <= active ? 'text-[#0F52BA]' : 'text-slate-500'] }, label),
      ]),
    )),
  ])
}

function renderPatientCard(props: any, emit: any) {
  const patient = props.activePatient as (Patient & Record<string, any>) | null
  const visit = props.activeVisit as MedicalVisit | null
  const visitStatus = statusBucket(visit?.status || props.row?.status)
  return medicalCard('Thông tin bệnh nhân', UserRound, [
    h('div', { class: 'flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between' }, [
      h('div', { class: 'flex min-w-0 items-center gap-4' }, [
        h('div', { class: 'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0F52BA]' }, [h(UserRound, { class: 'h-8 w-8' })]),
        h('div', { class: 'min-w-0' }, [
          h('div', { class: 'flex flex-wrap items-center gap-2' }, [
            h('h2', { class: 'truncate text-2xl font-bold text-slate-950' }, displayOrEmpty(patient?.fullName || props.row?.patientName)),
            h('span', { class: 'rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600' }, displayOrEmpty(patient?.gender)),
            h('span', { class: 'rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700' }, patientAge(patient) || 'Chưa có tuổi'),
          ]),
        ]),
      ]),
      h('div', { class: 'flex shrink-0 flex-wrap items-center gap-2' }, [
        h(StatusChip, { status: visit?.status || props.row?.status }),
        h(BaseButton, {
          type: 'button',
          variant: visitStatus === 'progress' ? 'outline' : 'primary',
          loading: props.saving,
          disabled: ['completed', 'progress'].includes(visitStatus),
          onClick: () => emit('start'),
        }, () => [h(Stethoscope, { class: 'h-4 w-4' }), visitStatus === 'progress' ? 'Đang khám' : 'Bắt đầu khám']),
      ]),
    ]),
    h('div', { class: 'mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4' }, [
      infoItem('Mã bệnh nhân', patient?.patientCode || patient?.patientIdCode || visit?.patientCode || props.row?.patientId),
      infoItem('Số điện thoại', patient?.phoneNumber || patient?.phone || props.row?.patientPhone || props.row?.raw?.patientPhone || props.row?.raw?.PatientPhone),
      infoItem('CCCD', patientCitizenId(patient)),
      infoItem('Ngày khám', props.row?.timeLabel || formatDate(visit?.visitDate || visit?.createdAt)),
      infoItem('Bệnh án', props.activeRecord?.medicalRecordCode || props.activeRecord?.medicalRecordIdCode || props.activeRecord?.medicalRecordId),
    ]),
  ])
}

function renderVisitInfoCard(props: any) {
  const visit = props.activeVisit as MedicalVisit | null
  const row = props.row as Row | null
  return medicalCard('Thông tin lượt khám', ClipboardCheck, [
    h('div', { class: 'space-y-3' }, [
      sideInfoItem('Bác sĩ khám', visit?.doctorName || row?.doctorName || doctorName.value),
      sideInfoItem('Khoa/Phòng', row?.raw?.specialtyName || row?.specialtyName || 'Chưa có'),
      sideInfoItem('Phòng khám', visitRoom(row) || 'Chưa có'),
      sideInfoItem('Loại khám', row?.raw?.type || row?.raw?.visitType || 'Khám thường'),
      sideInfoItem('Mã lịch hẹn', visit?.appointmentId || row?.appointmentId),
    ]),
  ])
}

function renderReasonCard(props: any) {
  return medicalCard('Lý do khám', ClipboardList, [
    h('div', { class: 'space-y-4' }, [
      inputField('Lý do khám *', props.examForm.chiefComplaint, (value: string) => { props.examForm.chiefComplaint = value }, 'Chưa có'),
      inputField('Ngày bắt đầu', String(props.activeVisit?.startedAt || props.activeVisit?.visitDate || props.row?.date || '').slice(0, 10), () => undefined, '', 'date'),
    ]),
  ])
}

function renderVitalsCard(props: any, _emit: any) {
  const bmi = bmiValue(props.vitalsForm.height, props.vitalsForm.weight)
  const fields = doctorVitalFields(props.row, props.activeVisit)
  const specialtyLabel = doctorVitalSpecialtyLabel(props.row, props.activeVisit)
  return medicalCard('Sinh hiệu', HeartPulse, [
    h('div', { class: 'mb-4 flex flex-wrap gap-2' }, [
      h('span', { class: 'rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700' }, specialtyLabel ? `Chuyên khoa: ${specialtyLabel}` : 'Chuyên khoa chung'),
      h('span', { class: 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600' }, `${fields.length} chỉ số theo dõi`),
    ]),
    h('div', { class: 'grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(128px,1fr))]' }, [
      ...fields.map((field) => vitalField(field.label, props.vitalsForm[field.key], field.unit || '', vitalFieldIcon(field.key))),
      bmi
        ? h('div', { class: 'rounded-xl border border-blue-100 bg-blue-50 p-3' }, [
        h('p', { class: 'text-xs font-bold text-blue-700' }, 'BMI'),
        h('p', { class: 'mt-2 text-xl font-bold text-slate-950' }, bmi || 'Chưa có'),
        h('p', { class: 'text-xs text-slate-500' }, bmi ? 'kg/m²' : 'Nhập chiều cao/cân nặng'),
        ])
        : null,
    ]),
  ])
}

function renderHistoryCard(props: any) {
  return medicalCard('Tiền sử bệnh', ShieldCheck, [
    h('div', { class: 'grid gap-3 sm:grid-cols-2' }, [
      checkboxField('Tiểu đường', props.historyForm.diabetes, (value: boolean) => { props.historyForm.diabetes = value }),
      checkboxField('Tăng huyết áp', props.historyForm.hypertension, (value: boolean) => { props.historyForm.hypertension = value }),
      checkboxField('Tim mạch', props.historyForm.cardiovascular, (value: boolean) => { props.historyForm.cardiovascular = value }),
      checkboxField('Hen suyễn', props.historyForm.asthma, (value: boolean) => { props.historyForm.asthma = value }),
    ]),
    h('div', { class: 'mt-4' }, [
      inputField('Khác', props.historyForm.other, (value: string) => { props.historyForm.other = value }, 'Nhập tiền sử khác nếu có'),
    ]),
  ])
}

function renderAllergyCard(props: any) {
  return medicalCard('Dị ứng thuốc', AlertTriangle, [
    textareaField('Dị ứng thuốc', props.historyForm.allergies, (value: string) => { props.historyForm.allergies = value }, 'Chưa có', ''),
  ])
}

function renderMedicalRecordCard(props: any) {
  return medicalCard('Bệnh án khám', ClipboardList, [
    h('div', { class: 'grid gap-4 xl:grid-cols-2' }, [
      textareaField('Triệu chứng', props.examForm.symptoms, (value: string) => { props.examForm.symptoms = value }, 'Chưa có'),
      textareaField('Khám lâm sàng', props.examForm.clinicalExam, (value: string) => { props.examForm.clinicalExam = value }, 'Chưa có'),
      textareaField('Chẩn đoán *', props.examForm.diagnosis, (value: string) => { props.examForm.diagnosis = value }, 'VD: Cảm lạnh thông thường', 'xl:col-span-2'),
      h('div', { class: 'xl:col-span-2 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]' }, [
        h('label', { class: 'block' }, [
          h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, 'Chuyên khoa ICD'),
          h('select', {
            value: props.examForm.diagnosisSpecialty,
            class: formInputClass,
            onChange: (event: Event) => { props.examForm.diagnosisSpecialty = (event.target as HTMLSelectElement).value },
          }, icdSpecialtyOptions.value.map((option) =>
            h('option', { value: option.value }, option.label),
          )),
        ]),
        h('label', { class: 'block' }, [
          h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, 'Mã ICD'),
          h('input', {
            value: props.examForm.diagnosisCode,
            list: 'icd-options',
            class: formInputClass,
            placeholder: 'Tìm mã ICD hoặc tên bệnh',
            onInput: (event: Event) => updateDiagnosisCode((event.target as HTMLInputElement).value, props.examForm),
            onChange: (event: Event) => updateDiagnosisCode((event.target as HTMLInputElement).value, props.examForm),
          }),
          h('datalist', { id: 'icd-options' }, filteredIcdCodes.value.map((item) =>
            h('option', { value: icdOptionValue(item), label: item.specialty }),
          )),
          props.medicines.length
            ? null
            : h('p', { class: 'border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800' }, 'Chưa tải được danh mục thuốc. Vui lòng bấm nút Tải lại thuốc bên dưới hoặc kiểm tra kết nối hệ thống.'),
        ]),
      ]),
    ]),
  ])
}

function renderClinicalOrdersCard(props: any, emit: any) {
  return medicalCard('Chỉ định cận lâm sàng', FlaskConical, [
    h('div', { class: 'grid gap-2 sm:grid-cols-2' }, [
      checkboxField('Xét nghiệm máu', props.clinicalChecklist.bloodTest, (value: boolean) => { props.clinicalChecklist.bloodTest = value }),
      checkboxField('Xét nghiệm nước tiểu', props.clinicalChecklist.urineTest, (value: boolean) => { props.clinicalChecklist.urineTest = value }),
      checkboxField('Siêu âm', props.clinicalChecklist.ultrasound, (value: boolean) => { props.clinicalChecklist.ultrasound = value }),
      checkboxField('X-Quang', props.clinicalChecklist.xray, (value: boolean) => { props.clinicalChecklist.xray = value }),
      checkboxField('Điện tim', props.clinicalChecklist.ecg, (value: boolean) => { props.clinicalChecklist.ecg = value }),
    ]),
    h('div', { class: 'mt-4 grid gap-3' }, [
      selectField('Loại', props.orderForm.orderType, (value: string) => { props.orderForm.orderType = value }, ['Xét nghiệm', 'Siêu âm', 'X-Quang', 'Điện tim', 'Khác']),
      inputField('Tên chỉ định khác', props.orderForm.orderName, (value: string) => { props.orderForm.orderName = value }, 'VD: Nội soi tai mũi họng'),
      inputField('Lý do', props.orderForm.reason, (value: string) => { props.orderForm.reason = value }, 'Chưa có'),
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('add-order') }, () => [h(Plus, { class: 'h-4 w-4' }), 'Thêm chỉ định']),
    ]),
    props.clinicalOrders.length
      ? h('div', { class: 'mt-4 space-y-2' }, props.clinicalOrders.map((order: any) => {
          const hasResult = Boolean(order.resultText || order.ResultText || order.conclusion || order.Conclusion)
          return h('div', { class: 'rounded-xl border border-blue-100 bg-blue-50 p-3' }, [
            h('div', { class: 'flex items-start justify-between gap-3' }, [
              h('div', { class: 'min-w-0' }, [
                h('p', { class: 'font-bold text-blue-800' }, `${order.orderType || order.OrderType || 'Chỉ định'} - ${order.orderName || order.OrderName || 'Chưa có'}`),
                h('p', { class: 'mt-1 text-xs text-slate-600' }, hasResult ? `Kết quả: ${order.resultText || order.ResultText || order.conclusion || order.Conclusion}` : 'Chưa nhập kết quả'),
              ]),
              h('button', {
                type: 'button',
                class: 'shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100',
                onClick: () => emit('save-order-result', order),
              }, hasResult ? 'Cập nhật' : 'Nhập kết quả'),
            ]),
          ])
        }))
      : h('p', { class: 'mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500' }, 'Chưa có chỉ định cận lâm sàng.'),
  ])
}

function renderPrescriptionCard(props: any, emit: any) {
  const typeOptions = medicineTypeOptions(props.medicines, props.row)
  const visibleMedicines = filteredPrescriptionMedicines(props.medicines)
  return medicalCard('Kê đơn thuốc', ClipboardCheck, [
    props.medicineLoading
      ? null
      : h('div', { class: 'mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]' }, [
          h('label', { class: 'block' }, [
            h('span', { class: 'mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500' }, 'Bộ lọc thuốc theo chuyên khoa'),
            h('select', {
              value: prescriptionMedicineType.value,
              class: formInputClass,
              onChange: (event: Event) => { prescriptionMedicineType.value = (event.target as HTMLSelectElement).value },
            }, [
              h('option', { value: '' }, 'Tất cả chuyên khoa/nhóm thuốc'),
              ...typeOptions.map((type) => h('option', { value: type }, type)),
            ]),
          ]),
          h('div', { class: 'flex items-end' }, [
            h('span', { class: 'inline-flex h-11 items-center rounded-xl bg-blue-50 px-4 text-sm font-bold text-blue-700' }, `${visibleMedicines.length} thuốc phù hợp`),
          ]),
        ]),
    props.medicineLoading
      ? h(LoadingSkeleton)
      : h('div', { class: 'overflow-x-auto rounded-xl border border-slate-200' }, [
          h('table', { class: 'min-w-[1020px] w-full divide-y divide-slate-200 text-sm' }, [
            h('thead', { class: 'bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500' }, [
              h('tr', null, ['Thuốc', 'Liều dùng', 'Số ngày', 'Số lượng', 'Ghi chú', 'Thao tác'].map((label) => h('th', { class: 'px-4 py-3' }, label))),
            ]),
            h('tbody', { class: 'divide-y divide-slate-100 bg-white' }, props.prescriptionItems.length
              ? props.prescriptionItems.map((item: PrescriptionItemPayload, index: number) => {
                  const listId = `medicine-suggestions-${index}`
                  const suggestions = medicineSearchSuggestions(item, visibleMedicines)
                  return h('tr', null, [
                    h('td', { class: 'px-4 py-3' }, [
                      h('div', { class: 'min-w-[280px]' }, [
                        h('input', {
                          value: item.medicineNameSnapshot || '',
                          list: listId,
                          class: [formInputClass, 'w-full'],
                          placeholder: 'Nhập tên thuốc',
                          autocomplete: 'off',
                          onInput: (event: Event) => emit('select-prescription-medicine', item, (event.target as HTMLInputElement).value),
                          onChange: (event: Event) => emit('select-prescription-medicine', item, (event.target as HTMLInputElement).value),
                        }),
                        suggestions.length
                          ? h('div', { class: 'mt-2 max-h-48 overflow-y-auto rounded-xl border border-blue-100 bg-white shadow-sm' }, suggestions.map((medicine: any) =>
                              h('button', {
                                type: 'button',
                                class: 'block w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50',
                                onClick: () => emit('select-prescription-medicine', item, medicineName(medicine)),
                              }, [
                                h('span', { class: 'block font-semibold text-slate-900' }, medicineName(medicine)),
                                h('span', { class: 'mt-0.5 block text-xs text-slate-500' }, `${medicineType(medicine)} - tồn ${medicineStock(medicine)} ${medicineUnit(medicine)}`),
                              ]),
                            ))
                          : null,
                      ]),
                      h('datalist', { id: listId }, [
                        ...visibleMedicines.map((medicine: any) => h('option', {
                          value: medicineName(medicine),
                          label: `${medicineName(medicine)} - ${medicineType(medicine)} - tồn ${medicineStock(medicine)}`,
                        })),
                      ]),
                    ]),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.dosage, class: [formInputClass, 'min-w-[160px]'], placeholder: 'VD: 1 viên x 2 lần/ngày', onInput: (event: Event) => { item.dosage = (event.target as HTMLInputElement).value } })),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.durationDays, type: 'number', min: 1, class: [formInputClass, 'min-w-[100px]'], onInput: (event: Event) => { item.durationDays = Number((event.target as HTMLInputElement).value) } })),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.quantity, type: 'number', class: [formInputClass, 'min-w-[110px]'], onInput: (event: Event) => { item.quantity = Number((event.target as HTMLInputElement).value) } })),
                    h('td', { class: 'px-4 py-3' }, h('input', { value: item.note || item.usageInstruction || '', class: [formInputClass, 'min-w-[180px]'], placeholder: 'Sau ăn, khi đau...', onInput: (event: Event) => { item.note = (event.target as HTMLInputElement).value; item.usageInstruction = (event.target as HTMLInputElement).value } })),
                    h('td', { class: 'px-4 py-3 text-center' }, h('button', { type: 'button', class: 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50', onClick: () => emit('remove-medicine', item, index) }, [h(Trash2, { class: 'h-4 w-4' })])),
                  ])
                })
              : [h('tr', null, [h('td', { class: 'px-4 py-6 text-center text-slate-500', colspan: 6 }, 'Chưa có thuốc trong đơn.')])]),
          ]),
        ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-3' }, [
      h(BaseButton, { type: 'button', variant: 'outline', onClick: () => emit('add-prescription-row') }, () => [h(Plus, { class: 'h-4 w-4' }), 'Thêm thuốc']),
    ]),
  ])
}

function renderConclusionCard(props: any) {
  return medicalCard('Kết luận khám', FileText, [
    h('div', { class: 'grid gap-4' }, [
      textareaField('Kết luận', props.examForm.treatmentPlan, (value: string) => { props.examForm.treatmentPlan = value }, 'Chưa có'),
      textareaField('Lời dặn bác sĩ', props.examForm.doctorNote, (value: string) => { props.examForm.doctorNote = value }, 'Chưa có'),
      inputField('Ngày tái khám', props.examForm.followUpDate, (value: string) => { props.examForm.followUpDate = value }, '', 'date'),
      h('div', null, [
        h('p', { class: 'mb-2 text-sm font-semibold text-slate-700' }, 'Tình trạng'),
        h('div', { class: 'grid gap-2' }, ['Hoàn thành', 'Theo dõi', 'Nhập viện', 'Chuyển viện'].map((option) =>
          radioField(option, props.examForm.conclusionStatus === option, () => { props.examForm.conclusionStatus = option }),
        )),
      ]),
    ]),
  ])
}

function renderFooterActionBar(props: any, emit: any) {
  return h('div', { class: 'sticky bottom-0 z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur' }, [
    h('div', { class: 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4' }, [
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('save-draft') }, () => [h(Save, { class: 'h-4 w-4' }), 'Lưu nháp']),
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('save-record') }, () => [h(FileText, { class: 'h-4 w-4' }), 'Lưu bệnh án']),
      h(BaseButton, { type: 'button', variant: 'outline', loading: props.saving, onClick: () => emit('submit') }, () => [h(ClipboardCheck, { class: 'h-4 w-4' }), 'Kê đơn']),
      h(BaseButton, { type: 'button', variant: 'primary', loading: props.saving, onClick: () => emit('submit') }, () => [h(CheckCircle2, { class: 'h-4 w-4' }), 'Hoàn thành khám']),
    ]),
  ])
}

function medicalCard(title: string, icon: any, children: any[]) {
  return h('section', { class: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' }, [
    h('div', { class: 'mb-5 flex items-center gap-3' }, [
      h('span', { class: 'flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F52BA]' }, [h(icon, { class: 'h-5 w-5' })]),
      h('h3', { class: 'text-lg font-bold text-slate-950' }, title),
    ]),
    ...children,
  ])
}

function infoItem(label: string, value: unknown) {
  return h('div', { class: 'rounded-xl border border-slate-100 bg-slate-50 px-4 py-3' }, [
    h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, label),
    h('p', { class: 'mt-1 min-h-[20px] break-words text-sm font-bold text-slate-800' }, displayOrEmpty(value)),
  ])
}

function sideInfoItem(label: string, value: unknown) {
  return h('div', { class: 'flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3' }, [
    h('span', { class: 'text-sm font-semibold text-slate-500' }, label),
    h('span', { class: 'min-w-0 truncate text-right text-sm font-bold text-slate-950' }, displayOrEmpty(value)),
  ])
}

function vitalFieldIcon(key: string) {
  if (key === 'bloodPressure') return HeartPulse
  if (key === 'heartRate') return Activity
  if (key === 'temperature') return Thermometer
  if (key === 'respiratoryRate') return Wind
  if (key === 'height') return Ruler
  if (key === 'weight') return Weight
  if (key.includes('pain')) return AlertTriangle
  if (key.includes('visual')) return Eye
  return Activity
}

function vitalField(label: string, value: any, unit: string, icon: any) {
  const textValue = String(value ?? '').trim()
  return h('div', { class: 'block rounded-xl border border-slate-200 bg-white p-3' }, [
    h('span', { class: 'flex items-center gap-2 text-xs font-bold text-slate-600' }, [
      h(icon, { class: 'h-4 w-4 text-[#0F52BA]' }),
      label,
    ]),
    h('span', { class: 'mt-2 flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3' }, [
      h('span', { class: ['min-w-0 flex-1 truncate text-sm font-semibold', textValue ? 'text-slate-900' : 'text-slate-400'] }, textValue || 'Chưa có'),
      h('span', { class: 'shrink-0 text-xs font-semibold text-slate-400' }, unit),
    ]),
  ])
}

function checkboxField(label: string, checked: boolean, update: (value: boolean) => void) {
  return h('label', { class: 'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50' }, [
    h('input', {
      checked,
      type: 'checkbox',
      class: 'h-4 w-4 shrink-0 rounded border-slate-300 text-[#0F52BA] focus:ring-blue-500',
      onChange: (event: Event) => update((event.target as HTMLInputElement).checked),
    }),
    h('span', { class: 'min-w-0 break-words' }, label),
  ])
}

function radioField(label: string, checked: boolean, update: () => void) {
  return h('label', { class: [compactOptionClass, checked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'] }, [
    h('input', {
      checked,
      type: 'radio',
      name: 'conclusionStatus',
      class: 'h-4 w-4 shrink-0 border-slate-300 text-[#0F52BA] focus:ring-blue-500',
      onChange: update,
    }),
    h('span', { class: 'min-w-0 break-words' }, label),
  ])
}

function inputField(label: string, value: any, update: (value: string) => void, placeholder = '', type = 'text') {
  return h('label', { class: 'block' }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('input', { value, type, placeholder, class: formInputClass, onInput: (event: Event) => update((event.target as HTMLInputElement).value) }),
  ])
}

function textareaField(label: string, value: any, update: (value: string) => void, placeholder = '', extraClass = '') {
  return h('label', { class: ['block', extraClass] }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('textarea', { value, rows: 3, placeholder, class: formTextareaClass, onInput: (event: Event) => update((event.target as HTMLTextAreaElement).value) }),
  ])
}

function selectField(label: string, value: string, update: (value: string) => void, options: string[]) {
  return h('label', { class: 'block' }, [
    h('span', { class: 'mb-2 block text-sm font-semibold text-slate-700' }, label),
    h('select', { value, class: formInputClass, onChange: (event: Event) => update((event.target as HTMLSelectElement).value) }, options.map((option) => h('option', { value: option }, option))),
  ])
}

function drawerHeader(title: string, emit: (event: 'close') => void) {
  return h('div', { class: 'flex items-start justify-between gap-4' }, [
    h('div', null, [
      h('p', { class: 'text-xs font-bold uppercase tracking-[0.16em] text-blue-700' }, 'MedicareDNU'),
      h('h2', { class: 'mt-1 text-2xl font-bold text-slate-950' }, title),
    ]),
    h('button', { type: 'button', class: 'rounded-xl p-2 text-slate-500 hover:bg-slate-100', onClick: () => emit('close') }, [h(X, { class: 'h-5 w-5' })]),
  ])
}

function sectionBlock(title: string, rows: [string, any][]) {
  return h('section', { class: 'rounded-2xl border border-slate-200 p-4' }, [
    h('h3', { class: 'font-bold text-slate-950' }, title),
    h('div', { class: 'mt-3 grid gap-3 sm:grid-cols-2' }, rows.map(([label, value]) => h('div', null, [
      h('p', { class: 'text-xs font-bold uppercase tracking-wide text-slate-400' }, label),
      h('p', { class: 'mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800' }, String(value || 'Chưa cập nhật')),
    ]))),
  ])
}
</script>

<style scoped lang="postcss">
.doctor-schedule-page {
  @apply space-y-4;
}

.doctor-records-page {
  @apply space-y-6;
}

.doctor-records-header {
  @apply flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:justify-between;
}

.doctor-records-header h1 {
  @apply text-[1.75rem] font-bold tracking-normal text-slate-950;
}

.doctor-records-header p {
  @apply mt-1.5 max-w-3xl text-[13px] font-medium leading-5 text-slate-500;
}

.doctor-records-header-actions {
  @apply flex flex-wrap gap-2;
}

.doctor-records-stats {
  @apply grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4;
}

.doctor-record-stat-card {
  @apply flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition;
}

.doctor-record-stat-card > div > span:first-child {
  @apply text-sm font-bold text-slate-700;
}

.doctor-record-stat-card p {
  @apply mt-4 text-3xl font-extrabold tracking-tight text-slate-900;
}

.doctor-record-stat-card small {
  @apply mt-1 block text-xs font-medium text-slate-500;
}

.doctor-record-stat-icon {
  @apply flex h-10 w-10 items-center justify-center rounded-xl;
}

.doctor-record-stat-card.is-total {
  @apply hover:border-blue-200 hover:shadow-[0_12px_24px_rgba(15,82,186,0.06)];
}

.doctor-record-stat-card.is-total .doctor-record-stat-icon {
  @apply bg-blue-50 text-blue-600;
}

.doctor-record-stat-card.is-completed {
  @apply hover:border-emerald-200 hover:shadow-[0_12px_24px_rgba(16,185,129,0.06)];
}

.doctor-record-stat-card.is-completed .doctor-record-stat-icon {
  @apply bg-emerald-50 text-emerald-600;
}

.doctor-record-stat-card.is-draft {
  @apply hover:border-amber-200 hover:shadow-[0_12px_24px_rgba(245,158,11,0.06)];
}

.doctor-record-stat-card.is-draft .doctor-record-stat-icon {
  @apply bg-amber-50 text-amber-600;
}

.doctor-record-stat-card.is-follow {
  @apply hover:border-indigo-200 hover:shadow-[0_12px_24px_rgba(99,102,241,0.06)];
}

.doctor-record-stat-card.is-follow .doctor-record-stat-icon {
  @apply bg-indigo-50 text-indigo-600;
}

.doctor-record-table-shell {
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.035);
}

.doctor-record-filter {
  width: 260px;
  padding: 12px;
}

.doctor-record-filter-title {
  color: #475569;
  font-size: 12px;
  font-weight: 650;
  margin: 0 0 8px;
}

.doctor-record-filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

.doctor-record-filter-reset {
  border-color: #e2e8f0;
  color: #64748b;
  font-weight: 500;
}

.doctor-record-filter-submit {
  background: #0F52BA;
  border-color: #0F52BA;
  font-weight: 500;
}

.doctor-record-follow-tag,
.doctor-record-status-tag {
  align-items: center;
  border: 0 !important;
  border-radius: 999px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  margin: 0;
  padding: 2px 9px;
}

.doctor-record-follow-tag {
  background: #eff6ff;
  color: #1d4ed8;
}

.doctor-record-follow-tag :deep(svg) {
  display: none;
}

.doctor-record-actions {
  display: inline-flex;
  gap: 8px;
  justify-content: center;
}

.doctor-record-action-button {
  align-items: center;
  border-radius: 7px;
  display: inline-flex;
  height: 32px;
  justify-content: center;
  width: 32px;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease;
}

.doctor-record-action-primary {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #4338ca;
}

.doctor-record-action-primary:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #3730a3;
  transform: translateY(-1px);
}

.doctor-record-action-muted {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}

.doctor-record-action-muted:hover {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
  transform: translateY(-1px);
}

.doctor-record-action-button:focus-visible {
  outline: 2px solid #bfdbfe;
  outline-offset: 2px;
}

.doctor-record-table-shell :deep(.ant-table) {
  color: #334155;
  font-size: 13px;
}

.doctor-record-table-shell :deep(.ant-table-container),
.doctor-record-table-shell :deep(.ant-table-content) {
  overflow-x: hidden !important;
}

.doctor-record-table-shell :deep(.ant-table table) {
  width: 100% !important;
  table-layout: fixed !important;
}

.doctor-record-table-shell :deep(.ant-table-thead > tr > th) {
  height: 44px;
  background: #f9fbfd;
  border-bottom: 1px solid #e8edf3;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 650;
  padding-block: 10px;
  padding-inline: 12px;
}

.doctor-record-table-shell :deep(.ant-table-tbody > tr > td) {
  height: 52px;
  border-bottom-color: #eef2f7;
  padding-block: 11px;
  padding-inline: 12px;
  vertical-align: middle;
  overflow-wrap: anywhere;
}

.doctor-record-table-shell :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: 0;
}

.doctor-record-table-shell :deep(.ant-table-tbody > tr:hover > td) {
  background: #f7faff;
}

.doctor-record-table-shell :deep(.ant-table-tbody > tr > td.ant-table-cell-fix-right),
.doctor-record-table-shell :deep(.ant-table-thead > tr > th.ant-table-cell-fix-right) {
  background: #ffffff;
}

.doctor-record-table-shell :deep(.ant-table-tbody > tr:hover > .ant-table-cell-fix-right) {
  background: #f7faff;
}

.doctor-record-table-shell :deep(.ant-pagination) {
  min-height: 58px;
  border-top: 1px solid #eef2f7;
  background: #fbfcfe;
  gap: 4px;
  margin: 0;
  padding: 13px 16px;
}

.doctor-record-table-shell :deep(.ant-table-cell-fix-right-first::after) {
  box-shadow: inset -8px 0 8px -8px rgb(15 23 42 / 0.16);
}

.doctor-record-table-shell :deep(.ant-table-column-sorter),
.doctor-record-table-shell :deep(.ant-table-filter-trigger) {
  color: #94a3b8;
  opacity: 0.45;
  transition: color 160ms ease, opacity 160ms ease;
}

.doctor-record-table-shell :deep(th:hover .ant-table-column-sorter),
.doctor-record-table-shell :deep(th:hover .ant-table-filter-trigger),
.doctor-record-table-shell :deep(.ant-table-filter-trigger.active) {
  opacity: 1;
}

.doctor-record-table-shell :deep(.ant-table-filter-trigger:hover),
.doctor-record-table-shell :deep(.ant-table-filter-trigger.active),
.doctor-record-table-shell :deep(.ant-table-column-sorter-up.active),
.doctor-record-table-shell :deep(.ant-table-column-sorter-down.active) {
  color: #0f52ba;
}

.doctor-record-table-shell :deep(.ant-pagination-total-text) {
  color: #64748b;
  font-size: 12px;
  line-height: 30px;
  margin-right: auto;
}

.doctor-record-table-shell :deep(.ant-pagination-item),
.doctor-record-table-shell :deep(.ant-pagination-prev .ant-pagination-item-link),
.doctor-record-table-shell :deep(.ant-pagination-next .ant-pagination-item-link) {
  min-width: 30px;
  height: 30px;
  margin-inline-end: 0;
  border-color: transparent;
  border-radius: 8px;
  background: transparent;
  line-height: 28px;
  transition: background 160ms ease, color 160ms ease;
}

.doctor-record-table-shell :deep(.ant-pagination-item:hover),
.doctor-record-table-shell :deep(.ant-pagination-prev:not(.ant-pagination-disabled) .ant-pagination-item-link:hover),
.doctor-record-table-shell :deep(.ant-pagination-next:not(.ant-pagination-disabled) .ant-pagination-item-link:hover) {
  background: #eaf2ff;
  border-color: transparent;
  color: #0f52ba;
}

.doctor-record-table-shell :deep(.ant-pagination-item-active) {
  background: #0f52ba;
  border-color: transparent;
  box-shadow: 0 4px 12px rgb(15 82 186 / 0.2);
}

.doctor-record-table-shell :deep(.ant-pagination-item-active:hover) {
  background: #003c90;
  border-color: transparent;
}

.doctor-record-table-shell :deep(.ant-pagination-item-active a),
.doctor-record-table-shell :deep(.ant-pagination-item-active:hover a),
.doctor-record-table-shell :deep(.ant-pagination-item-active:focus a) {
  color: #ffffff;
}

.doctor-record-table-shell :deep(.ant-pagination-options) {
  margin-inline-start: 8px;
}

.doctor-record-table-shell :deep(.ant-pagination-options .ant-select-selector) {
  background: #ffffff;
  border-color: #e2e8f0;
  border-radius: 8px;
  box-shadow: none;
  font-size: 12px;
  height: 30px;
}

.doctor-record-table-shell :deep(.ant-pagination-options .ant-select-selection-item) {
  line-height: 28px;
}

.doctor-queue-page {
  @apply space-y-4;
}

.doctor-queue-shell {
  @apply overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm;
}

.doctor-queue-table-header {
  @apply flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between;
}

.doctor-queue-table-header p {
  @apply text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700;
}

.doctor-queue-table-header h2 {
  @apply mt-0.5 text-lg font-bold text-slate-950;
}

.doctor-queue-table-actions {
  @apply flex flex-wrap items-center gap-2;
}

.doctor-queue-table-actions span {
  @apply rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700;
}

.doctor-queue-table-actions button {
  @apply inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60;
}

.doctor-queue-header {
  @apply flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between;
}

.doctor-queue-header h2 {
  @apply text-base font-bold text-slate-950;
}

.doctor-queue-header p {
  @apply mt-1 text-sm text-slate-500;
}

.doctor-queue-header > span {
  @apply rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700;
}

.doctor-queue-grid {
  @apply grid gap-4 p-4 xl:grid-cols-2 2xl:grid-cols-3;
}

.doctor-queue-card {
  @apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md;
}

.doctor-queue-card-top {
  @apply flex items-start justify-between gap-4;
}

.doctor-queue-card h3 {
  @apply mt-3 truncate text-base font-bold text-slate-950;
}

.doctor-queue-card p {
  @apply mt-1 text-xs font-semibold text-slate-500;
}

.doctor-queue-visit {
  @apply rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700;
}

.doctor-queue-vital-chip {
  @apply rounded-full px-2.5 py-1 text-xs font-bold;
}

.doctor-queue-vital-chip.is-done {
  @apply bg-emerald-100 text-emerald-800;
}

.doctor-queue-vital-chip.is-progress {
  @apply bg-blue-100 text-blue-800;
}

.doctor-queue-vital-chip.is-missing {
  @apply bg-rose-100 text-rose-800;
}

.doctor-queue-vital-tag {
  align-items: center;
  border: 0 !important;
  border-radius: 999px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  margin: 0;
  padding: 2px 9px;
}

.doctor-queue-vital-tag.is-done {
  background: #dcfce7;
  color: #166534;
}

.doctor-queue-vital-tag.is-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.doctor-queue-vital-tag.is-missing {
  background: #ffe4e6;
  color: #be123c;
}

.doctor-queue-wait {
  @apply shrink-0 text-right;
}

.doctor-queue-wait span {
  @apply text-[11px] font-bold uppercase tracking-wide text-slate-400;
}

.doctor-queue-wait strong {
  @apply mt-1 block text-sm font-bold text-slate-900;
}

.doctor-queue-info-grid {
  @apply mt-4 grid gap-3 sm:grid-cols-2;
}

.doctor-queue-info-grid div {
  @apply rounded-xl bg-slate-50 px-3 py-2;
}

.doctor-queue-info-grid span {
  @apply text-[11px] font-bold uppercase tracking-wide text-slate-400;
}

.doctor-queue-info-grid strong {
  @apply mt-1 block truncate text-sm font-semibold text-slate-800;
}

.doctor-queue-reason {
  @apply mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-600;
}

.doctor-queue-actions {
  @apply mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3;
}

.doctor-queue-detail,
.doctor-queue-start {
  @apply inline-flex h-10 items-center rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60;
}

.doctor-queue-detail {
  @apply border border-slate-200 bg-white text-slate-700 hover:bg-slate-50;
}

.doctor-queue-start {
  @apply bg-blue-700 text-white hover:bg-blue-800;
}

.doctor-queue-pager {
  @apply flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between;
}

.doctor-queue-pager p {
  @apply text-sm text-slate-500;
}

.doctor-queue-pager span {
  @apply rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200;
}

.schedule-page-header {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}

.schedule-title-row {
  @apply flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between;
}

.schedule-page-kicker {
  @apply text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700;
}

.schedule-page-header h1 {
  @apply mt-1 text-[1.85rem] font-semibold tracking-normal text-slate-950;
}

.schedule-page-header p:not(.schedule-page-kicker) {
  @apply mt-1.5 max-w-2xl text-[13px] font-normal leading-5 text-slate-500;
}

.schedule-page-actions {
  @apply flex flex-wrap items-center gap-2;
}

.schedule-icon-action,
.schedule-week-button {
  @apply inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50;
}

.schedule-icon-action {
  @apply w-9;
}

.schedule-week-button {
  @apply px-3;
}

.schedule-header-controls {
  @apply mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[1fr_auto] lg:items-end;
}

.schedule-toolbar-main {
  @apply grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px];
}

.schedule-search-input,
.schedule-select,
.schedule-range-controls input {
  @apply h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100;
}

.schedule-search-input {
  @apply pl-9;
}

.schedule-range-controls {
  @apply grid gap-3 sm:grid-cols-2;
}

.schedule-range-controls label {
  @apply block;
}

.schedule-range-controls span {
  @apply mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400;
}

.schedule-week-summary {
  @apply mt-4 grid overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 sm:grid-cols-2 xl:grid-cols-4;
}

.schedule-week-summary > div {
  @apply border-b border-slate-200/70 p-3 sm:border-r xl:border-b-0;
}

.schedule-week-summary > div:last-child {
  @apply border-r-0;
}

.schedule-week-summary p {
  @apply text-[11px] font-medium uppercase tracking-wide text-slate-400;
}

.schedule-week-summary strong {
  @apply mt-1 block text-base font-semibold text-slate-950;
}

.schedule-calendar-shell {
  @apply overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm;
}

.schedule-loading {
  @apply grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4;
}

.schedule-week-grid {
  @apply grid min-w-full lg:grid-cols-7;
}

.schedule-day-column {
  @apply min-h-[320px] border-b border-slate-100 bg-white lg:border-b-0 lg:border-r;
}

.schedule-day-column:last-child {
  @apply border-r-0;
}

.schedule-day-column.is-today {
  @apply bg-blue-50/30;
}

.schedule-day-header {
  @apply flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-3 lg:flex-col lg:items-start lg:gap-0;
}

.schedule-day-header span {
  @apply text-[11px] font-medium uppercase tracking-wide text-slate-400;
}

.schedule-day-header strong {
  @apply text-xl font-semibold leading-none text-slate-950;
}

.schedule-day-header em {
  @apply text-[11px] not-italic text-slate-400;
}

.schedule-day-body {
  @apply space-y-2 p-3;
}

.schedule-shift-card {
  @apply relative block w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100;
}

.schedule-shift-dot {
  @apply absolute right-3 top-3 h-2.5 w-2.5 rounded-full;
}

.schedule-shift-dot.is-open {
  @apply bg-emerald-400;
}

.schedule-shift-dot.is-full {
  @apply bg-slate-300;
}

.schedule-shift-time {
  @apply block pr-5 text-sm font-semibold text-slate-950;
}

.schedule-shift-room {
  @apply mt-1 block text-[12px] font-normal text-slate-500;
}

.schedule-shift-meta {
  @apply mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500;
}

.schedule-shift-status {
  @apply mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium;
}

.schedule-shift-status.is-open {
  @apply bg-emerald-50 text-emerald-700;
}

.schedule-shift-status.is-full {
  @apply bg-slate-100 text-slate-500;
}

.schedule-empty-day {
  @apply flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-center text-[12px] font-normal text-slate-400;
}

.form-input {
  @apply h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}

.form-textarea {
  @apply w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100;
}

.pager-btn {
  @apply h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>

<style>
.print-area {
  display: none !important;
}

@media print {
  html,
  body {
    background: white !important;
    color: #0f172a !important;
    font-family: Arial, "Helvetica Neue", sans-serif !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  body * {
    visibility: hidden !important;
  }

  .print-area,
  .print-area * {
    visibility: visible !important;
  }

  .print-area {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    background: white !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-container {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
    font-size: 11px !important;
    line-height: 1.45 !important;
  }

  .print-container h1,
  .print-container h2 {
    letter-spacing: 0 !important;
  }

  .print-container h2 {
    color: #0f4c9a !important;
  }

  .print-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @page {
    size: A4;
    margin: 12mm 14mm 14mm;
  }
}
</style>
