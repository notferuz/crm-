// src/components/layout/MainLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import Content from './Content';
import Navbar from './Navbar';
import './MainLayout.css';
import { useLocation } from 'react-router-dom';

// Этот компонент объединяет Sidebar и Content
const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideLayout = ['/register', '/login'].includes(location.pathname);
  if (hideLayout) {
    return <>{children}</>;
  }
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <Content>
          {children}
        </Content>
      </div>
    </div>
  );
};

export default MainLayout;