<template>
  <div
    class="fixed z-50 flex flex-col items-end"
    :class="isReturningAssistant ? 'assistant-returning' : ''"
    :style="assistantPositionStyle"
  >
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-4 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-4 scale-95 opacity-0"
    >
      <section
        v-if="isOpen"
        class="mb-4 flex h-[500px] max-h-[calc(100vh-8rem)] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        aria-label="DogkyChatbot"
      >
        <header class="flex items-center justify-between bg-teal-700 px-4 py-3 text-white">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <Stethoscope class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <h2 class="truncate text-sm font-bold leading-tight">DogkyChatbot</h2>
              <p class="truncate text-xs font-medium text-teal-100">Cún bác sĩ Medicare đang trực</p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-teal-50 transition hover:bg-white/10"
            aria-label="Đóng DogkyChatbot"
            @click="isOpen = false"
          >
            <X class="h-4.5 w-4.5" />
          </button>
        </header>

        <div ref="conversationRef" class="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div class="max-w-[82%]">
              <div
                class="whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm"
                :class="
                  message.sender === 'user'
                    ? 'rounded-br-md bg-teal-700 text-white'
                    : 'rounded-bl-md border border-slate-100 bg-white text-slate-800'
                "
              >
                <template v-if="message.table">
                  <p class="mb-2 font-semibold text-slate-900">{{ message.text }}</p>
                  <dl class="overflow-hidden rounded-xl border border-slate-200">
                    <div
                      v-for="row in message.table.rows"
                      :key="row.label"
                      class="grid grid-cols-[104px_1fr] border-b border-slate-100 last:border-b-0"
                    >
                      <dt class="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">{{ row.label }}</dt>
                      <dd class="min-w-0 px-3 py-2 text-xs font-semibold text-slate-800">{{ row.value }}</dd>
                    </div>
                  </dl>
                </template>
                <template v-else>
                  {{ message.text }}
                </template>
              </div>

              <RouterLink
                v-if="loginPromptMessageId === message.id"
                to="/login"
                class="mt-2 inline-flex items-center gap-2 rounded-full border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50"
              >
                <LogIn class="h-3.5 w-3.5" />
                Đăng nhập
              </RouterLink>

              <div
                v-if="message.id === initialBotMessageId"
                class="mt-3 flex flex-wrap gap-2"
              >
                <button
                  v-for="action in quickActions"
                  :key="action.key"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full border border-teal-600 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  :disabled="isLoading"
                  @click="handleQuickAction(action)"
                >
                  <component :is="quickActionIcon(action.key)" class="h-3.5 w-3.5" />
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="flex justify-start">
            <div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <span class="h-2 w-2 animate-bounce rounded-full bg-teal-500"></span>
              <span class="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]"></span>
              <span class="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]"></span>
            </div>
          </div>
        </div>

        <form class="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3" @submit.prevent="sendMessage()">
          <input
            v-model="inputValue"
            type="text"
            class="min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            placeholder="Nhập câu hỏi cho Dogky..."
            :disabled="isLoading"
          />
          <button
            type="submit"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md transition hover:bg-teal-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            :disabled="!canSend"
            aria-label="Gửi tin nhắn"
          >
            <Send class="h-4.5 w-4.5" />
          </button>
        </form>
      </section>
    </Transition>

    <div class="relative flex flex-col items-end">
      <Transition
        enter-active-class="dogky-cloud-enter-active"
        enter-from-class="dogky-cloud-enter-from"
        enter-to-class="dogky-cloud-enter-to"
        leave-active-class="dogky-cloud-leave-active"
        leave-from-class="dogky-cloud-leave-from"
        leave-to-class="dogky-cloud-leave-to"
      >
        <div
          v-if="notificationActive && !isOpen"
          class="dogky-cloud-bubble absolute bottom-[5.85rem] right-[-3.35rem] flex h-40 w-72 items-center justify-center bg-contain bg-center bg-no-repeat px-16 pb-9 pt-12 text-center text-sm font-bold leading-5 text-slate-800 drop-shadow-[0_18px_24px_rgba(15,23,42,0.16)]"
          :style="{ backgroundImage: `url(${chatBubbleUrl})` }"
        >
          <span class="dogky-cloud-text line-clamp-3">{{ notificationText }}</span>
        </div>
      </Transition>

      <button
        type="button"
        class="animate-float relative flex h-28 w-28 touch-none select-none items-center justify-center overflow-visible rounded-full transition-all duration-300 hover:scale-110"
        :class="isOpen || isReturningAssistant ? 'cursor-pointer' : isDraggingAssistant ? 'cursor-grabbing' : 'cursor-grab'"
        :aria-label="isOpen ? 'Đóng DogkyChatbot' : 'Mở DogkyChatbot'"
        @click="handleAssistantClick"
        @pointerdown="startAssistantDrag"
      >
        <video
          :src="assistantVideoUrl"
          class="h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(15,82,186,0.22)]"
          autoplay
          loop
          muted
          playsinline
          preload="auto"
          aria-hidden="true"
        ></video>
        <span class="absolute right-5 top-5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { Component } from 'vue'
import { FileHeart, LogIn, Pill, ReceiptText, Send, Stethoscope, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import assistantVideoUrl from '@/assets/assistant-loop.webm'
import chatBubbleUrl from '@/assets/chat.png'

interface ChatMessage {
  id: number
  sender: 'bot' | 'user'
  text: string
  table?: {
    rows: ChatTableRow[]
  }
}

interface ChatTableRow {
  label: string
  value: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        thought?: boolean
      }>
    }
  }>
}

type QuickActionKey = 'symptom' | 'prescription' | 'invoice' | 'record'

interface QuickAction {
  key: QuickActionKey
  label: string
}

type LooseRecord = Record<string, any>

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const initialBotMessageId = 1
let lastMessageId = initialBotMessageId

const isOpen = ref(false)
const isLoading = ref(false)
const messages = ref<ChatMessage[]>([
  {
    id: initialBotMessageId,
    sender: 'bot',
    text: 'Gâu! Dogky đang trực đây. Có chuyện gì cần hỗ trợ thì nói nhanh lên nhé, gâu!',
  },
])
const inputValue = ref('')
const notificationActive = ref(false)
const notificationText = ref('')
const conversationRef = ref<HTMLElement | null>(null)
const loginPromptMessageId = ref<number | null>(null)
const proactiveReminders = ref<string[]>([])
const defaultAssistantPosition = { bottom: 24, right: 24 }
const assistantReturnMs = 520
const assistantPosition = ref({ ...defaultAssistantPosition })
const isDraggingAssistant = ref(false)
const isReturningAssistant = ref(false)

const runtimeState = reactive({
  activeAction: null as QuickActionKey | null,
})

const quickActions = reactive<QuickAction[]>([
  { key: 'symptom', label: 'Tư vấn triệu chứng' },
  { key: 'prescription', label: 'Xem đơn thuốc gần nhất' },
  { key: 'invoice', label: 'Xem hóa đơn viện phí' },
  { key: 'record', label: 'Xem hồ sơ bệnh án' },
])

const geminiApiKey = computed(() => import.meta.env.VITE_GEMINI_API_KEY?.trim() || '')
const geminiModel = computed(() => import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-3.5-flash')
const geminiEndpoint = computed(() =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel.value)}:generateContent?key=${encodeURIComponent(geminiApiKey.value)}`,
)
const canSend = computed(() => inputValue.value.trim().length > 0 && !isLoading.value)
const assistantPositionStyle = computed(() => ({
  bottom: `${assistantPosition.value.bottom}px`,
  right: `${assistantPosition.value.right}px`,
}))
const geminiRequestTimeoutMs = 30000
const proactiveVisibleMs = 3000
const proactiveHiddenMs = 10000

let notificationTimer: number | undefined
let scrollFrame: number | undefined
let proactiveVisibleTimer: number | undefined
let proactiveHiddenTimer: number | undefined
let proactiveReminderIndex = 0
let dragStartX = 0
let dragStartY = 0
let dragStartBottom = defaultAssistantPosition.bottom
let dragStartRight = defaultAssistantPosition.right
let assistantMovedDuringDrag = false
let ignoreNextAssistantClick = false
let assistantReturnTimer: number | undefined

onMounted(() => {
  clampAssistantPosition()
  window.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', clampAssistantPosition)
  refreshProactiveReminders()
  scrollToBottom()
})

onBeforeUnmount(() => {
  if (notificationTimer) window.clearTimeout(notificationTimer)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  stopProactiveReminderLoop()
  if (assistantReturnTimer) window.clearTimeout(assistantReturnTimer)
  window.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', clampAssistantPosition)
  window.removeEventListener('pointermove', moveAssistant)
  window.removeEventListener('pointerup', stopAssistantDrag)
  window.removeEventListener('pointercancel', stopAssistantDrag)
})

watch(
  () => [notificationStore.toast.show, notificationStore.toast.message] as const,
  ([show]) => {
    if (!show) return
    if (isOpen.value) return

    notificationText.value = compactNotification(notificationStore.toast.message || notificationStore.toast.title || 'Bạn vừa nhận được thông báo mới.')
    notificationActive.value = true

    stopProactiveReminderLoop()
    if (notificationTimer) window.clearTimeout(notificationTimer)
    notificationTimer = window.setTimeout(() => {
      notificationActive.value = false
      notificationTimer = undefined
      scheduleNextProactiveReminder(proactiveHiddenMs)
    }, 6000)
  },
)

watch(isOpen, (open) => {
  if (open) {
    notificationActive.value = false
    stopProactiveReminderLoop()
    if (notificationTimer) {
      window.clearTimeout(notificationTimer)
      notificationTimer = undefined
    }
    return
  }

  scheduleNextProactiveReminder(proactiveHiddenMs)
})

watch(
  () => [authStore.isAuthenticated, authStore.user?.patientId] as const,
  () => refreshProactiveReminders(),
)

watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

watch(isLoading, () => scrollToBottom())

function handleAssistantClick() {
  if (ignoreNextAssistantClick) {
    ignoreNextAssistantClick = false
    return
  }

  if (isOpen.value) {
    isOpen.value = false
    return
  }

  openChatFromDefaultPosition()
}

function isAssistantAtDefaultPosition() {
  return (
    Math.abs(assistantPosition.value.bottom - defaultAssistantPosition.bottom) < 1 &&
    Math.abs(assistantPosition.value.right - defaultAssistantPosition.right) < 1
  )
}

function openChatFromDefaultPosition() {
  if (isAssistantAtDefaultPosition()) {
    isOpen.value = true
    scrollToBottom()
    return
  }

  if (assistantReturnTimer) window.clearTimeout(assistantReturnTimer)
  isReturningAssistant.value = true
  assistantPosition.value = { ...defaultAssistantPosition }

  assistantReturnTimer = window.setTimeout(() => {
    isReturningAssistant.value = false
    assistantReturnTimer = undefined
    isOpen.value = true
    scrollToBottom()
  }, assistantReturnMs)
}

function startAssistantDrag(event: PointerEvent) {
  if (isOpen.value || isReturningAssistant.value || event.button !== 0) return

  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartBottom = assistantPosition.value.bottom
  dragStartRight = assistantPosition.value.right
  assistantMovedDuringDrag = false
  isDraggingAssistant.value = true

  window.addEventListener('pointermove', moveAssistant)
  window.addEventListener('pointerup', stopAssistantDrag, { once: true })
  window.addEventListener('pointercancel', stopAssistantDrag, { once: true })
}

function moveAssistant(event: PointerEvent) {
  if (!isDraggingAssistant.value) return

  const deltaX = event.clientX - dragStartX
  const deltaY = event.clientY - dragStartY

  if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
    assistantMovedDuringDrag = true
  }

  assistantPosition.value = {
    bottom: dragStartBottom - deltaY,
    right: dragStartRight - deltaX,
  }
  clampAssistantPosition()
}

function stopAssistantDrag() {
  window.removeEventListener('pointermove', moveAssistant)
  window.removeEventListener('pointerup', stopAssistantDrag)
  window.removeEventListener('pointercancel', stopAssistantDrag)

  isDraggingAssistant.value = false
  if (assistantMovedDuringDrag) {
    ignoreNextAssistantClick = true
    window.setTimeout(() => {
      ignoreNextAssistantClick = false
    }, 0)
  }
}

function clampAssistantPosition() {
  if (typeof window === 'undefined') return

  const padding = 8
  const mascotSize = 112
  const maxRight = Math.max(padding, window.innerWidth - mascotSize - padding)
  const maxBottom = Math.max(padding, window.innerHeight - mascotSize - padding)

  assistantPosition.value = {
    bottom: Math.min(Math.max(assistantPosition.value.bottom, padding), maxBottom),
    right: Math.min(Math.max(assistantPosition.value.right, padding), maxRight),
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') isOpen.value = false
}

function nextMessageId() {
  lastMessageId += 1
  return lastMessageId
}

function addBotMessage(text: string) {
  const id = nextMessageId()
  messages.value.push({ id, sender: 'bot', text })
  return id
}

function addBotTableMessage(text: string, rows: ChatTableRow[]) {
  const id = nextMessageId()
  messages.value.push({ id, sender: 'bot', text, table: { rows } })
  return id
}

function addUserMessage(text: string) {
  messages.value.push({ id: nextMessageId(), sender: 'user', text })
}

function scrollToBottom() {
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined
    if (!conversationRef.value) return
    conversationRef.value.scrollTop = conversationRef.value.scrollHeight
  })
}

async function refreshProactiveReminders() {
  stopProactiveReminderLoop()
  proactiveReminders.value = []
  proactiveReminderIndex = 0

  if (!authStore.isAuthenticated) {
    notificationActive.value = false
    return
  }

  await resolvePatientProfileIfNeeded()
  const patientId = authStore.user?.patientId
  if (!patientId) return

  try {
    const [appointments, invoices, prescriptions] = await Promise.all([
      appointmentApi.getAppointmentsByPatient(patientId).catch(() => []),
      billingApi.getInvoices(patientId).catch(() => []),
      billingApi.getPrescriptions(patientId).catch(() => []),
    ])

    proactiveReminders.value = buildProactiveReminders(
      appointments as LooseRecord[],
      invoices as LooseRecord[],
      prescriptions as LooseRecord[],
    )

    if (!proactiveReminders.value.length) {
      notificationActive.value = false
      return
    }

    scheduleNextProactiveReminder(proactiveHiddenMs)
  } catch (error) {
    console.warn('Dogky proactive reminders unavailable', error)
  }
}

function buildProactiveReminders(appointments: LooseRecord[], invoices: LooseRecord[], prescriptions: LooseRecord[]) {
  const reminders: string[] = []
  const nextAppointment = newestUpcomingAppointment(appointments)
  const latestUnpaidInvoice = newestByDate(invoices.filter(isUnpaidInvoice), ['paidAt', 'createdAt'])
  const latestPrescription = newestByDate(prescriptions, [
    'dispensedAt',
    'submittedAt',
    'sentToPharmacyAt',
    'createdAt',
    'examDate',
    'visitDate',
  ])

  if (nextAppointment) {
    const dateText = formatAppointmentDateTime(nextAppointment)
    const doctorText = stringValue(nextAppointment.doctorName, nextAppointment.DoctorName)
    reminders.push(`Lịch khám ${dateText}${doctorText ? ` với ${doctorText}` : ''}.`)
  }

  if (latestUnpaidInvoice) {
    const code = stringValue(latestUnpaidInvoice.invoiceCode, latestUnpaidInvoice.invoiceIdCode, latestUnpaidInvoice.invoiceId, latestUnpaidInvoice.id)
    const amount = numberValue(latestUnpaidInvoice.balanceDue, latestUnpaidInvoice.totalAmount, latestUnpaidInvoice.amount)
    reminders.push(`Hóa đơn${code ? ` ${code}` : ''}${amount ? `: ${formatCurrency(amount)}` : ''}.`)
  }

  if (latestPrescription) {
    const code = stringValue(latestPrescription.prescriptionCode, latestPrescription.prescriptionIdCode, latestPrescription.id, latestPrescription.prescriptionId)
    reminders.push(`Đơn thuốc${code ? ` ${code}` : ''} đã cập nhật.`)
  }

  return reminders
}

function scheduleNextProactiveReminder(delayMs: number) {
  stopProactiveReminderLoop()
  if (!proactiveReminders.value.length || notificationStore.toast.show || isOpen.value) return

  proactiveHiddenTimer = window.setTimeout(() => {
    showProactiveReminder()
  }, delayMs)
}

function showProactiveReminder() {
  if (!proactiveReminders.value.length || notificationStore.toast.show || isOpen.value) return

  notificationText.value = compactNotification(proactiveReminders.value[proactiveReminderIndex % proactiveReminders.value.length])
  notificationActive.value = true
  proactiveReminderIndex += 1

  proactiveVisibleTimer = window.setTimeout(() => {
    notificationActive.value = false
    proactiveVisibleTimer = undefined
    scheduleNextProactiveReminder(proactiveHiddenMs)
  }, proactiveVisibleMs)
}

function stopProactiveReminderLoop() {
  if (proactiveVisibleTimer) window.clearTimeout(proactiveVisibleTimer)
  if (proactiveHiddenTimer) window.clearTimeout(proactiveHiddenTimer)
  proactiveVisibleTimer = undefined
  proactiveHiddenTimer = undefined
}

async function sendMessage(forcedText?: string) {
  const text = (forcedText ?? inputValue.value).trim()
  if (!text || isLoading.value) return

  loginPromptMessageId.value = null
  addUserMessage(text)
  inputValue.value = ''
  isLoading.value = true
  runtimeState.activeAction = 'symptom'

  try {
    const reply = await askGemini(text)
    addBotMessage(reply)
  } catch (error) {
    console.error('Dogky Gemini error', error)
    addBotMessage(dogkyGeminiErrorMessage(error))
  } finally {
    isLoading.value = false
    runtimeState.activeAction = null
  }
}

async function askGemini(userText: string) {
  if (!geminiApiKey.value) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }

  const prompt = `[SYSTEM PROMPT: Bạn là chú cún bác sĩ Dogky của Medicare, tính cách cộc cằn, bận rộn nhưng tận tụy, hay sủa Gâu! Hãy trả lời ngắn gọn dưới 3 câu. Nếu người dùng mô tả triệu chứng bệnh, hãy đưa ra lời khuyên sơ bộ và khuyên họ đến đúng chuyên khoa khám phù hợp, nhắc họ tự đặt lịch trên web chứ bạn không thể đặt lịch hộ]. Câu hỏi của người bệnh: ${userText}`
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), geminiRequestTimeoutMs)
  let response: Response

  try {
    response = await fetch(geminiEndpoint.value, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.6,
        },
      }),
    })
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw new Error('Gemini request timed out')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(geminiStatusMessage(response.status, errorText))
  }

  const responseData = (await response.json()) as GeminiResponse
  const parts = responseData.candidates?.[0]?.content?.parts || []
  const text = parts
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join('')
  return stripMarkdown(text || 'Gâu! Dogky chưa nghĩ ra câu trả lời rõ ràng. Bạn mô tả lại ngắn gọn hơn nhé.')
}

function geminiStatusMessage(status: number, body: string) {
  if (status === 400) return 'Gemini request invalid'
  if (status === 401 || status === 403) return 'Gemini API key unauthorized'
  if (status === 404) return `Gemini model not found: ${geminiModel.value}`
  if (status === 429) return 'Gemini quota exceeded'
  const compactBody = body.replace(/\s+/g, ' ').slice(0, 160)
  return `Gemini request failed with status ${status}${compactBody ? `: ${compactBody}` : ''}`
}

function dogkyGeminiErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  if (message.includes('timed out')) return 'Gâu... Gemini phản hồi chậm quá. Bạn thử lại sau vài giây nhé.'
  if (message.includes('Missing VITE_GEMINI_API_KEY')) return 'Gâu! Chưa cấu hình API key Gemini trong .env.'
  if (message.includes('API key unauthorized')) return 'Gâu! API key Gemini chưa đúng hoặc chưa có quyền dùng API.'
  if (message.includes('quota')) return 'Gâu! Gemini đang hết quota hoặc bị giới hạn lượt gọi.'
  if (message.includes('model not found')) return 'Gâu! Model Gemini đang cấu hình chưa đúng. Kiểm tra VITE_GEMINI_MODEL nhé.'
  return 'Gâu... Dogky chưa gọi được Gemini. Bạn thử lại sau một chút nhé.'
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function handleQuickAction(action: QuickAction) {
  if (isLoading.value) return

  if (action.key === 'symptom') {
    await sendMessage(action.label)
    return
  }

  loginPromptMessageId.value = null
  addUserMessage(action.label)

  if (!ensureAuthenticated()) return

  isLoading.value = true
  runtimeState.activeAction = action.key

  try {
    if (action.key === 'prescription') await replyWithLatestPrescription()
    if (action.key === 'invoice') await replyWithLatestInvoice()
    if (action.key === 'record') await replyWithLatestMedicalRecord()
  } catch (error) {
    console.error('Dogky lookup error', error)
    addBotMessage('Gâu! Dogky chưa lấy được dữ liệu của bạn lúc này. Thử lại sau nhé.')
  } finally {
    isLoading.value = false
    runtimeState.activeAction = null
  }
}

function ensureAuthenticated() {
  if (authStore.isAuthenticated) return true

  const id = addBotMessage('Bạn chưa đăng nhập kìa gâu! Hãy đăng nhập trước đi.')
  loginPromptMessageId.value = id
  return false
}

async function replyWithLatestPrescription() {
  const history = await medicalRecordApi.getCurrentPatientHistory()
  const latest = newestByDate(history.prescriptions as LooseRecord[], [
    'submittedAt',
    'sentToPharmacyAt',
    'dispensedAt',
    'createdAt',
    'examDate',
    'visitDate',
  ])

  if (!latest) {
    addBotMessage('Gâu, Dogky chưa thấy đơn thuốc nào trong hồ sơ của bạn.')
    return
  }

  const items = prescriptionItems(latest)
  const code = stringValue(latest.prescriptionCode, latest.prescriptionIdCode, latest.id, latest.prescriptionId)
  const medicineSummary = items.length
    ? items.slice(0, 4).map((item, index) => {
        const name = stringValue(item.medicineName, item.medicineNameSnapshot, item.name, item.Name) || 'Thuốc chưa rõ tên'
        const dosage = stringValue(item.dosage, item.Dosage) || 'chưa có liều'
        const frequency = stringValue(item.frequency, item.Frequency)
        return `${index + 1}. ${name} - ${dosage}${frequency ? `, ${frequency}` : ''}`
      }).join('\n')
    : 'Chưa có chi tiết thuốc'

  addBotTableMessage(code ? `Gâu, đơn thuốc gần nhất (${code}) đây:` : 'Gâu, đơn thuốc gần nhất đây:', [
    { label: 'Mã đơn', value: code || 'Không rõ' },
    { label: 'Ngày kê', value: formatDate(stringValue(latest.submittedAt, latest.createdAt, latest.examDate, latest.visitDate)) || 'Không rõ' },
    { label: 'Trạng thái', value: stringValue(latest.status, latest.stockStatus) || 'Không rõ' },
    { label: 'Thuốc', value: medicineSummary },
  ])
}

async function replyWithLatestInvoice() {
  await resolvePatientProfileIfNeeded()
  const patientId = authStore.user?.patientId

  if (!patientId) {
    addBotMessage('Gâu, tài khoản này chưa gắn mã bệnh nhân nên Dogky chưa tra được viện phí.')
    return
  }

  const invoices = (await billingApi.getInvoices(patientId)) as LooseRecord[]
  const latest = newestByDate(invoices, ['paidAt', 'createdAt'])

  if (!latest) {
    addBotMessage('Gâu, Dogky chưa thấy hóa đơn viện phí nào của bạn.')
    return
  }

  const code = stringValue(latest.invoiceCode, latest.invoiceIdCode, latest.invoiceId, latest.id)
  const examFee = numberValue(latest.examinationFee, latest.examFee, latest.amount)
  const medicineTotal = numberValue(latest.medicineTotal)
  const status = stringValue(latest.status, latest.invoiceStatus) || 'Chưa rõ'

  addBotTableMessage(code ? `Gâu, hóa đơn mới nhất (${code}):` : 'Gâu, hóa đơn mới nhất:', [
    { label: 'Mã hóa đơn', value: code || 'Không rõ' },
    { label: 'Tiền khám', value: formatCurrency(examFee) },
    { label: 'Tiền thuốc', value: formatCurrency(medicineTotal) },
    { label: 'Trạng thái', value: translateInvoiceStatus(status) },
  ])
}

async function replyWithLatestMedicalRecord() {
  const history = await medicalRecordApi.getCurrentPatientClinicalTimeline()
  const latest = newestByDate(history.medicalRecords as LooseRecord[], [
    'completedAt',
    'examDate',
    'createdAt',
    'updatedAt',
  ])

  if (!latest) {
    addBotMessage('Gâu, Dogky chưa thấy bệnh án khám gần đây nào của bạn.')
    return
  }

  const diagnosis = stringValue(latest.diagnosisText, latest.diagnosis, latest.diagnosisCode) || 'Chưa có chẩn đoán'
  const doctorNote = stringValue(latest.doctorNote, latest.doctorNotes, latest.treatmentPlan) || 'Chưa có lời dặn của bác sĩ'
  const date = formatDate(stringValue(latest.completedAt, latest.examDate, latest.createdAt, latest.updatedAt))

  addBotTableMessage(date ? `Gâu, bệnh án gần nhất ngày ${date}:` : 'Gâu, bệnh án gần nhất:', [
    { label: 'Ngày khám', value: date || 'Không rõ' },
    { label: 'Chẩn đoán', value: diagnosis },
    { label: 'Bác sĩ', value: stringValue(latest.doctorName) || 'Không rõ' },
    { label: 'Lời dặn', value: doctorNote },
  ])
}

async function resolvePatientProfileIfNeeded() {
  if (authStore.user?.patientId || !authStore.isAuthenticated) return
  await authStore.resolvePatientProfile().catch(() => undefined)
}

function newestByDate<T extends LooseRecord>(items: T[] = [], dateKeys: string[]) {
  if (!items.length) return undefined

  return [...items].sort((left, right) => itemTime(right, dateKeys) - itemTime(left, dateKeys))[0]
}

function newestUpcomingAppointment(items: LooseRecord[]) {
  return items
    .filter((item) => !isClosedAppointmentStatus(stringValue(item.status, item.Status)))
    .filter((item) => appointmentTimestamp(item) >= Date.now() - 15 * 60 * 1000)
    .sort((left, right) => appointmentTimestamp(left) - appointmentTimestamp(right))[0]
}

function itemTime(item: LooseRecord, dateKeys: string[]) {
  for (const key of dateKeys) {
    const value = item[key] ?? item[toPascalCase(key)]
    const time = new Date(String(value || '')).getTime()
    if (Number.isFinite(time)) return time
  }
  return 0
}

function appointmentTimestamp(item: LooseRecord) {
  const date = stringValue(item.appointmentDate, item.AppointmentDate, item.scheduledAt, item.ScheduledAt)
  const time = stringValue(item.slotTime, item.SlotTime, item.time, item.Time) || '00:00'
  const normalizedDate = date.slice(0, 10)
  const normalizedTime = time.slice(0, 5)
  const value = normalizedDate ? `${normalizedDate}T${normalizedTime}:00` : date
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function isClosedAppointmentStatus(status?: string) {
  const value = String(status || '').toLowerCase()
  return ['cancel', 'completed', 'done', 'noshow', 'expired', 'hủy'].some((keyword) => value.includes(keyword))
}

function isUnpaidInvoice(invoice: LooseRecord) {
  const status = stringValue(invoice.status, invoice.invoiceStatus, invoice.Status, invoice.InvoiceStatus).toLowerCase()
  const balanceDue = numberValue(invoice.balanceDue, invoice.BalanceDue)
  if (balanceDue > 0) return true
  return status.includes('unpaid') || status.includes('pending') || status.includes('chưa') || status.includes('not paid')
}

function prescriptionItems(prescription: LooseRecord) {
  const value = prescription.items ?? prescription.Items ?? prescription.prescriptionItems ?? prescription.PrescriptionItems
  return Array.isArray(value) ? value as LooseRecord[] : []
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

function compactNotification(value: string) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length <= 72) return text
  return `${text.slice(0, 69).trimEnd()}...`
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value ?? 0)
    if (Number.isFinite(number) && number > 0) return number
  }
  return 0
}

function toPascalCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatAppointmentDateTime(item: LooseRecord) {
  const date = stringValue(item.appointmentDate, item.AppointmentDate, item.scheduledAt, item.ScheduledAt)
  const time = stringValue(item.slotTime, item.SlotTime, item.time, item.Time)
  const dateText = formatDate(date) || 'ngày chưa rõ'
  const timeText = time ? ` lúc ${time.slice(0, 5)}` : ''
  return `${dateText}${timeText}`
}

function translateInvoiceStatus(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('unpaid')) return 'Chưa thanh toán'
  if (normalized.includes('paid')) return 'Đã thanh toán'
  if (normalized.includes('cancel')) return 'Đã hủy'
  return value
}

function quickActionIcon(key: QuickActionKey): Component {
  if (key === 'symptom') return Stethoscope
  if (key === 'prescription') return Pill
  if (key === 'invoice') return ReceiptText
  return FileHeart
}
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.assistant-returning {
  transition:
    bottom 520ms cubic-bezier(0.34, 1.56, 0.64, 1),
    right 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dogky-cloud-bubble {
  transform-origin: 76% 92%;
  will-change: opacity, transform;
}

.dogky-cloud-text {
  max-width: 11rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.dogky-cloud-enter-active {
  transition:
    opacity 420ms ease-out,
    transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dogky-cloud-leave-active {
  transition:
    opacity 260ms ease-in,
    transform 320ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dogky-cloud-enter-from,
.dogky-cloud-leave-to {
  opacity: 0;
  transform: translate(3.6rem, 4.7rem) scale(0.08) rotate(2deg);
}

.dogky-cloud-enter-to,
.dogky-cloud-leave-from {
  opacity: 1;
  transform: translate(0, 0) scale(1) rotate(0);
}
</style>
