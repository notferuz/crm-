import { apiRequest } from './api';

export async function fetchDashboardData({ period, date_from, date_to, history_limit } = {}) {
  const qs = new URLSearchParams();
  if (period) qs.set('period', period);
  if (date_from) qs.set('date_from', date_from);
  if (date_to) qs.set('date_to', date_to);
  if (history_limit) qs.set('history_limit', String(history_limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest(`/dashboard/${suffix}`, 'GET');
}

export async function fetchRentalHistory(limit = 10) {
  return apiRequest(`/rentals/?limit=${limit}`, 'GET');
} 