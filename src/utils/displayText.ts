const phraseMap: Record<string, string> = {
  'Tim mach': 'Tim mạch',
  'Noi tong quat': 'Nội tổng quát',
  'Nhi khoa': 'Nhi khoa',
  'Da lieu': 'Da liễu',
  'Tai mui hong': 'Tai mũi họng',
  'Bac si': 'Bác sĩ',
  'BS.': 'BS.',
  'Nguyen': 'Nguyễn',
  'Tran': 'Trần',
  'Le': 'Lê',
  'Pham': 'Phạm',
  'Minh Anh': 'Minh Anh',
  'Hoang Nam': 'Hoàng Nam',
  'Thanh Ha': 'Thanh Hà',
  'Quoc Viet': 'Quốc Việt',
}

export function displayText(value?: string | null) {
  if (!value) return ''

  return Object.entries(phraseMap).reduce(
    (text, [plain, accented]) => text.split(plain).join(accented),
    value,
  )
}
