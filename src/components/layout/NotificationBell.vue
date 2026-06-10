<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
      aria-label="Thông báo"
      @click="togglePanel"
    >
      <Bell class="h-5 w-5" />
      <span
        v-if="notificationStore.unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white ring-2 ring-white"
      >
        {{ badgeText }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <section
        v-if="open"
        class="absolute right-0 top-12 z-[80] w-[min(92vw,380px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p class="text-sm font-bold text-slate-950">Thông báo</p>
            <p class="text-xs text-slate-500">{{ notificationStore.unreadCount }} chưa đọc</p>
          </div>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-2 rounded-md px-2 text-xs font-semibold text-[#0F52BA] hover:bg-blue-50 disabled:text-slate-400"
            :disabled="notificationStore.unreadCount === 0"
            @click="notificationStore.markAllAsRead()"
          >
            <CheckCheck class="h-4 w-4" />
            Đánh dấu đã đọc tất cả
          </button>
        </div>

        <div class="grid grid-cols-2 border-b border-slate-100 p-1">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="h-9 rounded-md text-xs font-bold transition"
            :class="activeTab === tab.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="max-h-[360px] overflow-y-auto">
          <button
            v-for="notification in visibleNotifications"
            :key="notification.id"
            type="button"
            class="grid w-full grid-cols-[36px_1fr] gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
            @click="openNotification(notification)"
          >
            <span :class="['flex h-9 w-9 items-center justify-center rounded-md', typeMeta(notification.type).className]">
              <component :is="typeMeta(notification.type).icon" class="h-4.5 w-4.5" />
            </span>
            <span class="min-w-0">
              <span class="flex items-start gap-2">
                <span class="line-clamp-1 text-sm font-bold text-slate-950">{{ notification.title }}</span>
                <span v-if="!notification.isRead" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500"></span>
              </span>
              <span class="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{{ notification.content }}</span>
              <span class="mt-1 block text-[11px] font-medium text-slate-400">{{ formatTime(notification.createdAt) }}</span>
            </span>
          </button>

          <div v-if="!visibleNotifications.length" class="px-4 py-8 text-center text-sm text-slate-500">
            Chưa có thông báo.
          </div>
        </div>

        <button
          type="button"
          class="flex h-11 w-full items-center justify-center gap-2 text-sm font-bold text-[#0F52BA] hover:bg-blue-50"
          @click="viewAll"
        >
          Xem tất cả
          <ArrowRight class="h-4 w-4" />
        </button>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Bell, CalendarCheck, CheckCheck, CreditCard, FileHeart, Pill, Settings, Stethoscope } from 'lucide-vue-next'
import { useNotificationStore, type NotificationItem } from '@/stores/notificationStore'

const router = useRouter()
const notificationStore = useNotificationStore()
const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const activeTab = ref<'all' | 'unread'>('all')
const tabs = [
  { label: 'Tất cả', value: 'all' as const },
  { label: 'Chưa đọc', value: 'unread' as const },
]

const badgeText = computed(() => (notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount))
const visibleNotifications = computed(() =>
  activeTab.value === 'unread' ? notificationStore.unreadNotifications : notificationStore.notifications,
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

async function togglePanel() {
  open.value = !open.value
  if (open.value) {
    await Promise.all([
      notificationStore.fetchNotifications().catch(() => undefined),
      notificationStore.fetchUnreadCount().catch(() => undefined),
    ])
  }
}

async function openNotification(notification: NotificationItem) {
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id).catch(() => undefined)
  }

  open.value = false
  if (notification.navigateUrl) {
    router.push(notification.navigateUrl)
  }
}

function viewAll() {
  open.value = false
  const first = notificationStore.notifications[0]
  if (first?.navigateUrl) {
    router.push(first.navigateUrl.split('?')[0])
  }
}

function typeMeta(type: string) {
  const normalized = String(type || '').toLowerCase()
  if (normalized.includes('appointment')) {
    return { icon: CalendarCheck, className: 'bg-blue-50 text-blue-700' }
  }
  if (normalized.includes('billing') || normalized.includes('invoice') || normalized.includes('payment')) {
    return { icon: CreditCard, className: 'bg-emerald-50 text-emerald-700' }
  }
  if (normalized.includes('prescription') || normalized.includes('medicine') || normalized.includes('pharmacy')) {
    return { icon: Pill, className: 'bg-indigo-50 text-indigo-700' }
  }
  if (normalized.includes('medicalrecord') || normalized.includes('record')) {
    return { icon: FileHeart, className: 'bg-rose-50 text-rose-700' }
  }
  if (normalized.includes('visit') || normalized.includes('exam')) {
    return { icon: Stethoscope, className: 'bg-cyan-50 text-cyan-700' }
  }
  return { icon: Settings, className: 'bg-slate-100 text-slate-700' }
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function handleOutsideClick(event: MouseEvent) {
  if (!open.value || !rootRef.value) return
  if (!rootRef.value.contains(event.target as Node)) open.value = false
}
</script>
