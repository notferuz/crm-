import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaCalendarAlt, FaUser, FaTools, FaMoneyBillWave, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { fetchRentals } from '../api/rental';
import { fetchEquipmentItem } from '../api/equipment';
import UpLogo from '../assets/Up-logo.svg';
import './RentalDetailPage.css';

const statusMap = {
  active: { text: 'Аренда', icon: FaCheckCircle, color: '#4cd964' },
  booked: { text: 'Бронь', icon: FaClock, color: '#397DFF' },
  completed: { text: 'Завершена', icon: FaCheckCircle, color: '#4cd964' },
  cancelled: { text: 'Отменена', icon: FaTimesCircle, color: '#ff3b30' },
  overdue: { text: 'Просрочена', icon: FaTimesCircle, color: '#ff9500' },
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RentalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [equipmentMap, setEquipmentMap] = useState({});

  useEffect(() => {
    loadRental();
    // eslint-disable-next-line
  }, [id]);

  const loadRental = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await fetchRentals(0, 1000);
      const found = all.find(r => String(r.id) === String(id));
      setRental(found);
      if (!found) setError('Аренда не найдена');
      // Загрузить названия техники
      if (found && found.items && found.items.length > 0) {
        const ids = Array.from(new Set(found.items.map(i => i.equipment_id)));
        const map = {};
        await Promise.all(ids.map(async eid => {
          try {
            const eq = await fetchEquipmentItem(eid);
            map[eid] = eq.title || `ID ${eid}`;
          } catch {
            map[eid] = `ID ${eid}`;
          }
        }));
        setEquipmentMap(map);
      }
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="rental-detail-page">
      <div className="receipt-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка чека...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="rental-detail-page">
      <div className="receipt-error">
        <FaTimesCircle />
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!rental) return null;

  const statusInfo = statusMap[rental.status] || { text: rental.status, icon: FaClock, color: '#888' };
  const StatusIcon = statusInfo.icon;
  const daysCount = rental.date_start && rental.date_end ? 
    Math.ceil((new Date(rental.date_end) - new Date(rental.date_start)) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="rental-detail-page">
      <div className="receipt-container">
        {/* Кнопка назад */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Назад
        </button>

        {/* Чек */}
        <div className="receipt">
          {/* Заголовок чека */}
          <div className="receipt-header">
            <div className="receipt-logo">
              <img src={UpLogo} alt="" className="logo-image" />
            </div>
            <div className="receipt-type">
              {rental.status === 'booked' ? 'БРОНЬ' : 'АРЕНДА'}
            </div>
          </div>

          {/* Информация о чеке */}
          <div className="receipt-info">
            <div className="receipt-number">
              <span>Чек №</span>
              <strong>{rental.id}</strong>
            </div>
            <div className="receipt-date">
              <FaCalendarAlt />
              <span>{formatDate(rental.date_start)} {formatTime(rental.date_start)}</span>
            </div>
          </div>

          {/* Статус */}
          <div className="receipt-status">
            <StatusIcon style={{ color: statusInfo.color }} />
            <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
          </div>

          {/* Клиент */}
          <div className="receipt-section">
            <div className="section-title">
              <FaUser />
              <span>Клиент</span>
            </div>
            <div className="client-info">
              <div className="client-name">
                {rental.client_full_name || rental.client_email || rental.client_phone || 'Клиент'}
              </div>
              {rental.client_phone && (
                <div className="client-phone">Тел: {rental.client_phone}</div>
              )}
            </div>
          </div>

          {/* Период аренды */}
          <div className="receipt-section">
            <div className="section-title">
              <FaCalendarAlt />
              <span>Период аренды</span>
            </div>
            <div className="rental-period">
              <div className="period-item">
                <span className="period-label">Начало:</span>
                <span className="period-value">{formatDate(rental.date_start)} {formatTime(rental.date_start)}</span>
              </div>
              <div className="period-item">
                <span className="period-label">Окончание:</span>
                <span className="period-value">{formatDate(rental.date_end)} {formatTime(rental.date_end)}</span>
              </div>
              <div className="period-item total-days">
                <span className="period-label">Дней:</span>
                <span className="period-value">{daysCount}</span>
              </div>
            </div>
          </div>

          {/* Техника */}
          <div className="receipt-section">
            <div className="section-title">
              <FaTools />
              <span>Техника</span>
            </div>
            <div className="equipment-list">
              {rental.items && rental.items.length > 0 ? (
                rental.items.map((item, index) => (
                  <div key={item.id} className="equipment-item">
                    <div className="equipment-name">
                      {equipmentMap[item.equipment_id] || `Техника #${item.equipment_id}`}
                    </div>
                    <div className="equipment-details">
                      <span className="equipment-quantity">{item.quantity} шт.</span>
                      <span className="equipment-price">
                        {item.price_per_day?.toLocaleString() || 0} сум/день
                      </span>
                    </div>
                    <div className="equipment-total">
                      {((item.price_per_day || 0) * item.quantity * daysCount).toLocaleString()} сум
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-equipment">Нет техники</div>
              )}
            </div>
          </div>

          {/* Итого */}
          <div className="receipt-total">
            <div className="total-line">
              <span>Итого к оплате:</span>
              <span className="total-amount">
                <FaMoneyBillWave />
                {rental.total_amount?.toLocaleString() || 0} сум
              </span>
            </div>
          </div>

          {/* Комментарий */}
          {rental.comment && (
            <div className="receipt-comment">
              <div className="comment-label">Комментарий:</div>
              <div className="comment-text">{rental.comment}</div>
            </div>
          )}

          {/* Админ */}
          <div className="receipt-admin">
            <span>Администратор: {rental.admin_full_name || 'Админ'}</span>
          </div>

          {/* Подпись */}
          <div className="receipt-footer">
            <div className="receipt-line"></div>
            <p>Спасибо за выбор Upgrade Agency!</p>
            <div className="print-btn" onClick={() => window.print()}>
              <FaPrint />
              Печать
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalDetailPage; 