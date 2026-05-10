import { useNavigate } from 'react-router-dom';
import { SearchX, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-center px-6 animate-fadeIn transition-colors duration-200">
      {/* Icon Container */}
      <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 border border-slate-300 dark:border-slate-700 shadow-sm">
        <SearchX className="w-12 h-12 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
      </div>
      
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
        404 - Halaman Tidak Ditemukan
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mb-10 leading-relaxed font-medium">
        Maaf, halaman yang Anda cari tidak ada, telah dipindahkan, atau Anda salah memasukkan URL.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button onClick={() => navigate(-1)} className="btn-secondary w-full sm:w-auto justify-center py-2.5 px-5">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali
        </button>
        <button onClick={() => navigate('/')} className="btn-primary w-full sm:w-auto justify-center py-2.5 px-5">
          <Home className="w-4 h-4 mr-1.5" /> Halaman Utama
        </button>
      </div>
    </div>
  );
}