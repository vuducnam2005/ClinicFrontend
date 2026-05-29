const fs = require('fs');

function replaceStr(filePath, oldStr, newStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(newStr ? new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

replaceStr('src/components/layout/PatientLayout.vue', '="item.to"', ':to="item.to"');
replaceStr('src/components/layout/SidebarNav.vue', '="item.to"', ':to="item.to"');
replaceStr('src/pages/admin/AdminDashboard.vue', '="stat.to"', ':to="stat.to"');
replaceStr('src/pages/doctor/DoctorDashboard.vue', '="stat.to"', ':to="stat.to"');
replaceStr('src/pages/nurse/NurseDashboard.vue', '="stat.to"', ':to="stat.to"');

replaceStr('src/pages/BookingPage.vue', '="doctorOptions"', ':options="doctorOptions"');
replaceStr('src/pages/BookingPage.vue', '="slots"', ':slots="slots"');
replaceStr('src/pages/BookingPage.vue', '="doctor?.doctorId || 0"', ':doctorId="doctor?.doctorId || 0"');
replaceStr('src/pages/BookingPage.vue', '="selectedSlot"', ':slotTime="selectedSlot"');
replaceStr('src/pages/BookingPage.vue', '="toast.show"', ':show="toast.show"');
replaceStr('src/pages/BookingPage.vue', '="toast.message"', ':message="toast.message"');
replaceStr('src/pages/BookingPage.vue', '="toast.type"', ':type="toast.type"');
replaceStr('src/pages/BookingPage.vue', '="formatDate(appointmentDate)"', ':appointmentDate="formatDate(appointmentDate)"');

replaceStr('src/pages/public/LoginPage.vue', '="toast.show"', ':show="toast.show"');
replaceStr('src/pages/public/LoginPage.vue', '="toast.message"', ':message="toast.message"');
replaceStr('src/pages/public/LoginPage.vue', '="toast.type"', ':type="toast.type"');

replaceStr('src/pages/public/RegisterPage.vue', '="toast.show"', ':show="toast.show"');
replaceStr('src/pages/public/RegisterPage.vue', '="toast.message"', ':message="toast.message"');
replaceStr('src/pages/public/RegisterPage.vue', '="toast.type"', ':type="toast.type"');

// Fix the missing :to="{ path: ... } that might still be broken in SidebarNav.vue or others
replaceStr('src/components/layout/SidebarNav.vue', '="{ name: item.name }"', ':to="{ name: item.name }"');
