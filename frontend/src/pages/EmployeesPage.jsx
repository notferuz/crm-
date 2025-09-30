import React, { useState, useEffect } from 'react';
import './EmployeesPage.css';
import { 
  FaPlus, 
  FaSearch, 
  FaTimes, 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaUserPlus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaIdCard,
  FaBuilding,
  FaCalendar,
  FaShieldAlt
} from 'react-icons/fa';
import { createStoreEmployee, getStoreEmployees } from '../api/users';
import { useUser } from '../context/UserContext';

function AddEmployeeModal({ open, onClose, onSuccess }) {
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

const EmployeesPage = () => {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const employeesData = await getStoreEmployees();
      setEmployees(employeesData);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadData();
  };

  const filteredEmployees = employees.filter(employee =>
    employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p>Загрузка сотрудников...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <FaUser className="header-icon" />
            <h1>Управление сотрудниками</h1>
          </div>
          <p className="header-subtitle">
            Добавляйте и управляйте сотрудниками вашего магазина
          </p>
        </div>
        
        <button className="btn btn-primary add-btn" onClick={handleAddEmployee}>
          <FaUserPlus />
          Добавить сотрудника
        </button>
      </div>

      <div className="page-content">
        <div className="controls-section">
          <div className="search-container">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Поиск сотрудников..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        <div className="employees-grid">
          {filteredEmployees.map((employee) => (
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
                  
                  {employee.passport_number && (
                    <div className="info-item">
                      <FaIdCard className="info-icon" />
                      <span>{employee.passport_number}</span>
                    </div>
                  )}
                  
                  {employee.organization && (
                    <div className="info-item">
                      <FaBuilding className="info-icon" />
                      <span>{employee.organization}</span>
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

        {filteredEmployees.length === 0 && !loading && (
          <div className="empty-state">
            <FaUser className="empty-icon" />
            <h3>Сотрудники не найдены</h3>
            <p>Попробуйте изменить параметры поиска или добавьте нового сотрудника</p>
          </div>
        )}
      </div>

      <AddEmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default EmployeesPage; 