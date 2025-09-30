import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrationPage.css';

const roles = [
  { value: 'admin', label: 'Админ' },
  { value: 'staff', label: 'Сотрудник' },
  { value: 'viewer', label: 'Только просмотр' },
];

const RegistrationPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка регистрации');
      }
      setSuccess('Пользователь успешно зарегистрирован!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registration-page-centered">
      <form className="registration-form-ui" onSubmit={handleSubmit}>
        <h2 className="reg-title">Регистрация пользователя</h2>
        <input type="email" className="reg-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" className="reg-input" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
        <input type="text" className="reg-input" placeholder="ФИО" value={fullName} onChange={e => setFullName(e.target.value)} />
        <select className="reg-input" value={role} onChange={e => setRole(e.target.value)}>
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button className="reg-btn" type="submit">Зарегистрировать</button>
        {error && <div className="registration-error">{error}</div>}
        {success && <div className="registration-success">{success}</div>}
      </form>
    </div>
  );
};

export default RegistrationPage; 