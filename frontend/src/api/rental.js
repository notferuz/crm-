import { apiRequest } from './api';

// API functions for rental management
export async function fetchRentals(skip = 0, limit = 1000) {
  return apiRequest(`/rentals/?skip=${skip}&limit=${limit}`, 'GET');
}

export async function createRental(rentalData) {
  return apiRequest('/rentals/', 'POST', rentalData);
}

export async function deleteRental(id) {
  return apiRequest(`/rentals/${id}`, 'DELETE');
} 

export async function returnRental(id, payload) {
  return apiRequest(`/rentals/${id}/return`, 'PATCH', payload);
}