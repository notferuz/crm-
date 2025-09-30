// src/components/layout/Content.jsx
import React from 'react';
import './Content.css';

// Этот компонент-обертка принимает другие компоненты (страницы) как "children"
const Content = ({ children }) => {
  return (
    <main className="content">
      {children}
    </main>
  );
};

export default Content;