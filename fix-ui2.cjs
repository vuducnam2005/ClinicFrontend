const fs = require('fs');

function replaceStr(filePath, oldStr, newStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(newStr ? new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

replaceStr('src/components/landing/DoctorSection.vue', '<RouterLink:to=', '<RouterLink :to=');
replaceStr('src/pages/DoctorsPage.vue', '<RouterLink:to=', '<RouterLink :to=');
replaceStr('src/components/landing/ServiceIntegrationSection.vue', '="n3UsingMock', ' :class="n3UsingMock');
replaceStr('src/components/layout/SidebarNav.vue', '="$route.path.startsWith', ' :class="$route.path.startsWith');
replaceStr('src/pages/MedicalRecordsPage.vue', '="healthOk', ' :class="healthOk');
replaceStr('src/pages/PharmacyBillingPage.vue', '="healthOk', ' :class="healthOk');
replaceStr('src/components/booking/SlotPicker.vue', '       ="', '       :class="');
