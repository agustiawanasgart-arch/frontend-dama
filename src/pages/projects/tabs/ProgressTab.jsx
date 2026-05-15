import { useEffect, useState, useRef } from "react";
import {
  progressAPI,
  assignmentsAPI,
  timelinesAPI,
  documentationAPI,
} from "../../../api/services";
import { PageLoader, Modal, ProgressBar } from "../../../components/ui";
import { useToast } from "../../../hooks/useToast";
import {
  formatDate,
  formatCurrency,
  extractError,
} from "../../../utils/helpers";
import { useAuth } from "../../../context/AuthContext";
import {
  Hammer,
  Receipt,
  Plus,
  Pencil,
  Calendar,
  CheckCircle,
  BarChart3,
  ImagePlus,
  X,
  FileImage,
  Trash2,
} from "lucide-react";

const EMPTY_BUILD_FORM = {
  tahap: "",
  progress_percentage: 0,
  tanggal_update: "",
  catatan: "",
};
const EMPTY_PAY_FORM = { jumlah_bayar: "", tanggal_bayar: "", catatan: "" };

export default function ProgressTab({ unit, assignment, onUpdate }) {
  const { isRole } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fisik (Pembangunan)
  const [historyFisik, setHistoryFisik] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [fisikPct, setFisikPct] = useState(0);

  // Dana (Pembayaran)
  const [historyDana, setHistoryDana] = useState([]);
  const [payPct, setPayPct] = useState(0);

  // Modals
  const [buildModal, setBuildModal] = useState({
    open: false,
    mode: "view",
    editId: null,
    originalPct: 0,
  });
  const [payModal, setPayModal] = useState({ open: false, mode: "view" });

  // Forms
  const [buildForm, setBuildForm] = useState(EMPTY_BUILD_FORM);
  const [payForm, setPayForm] = useState(EMPTY_PAY_FORM);
  const [saving, setSaving] = useState(false);

  // Dokumentasi (foto/file progress)
  const [docFiles, setDocFiles] = useState([]); // File[] yang dipilih untuk diupload
  const [docsMap, setDocsMap] = useState({}); // { progressId: [doc, ...] }
  const fileInputRef = useRef(null);

  // Lightbox
  const [lightbox, setLightbox] = useState(null); // { url, type: 'image'|'video', name }

  // Kalkulasi Dana
  const isCashLunas = assignment?.pembayaran?.tipe === "cash_lunas";
  const hargaTotal = assignment?.pembayaran?.harga_total || 0;
  const totalDibayar = isCashLunas
    ? hargaTotal
    : assignment?.pembayaran?.total_dibayar || 0;
  const sisaTagihan = hargaTotal - totalDibayar;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch History Fisik & Timelines
        const [rProg, rTime] = await Promise.all([
          progressAPI.list({ unitId: unit.id }),
          timelinesAPI.list({ unitId: unit.id }),
        ]);

        const filteredFisik = (rProg.data?.data || [])
          .filter((p) => String(p.unit_id || p.unitId) === String(unit.id))
          .sort(
            (x, y) =>
              new Date(y.tanggal_update || y.tanggalUpdate) -
              new Date(x.tanggal_update || x.tanggalUpdate),
          );

        const unitTimelines = rTime.data?.data || [];

        // Fetch docs for this unit and map by progress_id
        let dMap = {};
        try {
          const rDocs = await documentationAPI.list({ unitId: unit.id });
          const docs = rDocs.data?.data || [];
          docs.forEach((d) => {
            const pid = d.progressId || d.progress_id;
            if (pid) {
              if (!dMap[pid]) dMap[pid] = [];
              dMap[pid].push(d);
            }
          });
          setDocsMap(dMap);
        } catch (err) {
          // docs are optional, don't block progress
        }

        // Fetch History Dana
        let fDana = [];
        let pPct = isCashLunas
          ? 100
          : Number(assignment?.pembayaran?.persentase_dibayar || 0);

        if (assignment) {
          if (!isCashLunas) {
            const rPay = await assignmentsAPI.getPayments(assignment.id);
            fDana = rPay.data?.data || [];
          } else {
            fDana = [
              {
                id: "lunas-auto",
                jumlah_bayar: hargaTotal,
                tanggal_bayar:
                  assignment.tanggal_pembelian || new Date().toISOString(),
                catatan:
                  "Pembayaran Cash Lunas diselesaikan secara penuh pada saat transaksi pembelian unit.",
                dicatat_oleh: "Sistem Otomatis",
              },
            ];
          }
        }

        if (isMounted) {
          setHistoryFisik(filteredFisik);
          setTimelines(unitTimelines);
          setFisikPct(Number(unit.progress_percentage || 0));
          setHistoryDana(fDana);
          setPayPct(Math.min(pPct, 100));
          setDocsMap(dMap);
        }
      } catch (err) {
        if (isMounted) toast(extractError(err), "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [unit.id, assignment?.id, refreshKey]);

  // --- Handlers Pembangunan ---
  const handleOpenEditBuild = (p) => {
    const editId = p.id || p.progress_id;
    if (!editId) {
      toast("ID progress tidak ditemukan.", "error");
      return;
    }
    const pct = Number(p.progress_percentage || p.progressPercentage || 0);
    setBuildForm({
      tahap: p.tahap,
      progress_percentage: pct,
      tanggal_update:
        (p.tanggal_update || p.tanggalUpdate)?.split("T")[0] || "",
      catatan: p.catatan || "",
    });
    setBuildModal({ open: true, mode: "edit", editId, originalPct: pct });
  };

  const handleSaveBuild = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        unit_id: unit.id,
        tahap: buildForm.tahap,
        progress_percentage: Number(buildForm.progress_percentage),
        tanggal_update: buildForm.tanggal_update,
        catatan: buildForm.catatan,
      };

      let savedProgressId = buildModal.editId;
      if (buildModal.mode === "create") {
        const res = await progressAPI.create(payload);
        savedProgressId = res.data?.data?.id || res.data?.id;
        toast("Progress bangunan ditambahkan!", "success");
      } else {
        await progressAPI.update(buildModal.editId, payload);
        toast("Data progress diperbarui!", "success");
      }

      // Upload dokumentasi jika ada file yang dipilih
      if (docFiles.length > 0 && savedProgressId) {
        for (const file of docFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("unitId", unit.id);
          fd.append("progressId", savedProgressId);
          // Gunakan nilai valid enum doc_type: foto | video | dokumen | foto_360
          let jenis = "dokumen";
          if (file.type.startsWith("video/")) jenis = "video";
          else if (file.type.startsWith("image/")) jenis = "foto";
          fd.append("jenis", jenis);
          try {
            await documentationAPI.upload(fd);
          } catch (docErr) {
            toast(`Gagal upload ${file.name}: ${extractError(docErr)}`, "error");
          }
        }
        toast(`${docFiles.length} media berhasil diunggah`, "success");
      }

      // Timeline status auto-updates are now handled completely by the backend.

      setBuildModal({ open: false, mode: "view", editId: null, originalPct: 0 });
      setDocFiles([]);
      setRefreshKey((prev) => prev + 1);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Handler Delete Dokumentasi ---
  const handleDeleteDoc = async (docId) => {
    try {
      await documentationAPI.delete(docId);
      toast("Dokumen dihapus", "success");
      // Refresh docsMap
      const rDocs = await documentationAPI.list({ unitId: unit.id });
      const docs = rDocs.data?.data || [];
      const dMap = {};
      docs.forEach((d) => {
        const pid = d.progressId || d.progress_id;
        if (pid) {
          if (!dMap[pid]) dMap[pid] = [];
          dMap[pid].push(d);
        }
      });
      setDocsMap(dMap);
    } catch (err) {
      toast(extractError(err), "error");
    }
  };

  // --- Handlers Pembayaran ---
  const handleSavePay = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...payForm,
        jumlah_bayar: Number(payForm.jumlah_bayar),
        tanggal_bayar: new Date(payForm.tanggal_bayar).toISOString(),
      };

      if (payload.jumlah_bayar > sisaTagihan) {
        toast(
          `Gagal: Maksimal pembayaran adalah ${formatCurrency(sisaTagihan)}`,
          "error",
        );
        setSaving(false);
        return;
      }

      await assignmentsAPI.createPayment(assignment.id, payload);
      toast("Pembayaran berhasil dicatat", "success");

      setPayModal({ open: false, mode: "view" });
      setRefreshKey((prev) => prev + 1);
      if (onUpdate) onUpdate(); // Sync parent data
    } catch (err) {
      toast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const selectedTahap = buildForm.tahap;
  const otherFisikForSelectedTahap = historyFisik.filter(
    (p) => p.tahap === selectedTahap &&
           (buildModal.mode === "edit" ? String(p.id || p.progress_id) !== String(buildModal.editId) : true)
  );
  const baseTahapPctExcludingEdit = otherFisikForSelectedTahap.reduce(
    (acc, curr) => acc + Number(curr.progress_percentage || curr.progressPercentage || 0),
    0
  );
  const maxSisa = selectedTahap ? Math.max(0, 100 - baseTahapPctExcludingEdit) : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Progress & Dokumentasi
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KOLOM FISIK */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hammer className="w-4 h-4 text-slate-400" /> Fisik (Pembangunan)
            </h4>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
              {fisikPct}%
            </span>
          </div>
          <ProgressBar
            value={fisikPct}
            className="!bg-slate-100 dark:!bg-slate-700 h-1.5 rounded-none"
          />

          <div className="p-4 flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 space-y-3 custom-scrollbar mb-4">
              {historyFisik.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">
                  Belum ada riwayat pembangunan.
                </p>
              ) : (
                historyFisik.map((p, idx) => {
                  const pct = Number(
                    p.progress_percentage || p.progressPercentage || 0,
                  );
                  return (
                    <div
                      key={p.id || idx}
                      className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl relative group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-bold text-slate-800 dark:text-slate-100">
                          {p.tahap}
                        </h5>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="badge bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            +{pct}%
                          </span>
                          {isRole("admin", "super_admin") && (
                            <button
                              onClick={() => handleOpenEditBuild(p)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 gap-1.5 mb-2">
                        <Calendar className="w-3.5 h-3.5" />{" "}
                        {formatDate(p.tanggal_update || p.tanggalUpdate)}
                      </div>
                      {p.catatan && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                          {p.catatan}
                        </p>
                      )}
                      {/* Dokumentasi foto terlampir */}
                      {(() => {
                        const pid = p.id || p.progress_id;
                        const docs = docsMap[pid] || [];
                        if (docs.length === 0) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                              <FileImage className="w-3 h-3" /> {docs.length} Foto/Dokumen
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {docs.map((d) => {
                                const url = d.url || d.fileUrl;
                                const isVideo = d.jenis === 'video' || url?.match(/\.(mp4|webm|mov|avi)$/i);
                                // Cek jenis='foto' ATAU ekstensi gambar di URL
                                const isImage = !isVideo && (d.jenis === 'foto' || d.jenis === 'foto_360' || url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                                return (
                                  <div key={d.id} className="relative group/media">
                                    <button
                                      type="button"
                                      onClick={() => setLightbox({ url, type: isVideo ? 'video' : isImage ? 'image' : 'file', name: d.nama_file || d.namaFile })}
                                      className="block w-full aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 hover:ring-2 hover:ring-indigo-400 transition-all"
                                      title={d.nama_file || d.namaFile}
                                    >
                                      {isImage ? (
                                        <img src={url} alt={d.nama_file} className="w-full h-full object-cover" />
                                      ) : isVideo ? (
                                        <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1">
                                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                          <span className="text-[10px] text-slate-300">VIDEO</span>
                                        </div>
                                      ) : (
                                        <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                          <FileImage className="w-6 h-6 text-slate-400" />
                                        </div>
                                      )}
                                    </button>
                                    {isRole("admin", "super_admin") && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDoc(d.id)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center"
                                        title="Hapus"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>

            {isRole("admin", "super_admin") && fisikPct < 100 && (
              <button
                className="btn-primary w-full mt-auto"
                onClick={() => {
                  setBuildForm({
                    ...EMPTY_BUILD_FORM,
                    tanggal_update: new Date().toISOString().split("T")[0],
                  });
                  setBuildModal({
                    open: true,
                    mode: "create",
                    editId: null,
                    originalPct: 0,
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Tahap Pembangunan
              </button>
            )}
          </div>
        </div>

        {/* KOLOM DANA */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" /> Dana (Pembayaran)
            </h4>
            <span
              className={`font-bold text-lg ${sisaTagihan <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {payPct}%
            </span>
          </div>
          <ProgressBar
            value={payPct}
            className="!bg-slate-100 dark:!bg-slate-700 h-1.5 rounded-none"
          />

          <div className="p-4 flex-1 flex flex-col">
            <div
              className={`p-4 rounded-xl flex justify-between border mb-4 ${sisaTagihan <= 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700"}`}
            >
              <div>
                <p
                  className={`text-xs mb-0.5 uppercase tracking-wider font-bold ${sisaTagihan <= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}
                >
                  Total Dibayar
                </p>
                <p
                  className={`text-base font-bold ${sisaTagihan <= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}
                >
                  {formatCurrency(totalDibayar)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-xs mb-0.5 uppercase tracking-wider font-bold ${sisaTagihan <= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}
                >
                  {sisaTagihan <= 0 ? "Status" : "Sisa Tagihan"}
                </p>
                {sisaTagihan <= 0 ? (
                  <p className="text-base font-bold flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> LUNAS
                  </p>
                ) : (
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(sisaTagihan)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[250px] pr-2 space-y-3 custom-scrollbar mb-4">
              {historyDana.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">
                  Belum ada riwayat pembayaran.
                </p>
              ) : (
                historyDana.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl"
                  >
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {formatCurrency(p.jumlah_bayar)}
                    </p>
                    <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                      <span>
                        <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        {formatDate(p.tanggal_bayar)}
                      </span>
                      <span>•</span>
                      <span>Oleh: {p.dicatat_oleh || "Sistem"}</span>
                    </div>
                    {p.catatan && (
                      <p
                        className={`text-xs mt-2 p-2 rounded-lg italic ${isCashLunas ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-50 text-slate-600 dark:bg-slate-800/50"}`}
                      >
                        "{p.catatan}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {isRole("admin", "super_admin") &&
              sisaTagihan > 0 &&
              !isCashLunas && (
                <button
                  className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 w-full mt-auto"
                  onClick={() => {
                    setPayForm({
                      ...EMPTY_PAY_FORM,
                      tanggal_bayar: new Date().toISOString().split("T")[0],
                    });
                    setPayModal({ open: true, mode: "create" });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Catat Pembayaran
                </button>
              )}
          </div>
        </div>
      </div>

      {/* MODAL FISIK */}
      <Modal
        open={buildModal.open}
        onClose={() => {
          setBuildModal({ open: false, mode: "view" });
          setDocFiles([]);
        }}
        title={`Fisik: Unit ${unit.nomor_unit}`}
      >
        <form onSubmit={handleSaveBuild} className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 p-3 rounded-lg text-sm border border-indigo-200 dark:border-indigo-800/50">
            {buildModal.mode === "edit" ? (
              <>
                Tahap ini sudah memiliki progress{" "}
                <strong>{baseTahapPctExcludingEdit}%</strong>. Nilai entri ini dapat
                diubah antara <strong>0% — {maxSisa}%</strong>.
              </>
            ) : (
              <>
                {selectedTahap ? (
                  <>
                    Tahap <strong>{selectedTahap}</strong> sudah mencapai <strong>{baseTahapPctExcludingEdit}%</strong>. Anda
                    dapat menambah hingga <strong>{maxSisa}%</strong> pada tahap ini.
                  </>
                ) : (
                  <>Silakan pilih tahap pembangunan terlebih dahulu.</>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="label">Nama Tahap Pengerjaan</label>
            <select
              className="input"
              required
              value={buildForm.tahap}
              onChange={(e) => {
                const newTahap = e.target.value;
                setBuildForm((f) => ({ ...f, tahap: newTahap, progress_percentage: 0 }));
              }}
            >
              <option value="">-- Pilih Timeline --</option>
              {timelines.map((t) => (
                <option key={t.id} value={t.taskName}>
                  {t.taskName}
                </option>
              ))}
            </select>
            {timelines.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Buat Timeline dulu di tab sebelah sebelum mengisi progress.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="label">
              Persentase Tahap Ini{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                +{buildForm.progress_percentage}%
              </span>
            </label>
            <input
              type="range"
              min="0"
              max={maxSisa}
              step="1"
              className="w-full accent-indigo-600"
              value={buildForm.progress_percentage}
              onChange={(e) =>
                setBuildForm((f) => ({
                  ...f,
                  progress_percentage: Number(e.target.value),
                }))
              }
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span>{maxSisa}%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label">Tanggal Laporan</label>
            <input
              type="date"
              required
              className="input"
              value={buildForm.tanggal_update}
              onChange={(e) =>
                setBuildForm((f) => ({ ...f, tanggal_update: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="label">Catatan Lapangan</label>
            <textarea
              className="input min-h-[80px]"
              value={buildForm.catatan}
              onChange={(e) =>
                setBuildForm((f) => ({ ...f, catatan: e.target.value }))
              }
              placeholder="Opsional"
            />
          </div>

          {/* UPLOAD & KELOLA DOKUMENTASI */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <FileImage className="w-4 h-4 text-indigo-500" />
              Foto / Video Lapangan{" "}
              <span className="text-slate-400 font-normal text-xs">(opsional, bisa multiple)</span>
            </label>

            {/* Existing docs in edit mode */}
            {buildModal.mode === "edit" && (() => {
              const existingDocs = docsMap[buildModal.editId] || [];
              if (existingDocs.length === 0) return (
                <p className="text-xs text-slate-400 italic">Belum ada foto/video terlampir.</p>
              );
              return (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {existingDocs.map((d) => {
                    const url = d.url || d.fileUrl;
                    const isVideo = d.jenis === 'video' || url?.match(/\.(mp4|webm|mov|avi)$/i);
                    const isImage = !isVideo && url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <div key={d.id} className="relative group/doc">
                        <button
                          type="button"
                          onClick={() => setLightbox({ url, type: isVideo ? 'video' : isImage ? 'image' : 'file', name: d.nama_file || d.namaFile })}
                          className="block w-full aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 hover:ring-2 hover:ring-indigo-400 transition-all"
                        >
                          {isImage ? (
                            <img src={url} alt={d.nama_file} className="w-full h-full object-cover" />
                          ) : isVideo ? (
                            <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              <span className="text-[10px] text-slate-300">VIDEO</span>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <FileImage className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(d.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center"
                          title="Hapus"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div
              className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files);
                setDocFiles((prev) => [...prev, ...dropped]);
              }}
            >
              <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Klik atau drag & drop foto/video di sini</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, MP4, MOV, PDF...</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files);
                setDocFiles((prev) => [...prev, ...selected]);
                e.target.value = "";
              }}
            />
            {docFiles.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {docFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileImage className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      className="ml-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      onClick={() => setDocFiles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Menyimpan..."
                : buildModal.mode === "edit"
                  ? "Perbarui Progress"
                  : "Simpan Progress"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL PEMBAYARAN */}
      <Modal
        open={payModal.open}
        onClose={() => setPayModal({ open: false, mode: "view" })}
        title={`Catat Pembayaran: Unit ${unit.nomor_unit}`}
      >
        <form onSubmit={handleSavePay} className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm border border-amber-200 dark:border-amber-800/50 mb-4">
            Sisa tagihan yang harus dilunasi adalah{" "}
            <strong>{formatCurrency(sisaTagihan)}</strong>. Anda tidak dapat
            menginput melebihi nominal ini.
          </div>

          <div className="space-y-1.5">
            <label className="label">Jumlah Nominal Transfer/Cash (Rp)</label>
            <input
              type="number"
              required
              className="input"
              placeholder="0"
              max={sisaTagihan}
              value={payForm.jumlah_bayar}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, jumlah_bayar: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="label">Tanggal Transaksi</label>
            <input
              type="date"
              required
              className="input"
              value={payForm.tanggal_bayar}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, tanggal_bayar: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="label">Keterangan / Berita Acara</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Misal: Cicilan ke-3 via BCA..."
              value={payForm.catatan}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, catatan: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="btn-primary !bg-emerald-600 hover:!bg-emerald-700"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </Modal>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <p className="text-white/60 text-sm mb-4 max-w-lg text-center truncate">{lightbox.name}</p>
          {lightbox.type === 'image' ? (
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : lightbox.type === 'video' ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <FileImage className="w-20 h-20 text-white/30" />
              <a
                href={lightbox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Buka File
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

