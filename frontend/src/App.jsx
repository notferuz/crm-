// src/App.jsx
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import TechniquesPage from './pages/TechniquesPage';
import Clients from './pages/ClientsPage';
import ClientInfoPage from './pages/ClientInfoPage';
import RentalPage from './pages/RentalPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import StoreInfoPage from './pages/StoreInfoPage';
import SuperAdminPage from './pages/SuperAdminPage';
import HistoryPage from './pages/HistoryPage';
import RentalDetailPage from './pages/RentalDetailPage';
import AcceptPage from './pages/AcceptPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './context/UserContext';
// import AboutPage from './pages/AboutPage'; // <-- Раскомментируйте, если хотите показать другую страницу

function App() {
  const { user, loading } = useUser();
  const can = (section) => {
    if (!user) return false;
    // Полный доступ для супер-админа и store_admin
    if (['superadmin', 'store_admin'].includes((user.role || '').toLowerCase())) return true;
    const perms = user.permissions || {};
    switch (section) {
      case 'dashboard': return perms.dashboard !== false; // по умолчанию true
      case 'equipment': return !!perms.equipment;
      case 'clients': return !!perms.clients;
      case 'rentals': return !!perms.rentals; // включает /rental
      case 'history': return !!(perms.history ?? perms.rentals);
      case 'accept': return !!(perms.accept ?? perms.rentals);
      case 'profile': return !!(perms.profile ?? true);
      default: return true;
    }
  };

  const firstAllowedPath = () => {
    if (!user) return '/login';
    if (can('dashboard')) return '/dashboard';
    if (can('equipment')) return '/techniques';
    if (can('clients')) return '/clients';
    if (can('rentals')) return '/rental';
    if (can('history')) return '/history';
    if (can('accept')) return '/accept';
    if (can('profile')) return '/profile';
    return '/login';
  };

  if (loading) return <div>Загрузка...</div>;

  // Если пользователь супер-админ, показываем специальную страницу
  if (user?.role === 'superadmin') {
    return (
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/super-admin" />} />
          <Route path="/super-admin" element={<SuperAdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="*" element={<Navigate to="/super-admin" />} />
        </Routes>
      </MainLayout>
    );
  }

  // Для остальных пользователей показываем обычный интерфейс
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to={firstAllowedPath()} />} />
        {can('dashboard') && <Route path="/dashboard" element={<HomePage />} />}
        {can('rentals') && <Route path="/rental" element={<RentalPage />} />}
        {can('rentals') && <Route path="/rental/:id" element={<RentalDetailPage />} />}
        {can('accept') && <Route path="/accept" element={<AcceptPage />} />}
        {can('equipment') && <Route path="/techniques" element={<TechniquesPage />} />}
        {can('clients') && <Route path="/clients" element={<Clients />} />}
        {can('clients') && <Route path="/clients/:id" element={<ClientInfoPage />} />}
        <Route path="/stores/:id" element={<StoreInfoPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        {can('profile') && <Route path="/profile" element={<ProfilePage />} />}
        {can('history') && <Route path="/history" element={<HistoryPage />} />}
        {/* Защита: если нет прав на раздел — редирект на dashboard */}
        {!can('dashboard') && <Route path="/dashboard" element={<Navigate to={firstAllowedPath()} />} />} 
        {!can('rentals') && <Route path="/rental" element={<Navigate to={firstAllowedPath()} />} />}
        {!can('accept') && <Route path="/accept" element={<Navigate to={firstAllowedPath()} />} />}
        {!can('history') && <Route path="/history" element={<Navigate to={firstAllowedPath()} />} />}
        {!can('profile') && <Route path="/profile" element={<Navigate to={firstAllowedPath()} />} />}
        {!can('equipment') && <Route path="/techniques" element={<Navigate to={firstAllowedPath()} />} />}
        {!can('clients') && <Route path="/clients" element={<Navigate to={firstAllowedPath()} />} />}
        {!can('clients') && <Route path="/clients/:id" element={<Navigate to={firstAllowedPath()} />} />}
      </Routes>
      {/* <AboutPage /> */}
    </MainLayout>
  );
}

export default App;