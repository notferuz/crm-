const API_BASE = '/api'

export async function apiRequest(path, method = 'GET', data) {
  const config = { method, headers: {} }
  if (data) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(data)
  }
  const res = await fetch(`${API_BASE}${path}`, config)
  if (!res.ok) {
    const text = await res.text()
    try { throw new Error(JSON.parse(text).detail) } catch {
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
  }
  return res.json()
}

export const fetchStoreBySlug = (slug) => apiRequest(`/stores/public/by-slug/${slug}`)
export const fetchCategories = (slug) => apiRequest(`/categories/public?store_slug=${slug}`)
export const fetchEquipment = (slug) => apiRequest(`/equipment/public?store_slug=${slug}`)
export const createOrder = (payload) => apiRequest('/orders/', 'POST', payload)


