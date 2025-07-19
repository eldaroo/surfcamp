import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date, pattern: string = 'dd/MM/yyyy'): string {
  return format(date, pattern, { locale: es });
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  return differenceInDays(checkOut, checkIn);
}

export function validateDateRange(checkIn: Date, checkOut: Date): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isBefore(checkIn, today)) {
    return 'La fecha de entrada no puede ser anterior a hoy';
  }
  
  if (!isAfter(checkOut, checkIn)) {
    return 'La fecha de salida debe ser posterior a la fecha de entrada';
  }
  
  const nights = calculateNights(checkIn, checkOut);
  if (nights > 30) {
    return 'La estadía no puede ser mayor a 30 noches';
  }
  
  if (nights < 1) {
    return 'La estadía debe ser de al menos 1 noche';
  }
  
  return null;
}

export function validateGuestCount(guests: number): string | null {
  if (guests < 1) {
    return 'Debe haber al menos 1 huésped';
  }
  
  if (guests > 12) {
    return 'El máximo es 12 huéspedes por reserva';
  }
  
  return null;
}

export function generateBookingReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `SC-${timestamp}${random}`.toUpperCase();
} 