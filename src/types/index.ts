export type AppointmentStatus = 'pendente' | 'confirmada' | 'concluida' | 'cancelada';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar_color: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface AppointmentWithDoctor extends Appointment {
  doctor: Doctor;
}
