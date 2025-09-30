import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import UpLogo from '../assets/Up-logo.svg';
import { useUser } from '../context/UserContext';
import { fetchMe } from '../api/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      });
      if (!response.ok) {
        throw new Error('Неверный логин или пароль');
      }
      const data = await response.json();
      if (!data.access_token) {
        throw new Error('Ошибка авторизации: токен не получен');
      }
      localStorage.setItem('token', data.access_token);
      // Сразу обновляем пользователя в контексте
      const me = await fetchMe();
      setUser(me);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-centered">
      <form className="login-form-ui" onSubmit={handleSubmit}>
        <div style={{display:'flex', justifyContent:'center', marginBottom:12}}>
          <img src={UpLogo} alt="Logo" style={{height:48}} />
        </div>
        <h2 className="login-title">Вход в систему</h2>
        <input
          type="email"
          className="login-input"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="login-input"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="login-btn" type="submit">Войти</button>
        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
};

export default LoginPage; 