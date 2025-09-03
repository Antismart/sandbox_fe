export function formatKenyanPhone(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('254')) {
    return digits;
  } else if (digits.startsWith('0')) {
    return '254' + digits.slice(1);
  } else if (digits.length === 9) {
    return '254' + digits;
  }
  
  throw new Error('Invalid phone number format');
}

export function isValidKenyanPhone(phone: string): boolean {
  try {
    const formatted = formatKenyanPhone(phone);
    return /^254[17]\d{8}$/.test(formatted);
  } catch {
    return false;
  }
}