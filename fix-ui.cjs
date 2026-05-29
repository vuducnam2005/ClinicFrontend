const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (fullPath.endsWith('.vue')) {
      callback(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix known missing attributes
  content = content.replace(/="item"/g, ':key="item"');
  content = content.replace(/="doctor\.doctorId"/g, ':key="doctor.doctorId"');
  content = content.replace(/="item\.to"/g, ':key="item.to"');
  content = content.replace(/="link\.name"/g, ':key="link.name"');
  content = content.replace(/="link\.path"/g, ':key="link.path"');
  content = content.replace(/="appointment\.appointmentId"/g, ':key="appointment.appointmentId"');
  content = content.replace(/="medicine\.medicineId"/g, ':key="medicine.medicineId"');
  content = content.replace(/="stat\.label"/g, ':key="stat.label"');
  content = content.replace(/="service\.name"/g, ':key="service.name"');
  content = content.replace(/="record\.recordId"/g, ':key="record.recordId"');
  content = content.replace(/="bill\.invoiceId"/g, ':key="bill.invoiceId"');
  content = content.replace(/="step\.title"/g, ':key="step.title"');
  content = content.replace(/="specialty\.name"/g, ':key="specialty.name"');
  content = content.replace(/="step\.id"/g, ':key="step.id"');

  content = content.replace(/="specialtyOptions"/g, ':options="specialtyOptions"');
  content = content.replace(/="dashboardRoute"/g, ':to="dashboardRoute"');
  content = content.replace(/="\{ path/g, ':to="{ path');
  content = content.replace(/<component="/g, '<component :is="');
  content = content.replace(/<span="/g, '<span :class="');
  content = content.replace(/<div="/g, '<div :class="');
  content = content.replace(/<button\s+="/g, '<button\n    :type="');
  content = content.replace(/="disabled \|\| loading"/g, ':disabled="disabled || loading"');
  
  // Specific fix for BaseSelect options and BaseButton classes
  if (filePath.endsWith('SlotPicker.vue') || filePath.endsWith('DoctorsPage.vue')) {
    content = content.replace(/="\[/g, ':options="[');
  } else if (filePath.endsWith('BaseButton.vue')) {
    content = content.replace(/="type"/g, ':type="type"');
    content = content.replace(/="\[/g, ':class="[');
  } else if (filePath.endsWith('SidebarNav.vue')) {
    content = content.replace(/="\[/g, ':class="[');
  } else if (filePath.endsWith('MedicalRecordsPage.vue')) {
      content = content.replace(/="\[/g, ':class="[');
  } else if (filePath.endsWith('AdminDashboard.vue') || filePath.endsWith('DoctorDashboard.vue') || filePath.endsWith('NurseDashboard.vue') || filePath.endsWith('PatientDashboard.vue')) {
      content = content.replace(/="\[/g, ':class="[');
  } else if (filePath.endsWith('AdminResourcePage.vue') || filePath.endsWith('DoctorResourcePage.vue') || filePath.endsWith('NurseResourcePage.vue')) {
      content = content.replace(/="\[/g, ':class="[');
  } else if (filePath.endsWith('ServiceIntegrationSection.vue')) {
      content = content.replace(/="\[/g, ':class="[');
      content = content.replace(/="step"/g, ':key="step"');
  } else {
      content = content.replace(/="\[/g, ':class="[');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
});

console.log("Fix completed.");
