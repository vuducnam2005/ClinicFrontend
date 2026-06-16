/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL: string
  readonly VITE_APPOINTMENT_SERVICE_URL: string
  readonly VITE_MEDICAL_RECORD_SERVICE_URL: string
  readonly VITE_PHARMACY_BILLING_SERVICE_URL: string
  readonly VITE_USE_GATEWAY: string
  readonly VITE_BANK_TRANSFER_BANK: string
  readonly VITE_BANK_TRANSFER_ACCOUNT: string
  readonly VITE_BANK_TRANSFER_ACCOUNT_NAME: string
  readonly VITE_BANK_TRANSFER_PREFIX: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
