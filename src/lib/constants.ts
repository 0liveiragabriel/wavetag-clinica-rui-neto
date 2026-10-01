import type { AppointmentStatus } from '@/types';

export const ADMIN_PIN = '1234';

export const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  pendente: {
    label: 'Pendente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  confirmada: {
    label: 'Confirmada',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  concluida: {
    label: 'Concluída',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    dotColor: 'bg-red-500',
  },
};

export const STATUS_ORDER: AppointmentStatus[] = ['pendente', 'confirmada', 'concluida', 'cancelada'];

export function formatDatePT(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const wd = weekdays[date.getDay()];
  const d = date.getDate();
  const m = months[date.getMonth()];
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${d} de ${m}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
