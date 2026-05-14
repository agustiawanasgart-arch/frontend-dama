import { useEffect, useState } from 'react';
import { companiesAPI, projectsAPI } from '../../api/services';
import { PageLoader, EmptyState, SearchInput, Modal, Confirm } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { getStatusColor, getStatusLabel, formatDate, extractError } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Plus, Pencil, Trash2, MapPin, Calendar } from 'lucide-react';

const EMPTY_FORM = { nama_proyek: '', lokasi: '', deskripsi: '', status: 'active' };

export default function ProjectsPage() {
  const { isRole, user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const needsCompanyPicker = isRole('super_admin') || (isRole('admin') && !user?.companyId);


const load = async () => {
    setLoading(true);
    try {
      const r = await projectsAPI.list();
      setProjects(r.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const fetchProjects = async () => {
      try {
        const r = await projectsAPI.list();
        setProjects(r.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!needsCompanyPicker) return;
    companiesAPI
      .list()
      .then((r) => setCompanies(r.data.data || []))
      .catch((err) => toast(extractError(err), 'error'));
  }, [needsCompanyPicker, toast]);
  
  const filtered = projects.filter(p =>
    p.nama_proyek?.toLowerCase().includes(search.toLowerCase()) ||
    p.lokasi?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { 
    setForm({
      ...EMPTY_FORM,
      company_id: user?.companyId || '',
    }); 
    setModal({ open: true, mode: 'create' }); 
  };
  
  const openEdit = (p) => {
    setForm({ nama_proyek: p.nama_proyek, lokasi: p.lokasi, deskripsi: p.deskripsi || '', status: p.status });
    setModal({ open: true, mode: 'edit', data: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await projectsAPI.create(form);
        toast('Proyek berhasil dibuat', 'success');
      } else {
        await projectsAPI.update(modal.data.id, form);
        toast('Proyek berhasil diperbarui', 'success');
      }
      setModal({ open: false });
      load();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await projectsAPI.delete(confirm.id);
      toast('Proyek berhasil dihapus', 'success');
      setConfirm({ open: false });
      load();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Proyek</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{projects.length} proyek tersedia</p>
        </div>
        {isRole('super_admin', 'admin') && (
          <button className="btn-primary whitespace-nowrap" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />Tambah Proyek
          </button>
        )}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Cari nama proyek atau lokasi..." />

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Belum ada proyek" description="Mulai tambahkan portofolio proyek real estate Anda"
          action={isRole('super_admin', 'admin') && <button className="btn-primary mt-2" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Tambah Proyek</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map(p => (
            <div key={p.id} className="card-hover p-6 group flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
                  {isRole('super_admin', 'admin') && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="btn-ghost !p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirm({ open: true, id: p.id })} className="btn-ghost !p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 leading-tight">{p.nama_proyek}</h3>
                {p.deskripsi && <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{p.deskripsi}</p>}
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{p.lokasi}</span>
                </div>
               
                <div className="flex items-start gap-2.5 text-sm text-slate-500 dark:text-slate-500">
                  <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Dibuat {formatDate(p.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Tambah Proyek' : 'Edit Proyek'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Nama Proyek</label>
            <input className="input" required value={form.nama_proyek} onChange={e => setForm(f => ({ ...f, nama_proyek: e.target.value }))} placeholder="Contoh: Grand Central 2026" />
          </div>
          {needsCompanyPicker && (
            <div className="space-y-1.5">
              <label className="label">Perusahaan</label>
              <select
                className="input"
                required
                value={form.company_id || ''}
                onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
              >
                <option value="">Pilih perusahaan...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.nama_pt}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Lokasi</label>
              <input className="input" required value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))} placeholder="Contoh: Jakarta Timur" />
            </div>
          
          </div>
          <div className="space-y-1.5">
            <label className="label">Deskripsi</label>
            <textarea className="input resize-none h-24" value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Jelaskan detail singkat proyek ini..." />
          </div>
          <div className="space-y-1.5">
            <label className="label">Status Proyek</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Sedang Berjalan (Active)</option>
              <option value="completed">Telah Selesai (Completed)</option>
              <option value="on_hold">Ditunda (On Hold)</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
          </div>
        </form>
      </Modal>

      <Confirm open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete}
        title="Hapus Proyek" description="Apakah Anda yakin ingin menghapus proyek ini? Semua cluster, unit, dan progres di dalamnya akan ikut terhapus." loading={saving} />
    </div>
  );
}
