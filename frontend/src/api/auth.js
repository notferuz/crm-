import { apiRequest } from './api';

export async function fetchMe() {
  const token = localStorage.getItem('token');
  console.log('fetchMe token:', token);
  if (!token) return null;
  
  try {
    return await apiRequest('/auth/me', 'GET');
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateProfile(userId, userData) {
  return apiRequest(`/users/${userId}`, 'PATCH', userData);
}

export async function fetchTeam() {
  return apiRequest('/users/store-employees', 'GET');
} 