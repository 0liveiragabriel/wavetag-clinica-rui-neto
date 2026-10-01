import { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  Stethoscope,
  User,
  Star,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import type { Doctor, Appointment, AppointmentStatus } from '@/types';
import { TIME_SLOTS, formatDatePT, todayISO } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface PatientPortalProps {
  doctors: Doctor[];
  onAppointmentCreated: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function PatientPortal({ doctors, onAppointmentCreated }: PatientPortalProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const canProceedStep1 = selectedDoctor !== null;
  const canProceedStep2 = selectedTime !== '';
  const canProceedStep3 =
    patientName.trim().length >= 3 &&
    patientPhone.trim().length >= 9 &&
    /^\S+@\S+\.\S+$/.test(patientEmail);

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert({
          doctor_id: selectedDoctor.id,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
          patient_email: patientEmail.trim(),
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          status: 'pendente' as AppointmentStatus,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setConfirmedAppointment(data as Appointment);
      setStep(4);
      onAppointmentCreated();
    } catch {
      setError('Não foi possível registar a marcação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate(todayISO());
    setSelectedTime('');
    setPatientName('');
    setPatientPhone('');
    setPatientEmail('');
    setConfirmedAppointment(null);
    setError(null);
  };

  const whatsappLink = confirmedAppointment
    ? `https://wa.me/${patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá ${patientName}! A sua consulta na Clínica Rui Neto com ${selectedDoctor?.name} está marcada para ${formatDatePT(confirmedAppointment.appointment_date)} às ${confirmedAppointment.appointment_time}. Obrigado!`,
      )}`
    : '';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Progress indicator */}
      {step < 4 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= s
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-10 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                    step > s ? 'bg-sky-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Choose doctor */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-sky-50 items-center justify-center mb-3">
              <Stethoscope className="w-7 h-7 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Escolha o Médico</h2>
            <p className="text-sm text-slate-500 mt-1">Selecione o profissional com quem deseja marcar a sua consulta.</p>
          </div>

          {doctors.map((doctor) => {
            const isSelected = selectedDoctor?.id === doctor.id;
            return (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: doctor.avatar_color }}
                  >
                    {doctor.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{doctor.name}</p>
                    <p className="text-sm text-slate-500 truncate">{doctor.specialty}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => canProceedStep1 && setStep(2)}
            disabled={!canProceedStep1}
            className={`w-full py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 ${
              canProceedStep1
                ? 'bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-lg shadow-sky-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continuar
          </button>
        </div>
      )}

      {/* STEP 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-sky-50 items-center justify-center mb-3">
              <Calendar className="w-7 h-7 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Data e Hora</h2>
            <p className="text-sm text-slate-500 mt-1">Escolha o dia e o horário da sua consulta.</p>
          </div>

          {/* Date selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => changeDate(-1)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <p className="font-semibold text-slate-900 text-sm">{formatDatePT(selectedDate)}</p>
              <button
                onClick={() => changeDate(1)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            {/* Quick date pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {getNextDates(7).map((d) => {
                const isSelected = d.value === selectedDate;
                const isToday = d.value === todayISO();
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl border-2 shrink-0 transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase text-slate-400 font-medium">{d.weekday}</span>
                    <span className="text-lg font-bold text-slate-900">{d.day}</span>
                    <span className="text-[10px] text-slate-400">{isToday ? 'Hoje' : d.month}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Horários disponíveis</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3.5 rounded-2xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => canProceedStep2 && setStep(3)}
              disabled={!canProceedStep2}
              className={`flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 ${
                canProceedStep2
                  ? 'bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-lg shadow-sky-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Patient data */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-sky-50 items-center justify-center mb-3">
              <User className="w-7 h-7 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Os seus dados</h2>
            <p className="text-sm text-slate-500 mt-1">Precisamos dos seus contactos para confirmar a marcação.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="O seu nome"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Telemóvel (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+351 9XX XXX XXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="o@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-sky-50 rounded-2xl border border-sky-100 p-4">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">Resumo</p>
            <div className="space-y-1 text-sm text-slate-700">
              <p><span className="text-slate-400">Médico:</span> {selectedDoctor?.name}</p>
              <p><span className="text-slate-400">Data:</span> {formatDatePT(selectedDate)}</p>
              <p><span className="text-slate-400">Hora:</span> {selectedTime}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3.5 rounded-2xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canProceedStep3 || submitting}
              className={`flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                canProceedStep3 && !submitting
                  ? 'bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-lg shadow-sky-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A registar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Marcação
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && confirmedAppointment && (
        <div className="space-y-5">
          <div className="text-center pt-4">
            <div className="inline-flex w-20 h-20 rounded-3xl bg-emerald-50 items-center justify-center mb-4 animate-[scaleIn_0.4s_ease-out]">
              <CheckCircle2 className="w-11 h-11 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Marcação Registada!</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              A sua consulta foi registada com sucesso. Confirme o envio do lembrete por WhatsApp abaixo.
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-4">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Detalhes da Consulta</p>
            </div>
            <div className="p-5 space-y-3">
              <SummaryRow icon={<Stethoscope className="w-4 h-4" />} label="Médico" value={selectedDoctor?.name || ''} />
              <SummaryRow icon={<Calendar className="w-4 h-4" />} label="Data" value={formatDatePT(confirmedAppointment.appointment_date)} />
              <SummaryRow icon={<Clock className="w-4 h-4" />} label="Hora" value={confirmedAppointment.appointment_time} />
              <div className="border-t border-slate-100 pt-3">
                <SummaryRow icon={<User className="w-4 h-4" />} label="Paciente" value={patientName} />
                <SummaryRow icon={<Phone className="w-4 h-4" />} label="Telemóvel" value={patientPhone} />
                <SummaryRow icon={<Mail className="w-4 h-4" />} label="E-mail" value={patientEmail} />
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] shadow-lg shadow-green-500/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Confirmar & Enviar Lembrete por WhatsApp
          </a>

          {/* Google Review CTA */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Avalie a sua experiência</p>
            <p className="text-xs text-slate-500 mb-3">Deixe a sua avaliação de 5 estrelas no Google em 1 toque.</p>
            <a
              href="https://www.google.com/search?q=Cl%C3%ADnica+Rui+Neto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-all active:scale-95"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              Avaliar no Google
            </a>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-3 rounded-2xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            Fazer nova marcação
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function getNextDates(count: number) {
  const dates: { value: string; day: string; weekday: string; month: string }[] = [];
  const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push({
      value: `${y}-${m}-${day}`,
      day: String(d.getDate()),
      weekday: weekdaysShort[d.getDay()],
      month: monthsShort[d.getMonth()],
    });
  }
  return dates;
}

