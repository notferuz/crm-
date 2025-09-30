import { apiRequest } from './api';

// Получить всех пользователей
export const fetchUsers = async () => {
  return apiRequest('/users/', 'GET');
};

// Получить сотрудников магазина
export const getStoreEmployees = async () => {
  return apiRequest('/users/store-employees', 'GET');
};

// Создать сотрудника магазина
export const createStoreEmployee = async (userData) => {
  return apiRequest('/users/store-employee', 'POST', userData);
};

// Создать пользователя (только для superadmin)
export const createUser = async (userData) => {
  // Если создаём сотрудника магазина (staff/viewer), используем специальный endpoint
  if (userData.role === 'staff' || userData.role === 'viewer' || !userData.role) {
    return apiRequest('/users/store-employee', 'POST', userData);
  }
  // Для superadmin и других ролей — общий endpoint
  return apiRequest('/users/', 'POST', userData);
};

// Получить пользователя по ID
export const fetchUser = async (userId) => {
  return apiRequest(`/users/${userId}`, 'GET');
};

// Обновить пользователя
export const updateUser = async (userId, userData) => {
  return apiRequest(`/users/${userId}`, 'PATCH', userData);
};

// Удалить пользователя
export const deleteUser = async (userId) => {
  return apiRequest(`/users/${userId}`, 'DELETE');
}; 