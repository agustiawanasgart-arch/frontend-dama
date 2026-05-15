import { useEffect, useState, useCallback } from "react";
import { clustersAPI } from "../../../api/services";
import {
  PageLoader,
  EmptyState,
  SearchInput,
  Modal,
  Confirm,
  Pagination,
} from "../../../components/ui";
import { useToast } from "../../../hooks/useToast";
import { extractError, formatDate } from "../../../utils/helpers";
import { useAuth } from "../../../context/AuthContext";
import { Layers, Plus, Pencil, Trash2, Home, ArrowRight, ArrowLeft } from "lucide-react";

const LIMIT = 12;

export default function ClusterList({ project, onSelectCluster, onBack }) {
  const { isRole } = useAuth();
  const { toast } = useToast();
  
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [modal, setModal] = useState({ open: false, mode: "create", data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama_cluster: "", jumlah_unit: "" });

  const loadClusters = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
        search: search.trim() || undefined,
        project_id: project.id,
      };
      const r = await clustersAPI.list(params);
      setClusters(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, project.id, toast]);

  useEffect(() => {
    loadClusters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, project.id]);

  const openCreate = () => {
    setForm({ nama_cluster: "", jumlah_unit: "" });
    setModal({ open: true, mode: "create", data: null });
  };

  const openEdit = (c, e) => {
    e.stopPropagation();
    setForm({
      nama_cluster: c.nama_cluster,
      jumlah_unit: c.jumlah_unit.toString(),
    });
    setModal({ open: true, mode: "edit", data: c });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { 
        project_id: project.id,
        nama_cluster: form.nama_cluster,
        jumlah_unit: parseInt(form.jumlah_unit) || 0 
      };

      if (modal.mode === "create") {
        await clustersAPI.create(payload);
        toast("Cluster berhasil dibuat", "success");
      } else {
        await clustersAPI.update(modal.data.id, payload);
        toast("Cluster berhasil diperbarui", "success");
      }
      setModal({ open: false });
      loadClusters(true);
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await clustersAPI.delete(confirm.id);
      toast("Cluster berhasil dihapus", "success");
      setConfirm({ open: false });
      loadClusters(true);
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <button onClick={onBack} className="btn-ghost w-fit text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Proyek
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Cluster di {project.nama_proyek}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{total} cluster terdaftar</p>
          </div>
          {isRole("super_admin", "admin") && (
            <button className="btn-primary whitespace-nowrap" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Tambah Cluster
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Cari nama cluster..."
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : clusters.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada cluster"
          description={search ? "Hasil pencarian tidak ditemukan." : `Tambahkan cluster ke proyek ${project.nama_proyek}.`}
          action={isRole('super_admin', 'admin') && <button className="btn-primary mt-2" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Tambah Cluster</button>}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {clusters.map((c) => (
              <div key={c.id} onClick={() => onSelectCluster(c)} className="card-hover p-6 group flex flex-col justify-between h-full border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl cursor-pointer">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                      {project.nama_proyek}
                    </span>
                    {isRole("super_admin", "admin") && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openEdit(c, e)} className="btn-ghost !p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirm({ open: true, id: c.id }); }} className="btn-ghost !p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center">
                    {c.nama_cluster} <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </h3>
                </div>
                
                <div className="pt-4 mt-2 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <Home className="w-4 h-4 text-slate-400" />
                    <span>{c.jumlah_unit} <span className="text-slate-400 font-normal">Unit</span></span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium uppercase">
                    {formatDate(c.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* MODAL CREATE/EDIT */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === "create" ? "Tambah Cluster" : "Edit Cluster"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Nama Cluster</label>
              <input
                className="input w-full"
                required
                value={form.nama_cluster}
                onChange={(e) => setForm((f) => ({ ...f, nama_cluster: e.target.value }))}
                placeholder="Contoh: Cluster Sakura"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label">Jumlah Unit</label>
              <input
                className="input w-full"
                type="number"
                min="0"
                required
                value={form.jumlah_unit}
                onChange={(e) => setForm((f) => ({ ...f, jumlah_unit: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-5 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={handleDelete}
        title="Hapus Cluster"
        description="Data cluster akan dihapus permanen. Pastikan tidak ada data unit di dalam cluster ini."
        loading={saving}
      />
    </div>
  );
}
