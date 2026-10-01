import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import PatientPortal from '@/components/PatientPortal';
import AdminPanel from '@/components/AdminPanel';
import { supabase } from '@/lib/supabase';
import type { AppointmentWithDoctor, Doctor } from '@/types';

export default function App() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data: doctorData, error: doctorError }, { data: appointmentData, error: appointmentError }] = await Promise.all([
      supabase.from('doctors').select('*').order('name'),
      supabase.from('appointments').select('*, doctor:doctors(*)').order('appointment_date').order('appointment_time'),
    ]);
    if (doctorError || appointmentError) {
      setError('Não foi possível carregar os dados da clínica. Verifique a ligação e tente novamente.');
      setLoading(false);
      return;
    }
    setDoctors((doctorData ?? []) as Doctor[]);
    setAppointments((appointmentData ?? []) as AppointmentWithDoctor[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadData()} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAdminButton={!adminMode} onAdminClick={() => setAdminMode(true)} />
      {adminMode ? (
        <AdminPanel appointments={appointments} doctors={doctors} onClose={() => setAdminMode(false)} onRefresh={() => void loadData()} />
      ) : (
        <PatientPortal doctors={doctors} onAppointmentCreated={() => void loadData()} />
      )}
      {!adminMode && <Footer />}
    </div>
  );
}

function LoadingState() {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-600/20"><Loader2 className="w-7 h-7 text-white animate-spin" /></div><p className="text-sm font-medium text-slate-700">A carregar a clínica...</p></div></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4"><div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-7 text-center shadow-lg"><div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-red-500" /></div><h2 className="text-lg font-bold text-slate-900">Algo correu mal</h2><p className="text-sm text-slate-500 mt-2">{message}</p><button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-all"><RefreshCw className="w-4 h-4" /> Tentar novamente</button></div></div>;
}

function Footer() {
  return <footer className="max-w-2xl mx-auto px-4 py-8 text-center"><p className="text-xs text-slate-400">Clínica Rui Neto · Medicina Geral e Familiar</p><p className="text-[11px] text-slate-300 mt-1">Uma experiência WaveTag · Contactless Healthcare</p></footer>;
}
