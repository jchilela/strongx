import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'AOA'): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('AOA', 'AOA');
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-AO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('pt-AO', {
    month: 'short',
    day: '2-digit',
  }).format(new Date(dateString));
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  const prefix = phone.slice(0, 5); // "+244 "
  const suffix = phone.slice(-3);
  const masked = phone.slice(5, -3).replace(/[0-9]/g, '*');
  return `${prefix} ${masked.slice(0, 3)} *** ${suffix}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal =
    local.length > 2
      ? local.slice(0, 2) + '*'.repeat(local.length - 2)
      : local;
  return `${maskedLocal}@${domain}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function countSmsSegments(message: string): number {
  const GSM_CHARS_PER_SMS = 160;
  const GSM_CHARS_PER_SMS_MULTIPART = 153;
  const length = message.length;
  if (length <= GSM_CHARS_PER_SMS) return 1;
  return Math.ceil(length / GSM_CHARS_PER_SMS_MULTIPART);
}

export function calculateSmsCost(message: string, costPerSms = 2.5): number {
  return countSmsSegments(message) * costPerSms;
}

export function generateReference(): string {
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      reject(err);
    }
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
