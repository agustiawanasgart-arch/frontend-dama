import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui';
import { useTheme } from '../../hooks/useTheme';
import {
  LayoutDashboard, Building2, FolderKanban, Layers, Home,
  Users, ClipboardList, TrendingUp, FileImage, LogOut, Menu, X, Sun, Moon
} from 'lucide-react';
import { useState } from 'react';

// 1. Deklarasi navItems dikembalikan agar ikon terpakai dan tidak undefined
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin'] },
  { to: '/companies', icon: Building2, label: 'Perusahaan', roles: ['super_admin'] },
  { to: '/projects', icon: FolderKanban, label: 'Proyek', roles: [ 'admin'] },
  { to: '/clusters', icon: Layers, label: 'Cluster', roles: [ 'admin'] },
  { to: '/units', icon: Home, label: 'Unit', roles: ['admin', 'customer'] },
  { to: '/assignments', icon: ClipboardList, label: 'Assignment', roles: [ 'admin', 'customer'] },
  { to: '/progress', icon: TrendingUp, label: 'Progress', roles: ['admin', 'customer'] },
  { to: '/documentation', icon: FileImage, label: 'Dokumentasi', roles: [ 'admin', 'customer'] },
  { to: '/users', icon: Users, label: 'Pengguna', roles: ['super_admin', 'admin'] },
];

export default function Sidebar() {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => isRole(...item.roles));

  // 2. Diubah menjadi fungsi pembantu (helper function) bukan React Component
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="px-5 py-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-sans font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none">PropTrack</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            {/* 3. Gunakan Render Prop agar isActive bisa dibaca oleh anak elemen */}
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <button 
          onClick={toggleTheme} 
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="text-sm font-medium">{theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-3 px-2 pt-2">
          <Avatar name={user?.nama} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold truncate">{user?.nama}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        
        <button onClick={handleLogout} className="sidebar-link w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-[60] bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-700 dark:text-slate-200"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {renderSidebarContent()}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 transition-colors duration-200">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
