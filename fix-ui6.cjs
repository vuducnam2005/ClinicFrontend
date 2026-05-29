const fs = require('fs');

function replaceStr(filePath, oldStr, newStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(newStr ? new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

// RegisterPage & LoginPage & MyAppointmentsPage
replaceStr('src/pages/public/RegisterPage.vue', 'type="submit"="loading"', 'type="submit" :loading="loading"');
replaceStr('src/pages/public/LoginPage.vue', 'type="submit"="authStore.loading"', 'type="submit" :loading="authStore.loading"');
replaceStr('src/pages/MyAppointmentsPage.vue', 'size="lg"="loading"', 'size="lg" :loading="loading"');
replaceStr('src/pages/MyAppointmentsPage.vue', 'font-semibold"="statusClass(appointment.status)"', 'font-semibold" :class="statusClass(appointment.status)"');

// PharmacyBillingPage
replaceStr('src/pages/PharmacyBillingPage.vue', '="module.title"', ':key="module.title"');

// NurseResourcePage
replaceStr('src/pages/nurse/NurseResourcePage.vue', 'variant="outline"="loading"', 'variant="outline" :disabled="loading"');
replaceStr('src/pages/nurse/NurseResourcePage.vue', '="column.key"', ':key="column.key"');
replaceStr('src/pages/nurse/NurseResourcePage.vue', '="String(row.id || index)"', ':key="String(row.id || index)"');

// NurseDashboard
replaceStr('src/pages/nurse/NurseDashboard.vue', 'variant="outline"="loading"', 'variant="outline" :disabled="loading"');
replaceStr('src/pages/nurse/NurseDashboard.vue', '="item.appointmentId"', ':key="item.appointmentId"');
replaceStr('src/pages/nurse/NurseDashboard.vue', '="item.invoiceId"', ':key="item.invoiceId"');

// DoctorResourcePage
replaceStr('src/pages/doctor/DoctorResourcePage.vue', 'variant="outline"="loading"', 'variant="outline" :disabled="loading"');
replaceStr('src/pages/doctor/DoctorResourcePage.vue', '="column.key"', ':key="column.key"');
replaceStr('src/pages/doctor/DoctorResourcePage.vue', '="String(row.id || index)"', ':key="String(row.id || index)"');

// DoctorDashboard
replaceStr('src/pages/doctor/DoctorDashboard.vue', 'variant="outline"="loading"', 'variant="outline" :disabled="loading"');
replaceStr('src/pages/doctor/DoctorDashboard.vue', '="item.id"', ':key="item.id"');
replaceStr('src/pages/doctor/DoctorDashboard.vue', '="item.scheduleId"', ':key="item.scheduleId"');

// BookingPage
replaceStr('src/pages/BookingPage.vue', 'type="date"="today"', 'type="date" :min="today"');
replaceStr('src/pages/BookingPage.vue', 'size="lg"="loadingSlots"="!selectedDoctor || !selectedDate"', 'size="lg" :loading="loadingSlots" :disabled="!selectedDoctor || !selectedDate"');
replaceStr('src/pages/BookingPage.vue', ':slots="slots"="loadingSlots"', ':slots="slots" :loading="loadingSlots"');

// AdminResourcePage
replaceStr('src/pages/admin/AdminResourcePage.vue', 'variant="outline"="loading"', 'variant="outline" :disabled="loading"');
replaceStr('src/pages/admin/AdminResourcePage.vue', '="metric.label"', ':key="metric.label"');
replaceStr('src/pages/admin/AdminResourcePage.vue', '="column.key"', ':key="column.key"');
replaceStr('src/pages/admin/AdminResourcePage.vue', '="String(row.id || index)"', ':key="String(row.id || index)"');

// AdminDashboard
replaceStr('src/pages/admin/AdminDashboard.vue', 'variant="outline"="loading"', 'variant="outline" :disabled="loading"');
replaceStr('src/pages/admin/AdminDashboard.vue', '="patient.patientId"', ':key="patient.patientId"');

// BaseSelect
replaceStr('src/components/ui/BaseSelect.vue', '="String(option.value)"="option.value"', ':key="String(option.value)" :value="option.value"');

// TestimonialsSection
replaceStr('src/components/landing/TestimonialsSection.vue', '="i"', ':key="i"');

// ServiceIntegrationSection
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="service.barClass"', ':class="service.barClass"');
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="service.iconClass"', ':class="service.iconClass"');
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="service.textClass"', ':class="service.textClass"');
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="statusClass(service.key)"', ':class="statusClass(service.key)"');
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="statusDotClass(service.key)"', ':class="statusDotClass(service.key)"');
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="feature"', ':key="feature"');

// QuickBookingPanel
replaceStr('src/components/landing/QuickBookingPanel.vue', ':slots="slots"="loadingSlots"', ':slots="slots" :loading="loadingSlots"');

// QueuePreviewSection
replaceStr('src/components/landing/QueuePreviewSection.vue', '="statusClass(item.status)"', ':class="statusClass(item.status)"');
replaceStr('src/components/landing/QueuePreviewSection.vue', '="dotPingClass(item.status)"', ':class="dotPingClass(item.status)"');
replaceStr('src/components/landing/QueuePreviewSection.vue', '="dotClass(item.status)"', ':class="dotClass(item.status)"');

// AppointmentForm
replaceStr('src/components/booking/AppointmentForm.vue', 'size="lg"="loading"="!canSubmit"', 'size="lg" :loading="loading" :disabled="!canSubmit"');
