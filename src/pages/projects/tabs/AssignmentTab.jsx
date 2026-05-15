import { useState, useEffect } from 'react';
import { assignmentsAPI, usersAPI } from '../../../api/services';
import { PageLoader, Select } from '../../../components/ui';
import { useToast } from '../../../hooks/useToast';
import { extractError, formatCurrency, formatDate } from '../../../utils/helpers';
import { useAuth } from '../../../context/AuthContext';
import { UserCheck, Pencil, Trash2 } from 'lucide-react';

export default function AssignmentTab({ unit, project, onAssigned }) {
  const { isRole } = useAuth();
  const { toast } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    user_id: '',
    tanggal_pembelian: new Date().toISOString().split("T")[0],
    tipe_pembayaran: 'cash_lunas',
    harga_total: 0,
    tenor_bulan: 0,
    keterangan_kpr: '',
    status_kepemilikan: 'active'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgRes, usersRes] = await Promise.all([
        assignmentsAPI.list({ limit: 100 }),
        usersAPI.list({})
      ]);

      const currentAsg = (asgRes.data?.data || []).find(a => String(a.unit_id) === String(unit.id));
      if (currentAsg) {
        setAssignment(currentAsg);
      }

      const customersOnly = (usersRes.data?.data || []).filter(u => u.role === "customer");
      setUsers(customersOnly);

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

  const startEdit = () => {
    setForm({
      user_id: assignment.user?.id || assignment.user_id,
      tanggal_pembelian: assignment.tanggal_pembelian?.split("T")[0] || "",
      tipe_pembayaran: assignment.pembayaran?.tipe || "cash_lunas",
      harga_total: assignment.pembayaran?.harga_total || 0,
      tenor_bulan: assignment.pembayaran?.tenor_bulan || 0,
      keterangan_kpr: assignment.pembayaran?.keterangan_kpr || "",
      status_kepemilikan: assignment.status_kepemilikan || 'active'
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        project_id: project.id,
        cluster_id: unit.cluster_id || unit.cluster?.id,
        unit_id: unit.id,
        user_id: form.user_id,
        tanggal_pembelian: form.tanggal_pembelian,
        tipe_pembayaran: form.tipe_pembayaran,
        harga_total: Number(form.harga_total),
        tenor_bulan: Number(form.tenor_bulan),
        keterangan_kpr: form.keterangan_kpr,
        status_kepemilikan: form.status_kepemilikan
      };

      if (!assignment) {
        await assignmentsAPI.create(payload);
        toast('Penugasan berhasil dibuat', 'success');
      } else {
        await assignmentsAPI.update(assignment.id, payload);
        toast('Data penugasan diperbarui', 'success');
      }
      setIsEditing(false);
      await loadData();
      if (onAssigned) onAssigned(); // Panggil ini agar tab lain terbuka!
    } catch (err) {
      toast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  if (assignment && !isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Detail Penugasan / Kepemilikan
          </h3>
          {isRole('super_admin', 'admin') && (
            <button onClick={startEdit} className="btn-secondary text-sm px-3 py-1.5 h-auto">
              <Pencil className="w-4 h-4 mr-1" /> Edit Data
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Customer / Pemilik</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{assignment.user?.nama}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{assignment.user?.email}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Status: <span className={`badge ${assignment.status_kepemilikan === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{assignment.status_kepemilikan.toUpperCase()}</span></p>
           </div>
           <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Informasi Finansial</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-slate-500 py-1">Tipe Pembayaran</td>
                    <td className="font-semibold text-right text-slate-900 dark:text-white uppercase">{assignment.pembayaran?.tipe?.replace("_", " ")}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 py-1">Harga Net</td>
                    <td className="font-mono font-semibold text-right text-slate-900 dark:text-white">{formatCurrency(assignment.pembayaran?.harga_total)}</td>
                  </tr>
                  {assignment.pembayaran?.tipe !== "cash_lunas" && (
                    <tr>
                      <td className="text-slate-500 py-1">Tenor</td>
                      <td className="font-semibold text-right text-slate-900 dark:text-white">{assignment.pembayaran?.tenor_bulan} Bulan</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-slate-500 py-1">Tgl Pembelian</td>
                    <td className="font-semibold text-right text-slate-900 dark:text-white">{formatDate(assignment.tanggal_pembelian)}</td>
                  </tr>
                </tbody>
              </table>
           </div>
           {assignment.pembayaran?.keterangan_kpr && (
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold block mb-1">Keterangan / Bank KPR:</span>
                {assignment.pembayaran?.keterangan_kpr}
              </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
           <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
           {assignment ? 'Edit Penugasan' : 'Buat Penugasan Baru'}
        </h3>
        {assignment && (
           <button onClick={() => setIsEditing(false)} className="btn-ghost text-slate-500 text-sm">Batal Edit</button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
         <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="label">Pilih Customer</label>
                <Select
                  value={form.user_id}
                  onChange={(v) => setForm((f) => ({ ...f, user_id: v }))}
                  options={users.map((u) => ({
                    value: u.id,
                    label: `${u.nama} (${u.email})`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="label">Tanggal Pembelian</label>
                   <input type="date" className="input" required value={form.tanggal_pembelian} onChange={e => setForm({...form, tanggal_pembelian: e.target.value})} />
                 </div>
                 {assignment && (
                   <div>
                     <label className="label">Status Kepemilikan</label>
                     <select className="input" value={form.status_kepemilikan} onChange={e => setForm({...form, status_kepemilikan: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                     </select>
                   </div>
                 )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Informasi Finansial & Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Tipe Pembayaran</label>
                    <select className="input" value={form.tipe_pembayaran} onChange={e => setForm({...form, tipe_pembayaran: e.target.value})}>
                      <option value="cash_lunas">Cash Lunas</option>
                      <option value="cash_cicil">Cash Bertahap (In-House)</option>
                      <option value="kredit_kpr">Kredit KPR</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Harga Total (Net)</label>
                    <input type="number" className="input" required value={form.harga_total} onChange={e => setForm({...form, harga_total: e.target.value})} placeholder="0" />
                  </div>
                  {form.tipe_pembayaran !== 'cash_lunas' && (
                    <div>
                      <label className="label">Tenor (Bulan)</label>
                      <input type="number" className="input" value={form.tenor_bulan} onChange={e => setForm({...form, tenor_bulan: e.target.value})} placeholder="0" />
                    </div>
                  )}
                  {form.tipe_pembayaran === 'kredit_kpr' && (
                    <div className="md:col-span-2">
                      <label className="label">Keterangan / Bank KPR</label>
                      <textarea className="input" rows="2" value={form.keterangan_kpr} onChange={e => setForm({...form, keterangan_kpr: e.target.value})} placeholder="Catatan..."></textarea>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
               <button type="submit" className="btn-primary" disabled={saving || !form.user_id}>
                  {saving ? 'Menyimpan...' : (assignment ? 'Simpan Perubahan' : 'Assign Customer (Buka Tab Lain)')}
               </button>
            </div>
         </form>
      </div>
    </div>
  )
}
