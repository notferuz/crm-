// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaKey, FaLockOpen, FaShieldAlt, FaMoneyBillWave, FaCreditCard, FaChartLine } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './HomePage.css';
import './TechniquesPage.css';
import { FaFilter } from 'react-icons/fa';
import { fetchDashboardData } from '../api/dashboard';
import { useUser } from '../context/UserContext';

const THEME = '#397DFF';

const HomePage = () => {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [period, setPeriod] = useState('today'); // today | yesterday | custom
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFrom, dateTo]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = period === 'custom'
        ? { period: 'custom', date_from: dateFrom, date_to: dateTo, history_limit: 10 }
        : { period, history_limit: 10 };
      const data = await fetchDashboardData(params);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setToday = () => {
    const t = new Date().toISOString().slice(0, 10);
    setPeriod('today');
    setDateFrom(t);
    setDateTo(t);
  };
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    setPeriod('yesterday');
    setDateFrom(y);
    setDateTo(y);
  };

  if (loading) {
    return (
      <div className="home-page">
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
          Загрузка дашборда...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div style={{ textAlign: 'center', padding: '50px', color: '#ff3b30' }}>
          <h3>Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button 
            onClick={loadDashboardData}
            style={{
              padding: '10px 20px',
              backgroundColor: THEME,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="home-page">
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          Нет данных для отображения
        </div>
      </div>
    );
  }

  // Utilization (busy vs available)
  const busyQty = Number(dashboardData.equipment?.busy || 0);
  const availableQty = Number(dashboardData.equipment?.available || 0);
  const totalQty = busyQty + availableQty;
  const utilization = totalQty > 0 ? Math.round((busyQty / totalQty) * 100) : 0;

  // Cards (more relevant KPIs)
  const bookedCount = (dashboardData.period?.status_counts && typeof dashboardData.period.status_counts.booked !== 'undefined')
    ? dashboardData.period.status_counts.booked
    : (Array.isArray(dashboardData.history) ? dashboardData.history.filter(r => r.status === 'booked').length : 0);

  const cards = [
    {
      icon: <FaChartLine size={36} color={THEME} />, 
      title: 'Загрузенность', 
      value: `${utilization}%`, 
      color: THEME,
    },
    {
      icon: <FaCalendarAlt size={36} color={THEME} />, 
      title: 'Аренд за период', 
      value: dashboardData.period?.rentals || 0, 
      color: THEME,
    },
    {
      icon: <FaShieldAlt size={36} color={THEME} />, 
      title: 'Бронь за период', 
      value: bookedCount, 
      color: THEME,
    },
    {
      icon: <FaLockOpen size={36} color={THEME} />, 
      title: 'Средний чек', 
      value: (dashboardData.period?.avg_check || 0).toLocaleString() + ' сум', 
      color: THEME,
    },
  ];

  // Pie data (unified palette)
  const pieData = [
    { name: 'Занято', value: busyQty, color: THEME },
    { name: 'Свободно', value: availableQty, color: '#9bbdff' },
  ];

  const getUserInitials = (fullName) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    return names[0].charAt(0) + (names[1]?.charAt(0) || '');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'booked':
        return 'blue';
      case 'completed':
        return 'yellow';
      case 'cancelled':
      case 'overdue':
        return 'red';
      default:
        return 'gray';
    }
  };

  const periodLabel = (() => {
    if (period === 'today') return 'Сегодня';
    if (period === 'yesterday') return 'Вчера';
    return `${formatDate(dashboardData.period?.start)} — ${formatDate(dashboardData.period?.end)}`;
  })();

  // Payments breakdown (cash/card) — use 0 if not provided by API yet
  const cashAmount = dashboardData.period?.cash || 0;
  const cardAmount = dashboardData.period?.card || 0;

  return (
    <div className="home-page">
      <h2 className="greeting">Здравствуйте, {user?.full_name || 'Пользователь'}!</h2>
      <h1 className="main-title">Дэшборд</h1>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <FaFilter color={THEME} />
        <button onClick={setToday} className={`btn ${period==='today' ? 'btn-primary' : ''}`}>Сегодня</button>
        <button onClick={setYesterday} className={`btn ${period==='yesterday' ? 'btn-primary' : ''}`}>Вчера</button>
        <button onClick={() => setPeriod('custom')} className={`btn ${period==='custom' ? 'btn-primary' : ''}`}>Период</button>
        {period === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
            <span style={{ color: '#888' }}>—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
          </div>
        )}
        <div style={{ marginLeft: 'auto', color: '#666' }}>Период: <b>{periodLabel}</b></div>
      </div>
      
      {/* Summary for selected period */}
      <div className="today-stats" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '20px', 
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Аренд за период</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME }}>
            {dashboardData.period?.rentals || 0}
          </div>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '20px', 
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Доход за период</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME }}>
            {(dashboardData.period?.revenue || 0).toLocaleString()} сум
          </div>
        </div>
      </div>

      {/* Payments (cash / card) */}
      <div className="today-stats" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '20px', 
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Наличка</h3>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8 }}>
            <FaMoneyBillWave color={THEME} />
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: THEME }}>
              {cashAmount.toLocaleString()} сум
            </div>
          </div>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '20px', 
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Карта</h3>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8 }}>
            <FaCreditCard color={THEME} />
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: THEME }}>
              {cardAmount.toLocaleString()} сум
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="cards-section">
          <div className="cards-grid">
            {cards.map((card, idx) => (
              <div className="dashboard-card" key={idx}>
                <div className="card-icon">{card.icon}</div>
                <div className="card-title">{card.title}</div>
                <div className="card-value">{typeof card.value === 'string' ? card.value : card.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="pie-section">
          <div className="pie-card">
            <h3 className="pie-title">Статистика техники</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill={THEME}
                  label={({ value }) => value}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend-list">
              {pieData.map((item, idx) => (
                <div className="pie-legend-item" key={idx}>
                  <span className="pie-legend-color" style={{ background: item.color }}></span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* История аренд */}
      <div className="history-section">
        <div className="history-header">
          <h2>История аренд</h2>
        </div>
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Дата начала</th>
                <th>Дата окончания</th>
                <th>Админ</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.history && dashboardData.history.length > 0 ? (
                dashboardData.history.map((rental, idx) => (
                  <tr key={rental.id || idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#e6f0ff',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: THEME,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          border: `2px solid ${THEME}`
                        }}>
                          {(() => { if (!rental.client_full_name) return 'К'; const names = rental.client_full_name.split(' '); return names[0].charAt(0) + (names[1]?.charAt(0) || ''); })()}
                        </div>
                        <span>{rental.client_full_name || 'Клиент'}</span>
                      </div>
                    </td>
                    <td>{formatDate(rental.date_start)}</td>
                    <td>{formatDate(rental.date_end)}</td>
                    <td>{rental.admin_full_name || 'Админ'}</td>
                    <td>{(rental.total_amount || 0).toLocaleString()} сум</td>
                    <td>
                      <span className={`history-status-badge status-${getStatusColor(rental.status)}`}>
                        {(() => {
                          switch (rental.status) {
                            case 'active': return 'Активна';
                            case 'booked': return 'Забронирована';
                            case 'completed': return 'Завершена';
                            case 'cancelled': return 'Отменена';
                            case 'overdue': return 'Просрочена';
                            default: return rental.status;
                          }
                        })()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Нет данных об арендах
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
