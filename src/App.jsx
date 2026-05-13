
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ClustersPage from './pages/clusters/ClustersPage';
import UnitsPage from './pages/units/UnitsPage';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import ProgressPage from './pages/progress/ProgressPage';
import DocumentationPage from './pages/documentation/DocumentationPage';
import UsersPage from './pages/users/UsersPage';
import CompaniesPage from './pages/companies/CompaniesPage';

// Halaman Error & Proteksi
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // Jika role user tidak ada di dalam array roles yang diizinkan
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'customer') {
      // Jika nanti customer punya dashboard sendiri, ganti path ini (misal: to="/my-units")
      return <Navigate to="/unauthorized" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rute Publik */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Rute Terproteksi (Admin & Super Admin) */}
      <Route path="/" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} />
      <Route path="/companies" element={<PrivateRoute roles={['super_admin']}><AppLayout><CompaniesPage /></AppLayout></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><ProjectsPage /></AppLayout></PrivateRoute>} />
      <Route path="/clusters" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><ClustersPage /></AppLayout></PrivateRoute>} />
      <Route path="/units" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><UnitsPage /></AppLayout></PrivateRoute>} />
      <Route path="/assignments" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><AssignmentsPage /></AppLayout></PrivateRoute>} />
      <Route path="/progress" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><ProgressPage /></AppLayout></PrivateRoute>} />
      <Route path="/documentation" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><DocumentationPage /></AppLayout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={['super_admin','admin']}><AppLayout><UsersPage /></AppLayout></PrivateRoute>} />

      {/* Rute Error */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/server-error" element={<ServerErrorPage />} />

      {/* 404 Wildcard (Harus diletakkan paling bawah) */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}
