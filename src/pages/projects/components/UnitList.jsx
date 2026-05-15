import { useEffect, useState, useCallback } from "react";
import { unitsAPI, assignmentsAPI } from "../../../api/services"; 
import { PageLoader, EmptyState, SearchInput, Modal, ProgressBar, Select } from "../../../components/ui";
import { useToast } from "../../../hooks/useToast";
import { getStatusColor, getStatusLabel, extractError } from "../../../utils/helpers";
import { useAuth } from "../../../context/AuthContext";
import { Home, Pencil, Plus, ArrowLeft, Eye } from "lucide-react";

const initialAddForm = {
  tipe_rumah: "",
  luas_tanah: "",
  luas_bangunan: "",
  jumlah_unit: 1,
  nomor_units: [""], 
};

export default function UnitList({ cluster, project, onSelectUnit, onBack }) {
  const { isRole } = useAuth();
  const { toast } = useToast();

  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [addModal, setAddModal] = useState(false);

  const [editForm, setEditForm] = useState({ nomor_unit: "", tipe_rumah: "", luas_tanah: "", luas_bangunan: "" });
  const [addForm, setAddForm] = useState(initialAddForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rUnits, rAsg] = await Promise.all([
        unitsAPI.list({ limit: 2000 }),
        assignmentsAPI.list({ limit: 2000 })
      ]);
      const clusterUnits = (rUnits.data?.data || []).filter(u => String(u.cluster_id) === String(cluster.id) || String(u.cluster?.id) === String(cluster.id));
      
      // Mencegah duplicate ID yang mungkin muncul dari relasi database
      const uniqueUnits = Array.from(new Map(clusterUnits.map(u => [u.id, u])).values());
      
      setUnits(uniqueUnits);
      setAssignments(rAsg.data?.data || []);
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [cluster.id, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);
  
  const filtered = units.filter((u) => {
    const matchSearch = u.nomor_unit?.toLowerCase().includes(search.toLowerCase()) || u.tipe_rumah?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || u.status_pembangunan === filterStatus;
    return matchSearch && matchStatus;
  });

  const unitTerdaftar = units.length;
  const kapasitasCluster = cluster?.jumlah_unit || 0;
  const sisaKuota = Math.max(0, kapasitasCluster - unitTerdaftar);

  const handleJumlahChange = (e) => {
    let val = parseInt(e.target.value) || 1;

    if (val > sisaKuota) {
      val = sisaKuota;
      toast(`Maksimal penambahan unit di cluster ini sisa ${sisaKuota} unit`, "error");
    }

    const newNomorUnits = [...addForm.nomor_units];
    if (val > newNomorUnits.length) {
      while (newNomorUnits.length < val) newNomorUnits.push("");
    } else {
      newNomorUnits.length = val; 
    }

    setAddForm({ ...addForm, jumlah_unit: val, nomor_units: newNomorUnits });
  };

  const handleNomorChange = (index, value) => {
    const newNomorUnits = [...addForm.nomor_units];
    newNomorUnits[index] = value;
    setAddForm({ ...addForm, nomor_units: newNomorUnits });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (addForm.jumlah_unit > sisaKuota) return toast(`Gagal! Sisa kuota hanya ${sisaKuota} unit`, "error"); 
    if (addForm.nomor_units.some((n) => !n.trim())) return toast("Semua nomor unit wajib diisi", "error");

    setSaving(true);
    try {
      const payloads = addForm.nomor_units.map((nomor) => ({
        cluster_id: cluster.id,
        nomor_unit: nomor.trim(),
        tipe_rumah: addForm.tipe_rumah,
        luas_tanah: parseFloat(addForm.luas_tanah) || 0,
        luas_bangunan: parseFloat(addForm.luas_bangunan) || 0,
      }));

      await unitsAPI.bulkCreate(payloads);
      toast(`${payloads.length} unit berhasil ditambahkan`, "success");
      setAddModal(false);
      setAddForm(initialAddForm);
      load();
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u, e) => {
    e.stopPropagation();
    setEditForm({
      nomor_unit: u.nomor_unit || "",
      tipe_rumah: u.tipe_rumah || "",
      luas_tanah: u.luas_tanah || "",
      luas_bangunan: u.luas_bangunan || "",
    });
    setEditModal({ open: true, data: u });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await unitsAPI.update(editModal.data.id, {
        nomor_unit: editForm.nomor_unit,
        tipe_rumah: editForm.tipe_rumah,
        luas_tanah: parseFloat(editForm.luas_tanah) || 0,
        luas_bangunan: parseFloat(editForm.luas_bangunan) || 0,
      });
      toast("Spesifikasi unit berhasil diperbarui", "success");
      setEditModal({ open: false, data: null });
      load();
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "belum_mulai", label: "Belum Mulai" },
    { value: "dalam_pembangunan", label: "Dalam Pembangunan" },
    { value: "selesai", label: "Selesai" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <button onClick={onBack} className="btn-ghost w-fit text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Cluster
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Unit di {cluster.nama_cluster}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{units.length} unit terdaftar dari kapasitas {kapasitasCluster}</p>
          </div>
          {isRole("super_admin", "admin") && (
            <button className="btn-primary whitespace-nowrap" onClick={() => setAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Unit
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nomor unit atau tipe..." />
        </div>
        <div className="w-full sm:w-64">
          <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} placeholder="Semua Status Pembangunan" />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Home} title="Belum ada unit" description="Data unit tidak ditemukan atau belum ditambahkan." />
      ) : (
        <div className="card">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left whitespace-nowrap cursor-pointer">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nomor Unit</th>
                  <th className="px-6 py-4 font-semibold">Status Penjualan</th>
                  <th className="px-6 py-4 font-semibold">Spesifikasi</th>
                  <th className="px-6 py-4 font-semibold">Progress</th>
                  <th className="px-6 py-4 font-semibold">Pembangunan</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => {
                  const asg = assignments.find(a => (String(a.unit_id) === String(u.id) || String(a.unit?.id) === String(u.id)) && a.status_kepemilikan === 'active');
                  
                  return (
                  <tr key={u.id} onClick={() => onSelectUnit(u)} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">{u.nomor_unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      {asg ? (
                        <div>
                          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Terjual</span>
                          <div className="text-[10px] text-slate-500 font-medium uppercase mt-1 truncate max-w-[120px]">{asg.user?.nama || "Customer"}</div>
                        </div>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Tersedia</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-200">{u.tipe_rumah || "-"}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">LB: {u.luas_bangunan || 0}m² / LT: {u.luas_tanah || 0}m²</div>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-3">
                        <ProgressBar value={u.progress_percentage || 0} className="flex-1" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right">{u.progress_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusColor(u.status_pembangunan)}`}>{getStatusLabel(u.status_pembangunan)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="btn-ghost !p-2 inline-flex mr-1 text-slate-400 group-hover:text-indigo-600">
                          <Eye className="w-4 h-4" />
                       </button>
                      {isRole("super_admin", "admin") && (
                        <button onClick={(e) => openEdit(u, e)} className="btn-ghost !p-2 inline-flex">
                          <Pencil className="w-4 h-4 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Unit */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Tambah Unit Baru" size="md">
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="label">Tipe Rumah</label>
              <input type="text" className="input" value={addForm.tipe_rumah} onChange={(e) => setAddForm({ ...addForm, tipe_rumah: e.target.value })} placeholder="Ex: Tipe 45" />
            </div>
            <div className="space-y-1.5">
              <label className="label">Luas Bangunan</label>
              <div className="relative">
                <input type="number" className="input pr-8" value={addForm.luas_bangunan} onChange={(e) => setAddForm({ ...addForm, luas_bangunan: e.target.value })} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">m²</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label">Luas Tanah</label>
              <div className="relative">
                <input type="number" className="input pr-8" value={addForm.luas_tanah} onChange={(e) => setAddForm({ ...addForm, luas_tanah: e.target.value })} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">m²</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <label className="label flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span>Jumlah unit yang dibuat serentak:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 sm:mt-0 ${sisaKuota > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"}`}>
                    SISA KUOTA CLUSTER: {sisaKuota}
                  </span>
              </label>
              <input type="number" min="1" max={sisaKuota} className="input w-full sm:w-32" value={addForm.jumlah_unit} onChange={handleJumlahChange} disabled={sisaKuota === 0} required />
              {sisaKuota === 0 && <p className="text-xs font-semibold text-rose-500 mt-2">Kapasitas cluster ini sudah penuh!</p>}
            </div>

            {sisaKuota > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <label className="label mb-3">Definisikan Nomor Unit</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {addForm.nomor_units.map((nomor, index) => (
                    <input key={index} type="text" className="input !bg-white dark:!bg-slate-900 font-mono text-sm" value={nomor} onChange={(e) => handleNomorChange(index, e.target.value)} placeholder={`Unit ${index + 1}`} required />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setAddModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving || sisaKuota === 0}>{saving ? "Menyimpan..." : "Buat Unit"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Unit */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, data: null })} title="Edit Spesifikasi Unit" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Nomor Unit</label>
            <input type="text" className="input font-mono font-bold" value={editForm.nomor_unit} onChange={(e) => setEditForm((f) => ({ ...f, nomor_unit: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <label className="label">Tipe Rumah</label>
            <input type="text" className="input" value={editForm.tipe_rumah} onChange={(e) => setEditForm((f) => ({ ...f, tipe_rumah: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Luas Bangunan</label>
              <div className="relative">
                <input type="number" className="input pr-8" value={editForm.luas_bangunan} onChange={(e) => setEditForm((f) => ({ ...f, luas_bangunan: e.target.value }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">m²</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label">Luas Tanah</label>
              <div className="relative">
                <input type="number" className="input pr-8" value={editForm.luas_tanah} onChange={(e) => setEditForm((f) => ({ ...f, luas_tanah: e.target.value }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">m²</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={() => setEditModal({ open: false, data: null })}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
