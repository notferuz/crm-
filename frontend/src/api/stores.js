import { apiRequest } from './api';

const API_BASE_URL = 'http://localhost:8000';

// Получить все магазины (только для superadmin)
export const fetchStores = async () => {
  return apiRequest('/stores/', 'GET');
};

// Получить магазин по ID
export const fetchStore = async (storeId) => {
  return apiRequest(`/stores/${storeId}`, 'GET');
};

// Создать новый магазин
export const createStore = async (storeData) => {
  return apiRequest('/stores/', 'POST', storeData);
};

// Обновить магазин
export const updateStore = async (storeId, storeData) => {
  return apiRequest(`/stores/${storeId}`, 'PUT', storeData);
};

// Удалить магазин
export const deleteStore = async (storeId) => {
  return apiRequest(`/stores/${storeId}`, 'DELETE');
};

// Получить статистику магазина
export const fetchStoreStats = async (storeId) => {
  return apiRequest(`/stores/${storeId}/stats`, 'GET');
}; 

// Upload logo helper
export const uploadLogo = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload/image', { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {}, body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}