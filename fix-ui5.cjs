const fs = require('fs');

function replaceStr(filePath, oldStr, newStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(newStr ? new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

replaceStr('src/components/booking/BookingModal.vue', '="doctor?.doctorId || 0"', ':doctorId="doctor?.doctorId || 0"');
replaceStr('src/components/booking/BookingModal.vue', '="slotTime"', ':slotTime="slotTime"');
replaceStr('src/components/booking/BookingModal.vue', '="toast.show"', ':show="toast.show"');
replaceStr('src/components/booking/BookingModal.vue', '="toast.message"', ':message="toast.message"');

replaceStr('src/components/landing/QuickBookingPanel.vue', '="doctorOptions"', ':options="doctorOptions"');
replaceStr('src/components/landing/QuickBookingPanel.vue', '="slots"', ':slots="slots"');
replaceStr('src/components/landing/QuickBookingPanel.vue', '="modalOpen"', ':open="modalOpen"');
replaceStr('src/components/landing/QuickBookingPanel.vue', '="selectedDate"', ':appointmentDate="selectedDate"');
replaceStr('src/components/landing/QuickBookingPanel.vue', '="selectedSlot"', ':slotTime="selectedSlot"');
replaceStr('src/components/landing/QuickBookingPanel.vue', '="doctor"', ':doctor="doctor"');

replaceStr('src/components/layout/AdminLayout.vue', ':groups="menuGroups"', ':menuGroups="menuGroups"');
replaceStr('src/components/layout/DoctorLayout.vue', ':groups="menuGroups"', ':menuGroups="menuGroups"');
replaceStr('src/components/layout/NurseLayout.vue', ':groups="menuGroups"', ':menuGroups="menuGroups"');

let sidebarNav = fs.readFileSync('src/components/layout/SidebarNav.vue', 'utf8');
sidebarNav = sidebarNav.replace(/:key:to="item.to"/g, '');
sidebarNav = sidebarNav.replace(/:key="item.to"\s+:to="item.to"/g, '');
sidebarNav = sidebarNav.replace(/<RouterLink\s+v-for="item in group.items"/g, '<RouterLink\n          v-for="item in group.items"\n          :key="item.to"\n          :to="item.to"');
fs.writeFileSync('src/components/layout/SidebarNav.vue', sidebarNav, 'utf8');

