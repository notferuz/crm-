import { apiRequest } from './api';

// Получить список техники
export async function fetchEquipment() {
  return apiRequest('/equipment/', 'GET');
}

// Получить конкретную технику
export const fetchEquipmentItem = async (equipmentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/equipment/${equipmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching equipment item:', error);
    throw error;
  }
};

// Создать новую технику
export async function createEquipment(data) {
  return apiRequest('/equipment/', 'POST', data);
}

// Обновить технику
export async function updateEquipment(id, data) {
  return apiRequest(`/equipment/${id}`, 'PUT', data);
}

// Удалить технику
export async function deleteEquipment(id) {
  return apiRequest(`/equipment/${id}`, 'DELETE');
}

// Получить список категорий
export async function fetchCategories() {
  return apiRequest('/categories/', 'GET');
}

// Создать новую категорию
export async function createCategory(data) {
  return apiRequest('/categories/', 'POST', data);
} 