/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL: string
  readonly VITE_APPOINTMENT_SERVICE_URL: string
  readonly VITE_MEDICAL_RECORD_SERVICE_URL: string
  readonly VITE_PHARMACY_BILLING_SERVICE_URL: string
  readonly VITE_USE_GATEWAY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
