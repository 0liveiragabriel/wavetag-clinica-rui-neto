import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Filter,
  LockKeyhole,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { AppointmentWithDoctor, AppointmentStatus, Doctor } from '@/types';
import { ADMIN_PIN, formatDatePT, STATUS_CONFIG, STATUS_ORDER, todayISO } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface AdminPanelProps {
  appointments: AppointmentWithDoctor[];
  doctors: Doctor[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function AdminPanel({ appointments, doctors, onClose, onRefresh }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [view, setView] = useState<'dashboard' | 'patients'>('dashboard');

  if (!authenticated) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-7 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center mb-5">
              <LockKeyhole className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Área da Recepção</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Introduza o PIN de acesso para continuar.</p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, ''));
                setPinError(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  if (pin === ADMIN_PIN) setAuthenticated(true);
                  else setPinError(true);
                }
              }}
              placeholder="••••"
              className={`w-full text-center text-2xl tracking-[0.6em] py-3 rounded-xl border-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${pinError ? 'border-red-300' : 'border-slate-200 focus:border-sky-500'}`}
            />
            {pinError && <p className="text-xs text-red-600 mt-2">PIN incorreto. Tente novamente.</p>}
            <button
              onClick={() => {
                if (pin === ADMIN_PIN) setAuthenticated(true);
                else setPinError(true);
              }}
              className="w-full mt-4 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-all active:scale-[0.98]"
            >
              Entrar
            </button>
            <button onClick={onClose} className="mt-4 text-sm text-slate-500 hover:text-slate-700">Voltar ao portal</button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">PIN de demonstração: 1234</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Sessão segura · Recepção
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Bom dia, Recepção</h2>
          <p className="text-sm text-slate-500 mt-1">Aqui está o resumo da clínica para hoje.</p>
        </div>
        <button
          onClick={onClose}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit mb-6">
        <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Agenda</span>
        </button>
        <button onClick={() => setView('patients')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'patients' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Pacientes</span>
        </button>
      </div>

      {view === 'dashboard' ? (
        <DashboardView appointments={appointments} doctors={doctors} onRefresh={onRefresh} />
      ) : (
        <PatientsView appointments={appointments} />
      )}
    </div>
  );
}

function DashboardView({ appointments, doctors, onRefresh }: { appointments: AppointmentWithDoctor[]; doctors: Doctor[]; onRefresh: () => void }) {
  const [doctorFilter, setDoctorFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const todayAppointments = appointments.filter((appointment) => appointment.appointment_date === todayISO());
  const filteredAppointments = useMemo(() => todayAppointments.filter((appointment) => {
    const matchesDoctor = doctorFilter === 'todos' || appointment.doctor_id === doctorFilter;
    const matchesStatus = statusFilter === 'todos' || appointment.status === statusFilter;
    const matchesSearch = appointment.patient_name.toLowerCase().includes(search.toLowerCase());
    return matchesDoctor && matchesStatus && matchesSearch;
  }), [appointments, doctorFilter, statusFilter, search]);

  const counts = {
    total: todayAppointments.length,
    pending: todayAppointments.filter((a) => a.status === 'pendente').length,
    confirmed: todayAppointments.filter((a) => a.status === 'confirmada').length,
    done: todayAppointments.filter((a) => a.status === 'concluida').length,
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdating(id);
    await supabase.from('appointments').update({ status }).eq('id', id);
    setUpdating(null);
    onRefresh();
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Consultas hoje" value={counts.total} icon={<CalendarDays className="w-5 h-5" />} tone="sky" />
        <StatCard label="Pendentes" value={counts.pending} icon={<Clock className="w-5 h-5" />} tone="amber" />
        <StatCard label="Confirmadas" value={counts.confirmed} icon={<Check className="w-5 h-5" />} tone="blue" />
        <StatCard label="Concluídas" value={counts.done} icon={<ShieldCheck className="w-5 h-5" />} tone="emerald" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar paciente..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} className="appearance-none w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-sky-500">
              <option value="todos">Todos os médicos</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="appearance-none w-full sm:w-40 pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-sky-500">
              <option value="todos">Todos os estados</option>
              {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="font-semibold text-slate-900">Agenda de hoje</h3><p className="text-xs text-slate-500 mt-0.5">{formatDatePT(todayISO())}</p></div>
          <span className="text-xs font-medium text-slate-400">{filteredAppointments.length} resultados</span>
        </div>
        {filteredAppointments.length === 0 ? (
          <div className="p-10 text-center"><CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">Não foram encontradas consultas.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} updating={updating === appointment.id} onStatusChange={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AppointmentRow({ appointment, updating, onStatusChange }: { appointment: AppointmentWithDoctor; updating: boolean; onStatusChange: (id: string, status: AppointmentStatus) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_CONFIG[appointment.status];
  const whatsappLink = `https://wa.me/${appointment.patient_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${appointment.patient_name}, lembramos que tem consulta hoje às ${appointment.appointment_time} na Clínica Rui Neto.`)}`;
  return (
    <div className="px-4 sm:px-5 py-4 hover:bg-slate-50/70 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-12 text-center shrink-0"><p className="text-base font-bold text-slate-900">{appointment.appointment_time}</p><div className="flex items-center justify-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /><span className="text-[10px] text-slate-400">30 min</span></div></div>
        <div className="w-px h-10 bg-slate-200 hidden sm:block" />
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: appointment.doctor.avatar_color }}>{appointment.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
        <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900 truncate">{appointment.patient_name}</p><p className="text-xs text-slate-500 truncate">{appointment.doctor.name} · {appointment.doctor.specialty}</p></div>
        <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${status.bgColor} ${status.color}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />{status.label}</span>
        <div className="relative flex items-center gap-1">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors" title="Enviar lembrete por WhatsApp"><MessageCircle className="w-4 h-4" /></a>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          {menuOpen && <><button aria-label="Fechar menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} /><div className="absolute right-0 top-10 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-xl p-1">{STATUS_ORDER.map((nextStatus) => <button key={nextStatus} disabled={updating || nextStatus === appointment.status} onClick={() => { onStatusChange(appointment.id, nextStatus); setMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 disabled:opacity-40">Marcar como {STATUS_CONFIG[nextStatus].label}</button>)}</div></>}
        </div>
      </div>
      <div className="md:hidden mt-2 ml-[60px]"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${status.bgColor} ${status.color}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />{status.label}</span></div>
    </div>
  );
}

function PatientsView({ appointments }: { appointments: AppointmentWithDoctor[] }) {
  const patients = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string; appointments: AppointmentWithDoctor[] }>();
    appointments.forEach((appointment) => {
      const key = appointment.patient_email.toLowerCase();
      const existing = map.get(key);
      if (existing) existing.appointments.push(appointment);
      else map.set(key, { name: appointment.patient_name, phone: appointment.patient_phone, email: appointment.patient_email, appointments: [appointment] });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);
  return <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="px-4 sm:px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Ficha de Pacientes</h3><p className="text-xs text-slate-500 mt-0.5">Contactos e histórico de consultas</p></div>{patients.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Ainda não existem pacientes registados.</div> : <div className="divide-y divide-slate-100">{patients.map((patient) => <div key={patient.email} className="p-4 sm:p-5 flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0"><UserRound className="w-5 h-5 text-sky-600" /></div><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-slate-900">{patient.name}</p><p className="text-xs text-slate-500 mt-0.5">{patient.phone} · {patient.email}</p><div className="flex flex-wrap gap-2 mt-2">{patient.appointments.map((appointment) => <span key={appointment.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-[10px] text-slate-500"><Stethoscope className="w-3 h-3" />{appointment.appointment_date} · {appointment.appointment_time}</span>)}</div></div><span className="text-xs text-slate-400 shrink-0">{patient.appointments.length} consulta{patient.appointments.length !== 1 ? 's' : ''}</span></div>)}</div>}</div>;
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'sky' | 'amber' | 'blue' | 'emerald' }) {
  const styles = { sky: 'bg-sky-50 text-sky-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600' };
  return <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${styles[tone]}`}>{icon}</div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500 mt-0.5">{label}</p></div>;
}
