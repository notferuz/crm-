// src/components/Sidebar/Sidebar.jsx
import React, { useState } from 'react'; // Import useState
import './Sidebar.css';
import {
  FaThLarge,
  FaRegFileAlt,
  FaUsers,
  FaSignOutAlt,
  FaQuestionCircle,
  FaRegCalendarAlt,
  FaCog,
} from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Modal from '../Modal/Modal'; // Import the new Modal component
import { useUser } from '../../context/UserContext';
import SupportChat from '../SupportChat';
import UpLogo from '../../assets/Up-logo.svg';

const Sidebar = ({ isDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const can = (section) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    if (role === 'superadmin' || role === 'store_admin') return true;
    const perms = user.permissions || {};
    switch (section) {
      case 'dashboard': return perms.dashboard !== false; // default true
      case 'equipment': return !!perms.equipment;
      case 'clients': return !!perms.clients;
      case 'rentals': return !!perms.rentals; // rental, accept, history
      case 'history': return !!(perms.history ?? perms.rentals);
      case 'accept': return !!(perms.accept ?? perms.rentals);
      case 'profile': return !!(perms.profile ?? true);
      default: return true;
    }
  };
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for modal visibility
  const [showSupportChat, setShowSupportChat] = useState(false);

  const handleLogoutConfirm = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/login');
    
    // Close modal
    setShowLogoutModal(false);
  };

  const handleLogoutClick = () => {
    console.log('Logout button clicked, setting modal to true');
    setShowLogoutModal(true);
  };

  console.log('Modal state:', showLogoutModal); // Debug log

  if (isDrawer) {
    return (
      <aside className="drawer-sidebar">
        <nav className="sidebar-menu">
          <ul>
            {can('dashboard') && (
              <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                <Link to="/dashboard"><FaThLarge className="menu-icon" /><span>Дэшборд</span></Link>
              </li>
            )}
            {can('equipment') && (
              <li className={location.pathname === '/techniques' ? 'active' : ''}>
                <Link to="/techniques"><FaRegFileAlt className="menu-icon" /><span>Техники</span></Link>
              </li>
            )}
            {can('clients') && (
              <li className={location.pathname.startsWith('/clients') ? 'active' : ''}>
                <Link to="/clients"><FaUsers className="menu-icon" /><span>Клиенты</span></Link>
              </li>
            )}
            {can('rentals') && (
              <>
                <li className={location.pathname.startsWith('/rental') ? 'active' : ''}>
                  <Link to="/rental"><FaRegCalendarAlt className="menu-icon" /><span>Аренда</span></Link>
                </li>
                {can('history') && (
                <li className={location.pathname.startsWith('/history') ? 'active' : ''}>
                  <Link to="/history"><FaRegCalendarAlt className="menu-icon" /><span>История</span></Link>
                </li>
                )}
                {can('accept') && (
                <li className={location.pathname.startsWith('/accept') ? 'active' : ''}>
                  <Link to="/accept"><FaRegCalendarAlt className="menu-icon" /><span>Принять</span></Link>
                </li>
                )}
              </>
            )}
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <div className="support-section">
            <button className="support-button" onClick={() => setShowSupportChat(true)}>
              <FaQuestionCircle className="button-icon" />
              <span>Support</span>
            </button>
          </div>
          <div className="logout-section">
            <button onClick={handleLogoutClick} className="logout-button-style">
              <FaSignOutAlt className="logout-icon" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Меню для супер-админа
  if (user?.role === 'superadmin') {
    return (
      <>
        <aside className={`sidebar${isDrawer ? ' drawer-sidebar' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src={UpLogo} alt="Upgrade Agency" className="sidebar-logo-image" />
            </div>
          </div>
          <nav className="sidebar-menu">
            <ul>
              <li className={location.pathname === '/super-admin' ? 'active' : ''}>
                <Link to="/super-admin">
                  <FaCog className="menu-icon" />
                  <span>Управление системой</span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className="sidebar-bottom">
            <div className="support-section">
              <button className="support-button" onClick={() => setShowSupportChat(true)}>
                <FaQuestionCircle className="button-icon" />
                <span>Support</span>
              </button>
            </div>
            <div className="logout-section">
              <button
                onClick={handleLogoutClick}
                className="logout-button-style"
              >
                <FaSignOutAlt className="logout-icon" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Logout Confirmation Modal */}
        <Modal
          show={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
          title="Подтверждение выхода"
          message="Вы уверены, что хотите выйти из аккаунта?"
          confirmText="Выйти"
          cancelText="Отмена"
        />

        <SupportChat open={showSupportChat} onClose={() => setShowSupportChat(false)} user={user} />
      </>
    );
  }

  // Меню для обычных пользователей
  return (
    <>
      <aside className={`sidebar${isDrawer ? ' drawer-sidebar' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={UpLogo} alt="Upgrade Agency" className="sidebar-logo-image" />
          </div>
        </div>
        <nav className="sidebar-menu">
          <ul>
            <li className={location.pathname === '/dashboard' ? 'active' : ''}>
              <Link to="/dashboard">
                <FaThLarge className="menu-icon" />
                <span>Дэшборд</span>
              </Link>
            </li>
            <li className={location.pathname === '/techniques' ? 'active' : ''}>
              <Link to="/techniques">
                <FaRegFileAlt className="menu-icon" />
                <span>Техники</span>
              </Link>
            </li>
            <li className={location.pathname.startsWith('/clients') ? 'active' : ''}>
              <Link to="/clients">
                <FaUsers className="menu-icon" />
                <span>Клиенты</span>
              </Link>
            </li>
            <li className={location.pathname.startsWith('/rental') ? 'active' : ''}>
              <Link to="/rental">
                <FaRegCalendarAlt className="menu-icon" />
                <span>Аренда</span>
              </Link>
            </li>
            <li className={location.pathname.startsWith('/history') ? 'active' : ''}>
              <Link to="/history">
                <FaRegCalendarAlt className="menu-icon" />
                <span>История</span>
              </Link>
            </li>
            <li className={location.pathname.startsWith('/accept') ? 'active' : ''}>
              <Link to="/accept">
                <FaRegCalendarAlt className="menu-icon" />
                <span>Принять</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <div className="support-section">
            <button className="support-button" onClick={() => setShowSupportChat(true)}>
              <FaQuestionCircle className="button-icon" />
              <span>Support</span>
            </button>
          </div>
          <div className="logout-section">
            <button
              onClick={handleLogoutClick}
              className="logout-button-style"
            >
              <FaSignOutAlt className="logout-icon" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        show={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Подтверждение выхода"
        message="Вы уверены, что хотите выйти из аккаунта?"
        confirmText="Выйти"
        cancelText="Отмена"
      />

      <SupportChat open={showSupportChat} onClose={() => setShowSupportChat(false)} user={user} />
    </>
  );
};

export default Sidebar;