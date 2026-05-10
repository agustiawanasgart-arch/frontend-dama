import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fadeIn">
      {/* Icon Container */}
      <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8 border border-rose-100 dark:border-rose-500/20 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
      </div>
      
      {/* Text Area */}
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
        Akses Ditolak
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mb-10 leading-relaxed font-medium">
        Maaf, Anda tidak memiliki izin akses (role) yang memadai untuk melihat halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah sebuah kesalahan.
      </p>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="btn-secondary w-full sm:w-auto justify-center py-2.5 px-5"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> 
          Kembali ke Sebelumnya
        </button>
        
        <button 
          onClick={() => navigate('/')} 
          className="btn-primary w-full sm:w-auto justify-center py-2.5 px-5"
        >
          <Home className="w-4 h-4 mr-1.5" /> 
          Halaman Utama
        </button>
      </div>
    </div>
  );
}