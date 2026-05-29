const fs = require('fs');

function replaceStr(filePath, oldStr, newStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(newStr ? new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

replaceStr('src/components/layout/AppHeader.vue', ':key:key="item.to"', ':key="item.to"');
replaceStr('src/components/layout/AppHeader.vue', ':to:key="item.to"', ':to="item.to"');
replaceStr('src/components/layout/AppHeader.vue', ':to:to="dashboardRoute"', ':to="dashboardRoute"');

replaceStr('src/components/layout/PatientLayout.vue', ':key:to="item.to":key:to="item.to"', ':key="item.to" :to="item.to"');

replaceStr('src/components/layout/SidebarNav.vue', ':key:to="item.to"', ':key="item.to"');
replaceStr('src/components/layout/SidebarNav.vue', ':key:to="item.to"', ':to="item.to"');

replaceStr('src/pages/BookingPage.vue', '="selectedDate"', ':appointmentDate="selectedDate"');
replaceStr('src/pages/BookingPage.vue', '="submitting"', ':loading="submitting"');
replaceStr('src/pages/BookingPage.vue', '="toast.title"', ':title="toast.title"');

replaceStr('src/pages/public/LoginPage.vue', '="toast.title"', ':title="toast.title"');
replaceStr('src/pages/public/RegisterPage.vue', '="toast.title"', ':title="toast.title"');

// Fix DoctorLayout and NurseLayout syntax issue where `SidebarNav="menuGroups"` appeared.
// "SidebarNav="menuGroups"" error comes from trying to use the component like <SidebarNav="menuGroups" /> instead of <SidebarNav :groups="menuGroups" />
replaceStr('src/components/layout/DoctorLayout.vue', '<SidebarNav="menuGroups"', '<SidebarNav :groups="menuGroups"');
replaceStr('src/components/layout/NurseLayout.vue', '<SidebarNav="menuGroups"', '<SidebarNav :groups="menuGroups"');
replaceStr('src/components/layout/AdminLayout.vue', '<SidebarNav="menuGroups"', '<SidebarNav :groups="menuGroups"');
