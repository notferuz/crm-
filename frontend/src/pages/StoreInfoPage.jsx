import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStore, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUsers, FaBoxes, FaCalendarAlt } from 'react-icons/fa';
import { fetchStore, fetchStoreStats } from '../api/stores';
import './StoreInfoPage.css';

const StoreInfoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true);
        const [storeData, statsData] = await Promise.all([
          fetchStore(id),
          fetchStoreStats(id)
        ]);
        setStore(storeData);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [id]);

  const handleBack = () => {
    navigate('/stores');
  };

  if (loading) {
    return (
      <div className="store-info-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка информации о магазине...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-info-page">
        <div className="error-container">
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="store-info-page">
        <div className="error-container">
          <h2>Магазин не найден</h2>
          <p>Запрашиваемый магазин не существует или был удален.</p>
          <button onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="store-info-page">
      <div className="store-info-header">
        <button onClick={handleBack} className="back-btn">
          <FaArrowLeft /> Назад
        </button>
        <h1>Информация о магазине</h1>
      </div>

      <div className="store-info-content">
        <div className="store-main-info">
          <div className="store-header">
            <div className="store-icon">
              <FaStore />
            </div>
            <div className="store-title-section">
              <h2>{store.name}</h2>
              <span className={`store-status-badge ${store.is_active ? 'status-green' : 'status-red'}`}>
                {store.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>

          <div className="store-details">
            <div className="store-detail-item">
              <FaMapMarkerAlt className="detail-icon" />
              <div className="detail-content">
                <label>Адрес</label>
                <span>{store.address}</span>
              </div>
            </div>

            <div className="store-detail-item">
              <FaPhone className="detail-icon" />
              <div className="detail-content">
                <label>Телефон</label>
                <span>{store.phone}</span>
              </div>
            </div>

            <div className="store-detail-item">
              <FaEnvelope className="detail-icon" />
              <div className="detail-content">
                <label>Email</label>
                <span>{store.email}</span>
              </div>
            </div>

            <div className="store-detail-item">
              <FaCalendarAlt className="detail-icon" />
              <div className="detail-content">
                <label>Дата создания</label>
                <span>{new Date(store.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="store-stats-section">
            <h3>Статистика магазина</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.total_employees || 0}</span>
                  <span className="stat-label">Сотрудников</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaBoxes />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.total_equipment || 0}</span>
                  <span className="stat-label">Оборудования</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaStore />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.active_rentals || 0}</span>
                  <span className="stat-label">Активных аренд</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaCalendarAlt />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.total_rentals || 0}</span>
                  <span className="stat-label">Всего аренд</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreInfoPage; 