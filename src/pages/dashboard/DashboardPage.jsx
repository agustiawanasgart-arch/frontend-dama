import { useEffect, useState } from "react";
import { dashboardAPI } from "../../api/services";
import { PageLoader, ProgressBar } from "../../components/ui";
import { extractError } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Home,
  FolderKanban,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme"; // Gunakan hook theme yang sudah kita buat sebelumnya

// Warna Chart (Dibuat sedikit lebih vibrant agar cocok di Light & Dark mode)
const COLORS = ["#10b981", "#f59e0b", "#64748b"];
const BAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [stats, setStats] = useState(null);
  // <- Baris state projects dihapus total dari sini
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Kita ubah Promise.all menjadi pemanggilan tunggal khusus stats saja
    dashboardAPI
      .stats()
      .then((res) => {
        setStats(res.data.data);
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error)
    return (
      <div className="text-rose-500 text-sm font-medium p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
        {error}
      </div>
    );

  const unitData = stats
    ? [
        { name: "Selesai", value: stats.units.selesai },
        { name: "Dalam Pembangunan", value: stats.units.dalam_pembangunan },
        { name: "Belum Mulai", value: stats.units.belum_mulai },
      ]
    : [];

  const projectData = stats
    ? [
        { name: "Aktif", value: stats.projects.active },
        { name: "Selesai", value: stats.projects.completed },
        { name: "On Hold", value: stats.projects.on_hold },
      ]
    : [];

  const statCards = [
    {
      label: "Total Unit",
      value: stats?.units?.total ?? 0,
      icon: Home,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      sub: `${stats?.units?.selesai ?? 0} selesai`,
    },
    {
      label: "Proyek",
      value: stats?.projects?.total ?? 0,
      icon: FolderKanban,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      sub: `${stats?.projects?.active ?? 0} aktif`,
    },
    {
      label: "Customer",
      value: stats?.customers?.total ?? 0,
      icon: Users,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      sub: `${stats?.customers?.active ?? 0} aktif`,
    },
    {
      label: "Assignment",
      value: stats?.assignments?.total ?? 0,
      icon: ClipboardList,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      sub: `${stats?.assignments?.active ?? 0} aktif`,
    },
  ];

  const tooltipStyle = {
    background: theme === "dark" ? "#1e293b" : "#ffffff",
    border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
    borderRadius: "12px",
    color: theme === "dark" ? "#f8fafc" : "#0f172a",
    fontSize: "13px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Selamat datang kembali,{" "}
          <span className="font-semibold">{user?.nama ?? user?.name}</span>
        </p>
      </div>

      {/* BENTO STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((s) => (
          <div key={s.label} className="card p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}
              >
                <s.icon className={`w-6 h-6 ${s.color}`} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                {s.value.toLocaleString()}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {s.label}
              </div>
            </div>
            <div className={`text-xs mt-3 font-medium ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Status Unit Pie */}
        <div className="card p-6 flex flex-col">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">
            Status Unit
          </h3>
          <div className="h-60 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={unitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {unitData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "inherit" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {unitData.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: COLORS[i] }}
                />
                {d.name}:{" "}
                <span className="text-slate-900 dark:text-slate-200">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Proyek Bar */}
        <div className="card p-6 flex flex-col">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">
            Status Proyek
          </h3>
          <div className="h-60 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: theme === "dark" ? "#94a3b8" : "#64748b",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{
                    fill: theme === "dark" ? "#94a3b8" : "#64748b",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{
                    fill: theme === "dark" ? "#334155" : "#f1f5f9",
                    opacity: 0.4,
                  }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "inherit" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {projectData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PROGRESS OVERVIEW */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Progress Pembangunan Unit
          </h3>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-transparent">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-full mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.units?.selesai ?? 0}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 mb-4">
              Selesai
            </div>
            <ProgressBar
              value={
                stats?.units?.total
                  ? (stats.units.selesai / stats.units.total) * 100
                  : 0
              }
              className="!bg-slate-200 dark:!bg-slate-700"
            />
          </div>

          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-transparent">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-500/10 rounded-full mx-auto mb-3">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.units?.dalam_pembangunan ?? 0}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 mb-4">
              Dalam Pembangunan
            </div>
            <ProgressBar
              value={
                stats?.units?.total
                  ? (stats.units.dalam_pembangunan / stats.units.total) * 100
                  : 0
              }
              className="!bg-slate-200 dark:!bg-slate-700"
            />
          </div>

          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-transparent">
            <div className="flex items-center justify-center w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.units?.belum_mulai ?? 0}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 mb-4">
              Belum Mulai
            </div>
            <ProgressBar
              value={
                stats?.units?.total
                  ? (stats.units.belum_mulai / stats.units.total) * 100
                  : 0
              }
              className="!bg-slate-200 dark:!bg-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
