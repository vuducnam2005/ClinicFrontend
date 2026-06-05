# ClinicFrontend

Frontend landing page va giao dien dat lich kham cho he thong microservices phong kham.

## Cong nghe

- Vue 3 + Vite
- TypeScript
- Tailwind CSS
- Vue Router
- Pinia
- axios
- lucide-vue-next
- CSS animation va scroll reveal

## Cai dat

```bash
npm install
```

## Chay local

```bash
npm run dev
```

Vite mac dinh chay o `http://localhost:5173`. Neu port ban, Vite se tu chon port tiep theo.

## Cau hinh `.env`

Tao file `.env` tu `.env.example`:

```env
VITE_API_GATEWAY_URL=http://localhost:5000

VITE_APPOINTMENT_SERVICE_URL=https://localhost:7174
VITE_MEDICAL_RECORD_SERVICE_URL=https://localhost:7002
VITE_PHARMACY_BILLING_SERVICE_URL=https://localhost:7003

VITE_USE_GATEWAY=false
```

## Ket noi Appointment Service

Khi `VITE_USE_GATEWAY=false`, cac API lich kham, bac si, chuyen khoa, lich lam viec va hang cho se goi truc tiep:

```text
https://localhost:7174
```

Frontend xu ly defensive: neu endpoint loi, chua co hoac tra ve rong, UI se hien loading skeleton, empty/error state va fallback data.

## Chuyen sang API Gateway

Dat:

```env
VITE_USE_GATEWAY=true
VITE_API_GATEWAY_URL=http://localhost:5000
```

Khi do frontend van goi cac route:

- `/api/appointments/**`
- `/api/doctors/**`
- `/api/specialties/**`
- `/api/doctor-schedules/**`
- `/api/waiting-queue/**`
- `/api/medical-records/**`
- `/api/patients/**`
- `/api/auth/**`
- `/api/billing/**`

Base URL se la `VITE_API_GATEWAY_URL`.

## Pages

- `/` - Landing page ClinicCare
- `/doctors` - Danh sach bac si, search/filter/sort
- `/booking` - Form dat lich day du
- `/my-appointments` - Tra cuu lich hen theo PatientId

## API dang dung

Appointment Service:

- `GET /api/specialties`
- `GET /api/doctors`
- `GET /api/doctors/by-specialty/{specialtyId}`
- `GET /api/doctors/{doctorId}/available-slots?date=yyyy-mm-dd`
- `POST /api/appointments`
- `GET /api/appointments/patient/{patientId}`
- `GET /api/waiting-queue?date=yyyy-mm-dd`
- `GET /api/health`

Medical Record Service prepared:

- `GET /api/patients`
- `GET /api/patients/{id}`
- `GET /api/medical-records`

Pharmacy & Billing Service prepared:

- `POST /api/auth/login`
- `GET /api/billing/invoices`
- `GET /api/integration/appointments/{appointmentId}/billing-info`

## Ghi chu

- Khong co login that trong phase nay.
- Khong tao benh an, hoa don hay thanh toan that trong frontend.
- AppointmentService backend khong bi sua trong task nay.
