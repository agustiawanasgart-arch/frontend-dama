import { useEffect, useState } from "react";
import {
  assignmentsAPI,
  usersAPI,
  unitsAPI,
  projectsAPI,
  clustersAPI,
} from "../../api/services";
import {
  PageLoader,
  EmptyState,
  SearchInput,
  Modal,
  Select,
} from "../../components/ui";
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  extractError,
} from "../../utils/helpers";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import { ClipboardList, Plus, Pencil } from "lucide-react";

const EMPTY_FORM = {
  user_id: "",
  project_id: "",
  cluster_id: "",
  unit_id: "",
  tanggal_pembelian: "",
  status_kepemilikan: "active",
  tipe_pembayaran: "cash_lunas",
  harga_total: 0,
  tenor_bulan: 0,
  keterangan_kpr: "",
};

export default function AssignmentsPage() {
  const { isRole } = useAuth();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]); // Akan diisi HANYA unit yang belum laku
  const [projects, setProjects] = useState([]);
  const [clusters, setClusters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    data: null,
  });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchPageData = async () => {
      setLoading(true);
      try {
        const r = await assignmentsAPI.list({ page, limit: 15 });
        if (isMounted) {
          setAssignments(r.data.data || []);
          setTotal(r.data.meta?.total || 0);
        }
      } catch (err) {
        if (isMounted) toast(extractError(err), "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPageData();

    return () => {
      isMounted = false;
    };
  }, [page, refreshKey, toast]); // dependensi aman dari linter

  // ================= LOAD MASTER DATA =================
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        // Ambil semua data master, termasuk semua assignment untuk mengecek unit mana yang sudah laku
        const [usersRes, unitsRes, projectsRes, allAssignRes] = await Promise.all([
          usersAPI.list({}),
          unitsAPI.list({ limit: 1000 }),
          projectsAPI.list({ limit: 100 }),
          assignmentsAPI.list({ limit: 2000 }) 
        ]);

        // 1. Set Users (Customer Only)
        const customersOnly = (usersRes.data.data || []).filter(
          (u) => u.role === "customer"
        );
        setUsers(customersOnly);
        
        // 2. Set Projects
        setProjects(projectsRes.data.data || []);

        // 3. Filter Unit: Hanya ambil unit yang BELUM di-assign
        const allAssignments = allAssignRes.data.data || [];
        // Kumpulkan ID unit yang status assignment-nya tidak dicancel (berarti sedang aktif dimiliki)
        const assignedUnitIds = allAssignments
          .filter(a => a.status_kepemilikan === 'active')
          .map(a => a.unit?.id);

        const allUnits = unitsRes.data.data || [];
        // Filter out unit yang ID-nya ada di daftar assignedUnitIds
        const availableUnits = allUnits.filter(u => !assignedUnitIds.includes(u.id));
        
        setUnits(availableUnits);

      } catch (err) {
        toast(extractError(err), "error");
      }
    };

    if (isRole("super_admin", "admin")) {
      fetchMaster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); // Tambahkan refreshKey agar saat ada assignment baru, unit yang sudah laku otomatis hilang dari dropdown

  const fetchClustersByProject = async (projectId) => {
    if (!projectId) return;
    try {
      const r = await clustersAPI.list({ project_id: projectId });
      setClusters(r.data.data || []);
    } catch (err) {
      toast(extractError(err), "error");
    }
  };

  // ================= HANDLERS =================
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      tanggal_pembelian: new Date().toISOString().split("T")[0],
    });
    setClusters([]);
    setModal({ open: true, mode: "create", data: null });
  };

  const openEdit = (a) => {
    setForm({
      user_id: a.user?.id,
      unit_id: a.unit?.id,
      tanggal_pembelian: a.tanggal_pembelian?.split("T")[0] || "",
      status_kepemilikan: a.status_kepemilikan,
      tipe_pembayaran: a.pembayaran?.tipe || "cash_lunas",
      harga_total: a.pembayaran?.harga_total || 0,
      tenor_bulan: a.pembayaran?.tenor_bulan || 0,
      keterangan_kpr: a.pembayaran?.keterangan_kpr || "",
    });
    setModal({ open: true, mode: "edit", data: a });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        harga_total: Number(form.harga_total),
        tenor_bulan: Number(form.tenor_bulan),
      };

      if (modal.mode === "create") {
        await assignmentsAPI.create(payload);
        toast("Assignment & Data Finansial berhasil dibuat", "success");
      } else {
        await assignmentsAPI.update(modal.data.id, payload);
        toast("Data berhasil diperbarui", "success");
      }
      setModal({ open: false });
      setRefreshKey((prev) => prev + 1); 
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = assignments.filter(
    (a) =>
      a.user?.nama?.toLowerCase().includes(search.toLowerCase()) ||
      a.unit?.nomor_unit?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Penjualan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {total} total unit terjual
          </p>
        </div>
        {isRole("super_admin", "admin") && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Unit Terjual
          </button>
        )}
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cari customer atau unit..."
      />

      {/* TABLE */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Data Kosong" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Customer / Unit</th>
                <th className="px-6 py-4">Tipe Bayar</th>
                <th className="px-6 py-4">Total Harga</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {a.user?.nama}
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.unit?.nomor_unit} - {a.unit?.cluster?.nama_cluster}
                    </div>
                  </td>
                  <td className="px-6 py-4 uppercase text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {a.pembayaran?.tipe?.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-200">
                    {formatCurrency(a.pembayaran?.harga_total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${getStatusColor(a.status_kepemilikan)}`}
                    >
                      {getStatusLabel(a.status_kepemilikan)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(a)}
                      className="btn-ghost !p-2"
                      title="Edit Assignment"
                    >
                      <Pencil className="w-4 h-4 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM (Create/Edit) */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === "create" ? "Assign Unit Baru" : "Edit Assignment"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Customer</label>
              <Select
                value={form.user_id}
                onChange={(v) => setForm((f) => ({ ...f, user_id: v }))}
                options={users.map((u) => ({
                  value: u.id,
                  label: `${u.nama} (${u.email})`,
                }))}
                disabled={modal.mode === "edit"}
              />
            </div>

            {modal.mode === "create" && (
              <>
                <div>
                  <label className="label">Proyek</label>
                  <select
                    className="input"
                    value={form.project_id}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        project_id: e.target.value,
                        cluster_id: "",
                        unit_id: "",
                      }));
                      fetchClustersByProject(e.target.value);
                    }}
                  >
                    <option value="">Pilih Proyek...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_proyek}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Cluster</label>
                  <select
                    className="input"
                    value={form.cluster_id}
                    disabled={!form.project_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cluster_id: e.target.value,
                        unit_id: "",
                      }))
                    }
                  >
                    <option value="">Pilih Cluster...</option>
                    {clusters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama_cluster}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Unit Tersedia</label>
                  <select
                    className="input"
                    value={form.unit_id}
                    disabled={!form.cluster_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit_id: e.target.value }))
                    }
                  >
                    <option value="">Pilih Unit...</option>
                    {units
                      .filter(
                        // Gunakan u.cluster_id ATAU u.cluster?.id untuk berjaga-jaga struktur response backend
                        (u) => String(u.cluster_id || u.cluster?.id) === String(form.cluster_id)
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nomor_unit} ({u.tipe_rumah})
                        </option>
                      ))}
                  </select>
                  {units.filter((u) => String(u.cluster_id || u.cluster?.id) === String(form.cluster_id)).length === 0 && form.cluster_id !== "" && (
                     <p className="text-xs text-rose-500 mt-1">Semua unit di cluster ini sudah terjual / penuh.</p>
                  )}
                </div>
              </>
            )}

            {/* SECTION FINANSIAL */}
            <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                Informasi Finansial & Harga
              </h3>
            </div>

            <div>
              <label className="label">Tipe Pembayaran</label>
              <select
                className="input"
                value={form.tipe_pembayaran}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tipe_pembayaran: e.target.value }))
                }
              >
                <option value="cash_lunas">Cash Lunas</option>
                <option value="cash_cicil">Cash Bertahap (In-House)</option>
                <option value="kredit_kpr">Kredit KPR</option>
              </select>
            </div>

            <div>
              <label className="label">Harga Total (Net)</label>
              <input
                type="number"
                className="input"
                value={form.harga_total}
                onChange={(e) =>
                  setForm((f) => ({ ...f, harga_total: e.target.value }))
                }
              />
            </div>

            {form.tipe_pembayaran !== "cash_lunas" && (
              <div>
                <label className="label">Tenor (Bulan)</label>
                <input
                  type="number"
                  className="input"
                  value={form.tenor_bulan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tenor_bulan: e.target.value }))
                  }
                />
              </div>
            )}

            <div>
              <label className="label">Tanggal Pembelian</label>
              <input
                type="date"
                className="input"
                value={form.tanggal_pembelian}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tanggal_pembelian: e.target.value }))
                }
              />
            </div>

            {form.tipe_pembayaran === "kredit_kpr" && (
              <div className="md:col-span-2">
                <label className="label">Keterangan / Bank KPR</label>
                <textarea
                  className="input"
                  rows="2"
                  value={form.keterangan_kpr}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keterangan_kpr: e.target.value }))
                  }
                ></textarea>
              </div>
            )}

            {modal.mode === "edit" && (
              <div className="md:col-span-2">
                <label className="label">Status Kepemilikan</label>
                <select
                  className="input"
                  value={form.status_kepemilikan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status_kepemilikan: e.target.value,
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModal({ open: false })}
            >
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
