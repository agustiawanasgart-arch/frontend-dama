import { useState, useEffect } from 'react';
import { retentionsAPI } from '../../../api/services';
import { PageLoader, Modal, Confirm } from '../../../components/ui';
import { useToast } from '../../../hooks/useToast';
import { extractError, formatDate } from '../../../utils/helpers';
import { useAuth } from '../../../context/AuthContext';
import { ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react';

export default function RetentionTab({ unit }) {
  const { isRole } = useAuth();
  const { toast } = useToast();
  
  const [retentions, setRetentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ amount: '', due_date: '', notes: '', status: 'active' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await retentionsAPI.list();
      const data = (res.data?.data || []).filter(r => String(r.unitId) === String(unit.id));
      setRetentions(data);
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        unitId: unit.id,
        amount: parseFloat(form.amount) || 0,
        dueDate: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        status: form.status,
        notes: form.notes
      };

      if (modal.mode === 'create') {
        await retentionsAPI.create(payload);
        toast('Data Garansi/Retensi berhasil dibuat', 'success');
      } else {
        await retentionsAPI.update(modal.data.id, payload);
        toast('Data Garansi/Retensi berhasil diperbarui', 'success');
      }
      setModal({ open: false });
      loadData();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await retentionsAPI.delete(confirm.id);
      toast('Retensi berhasil dihapus', 'success');
      setConfirm({ open: false });
      loadData();
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
           <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Garansi / Retensi
        </h3>
        {isRole('super_admin', 'admin') && retentions.length === 0 && (
          <button 
            className="btn-primary text-sm px-3 py-1.5 h-auto"
            onClick={() => {
              setForm({ amount: '', due_date: '', notes: '', status: 'active' });
              setModal({ open: true, mode: 'create' });
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Buat Data Garansi
          </button>
        )}
      </div>

      {retentions.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
           <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500 font-medium mb-1">Belum ada data garansi/retensi</p>
           <p className="text-sm text-slate-400">Anda dapat mengatur nilai retensi dan batas waktu garansi bangunan di sini.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
           {retentions.map(r => (
             <div key={r.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">Masa Garansi / Retensi</h4>
                      <p className="text-sm text-slate-500 mt-1">
                         Batas Waktu (Due Date): <span className="font-semibold text-rose-600 dark:text-rose-400">{formatDate(r.dueDate)}</span>
                      </p>
                      {r.amount > 0 && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          Nilai Ditahan: <span className="font-semibold text-slate-700 dark:text-slate-300">Rp {Number(r.amount).toLocaleString('id-ID')}</span>
                        </p>
                      )}
                   </div>
                   <div className="flex items-center gap-4">
                      <span className={`badge ${r.status === 'released' ? 'bg-emerald-100 text-emerald-700' : r.status === 'claimed' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {r.status.toUpperCase()}
                      </span>
                      {isRole('super_admin', 'admin') && (
                         <div className="flex gap-2">
                            <button onClick={() => {
                               setForm({ 
                                 amount: r.amount || '', 
                                 due_date: r.dueDate?.split('T')[0], 
                                 notes: r.notes || '', 
                                 status: r.status 
                               });
                               setModal({ open: true, mode: 'edit', data: r });
                            }} className="text-slate-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setConfirm({ open: true, id: r.id })} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      )}
                   </div>
                </div>
                {r.notes && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold block mb-1">Catatan Tambahan:</span>
                    {r.notes}
                  </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Buat Data Garansi' : 'Update Garansi'}>
         <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="label">Batas Waktu Garansi</label>
                  <input type="date" className="input" required value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                     <option value="active">Active (Masa Garansi)</option>
                     <option value="claimed">Claimed (Diklaim)</option>
                     <option value="released">Released (Selesai/Cair)</option>
                  </select>
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="label">Nilai Retensi (Opsional)</label>
               <input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" />
            </div>
            <div className="space-y-1.5">
               <label className="label">Catatan</label>
               <textarea className="input resize-none h-20" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan..." />
            </div>
            <div className="flex justify-end pt-4">
               <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
            </div>
         </form>
      </Modal>

      <Confirm open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} title="Hapus Retensi" description="Yakin ingin menghapus data retensi/garansi ini?" loading={saving} />
    </div>
  )
}
