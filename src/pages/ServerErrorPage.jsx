import { useNavigate } from 'react-router-dom';
import { ServerCrash, RefreshCcw, Home } from 'lucide-react';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-center px-6 animate-fadeIn transition-colors duration-200">
      <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/10 rounded-3xl flex items-center justify-center mb-8 border border-amber-200 dark:border-amber-500/20 shadow-sm">
        <ServerCrash className="w-12 h-12 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
      </div>
      
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
        500 - Gangguan Server
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mb-10 leading-relaxed font-medium">
        Oops! Sepertinya sistem kami sedang mengalami kendala atau sedang dalam pemeliharaan. Silakan coba lagi dalam beberapa saat.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button onClick={() => window.location.reload()} className="btn-primary w-full sm:w-auto justify-center py-2.5 px-5">
          <RefreshCcw className="w-4 h-4 mr-1.5" /> Muat Ulang Halaman
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary w-full sm:w-auto justify-center py-2.5 px-5">
          <Home className="w-4 h-4 mr-1.5" /> Beranda
        </button>
      </div>
    </div>
  );
}