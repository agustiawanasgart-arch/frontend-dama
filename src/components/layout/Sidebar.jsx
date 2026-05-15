import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Layers,
  Home,
  Users,
  ClipboardList,
  TrendingUp,
  FileImage,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";
import logo from "../../assets/podorukun-logo.png";

const navItems = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["super_admin", "admin"],
    match: ["/"],
  },
  {
    to: "/companies",
    icon: Building2,
    label: "Perusahaan",
    roles: ["super_admin"],
    match: ["/companies"],
  },
  {
    to: "/projects",
    icon: FolderKanban,
    label: "Proyek",
    roles: ["super_admin", "admin"],
    match: ["/projects"],
  },
  {
    to: "/units",
    icon: Home,
    label: "Unit (Customer)",
    roles: ["customer"],
    match: ["/units"],
  },
  {
    to: "/assignments",
    icon: ClipboardList,
    label: "Penjualan (Customer)",
    roles: ["customer"],
    match: ["/assignments"],
  },
  {
    to: "/progress",
    icon: TrendingUp,
    label: "Progress (Customer)",
    roles: ["customer"],
    match: ["/progress"],
  },
  {
    to: "/documentation",
    icon: FileImage,
    label: "Dokumentasi",
    roles: ["customer"],
    match: ["/documentation"],
  },
];

const settingsItems = [
  {
    to: "/users",
    icon: Users,
    label: "Pengguna",
    roles: ["super_admin", "admin"],
    match: ["/users"],
  },
];

export default function Sidebar() {
  const { logout, isRole } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleNavItems = navItems.filter((item) => isRole(...item.roles));

  const visibleSettingsItems = settingsItems.filter((item) =>
    isRole(...item.roles),
  );

  const isItemActive = (item) =>
    item.match.some((path) =>
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path),
    );

  const renderNavItems = (items) =>
    items.map((item) => {
      const active = isItemActive(item);

      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={() => setOpen(false)}
          className={`podorukun-sidebar-link ${
            active ? "podorukun-sidebar-link-active" : ""
          }`}
        >
          <item.icon
            className="h-[18px] w-[18px] shrink-0"
            strokeWidth={active ? 2.6 : 2.2}
          />

          <span>{item.label}</span>
        </NavLink>
      );
    });

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* HEADER */}
      <div className="flex items-start justify-between px-[34px] pb-9 pt-7">
        <div>
          <h1 className="text-[17px] font-semibold leading-6 text-[#c9151b]">
            Podorukun Group
          </h1>

          <p className="mt-0.5 text-[15px] font-medium leading-5 text-[#c9151b]">
            Monitoring Sistem
          </p>
        </div>

        <img
          src={logo}
          alt="Podorukun Logo"
          className="h-[36px] w-[36px] object-contain"
        />
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto pb-6">
        <div className="mb-8">
          <p className="podorukun-sidebar-section">Menu</p>

          <div className="mt-5 space-y-3">
            {renderNavItems(visibleNavItems)}
          </div>
        </div>

        <div>
          <p className="podorukun-sidebar-section">Pengaturan</p>

          <div className="mt-5 space-y-3">
            {renderNavItems(visibleSettingsItems)}
          </div>
        </div>
      </nav>

      {/* LOGOUT */}
      <button onClick={handleLogout} className="podorukun-logout">
        <span>Keluar</span>

        <span className="podorukun-logout-icon">
          <LogOut className="h-5 w-5" strokeWidth={2.3} />
        </span>
      </button>
    </div>
  );

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        className="fixed right-4 top-4 z-[60] rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[290px] transform overflow-hidden bg-white shadow-2xl shadow-slate-950/10 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="podorukun-sidebar-shadow sticky top-0 hidden h-screen w-[290px] shrink-0 overflow-hidden bg-white lg:flex lg:flex-col">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
