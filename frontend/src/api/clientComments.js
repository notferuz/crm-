import { apiRequest } from './api';

export const fetchClientComments = async (clientId) => {
  return await apiRequest(`/clients/${clientId}/comments`, 'GET');
};

export const addClientComment = async (clientId, text) => {
  return await apiRequest(`/clients/${clientId}/comments`, 'POST', { text });
};

export const deleteClientComment = async (clientId, commentId) => {
  return await apiRequest(`/clients/${clientId}/comments/${commentId}`, 'DELETE');
}; 