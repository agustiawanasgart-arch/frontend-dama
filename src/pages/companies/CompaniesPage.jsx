import { useEffect, useState } from 'react';
import { companiesAPI } from '../../api/services';
import { PageLoader, EmptyState, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { formatDate, extractError } from '../../utils/helpers';
import { Building2, Plus, Pencil, MapPin } from 'lucide-react';

const EMPTY_FORM = { nama_pt: '', kode_pt: '', alamat: '', logo_url: '' };

export default function CompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  
const load = async () => {
    setLoading(true);
    try {
      const r = await companiesAPI.list();
      setCompanies(r.data.data || []);
    } catch (err) {
      toast(extractError(err), 'error'); // Pastikan extractError dan toast sudah ada
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const fetchCompanies = async () => {
      try {
        const r = await companiesAPI.list();
        setCompanies(r.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);
  const openCreate = () => { 
    setForm(EMPTY_FORM); 
    setModal({ open: true, mode: 'create' }); 
  };
  
  const openEdit = (c) => {
    setForm({ nama_pt: c.nama_pt, kode_pt: c.kode_pt, alamat: c.alamat || '', logo_url: c.logo_url || '' });
    setModal({ open: true, mode: 'edit', data: c });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') { 
        await companiesAPI.create(form); 
        toast('Perusahaan berhasil ditambahkan', 'success'); 
      } else { 
        await companiesAPI.update(modal.data.id, form); 
        toast('Perusahaan berhasil diperbarui', 'success'); 
      }
      setModal({ open: false });
      load();
    } catch (err) { 
      toast(extractError(err), 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Perusahaan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{companies.length} perusahaan terdaftar</p>
        </div>
        <button className="btn-primary whitespace-nowrap" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Tambah Perusahaan
        </button>
      </div>

      {/* DATA DISPLAY */}
      {loading ? (
        <PageLoader />
      ) : companies.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada perusahaan" description="Tambahkan perusahaan ke sistem untuk memulai" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {companies.map(c => (
            <div key={c.id} className="card-hover p-6 group flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.nama_pt} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <button onClick={() => openEdit(c)} className="btn-ghost !p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-4 h-4 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                  </button>
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1.5 leading-tight">{c.nama_pt}</h3>
                <div className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-mono font-semibold rounded-md border border-indigo-100 dark:border-indigo-500/20 mb-4">
                  {c.kode_pt}
                </div>
                
                {c.alamat && (
                  <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{c.alamat}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                  Ditambahkan pada {formatDate(c.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Tambah Perusahaan' : 'Edit Perusahaan'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Nama Perusahaan</label>
            <input className="input" required value={form.nama_pt} onChange={e => setForm(f => ({ ...f, nama_pt: e.target.value }))} placeholder="Contoh: PT Golden Raya" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Kode PT</label>
            <input className="input" required value={form.kode_pt} onChange={e => setForm(f => ({ ...f, kode_pt: e.target.value }))} placeholder="Contoh: GR-A" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Alamat Lengkap</label>
            <input className="input" value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} placeholder="Contoh: Jakarta, Indonesia" />
          </div>
          <div className="space-y-1.5">
            <label className="label">Logo URL (Opsional)</label>
            <input className="input" type="url" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
