const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('billpro_token');
  const headers = {
    ...options.headers
  };

  if (!(options.body instanceof FormData) && options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    let response;
    try {
      response = await fetch(`${BASE_URL}${endpoint}`, config);
    } catch (networkError) {
      throw new Error('Cannot connect to BillPro backend server. Please verify the backend is running on port 5050.');
    }

    // Safely inspect response text to prevent "Unexpected end of JSON input"
    const rawText = await response.text();
    let data = null;

    if (rawText && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`Server returned error ${response.status} (${response.statusText || 'Service Unavailable'}).`);
        }
        throw new Error('Invalid response received from server.');
      }
    } else {
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status} (${response.statusText || 'No response'}). Backend may be restarting.`);
      }
      data = { success: true };
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('billpro_token');
        localStorage.removeItem('billpro_user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data?.message || `Request failed with status ${response.status}.`);
    }

    return data;
  } catch (error) {
    if (error.message && (error.message.includes('Unexpected end of JSON') || error.message.includes('JSON.parse'))) {
      throw new Error('Backend server is not responding. Please ensure the backend is running on port 5050.');
    }
    throw error;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  uploadImage: (formData, onProgress) => {
    const token = localStorage.getItem('billpro_token');
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/images/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.success) {
            resolve(res);
          } else {
            reject(new Error(res.message || 'Image upload failed.'));
          }
        } catch (e) {
          reject(new Error('Invalid server response during upload.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during image upload.'));
      xhr.send(formData);
    });
  }
};
