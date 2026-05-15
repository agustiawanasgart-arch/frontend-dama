import { useState, useEffect } from 'react';
import { handoversAPI } from '../../../api/services';
import { PageLoader, Modal, Confirm } from '../../../components/ui';
import { useToast } from '../../../hooks/useToast';
import { extractError, formatDate } from '../../../utils/helpers';
import { useAuth } from '../../../context/AuthContext';
import { Key, Plus, Pencil, Trash2, CheckCircle, Clock, AlertTriangle, UserCheck } from 'lucide-react';

export default function HandoverTab({ unit, onHandover }) {
  const { isRole } = useAuth();
  const { toast } = useToast();
  
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  
  // Use datetime-local format for state
  const [form, setForm] = useState({ scheduled_date: '', actual_date: '', proposed_date: '', notes: '', status: 'menunggu_respon_customer' });

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
        proposedDate: form.proposed_date ? new Date(form.proposed_date).toISOString() : undefined,
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

  // --- Actions ---
  const handleSimulateCustomer = async (h) => {
    // Simulasi customer mengajukan jadwal H+2
    const d = new Date(h.scheduledDate);
    d.setDate(d.getDate() + 2);
    try {
      setSaving(true);
      await handoversAPI.update(h.id, {
        status: 'menunggu_konfirmasi_admin',
        proposedDate: d.toISOString()
      });
      toast('Simulasi: Customer mengajukan perubahan jadwal', 'info');
      loadData();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateCustomerAcc = async (h) => {
    try {
      setSaving(true);
      await handoversAPI.update(h.id, {
        status: 'dijadwalkan',
      });
      toast('Simulasi: Customer menyetujui jadwal', 'success');
      loadData();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveProposal = async (h) => {
    try {
      setSaving(true);
      await handoversAPI.update(h.id, {
        scheduledDate: h.proposedDate,
        status: 'dijadwalkan',
        proposedDate: null
      });
      toast('Usulan jadwal disetujui', 'success');
      loadData();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (h) => {
    try {
      setSaving(true);
      await handoversAPI.update(h.id, {
        status: 'selesai',
        actualDate: new Date().toISOString()
      });
      toast('Serah terima ditandai selesai', 'success');
      loadData();
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
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
              setForm({ scheduled_date: '', actual_date: '', notes: '', status: 'menunggu_respon_customer' });
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
        <div className="space-y-4 mt-4">
           {handovers.map(h => {
             // Determine status UI
             let statusColor = "bg-slate-100 text-slate-700";
             let statusLabel = h.status;
             
             if (h.status === 'menunggu_respon_customer' || h.status === 'scheduled') {
               statusColor = "bg-amber-100 text-amber-700 border border-amber-200";
               statusLabel = "Menunggu Respon Customer";
             } else if (h.status === 'menunggu_konfirmasi_admin') {
               statusColor = "bg-rose-100 text-rose-700 border border-rose-200";
               statusLabel = "Perlu Konfirmasi Anda";
             } else if (h.status === 'dijadwalkan') {
               statusColor = "bg-indigo-100 text-indigo-700 border border-indigo-200";
               statusLabel = "Dijadwalkan (Disetujui)";
             } else if (h.status === 'selesai' || h.status === 'completed') {
               statusColor = "bg-emerald-100 text-emerald-700 border border-emerald-200";
               statusLabel = "Selesai";
             }

             return (
               <div key={h.id} className={`p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${h.status === 'menunggu_konfirmasi_admin' ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">Jadwal Serah Terima</h4>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                           <Clock className="w-4 h-4 text-slate-400" />
                           Jadwal: <span className="font-semibold text-slate-700 dark:text-slate-300">
                             {formatDate(h.scheduledDate)} {new Date(h.scheduledDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </p>
                        {h.actualDate && (
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Aktual Selesai: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatDate(h.actualDate)}
                            </span>
                          </p>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        {isRole('super_admin', 'admin') && (
                           <div className="flex gap-2">
                              <button onClick={() => {
                                 setForm({ 
                                   scheduled_date: toDateTimeLocal(h.scheduledDate), 
                                   actual_date: toDateTimeLocal(h.actualDate), 
                                   notes: h.notes || '', 
                                   status: h.status 
                                 });
                                 setModal({ open: true, mode: 'edit', data: h });
                              }} className="btn-secondary px-3 py-1.5 text-sm h-auto"><Pencil className="w-4 h-4 mr-1.5" /> Edit</button>
                              <button onClick={() => setConfirm({ open: true, id: h.id })} className="btn-danger px-3 py-1.5 text-sm h-auto"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Negotiation Alerts & Actions */}
                  {h.status === 'menunggu_respon_customer' && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Menunggu Respon Customer</p>
                          <p className="text-xs text-amber-700/80 mt-0.5">Notifikasi telah dikirim ke mobile app customer.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => handleSimulateCustomer(h)} className="px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors">Simulasi: Tolak & Ajukan Tgl</button>
                        <button onClick={() => handleSimulateCustomerAcc(h)} className="px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">Simulasi: ACC Customer</button>
                      </div>
                    </div>
                  )}

                  {h.status === 'menunggu_konfirmasi_admin' && (
                    <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200">
                      <div className="flex gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-rose-800 dark:text-rose-400">Customer Mengajukan Perubahan Jadwal</p>
                          <p className="text-sm text-rose-700/90 mt-1">Usulan baru: <span className="font-bold bg-white px-2 py-0.5 rounded ml-1 border border-rose-100">{formatDate(h.proposedDate)} {new Date(h.proposedDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-8">
                        <button onClick={() => handleApproveProposal(h)} className="btn-primary text-sm px-4 py-1.5 h-auto bg-rose-600 hover:bg-rose-700 border-none shadow-sm text-white">Setujui Usulan</button>
                        <button onClick={() => {
                            setForm({ 
                              scheduled_date: toDateTimeLocal(h.scheduledDate), 
                              actual_date: toDateTimeLocal(h.actualDate), 
                              notes: h.notes || '', 
                              status: 'menunggu_respon_customer' 
                            });
                            setModal({ open: true, mode: 'edit', data: h });
                        }} className="btn-secondary text-sm px-4 py-1.5 h-auto">Tolak & Atur Ulang</button>
                      </div>
                    </div>
                  )}

                  {h.status === 'dijadwalkan' && (
                    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <UserCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-400">Jadwal Telah Disepakati</p>
                          <p className="text-xs text-indigo-700/80 mt-0.5">Silakan lakukan serah terima pada hari H.</p>
                        </div>
                      </div>
                      <button onClick={() => handleMarkComplete(h)} className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-sm px-4 py-2 h-auto whitespace-nowrap">
                        <CheckCircle className="w-4 h-4 mr-2" /> Tandai Selesai
                      </button>
                    </div>
                  )}

                  {h.notes && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold block mb-1">Catatan Tambahan:</span>
                      {h.notes}
                    </div>
                  )}
               </div>
             )
           })}
        </div>
      )}

      {/* Modal Form */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Buat Jadwal Handover' : 'Update Handover'}>
         <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
               <label className="label">Pilih Tanggal & Waktu (Jadwal Utama)</label>
               <input type="datetime-local" className="input" required value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
               <p className="text-xs text-slate-500">Notifikasi akan otomatis dikirim ke aplikasi mobile customer untuk disetujui.</p>
            </div>
            {modal.mode === 'edit' && (
              <div className="space-y-1.5">
                 <label className="label">Status Handover</label>
                 <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="menunggu_respon_customer">Menunggu Respon Customer</option>
                    <option value="menunggu_konfirmasi_admin">Menunggu Konfirmasi Admin (Perubahan)</option>
                    <option value="dijadwalkan">Dijadwalkan (Disetujui)</option>
                    <option value="selesai">Selesai Serah Terima</option>
                    <option value="delayed">Tertunda</option>
                 </select>
              </div>
            )}
            <div className="space-y-1.5">
               <label className="label">Catatan Tambahan (Opsional)</label>
               <textarea className="input resize-none h-20" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Instruksi atau catatan..." />
            </div>
            <div className="flex justify-end pt-4 gap-2">
               <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary">Batal</button>
               <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Jadwal'}</button>
            </div>
         </form>
      </Modal>

      <Confirm open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} title="Hapus Handover" description="Yakin ingin menghapus jadwal serah terima ini?" loading={saving} />
    </div>
  )
}
