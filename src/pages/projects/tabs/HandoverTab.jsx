import { useState, useEffect } from 'react';
import { handoversAPI } from '../../../api/services';
import { PageLoader, Modal, Confirm } from '../../../components/ui';
import { useToast } from '../../../hooks/useToast';
import { extractError, formatDate } from '../../../utils/helpers';
import { useAuth } from '../../../context/AuthContext';
import { Key, Plus, Pencil, Trash2 } from 'lucide-react';

export default function HandoverTab({ unit, onHandover }) {
  const { isRole } = useAuth();
  const { toast } = useToast();
  
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ scheduled_date: '', actual_date: '', notes: '', status: 'scheduled' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await handoversAPI.list();
      const data = (res.data?.data || []).filter(h => String(h.unitId) === String(unit.id));
      setHandovers(data);
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
        scheduledDate: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : undefined,
        actualDate: form.actual_date ? new Date(form.actual_date).toISOString() : undefined,
        status: form.status,
        notes: form.notes
      };

      if (modal.mode === 'create') {
        await handoversAPI.create(payload);
        toast('Jadwal Handover berhasil dibuat', 'success');
      } else {
        await handoversAPI.update(modal.data.id, payload);
        toast('Jadwal Handover berhasil diperbarui', 'success');
      }
      setModal({ open: false });
      loadData();
      if (onHandover) onHandover();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await handoversAPI.delete(confirm.id);
      toast('Handover berhasil dihapus', 'success');
      setConfirm({ open: false });
      loadData();
      if (onHandover) onHandover();
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
           <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Serah Terima (Handover)
        </h3>
        {isRole('super_admin', 'admin') && handovers.length === 0 && (
          <button 
            className="btn-primary text-sm px-3 py-1.5 h-auto"
            onClick={() => {
              setForm({ scheduled_date: '', actual_date: '', notes: '', status: 'scheduled' });
              setModal({ open: true, mode: 'create' });
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Buat Jadwal Serah Terima
          </button>
        )}
      </div>

      {handovers.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
           <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500 font-medium mb-1">Belum ada jadwal serah terima</p>
           <p className="text-sm text-slate-400">Unit sudah mencapai 100%, Anda dapat mengatur jadwal serah terima kunci ke customer.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
           {handovers.map(h => (
             <div key={h.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">Jadwal Serah Terima</h4>
                      <p className="text-sm text-slate-500 mt-1">
                         Dijadwalkan: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(h.scheduledDate)}</span>
                      </p>
                      {h.actualDate && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          Aktual Serah Terima: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatDate(h.actualDate)}</span>
                        </p>
                      )}
                   </div>
                   <div className="flex items-center gap-4">
                      <span className={`badge ${h.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {h.status.toUpperCase()}
                      </span>
                      {isRole('super_admin', 'admin') && (
                         <div className="flex gap-2">
                            <button onClick={() => {
                               setForm({ 
                                 scheduled_date: h.scheduledDate?.split('T')[0], 
                                 actual_date: h.actualDate ? h.actualDate.split('T')[0] : '', 
                                 notes: h.notes || '', 
                                 status: h.status 
                               });
                               setModal({ open: true, mode: 'edit', data: h });
                            }} className="text-slate-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setConfirm({ open: true, id: h.id })} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      )}
                   </div>
                </div>
                {h.notes && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold block mb-1">Catatan Tambahan:</span>
                    {h.notes}
                  </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Buat Jadwal Handover' : 'Update Handover'}>
         <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="label">Tanggal Dijadwalkan</label>
                  <input type="date" className="input" required value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="label">Tanggal Aktual Selesai</label>
                  <input type="date" className="input" value={form.actual_date} onChange={e => setForm({...form, actual_date: e.target.value})} />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="label">Status Handover</label>
               <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="scheduled">Scheduled (Dijadwalkan)</option>
                  <option value="completed">Completed (Selesai Serah Terima)</option>
                  <option value="delayed">Delayed (Ditunda)</option>
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="label">Catatan Tambahan</label>
               <textarea className="input resize-none h-20" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan serah terima..." />
            </div>
            <div className="flex justify-end pt-4">
               <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
            </div>
         </form>
      </Modal>

      <Confirm open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} title="Hapus Handover" description="Yakin ingin menghapus data handover ini?" loading={saving} />
    </div>
  )
}
