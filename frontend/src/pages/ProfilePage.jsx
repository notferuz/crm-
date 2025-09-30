import React, { useState, useEffect } from 'react';
import { FaEdit, FaCheck, FaPlus } from 'react-icons/fa';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useUser } from '../context/UserContext';
import { updateProfile, fetchTeam } from '../api/auth';
import { createUser, deleteUser } from '../api/users';
import './ProfilePage.css';

function getUserInitials(fullName) {
  if (!fullName) return '';
  const names = fullName.split(' ');
  return names[0].charAt(0) + (names[1]?.charAt(0) || '');
}

const defaultPermissions = {
  dashboard: true,
  equipment: false,
  clients: false,
  rentals: false,
  history: false,
  accept: false,
  profile: false,
};

function CreateEmployeeModal({ open, onClose, onCreated, storeId }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff',
    permissions: { ...defaultPermissions }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('perm_')) {
      setForm(f => ({ ...f, permissions: { ...f.permissions, [name.replace('perm_', '')]: checked } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createUser({
        ...form,
        store_id: storeId,
        permissions: form.permissions
      });
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка создания сотрудника');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить сотрудника</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Пароль *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>ФИО *</label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Права доступа:</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label><input type="checkbox" name="perm_dashboard" checked={form.permissions.dashboard} onChange={handleChange} /> Дэшборд</label>
              <label><input type="checkbox" name="perm_equipment" checked={form.permissions.equipment} onChange={handleChange} /> Техника</label>
              <label><input type="checkbox" name="perm_clients" checked={form.permissions.clients} onChange={handleChange} /> Клиенты</label>
              <label><input type="checkbox" name="perm_rentals" checked={form.permissions.rentals} onChange={handleChange} /> Аренда</label>
              <label><input type="checkbox" name="perm_history" checked={!!form.permissions.history} onChange={handleChange} /> История</label>
              <label><input type="checkbox" name="perm_accept" checked={!!form.permissions.accept} onChange={handleChange} /> Принять</label>
              <label><input type="checkbox" name="perm_profile" checked={!!form.permissions.profile} onChange={handleChange} /> Профиль</label>
            </div>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>Создать</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getLevelTagClass(level) {
  switch (level.toLowerCase()) {
    case 'admin':
    case 'superadmin':
      return 'level-tag admin';
    case 'middle':
    case 'staff':
      return 'level-tag middle';
    default:
      return 'level-tag default';
  }
}

function EmployeeProfileModal({ open, onClose, member }) {
  if (!open || !member) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modern-modal modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, minWidth: 320 }}>
        <div className="modal-header">
          <h2>Профиль сотрудника</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
          <div className="member-avatar" style={{ width: 64, height: 64, borderRadius: '50%', background: '#eaf2ff', color: '#397DFF', fontWeight: 700, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            {getUserInitials(member?.full_name)}
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 700 }}>{member?.full_name || 'Без имени'}</h3>
          <div style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>{member?.email || ''}</div>
          <span className={getLevelTagClass(member?.role || '')} style={{ marginBottom: 8, fontSize: 14, padding: '2px 12px', borderRadius: 8, background: '#f7f8fa', color: '#397DFF', fontWeight: 500 }}>
            {member?.role || ''}
          </span>
          <div style={{ margin: '10px 0', fontSize: 15 }}>
            <b>Статус:</b> {member?.is_active ? <span style={{ color: '#27ae60' }}>Активен</span> : <span style={{ color: '#ff3b30' }}>Неактивен</span>}
          </div>
          {member?.permissions && (
            <div className="member-permissions" style={{ marginTop: 8, fontSize: 14, color: '#555', width: '100%' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Права:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {Object.entries(member.permissions).map(([key, val]) => (
                  <span key={key} style={{
                    // display: 'inline-block',
                    background: val ? '#eaf9f0' : '#f5f5f5',
                    color: val ? '#27ae60' : '#aaa',
                    borderRadius: 8,
                    padding: '2px 12px',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 2,
                    border: val ? '1px solid #27ae60' : '1px solid #eee',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    {val
                      ? <FaCheckCircle style={{ color: '#27ae60', marginRight: 4, fontSize: 16, verticalAlign: 'middle' }} />
                      : <FaTimesCircle style={{ color: '#ff3b30', marginRight: 4, fontSize: 16, verticalAlign: 'middle' }} />
                    }
                    {key === 'dashboard' ? 'Дэшборд' : key === 'equipment' ? 'Техника' : key === 'clients' ? 'Клиенты' : key === 'rentals' ? 'Аренда' : key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ProfilePage = () => {
  const { user, setUser } = useUser();
  // State to hold data being edited
  const [editedUser, setEditedUser] = useState({});
  // State to control edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State for active tab
  const [activeTab, setActiveTab] = useState('team');
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  // State for save status
  const [saveStatus, setSaveStatus] = useState('');
  // State for team members
  const [teamMembers, setTeamMembers] = useState([]);
  // State for team loading
  const [teamLoading, setTeamLoading] = useState(false);
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Effect to sync editedUser with user when user changes
  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
    }
  }, [user]);

  // Effect to load team members when team tab is active
  useEffect(() => {
    if (activeTab === 'team' && teamMembers.length === 0) {
      loadTeamMembers();
    }
  }, [activeTab]);

  const loadTeamMembers = async () => {
    setTeamLoading(true);
    try {
      const team = await fetchTeam();
      setTeamMembers(team);
    } catch (error) {
      console.error('Error loading team:', error);
      // Fallback to empty array if API fails
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  const handleToggleEditSave = async () => {
    if (isEditing) {
      // Save action
      setIsLoading(true);
      setSaveStatus('Сохранение...');

      try {
        const updatedUser = await updateProfile(user.id, {
          full_name: editedUser.full_name,
          email: editedUser.email,
        });

        setUser(updatedUser);
        setIsEditing(false);
        setSaveStatus('Сохранено!');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (error) {
        console.error('Error updating profile:', error);
        setSaveStatus(`Ошибка: ${error.message || 'Не удалось сохранить'}`);
        setTimeout(() => setSaveStatus(''), 3000);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Enter edit mode
      setIsEditing(true);
      setSaveStatus('');
    }
  };

  // Handler for input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Удалить этого сотрудника?')) return;
    try {
      await deleteUser(memberId);
      await loadTeamMembers();
    } catch (e) {
      alert('Ошибка удаления сотрудника');
    }
  };

  return (
    <div className="profile-container">
      {/* Main Profile Content Area */}
      <div className="profile-content">
        {/* Profile Header Section */}
        <div className="profile-header">
          <div className="avatar-container">
            {/* User Avatar Placeholder */}
            <div className="user-avatar">
              {getUserInitials(user.full_name)}
            </div>
          </div>
          <div className="user-info">
            <div className="name-edit-container">
              <h1 className="user-name">{user.full_name || 'Без имени'}</h1>
              {/* Edit/Save Button positioned beside the name */}
              <button
                onClick={handleToggleEditSave}
                className="edit-save-btn"
                disabled={isLoading}
                title={isEditing ? "Сохранить изменения" : "Редактировать профиль"}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div> {saveStatus}
                  </>
                ) : isEditing ? (
                  <>
                    <FaCheck size={16} /> Сохранить
                  </>
                ) : (
                  <>
                    <FaEdit size={16} /> Редактировать
                  </>
                )}
              </button>
            </div>
            <div className="user-role">{user.role}</div>
            {saveStatus && (
              <div className={`save-status ${saveStatus.includes('Ошибка') ? 'error' : 'success'}`}>
                {saveStatus}
              </div>
            )}

            <div className="info-section">
              <h4 className="info-title">Информация</h4>
              <div className="info-field">
                <div className="field-label">ФИО</div>
                <input
                  type="text"
                  name="full_name"
                  value={isEditing ? editedUser.full_name || '' : user.full_name || ''}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`info-input ${isEditing ? 'editing' : ''}`}
                />
              </div>
              <div className="info-field">
                <div className="field-label">Email</div>
                <input
                  type="email"
                  name="email"
                  value={isEditing ? editedUser.email || '' : user.email || ''}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`info-input ${isEditing ? 'editing' : ''}`}
                />
              </div>
              <div className="info-field">
                <div className="field-label">Роль</div>
                <input
                  type="text"
                  value={user.role || ''}
                  readOnly
                  className="info-input"
                  style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                />
              </div>
              <div className="info-field">
                <div className="field-label">Статус</div>
                <input
                  type="text"
                  value={user.is_active ? 'Активен' : 'Неактивен'}
                  readOnly
                  className="info-input"
                  style={{
                    backgroundColor: user.is_active ? '#e8f9ef' : '#ffeaea',
                    color: user.is_active ? '#4CAF50' : '#ff3b30'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Add User Button */}
        <div className="tabs-container">
          <div className="tabs-wrapper">
            <button
              onClick={() => setActiveTab('team')}
              className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            >
              Команда
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            >
              История
            </button>
          </div>
          {(user.role === 'store_admin' || user.role === 'superadmin') && (
            <button className="add-user-btn" title="Добавить нового пользователя" onClick={() => setShowCreateEmployee(true)}>
              <FaPlus size={14} style={{ marginRight: '8px' }} /> Пользователь
            </button>
          )}
        </div>
        <CreateEmployeeModal open={showCreateEmployee} onClose={() => setShowCreateEmployee(false)} onCreated={loadTeamMembers} storeId={user.store_id} />

        {/* Content based on active tab */}
        <div className="content-area">
          {activeTab === 'team' && (
            <div>
              {(() => {
                const teamList = teamMembers.filter(m => m.store_id === user.store_id && (m.role === 'staff' || m.role === 'viewer' || m.role === 'store_admin'));
                return <h3 className="section-title">Члены команды ({teamList.length})</h3>;
              })()}
              {teamLoading ? (
                <div className="loading">Загрузка команды...</div>
              ) : teamMembers.length > 0 ? (
                <div className="team-grid">
                  {teamMembers
                    .filter(member => member.store_id === user.store_id && (member.role === 'staff' || member.role === 'viewer' || member.role === 'store_admin'))
                    .map((member) => (
                      <div key={member.id} className="team-member-card" style={{
                        borderRadius: '16px',
                        boxShadow: '0 2px 12px rgba(57,125,255,0.07)',
                        background: '#fff',
                        padding: '20px 18px',
                        margin: '12px',
                        minWidth: 220,
                        maxWidth: 260,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        border: '1px solid #f0f4fa'
                      }}
                        onClick={e => {
                          // Не открывать модалку при клике на крестик удаления
                          if (e.target.closest('button')) return;
                          setSelectedMember(member);
                        }}
                      >
                        <div className="member-avatar" style={{ width: 56, height: 56, borderRadius: '50%', background: '#eaf2ff', color: '#397DFF', fontWeight: 700, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                          {getUserInitials(member.full_name)}
                        </div>
                        <h5 className="member-name" style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>{member.full_name || 'Без имени'}</h5>
                        <div className="member-role" style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>{member.role}</div>
                        <span className={getLevelTagClass(member.role)} style={{ marginBottom: 8, fontSize: 13, padding: '2px 10px', borderRadius: 8, background: '#f7f8fa', color: '#397DFF', fontWeight: 500 }}>
                          {member.role}
                        </span>
                        {/* Права доступа */}
                        {member.permissions && (
                          <div className="member-permissions" style={{ marginTop: 8, fontSize: 13, color: '#555', width: '100%' }}>
                            <div style={{ fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Права:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                              {Object.entries(member.permissions).map(([key, val]) => (
                                <span key={key} style={{
                                  // display: 'inline-block',
                                  background: val ? '#eaf9f0' : '#f5f5f5',
                                  color: val ? '#27ae60' : '#aaa',
                                  borderRadius: 8,
                                  padding: '2px 10px',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  marginBottom: 2,
                                  border: val ? '1px solid #27ae60' : '1px solid #eee',
                                  display: 'flex', alignItems: 'center', gap: 4
                                }}>
                                  {val ? '✔️' : '❌'} {key === 'dashboard' ? 'Дэшборд' : key === 'equipment' ? 'Техника' : key === 'clients' ? 'Клиенты' : key === 'rentals' ? 'Аренда' : key}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: 'rgba(255,59,48,0.13)',
                            border: 'none',
                            color: '#ff3b30',
                            cursor: 'pointer',
                            fontSize: 28,
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                            boxShadow: '0 2px 8px rgba(255,59,48,0.07)'
                          }}
                          title="Удалить сотрудника"
                          onClick={() => handleDeleteMember(member.id)}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,59,48,0.22)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,59,48,0.13)'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="loading">Нет данных о команде</div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ color: '#555' }}>
              <h3 className="section-title">История активности</h3>
              <ul className="history-list">
                <li className="history-item role-change">
                  <strong className="history-title">Изменение роли:</strong> Роль изменена с 'Сотрудник' на 'Админ' - <span className="history-time">10.06.2024, 14:30</span>
                </li>
                <li className="history-item login">
                  <strong className="history-title">Вход в систему:</strong> Успешный вход - <span className="history-time">09.06.2024, 09:15</span>
                </li>
                <li className="history-item profile-update">
                  <strong className="history-title">Обновление профиля:</strong> Обновлен email - <span className="history-time">08.06.2024, 18:00</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <EmployeeProfileModal open={!!selectedMember} onClose={() => setSelectedMember(null)} member={selectedMember} />
    </div>
  );
};

export default ProfilePage;