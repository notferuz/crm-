import { apiRequest } from './api';

// Получить список клиентов
export async function fetchClients() {
  return apiRequest('/clients/', 'GET');
}

// Получить информацию о клиенте по id
export async function fetchClientById(id) {
  return apiRequest(`/clients/${id}`, 'GET');
}

// Добавить клиента
export async function addClient(data) {
  return apiRequest('/clients/', 'POST', data);
}

// Обновить клиента
export async function updateClient(id, data) {
  return apiRequest(`/clients/${id}`, 'PUT', data);
}

// Удалить клиента
export async function deleteClient(id) {
  return apiRequest(`/clients/${id}`, 'DELETE');
} 