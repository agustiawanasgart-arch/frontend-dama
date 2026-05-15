import { useState, useEffect } from 'react';
import { timelinesAPI } from '../../../api/services';
import { PageLoader, Modal, Confirm } from '../../../components/ui';
import { useToast } from '../../../hooks/useToast';
import { extractError, formatDate } from '../../../utils/helpers';
import { useAuth } from '../../../context/AuthContext';
import { CalendarDays, Plus, Pencil, Trash2 } from 'lucide-react';

export default function TimelineTab({ unit, project, onUpdate }) {
  const { isRole } = useAuth();
  const { toast } = useToast();
  
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ task_name: '', start_date: '', end_date: '', status: 'planned' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await timelinesAPI.list({ limit: 100 });
      // Filter by unitId
      const data = (res.data?.data || []).filter(t => String(t.unitId) === String(unit.id));
      setTimelines(data);
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        projectId: project.id,
        unitId: unit.id,
        taskName: form.task_name,
        startDate: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        endDate: form.end_date ? new Date(form.end_date).toISOString() : undefined
      };

      if (modal.mode === 'create') {
        await timelinesAPI.create(payload);
        toast('Timeline berhasil dibuat', 'success');
      } else {
        await timelinesAPI.update(modal.data.id, payload);
        toast('Timeline berhasil diperbarui', 'success');
      }
      setModal({ open: false });
      loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await timelinesAPI.delete(confirm.id);
      toast('Timeline berhasil dihapus', 'success');
      setConfirm({ open: false });
      loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
           <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Estimasi Pengerjaan
        </h3>
        {isRole('super_admin', 'admin') && (
          <button 
            className="btn-primary text-sm px-3 py-1.5 h-auto"
            onClick={() => {
              setForm({ task_name: '', start_date: '', end_date: '', status: 'planned' });
              setModal({ open: true, mode: 'create' });
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Timeline
          </button>
        )}
      </div>

      {timelines.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
           <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500 font-medium">Belum ada timeline yang dibuat</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
           {timelines.map(t => (
             <div key={t.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                   <h4 className="font-bold text-slate-900 dark:text-white">{t.taskName}</h4>
                   <p className="text-xs text-slate-500 mt-1">
                      {formatDate(t.startDate)} - {formatDate(t.endDate)}
                   </p>
                </div>
                <div className="flex items-center gap-4">
                   <span className="badge bg-amber-100 text-amber-700">{t.status}</span>
                   {isRole('super_admin', 'admin') && (
                      <div className="flex gap-2">
                         <button onClick={() => {
                            setForm({ task_name: t.taskName, start_date: t.startDate?.split('T')[0], end_date: t.endDate?.split('T')[0], status: t.status });
                            setModal({ open: true, mode: 'edit', data: t });
                         }} className="text-slate-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                         <button onClick={() => setConfirm({ open: true, id: t.id })} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   )}
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Tambah Timeline' : 'Edit Timeline'}>
         <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
               <label className="label">Nama Tugas (Estimasi)</label>
               <input className="input" required value={form.task_name} onChange={e => setForm({...form, task_name: e.target.value})} placeholder="Contoh: Pengecoran Pondasi" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="label">Tanggal Mulai</label>
                  <input type="date" className="input" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="label">Tanggal Selesai</label>
                  <input type="date" className="input" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
               </div>
            </div>
            <div className="flex justify-end pt-4">
               <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
         </form>
      </Modal>

      <Confirm open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} title="Hapus Timeline" description="Yakin ingin menghapus timeline ini?" loading={saving} />
    </div>
  )
}
