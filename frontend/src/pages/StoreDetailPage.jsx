import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StoreDetailPage.css';
import { 
  FaStore, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope,
  FaUsers,
  FaChartBar,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaUserPlus,
  FaEquipment,
  FaRental,
  FaCalendar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaUser,
  FaIdCard,
  FaBuilding,
  FaShieldAlt
} from 'react-icons/fa';
import { fetchStore } from '../api/stores';
import { createStoreEmployee, getStoreEmployees } from '../api/users';
import { useUser } from '../context/UserContext';
import { fetchRentals } from '../api/rental';

function AddEmployeeModal({ open, onClose, onSuccess, storeId }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    birth_date: '',
    passport_number: '',
    organization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        birth_date: '',
        passport_number: '',
        organization: ''
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createStoreEmployee(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <FaUserPlus className="modal-icon" />
            Добавить сотрудника
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle />
              {error}
            </div>
          )}
          
          <form className="modern-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope className="label-icon" />
                  Email
                </label>
                <input 
                  className="form-input" 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaShieldAlt className="label-icon" />
                  Пароль
                </label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Минимум 6 символов" 
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaUser className="label-icon" />
                  Полное имя
                </label>
                <input 
                  className="form-input" 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Иван Иванов" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaPhone className="label-icon" />
                  Телефон
                </label>
                <input 
                  className="form-input" 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+998 XX XXX XX XX" 
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaCalendar className="label-icon" />
                  Дата рождения
                </label>
                <input 
                  className="form-input" 
                  type="date" 
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FaIdCard className="label-icon" />
                  Номер паспорта
                </label>
                <input 
                  className="form-input" 
                  type="text" 
                  name="passport_number"
                  value={formData.passport_number}
                  onChange={handleInputChange}
                  placeholder="AA1234567" 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <FaBuilding className="label-icon" />
                Организация
              </label>
              <input 
                className="form-input" 
                type="text" 
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                placeholder="Название организации" 
              />
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn-primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <FaCheckCircle />
                    Добавить сотрудника
                  </>
                )}
              </button>
              <button 
                className="btn btn-secondary" 
                type="button" 
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [store, setStore] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [rentals, setRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsError, setRentalsError] = useState('');

  useEffect(() => {
    loadData();
    loadRentals();
  }, [storeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storeData, employeesData] = await Promise.all([
        fetchStore(storeId),
        getStoreEmployees()
      ]);
      setStore(storeData);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Error loading store details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRentals = async () => {
    setRentalsLoading(true);
    setRentalsError('');
    try {
      const allRentals = await fetchRentals(0, 1000);
      // фильтруем по storeId
      setRentals(allRentals.filter(r => String(r.store_id) === String(storeId)));
    } catch (e) {
      setRentalsError(e.message || 'Ошибка загрузки истории аренд');
    } finally {
      setRentalsLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadData();
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'store_admin': 'Администратор магазина',
      'staff': 'Сотрудник',
      'viewer': 'Наблюдатель'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'store_admin': 'admin',
      'staff': 'staff',
      'viewer': 'viewer'
    };
    return roleColors[role] || 'default';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p>Загрузка информации о магазине...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/stores')}>
            <FaArrowLeft />
            Вернуться к магазинам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/stores')}>
            <FaArrowLeft />
            Назад к магазинам
          </button>
          
          <div className="store-title">
            <FaStore className="store-icon" />
            <h1>{store.name}</h1>
          </div>
          
          <div className="store-status">
            <span className={`status-badge ${store.is_active ? 'active' : 'inactive'}`}>
              {store.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="store-info-grid">
          <div className="info-card">
            <div className="info-card-header">
              <FaMapMarkerAlt className="info-icon" />
              <h3>Адрес</h3>
            </div>
            <p>{store.address || 'Адрес не указан'}</p>
          </div>
          
          <div className="info-card">
            <div className="info-card-header">
              <FaPhone className="info-icon" />
              <h3>Телефон</h3>
            </div>
            <p>{store.phone || 'Телефон не указан'}</p>
          </div>
          
          <div className="info-card">
            <div className="info-card-header">
              <FaEnvelope className="info-icon" />
              <h3>Email</h3>
            </div>
            <p>{store.email || 'Email не указан'}</p>
          </div>
        </div>

        <div className="stats-section">
          <h2 className="section-title">
            <FaChartBar className="section-icon" />
            Статистика магазина
          </h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <FaUsers className="stat-icon" />
              <div className="stat-content">
                <h3>{employees.length}</h3>
                <p>Сотрудников</p>
              </div>
            </div>
            
            <div className="stat-card">
              <FaEquipment className="stat-icon" />
              <div className="stat-content">
                <h3>0</h3>
                <p>Единиц техники</p>
              </div>
            </div>
            
            <div className="stat-card">
              <FaRental className="stat-icon" />
              <div className="stat-content">
                <h3>0</h3>
                <p>Активных аренд</p>
              </div>
            </div>
          </div>
        </div>

        <div className="employees-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaUsers className="section-icon" />
              Сотрудники магазина
            </h2>
            
            {(user?.role === 'store_admin' || user?.role === 'superadmin') && (
              <button className="btn btn-primary" onClick={handleAddEmployee}>
                <FaUserPlus />
                Добавить сотрудника
              </button>
            )}
          </div>
          
          <div className="employees-grid">
            {employees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <div className="employee-card-header">
                  <div className="employee-avatar">
                    <FaUser />
                  </div>
                  <div className="employee-status">
                    <span className={`status-badge ${employee.is_active ? 'active' : 'inactive'}`}>
                      {employee.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
                
                <div className="employee-card-body">
                  <h3 className="employee-name">{employee.full_name || 'Имя не указано'}</h3>
                  <p className="employee-role">
                    <span className={`role-badge ${getRoleColor(employee.role)}`}>
                      {getRoleLabel(employee.role)}
                    </span>
                  </p>
                  
                  <div className="employee-info">
                    <div className="info-item">
                      <FaEnvelope className="info-icon" />
                      <span>{employee.email}</span>
                    </div>
                    
                    {employee.phone && (
                      <div className="info-item">
                        <FaPhone className="info-icon" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    
                    {employee.birth_date && (
                      <div className="info-item">
                        <FaCalendar className="info-icon" />
                        <span>{new Date(employee.birth_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="employee-card-actions">
                  <button className="action-btn edit-btn">
                    <FaEdit />
                    Редактировать
                  </button>
                  
                  <button className="action-btn delete-btn">
                    <FaTrash />
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          {employees.length === 0 && (
            <div className="empty-state">
              <FaUsers className="empty-icon" />
              <h3>Сотрудники не найдены</h3>
              <p>Добавьте первого сотрудника в ваш магазин</p>
            </div>
          )}
        </div>

        {/* История аренд по магазину */}
        <div className="store-rentals-section">
          <h2>История аренд магазина</h2>
          {rentalsLoading ? (
            <div style={{padding:20}}>Загрузка...</div>
          ) : rentalsError ? (
            <div style={{color:'red',padding:20}}>{rentalsError}</div>
          ) : rentals.length === 0 ? (
            <div style={{padding:20, color:'#666'}}>Нет аренд для этого магазина</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Дата начала</th>
                  <th>Дата окончания</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Админ</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map(r => (
                  <tr key={r.id}>
                    <td>{r.client_full_name || r.client_email || r.client_phone || 'Клиент'}</td>
                    <td>{r.date_start ? new Date(r.date_start).toLocaleDateString('ru-RU') : ''}</td>
                    <td>{r.date_end ? new Date(r.date_end).toLocaleDateString('ru-RU') : ''}</td>
                    <td>{r.total_amount?.toLocaleString() || 0} сум</td>
                    <td>{r.status}</td>
                    <td>{r.admin_full_name || 'Админ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddEmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        storeId={storeId}
      />
    </div>
  );
};

export default StoreDetailPage; 