import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { RoleId } from '@/types/user'
import LandingPage from '@/pages/LandingPage.vue'
import LoginPage from '@/pages/public/LoginPage.vue'
import RegisterPage from '@/pages/public/RegisterPage.vue'
import DoctorLayout from '@/components/layout/DoctorLayout.vue'
import NurseLayout from '@/components/layout/NurseLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PatientLayout from '@/components/layout/PatientLayout.vue'

export default function router() {
  const routerInstance = createRouter({
    history: createWebHistory(),
    scrollBehavior() {
      return { top: 0, behavior: 'smooth' }
    },
    routes: [
      { path: '/', name: 'home', component: LandingPage },
      { path: '/login', name: 'login', component: LoginPage },
      { path: '/register', name: 'register', component: RegisterPage },
      { path: '/doctors', name: 'doctors', component: () => import('@/pages/DoctorsPage.vue') },
      { path: '/booking', name: 'booking', component: () => import('@/pages/BookingPage.vue'), meta: { requiresAuth: true } },

      {
        path: '/doctor',
        component: DoctorLayout,
        meta: { requiresAuth: true, requiredRole: RoleId.Doctor },
        children: [
          { path: '', redirect: '/doctor/dashboard' },
          { path: 'dashboard', name: 'doctor-dashboard', component: () => import('@/pages/doctor/DoctorDashboard.vue') },
          { path: 'queue', name: 'doctor-queue', component: () => import('@/pages/doctor/DoctorResourcePage.vue'), meta: { doctorResource: 'queue' } },
          { path: 'appointments', name: 'doctor-appointments', component: () => import('@/pages/doctor/DoctorResourcePage.vue'), meta: { doctorResource: 'appointments' } },
          { path: 'examine', name: 'doctor-examine', component: () => import('@/pages/doctor/DoctorResourcePage.vue'), meta: { doctorResource: 'examine' } },
          { path: 'records', name: 'doctor-records', component: () => import('@/pages/doctor/DoctorResourcePage.vue'), meta: { doctorResource: 'records' } },
          { path: 'schedule', name: 'doctor-schedule', component: () => import('@/pages/doctor/DoctorResourcePage.vue'), meta: { doctorResource: 'schedule' } },
        ],
      },

      {
        path: '/nurse',
        component: NurseLayout,
        meta: { requiresAuth: true, requiredRole: RoleId.Receptionist },
        children: [
          { path: '', redirect: '/nurse/dashboard' },
          { path: 'dashboard', name: 'nurse-dashboard', component: () => import('@/pages/nurse/NurseDashboard.vue') },
          { path: 'appointments', name: 'nurse-appointments', component: () => import('@/pages/nurse/NurseResourcePage.vue'), meta: { nurseResource: 'appointments' } },
          { path: 'patients', name: 'nurse-patients', component: () => import('@/pages/nurse/NurseResourcePage.vue'), meta: { nurseResource: 'patients' } },
          { path: 'queue', name: 'nurse-queue', component: () => import('@/pages/nurse/NurseResourcePage.vue'), meta: { nurseResource: 'queue' } },
          { path: 'bills', name: 'nurse-bills', component: () => import('@/pages/nurse/NurseResourcePage.vue'), meta: { nurseResource: 'bills' } },
          { path: 'medicines', name: 'nurse-medicines', component: () => import('@/pages/nurse/NurseMedicinesPage.vue') },
          { path: 'prescriptions', name: 'nurse-prescriptions', component: () => import('@/pages/nurse/NurseResourcePage.vue'), meta: { nurseResource: 'prescriptions' } },
        ],
      },

      {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true, requiredRole: RoleId.Admin },
        children: [
          { path: '', redirect: '/admin/dashboard' },
          { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/pages/admin/AdminDashboard.vue') },
          { path: 'doctors', name: 'admin-doctors', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'doctors' } },
          { path: 'specialties', name: 'admin-specialties', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'specialties' } },
          { path: 'schedules', name: 'admin-schedules', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'schedules' } },
          { path: 'patients', name: 'admin-patients', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'patients' } },
          { path: 'appointments', name: 'admin-appointments', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'appointments' } },
          { path: 'medicines', name: 'admin-medicines', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'medicines' } },
          { path: 'prescriptions', name: 'admin-prescriptions', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'prescriptions' } },
          { path: 'bills', name: 'admin-bills', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'bills' } },
          { path: 'notifications', name: 'admin-notifications', component: () => import('@/pages/admin/AdminNotificationsPage.vue') },
          { path: 'accounts', name: 'admin-accounts', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'accounts' } },
          { path: 'reports', name: 'admin-reports', component: () => import('@/pages/admin/AdminResourcePage.vue'), meta: { adminResource: 'reports' } },
        ],
      },

      {
        path: '/patient',
        component: PatientLayout,
        meta: { requiresAuth: true, requiredRole: RoleId.Patient },
        children: [
          { path: '', redirect: '/patient/dashboard' },
          { path: 'dashboard', name: 'patient-dashboard', component: () => import('@/pages/patient/PatientDashboard.vue') },
          { path: 'booking', name: 'patient-booking', component: () => import('@/pages/BookingPage.vue') },
          { path: 'appointments', name: 'patient-appointments', component: () => import('@/pages/patient/PatientResourcePage.vue'), meta: { patientResource: 'appointments' } },
          { path: 'records', name: 'patient-records', component: () => import('@/pages/patient/PatientRecordsPage.vue') },
          { path: 'prescriptions', name: 'patient-prescriptions', component: () => import('@/pages/patient/PatientPrescriptionsPage.vue') },
          { path: 'bills', name: 'patient-bills', component: () => import('@/pages/patient/PatientResourcePage.vue'), meta: { patientResource: 'bills' } },
          { path: 'profile', name: 'patient-profile', component: () => import('@/pages/patient/PatientResourcePage.vue'), meta: { patientResource: 'profile' } },
        ],
      },
      { path: '/my-appointments', component: () => import('@/pages/MyAppointmentsPage.vue'), meta: { requiresAuth: true, requiredRole: RoleId.Patient } },
      { path: '/medical-records', component: () => import('@/pages/MedicalRecordsPage.vue'), meta: { requiresAuth: true } },
      { path: '/billing', component: () => import('@/pages/PharmacyBillingPage.vue'), meta: { requiresAuth: true } },
    ],
  })

  routerInstance.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    if (authStore.token && !authStore.user) {
      await authStore.fetchMe()
    }

    if (to.meta.requiresAuth) {
      if (!authStore.isAuthenticated) {
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }

      if (to.meta.requiredRole && authStore.roleId !== to.meta.requiredRole) {
        if (authStore.isAdmin) return next('/admin/dashboard')
        if (authStore.isDoctor) return next('/doctor/dashboard')
        if (authStore.isReceptionist) return next('/nurse/dashboard')
        if (authStore.isPatient) return next('/patient/dashboard')
        return next('/')
      }
    }

    if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
      if (authStore.isAdmin) return next('/admin/dashboard')
      if (authStore.isDoctor) return next('/doctor/dashboard')
      if (authStore.isReceptionist) return next('/nurse/dashboard')
      if (authStore.isPatient) return next('/patient/dashboard')
    }

    next()
  })

  return routerInstance
}
