import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['super_admin', 'admin'],
  },
  {
    to: '/projects',
    icon: Building2,
    label: 'Proyek & Unit',
    roles: ['admin'],
  },
  {
    to: '/customers',
    icon: Users,
    label: 'Data Customer',
    roles: ['admin'],
  },
  {
    to: '/reports',
    icon: FileText,
    label: 'Laporan',
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const { logout, isRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) =>
    isRole(...item.roles)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      
      {/* HEADER */}
      <div className="px-6 pt-6 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-red-600 leading-tight">
              Podorukun Group
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Monitoring Sistem
            </p>
          </div>

          <div className="w-11 h-11 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold text-lg">
            IP
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="px-6">
        <p className="text-xs font-semibold text-gray-400 mb-4 tracking-wide">
          MENU
        </p>

        <div className="space-y-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `
                flex items-center gap-4
                px-5 py-4 rounded-3xl
                transition-all duration-200
                text-[15px] font-medium
                ${
                  isActive
                    ? 'bg-[#E7E7E7] text-red-600'
                    : 'text-gray-500 hover:bg-gray-200'
                }
              `
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  />

                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* SECTION PENGATURAN */}
        <div className="mt-10">
          <p className="text-xs font-semibold text-gray-400 mb-4 tracking-wide">
            PENGATURAN
          </p>

          <button
            className="
              flex items-center gap-4
              px-5 py-4 rounded-3xl
              text-gray-500 hover:bg-gray-200
              w-full transition
            "
          >
            <Users className="w-5 h-5" />
            <span className="text-[15px] font-medium">
              Akun User
            </span>
          </button>
        </div>
      </div>

      {/* LOGOUT */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="
            w-full bg-red-700
            hover:bg-red-800
            transition
            text-white
            px-6 py-5
            flex items-center justify-between
            font-semibold
          "
        >
          <span>Keluar</span>

          <div className="bg-white text-red-700 rounded-lg p-2">
            <LogOut className="w-5 h-5" />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        className="
          lg:hidden fixed top-4 right-4 z-[60]
          bg-white p-2 rounded-xl shadow
        "
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-[280px]
          transition-transform duration-300
          lg:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className="
          hidden lg:flex
          w-[280px]
          h-screen
          sticky top-0
          border-r border-gray-200
        "
      >
        <SidebarContent />
      </aside>
    </>
  );
}