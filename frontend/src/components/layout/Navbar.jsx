// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import './Navbar.css'; // Подключаем стили
import { FaSearch, FaRegBell, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import UpLogo from '../../assets/Up-logo.svg';
import Sidebar from './Sidebar';
import { useUser } from '../../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  // Function to get user initials
  const getUserInitials = (fullName) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    return names[0].charAt(0) + (names[1]?.charAt(0) || '');
  };

  return (
    <>
      {/* Мобильный Drawer */}
      <div className={`mobile-drawer${drawerOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-logo"><img src={UpLogo} alt="Logo" style={{height:34}} /></span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}><FaTimes /></button>
        </div>
        <div className="drawer-navbar-extra">
          <div className="navbar-search">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Поиск" />
          </div>
          <div className="drawer-profile">
            <div className="avatar">
              {getUserInitials(user?.full_name)}
            </div>
            <span className="profile-name" style={{cursor: user ? 'pointer' : 'default'}} onClick={() => user && navigate('/profile')}>
              {user ? user.full_name : 'Гость'}
              {user && <span style={{ color: '#397DFF', marginLeft: 8, fontSize: 13 }}>({user.role})</span>}
            </span>
            <FaChevronDown className="chevron-icon" />
          </div>
        </div>
        <Sidebar isDrawer />
      </div>
      {/* Затемнение фона при открытом Drawer */}
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}></div>}

      <nav className="navbar-container">
        {/* Бургер-меню только на мобильных */}
        <button className="burger-btn" onClick={() => setDrawerOpen(true)}>
          <FaBars />
        </button>
        {/* Поиск слева на десктопе */}
        <div className="navbar-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Поиск" />
        </div>
        {/* Лого по центру */}
        <span className="navbar-logo"><img src={UpLogo} alt="Logo" style={{height:32}} /></span>
        {/* Правая часть: скрыта на мобилках */}
        <div className="navbar-controls">
          <button className="control-btn notification-btn">
            <FaRegBell />
          </button>
          <button className="control-btn profile-btn" onClick={() => user && navigate('/profile')}>
            <div className="avatar">
              {getUserInitials(user?.full_name)}
            </div>
            <span className="profile-name" style={{cursor: user ? 'pointer' : 'default'}}>
              {user ? user.full_name : 'Гость'}
              {user && <span style={{ color: '#397DFF', marginLeft: 8, fontSize: 13 }}>({user.role})</span>}
            </span>
            <FaChevronDown className="chevron-icon" />
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;