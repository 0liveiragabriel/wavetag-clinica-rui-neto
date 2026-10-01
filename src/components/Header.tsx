import { Stethoscope, Shield } from 'lucide-react';

interface HeaderProps {
  onAdminClick: () => void;
  showAdminButton: boolean;
}

export default function Header({ onAdminClick, showAdminButton }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      {/* WaveTag banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-center py-1.5">
        <p className="text-[11px] font-medium text-slate-300 tracking-wide">
          Powered by <span className="text-white font-semibold">WaveTag</span> · NFC Contactless
        </p>
      </div>

      {/* Main header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Clínica Rui Neto
            </h1>
            <p className="text-xs text-slate-500 leading-tight">Medicina Geral</p>
          </div>
        </div>

        {showAdminButton && (
          <button
            onClick={onAdminClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all duration-200 active:scale-95"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Área da Recepção</span>
            <span className="sm:hidden">Recepção</span>
          </button>
        )}
      </div>
    </header>
  );
}
