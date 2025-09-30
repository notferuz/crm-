import { apiRequest } from './api';

export async function fetchSupportMessages(storeId) {
  return apiRequest(`/support/messages/${storeId}`, 'GET');
}

export async function sendSupportMessage(messageData) {
  return apiRequest('/support/messages/', 'POST', messageData);
} 