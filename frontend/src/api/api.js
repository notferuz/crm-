const API_BASE_URL = '/api';

// Базовая функция для выполнения API запросов
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('token');
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${fullUrl}`, { method, headers: config.headers });

  const response = await fetch(fullUrl, config);

  console.log(`Response status: ${response.status} for ${fullUrl}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error for ${fullUrl}:`, errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    } catch (e) {
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }
  }

  // Для DELETE запросов может не быть тела ответа
  if (method === 'DELETE') {
    return { success: true };
  }

  const responseText = await response.text();
  console.log(`Response body for ${fullUrl}:`, responseText);
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error(`Failed to parse JSON for ${fullUrl}:`, responseText);
    throw new Error('Invalid JSON response from server');
  }
};

// Функция для загрузки файлов
export const uploadFile = async (endpoint, file, onProgress = null) => {
  const token = localStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (onProgress && event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload response:', response);
          resolve(response);
        } catch (error) {
          console.error('Failed to parse upload response:', error);
          console.log('Raw response:', xhr.responseText);
          reject(new Error('Неверный ответ от сервера'));
        }
      } else {
        console.error('Upload failed with status:', xhr.status);
        console.log('Response text:', xhr.responseText);
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', `${API_BASE_URL}${endpoint}`);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.send(formData);
  });
}; 