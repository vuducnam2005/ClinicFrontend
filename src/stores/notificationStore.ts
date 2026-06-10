import * as signalR from '@microsoft/signalr'
import { defineStore } from 'pinia'
import { createServiceClient, apiConfig, readApiResponse } from '@/services/apiClient'
import { useAuthStore } from '@/stores/authStore'

export interface NotificationItem {
  id: number
  userId: number
  role: string
  title: string
  content: string
  type: 'Appointment' | 'Billing' | 'Prescription' | 'MedicalRecord' | 'System' | string
  referenceId?: string | null
  navigateUrl: string
  isRead: boolean
  createdAt: string
}

export interface NotificationRecipient {
  userId: number
  fullName: string
  username: string
  email: string
  role: string
}

export interface ManualNotificationPayload {
  title: string
  content: string
  type?: string
  navigateUrl?: string
  referenceId?: string
  targetMode: 'All' | 'Roles' | 'User'
  roles?: string[]
  userId?: number
}

export interface ManualNotificationResponse {
  recipientCount: number
  notifications: NotificationItem[]
}

const client = createServiceClient('billing')

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function notificationHubUrl() {
  const baseUrl = apiConfig.useGateway ? apiConfig.gatewayUrl : apiConfig.urls.billing
  const prefix = apiConfig.useGateway ? '/pharmacy' : ''
  return joinUrl(baseUrl, `${prefix}/hub/notifications`)
}

function normalizeNotification(item: Record<string, any>): NotificationItem {
  return {
    id: Number(item.id ?? item.Id),
    userId: Number(item.userId ?? item.UserId),
    role: item.role ?? item.Role ?? '',
    title: item.title ?? item.Title ?? '',
    content: item.content ?? item.Content ?? '',
    type: item.type ?? item.Type ?? 'System',
    referenceId: item.referenceId ?? item.ReferenceId ?? null,
    navigateUrl: item.navigateUrl ?? item.NavigateUrl ?? '/',
    isRead: Boolean(item.isRead ?? item.IsRead),
    createdAt: item.createdAt ?? item.CreatedAt ?? new Date().toISOString(),
  }
}

function normalizeNotificationList(payload: unknown): NotificationItem[] {
  const data = readApiResponse<any>(payload as any)
  const items = extractItems(data)
  return items.map(normalizeNotification)
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.Items)) return payload.Items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.Data)) return payload.Data
  return []
}

function normalizeRecipient(item: Record<string, any>): NotificationRecipient {
  return {
    userId: Number(item.userId ?? item.UserId ?? item.id ?? item.Id),
    fullName: item.fullName ?? item.FullName ?? '',
    username: item.username ?? item.Username ?? '',
    email: item.email ?? item.Email ?? '',
    role: item.role ?? item.Role ?? item.roleName ?? item.RoleName ?? '',
  }
}

function filterRecipients(items: NotificationRecipient[], search: string) {
  const keyword = search.trim().toLowerCase()
  const unique = new Map<number, NotificationRecipient>()
  for (const item of items) {
    if (!item.userId || unique.has(item.userId)) continue
    unique.set(item.userId, item)
  }

  const recipients = Array.from(unique.values())
  if (!keyword) return recipients

  return recipients.filter((item) =>
    [item.fullName, item.username, item.email, item.role, String(item.userId)]
      .some((value) => value.toLowerCase().includes(keyword)),
  )
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as NotificationItem[],
    recipients: [] as NotificationRecipient[],
    unreadCount: 0,
    hubConnection: null as signalR.HubConnection | null,
    loading: false,
    toast: {
      show: false,
      title: '',
      message: '',
      type: 'success' as 'success' | 'error',
    },
  }),
  getters: {
    unreadNotifications: (state) => state.notifications.filter((item) => !item.isRead),
  },
  actions: {
    async fetchNotifications(isRead?: boolean) {
      this.loading = true
      try {
        const response = await client.get('/api/notifications', {
          params: {
            page: 1,
            pageSize: 20,
            ...(typeof isRead === 'boolean' ? { isRead } : {}),
          },
        })
        this.notifications = normalizeNotificationList(response.data)
      } finally {
        this.loading = false
      }
    },
    async fetchUnreadCount() {
      const response = await client.get('/api/notifications/unread-count')
      const data = readApiResponse<any>(response.data)
      this.unreadCount = Number(data?.count ?? data?.Count ?? 0)
    },
    async markAsRead(id: number) {
      const notification = this.notifications.find((item) => item.id === id)
      const wasUnread = notification ? !notification.isRead : false
      const response = await client.post(`/api/notifications/${id}/read`)
      const updated = normalizeNotification(readApiResponse<any>(response.data))

      this.notifications = this.notifications.map((item) => (item.id === id ? updated : item))
      if (wasUnread) this.unreadCount = Math.max(0, this.unreadCount - 1)
    },
    async markAllAsRead() {
      await client.post('/api/notifications/read-all')
      this.notifications = this.notifications.map((item) => ({ ...item, isRead: true }))
      this.unreadCount = 0
    },
    async fetchAdminRecipients(search = '') {
      try {
        const response = await client.get('/api/notifications/admin/recipients', {
          params: search.trim() ? { search: search.trim() } : {},
        })
        const data = readApiResponse<any>(response.data)
        const items = extractItems(data)
        this.recipients = filterRecipients(items.map(normalizeRecipient), search)
      } catch (error: any) {
        if (![404, 405].includes(Number(error?.response?.status))) throw error

        const paths = [
          '/api/auth/users',
          '/api/auth/users/doctors',
          '/api/auth/users/nurses',
          '/api/auth/users/pharmacists',
          '/api/auth/users/patients',
          '/api/auth/users/admins',
        ]
        const responses = await Promise.allSettled(paths.map((path) => client.get(path)))
        const items = responses.flatMap((result) => {
          if (result.status !== 'fulfilled') return []
          const data = readApiResponse<any>(result.value.data)
          return extractItems(data)
        })
        this.recipients = filterRecipients(items.map(normalizeRecipient), search)
      }
      return this.recipients
    },
    async sendManualNotification(payload: ManualNotificationPayload) {
      const response = await client.post('/api/notifications/admin/send', payload)
      const data = readApiResponse<any>(response.data)
      return {
        recipientCount: Number(data?.recipientCount ?? data?.RecipientCount ?? 0),
        notifications: normalizeNotificationList(data?.notifications ?? data?.Notifications ?? []),
      } as ManualNotificationResponse
    },
    async initSignalR() {
      const authStore = useAuthStore()
      if (!authStore.token) return
      if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return

      if (this.hubConnection) {
        await this.disconnectSignalR()
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(notificationHubUrl(), {
          accessTokenFactory: () => useAuthStore().token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build()

      connection.on('ReceiveNotification', (payload: Record<string, any>) => {
        const notification = normalizeNotification(payload)
        this.notifications = [
          notification,
          ...this.notifications.filter((item) => item.id !== notification.id),
        ].slice(0, 20)

        if (!notification.isRead) this.unreadCount += 1

        this.toast.title = notification.title || 'Thông báo mới'
        this.toast.message = notification.content || 'Bạn vừa nhận được thông báo mới.'
        this.toast.type = 'success'
        this.toast.show = true
      })

      this.hubConnection = connection

      try {
        await connection.start()
      } catch (error) {
        console.warn('Không thể kết nối chuông thông báo realtime', error)
      }
    },
    async disconnectSignalR() {
      if (!this.hubConnection) return
      const connection = this.hubConnection
      this.hubConnection = null
      await connection.stop().catch(() => undefined)
    },
    hideToast() {
      this.toast.show = false
    },
  },
})
