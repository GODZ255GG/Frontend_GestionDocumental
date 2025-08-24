const API_BASE_URL = 'http://localhost:3000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (body) {
    if (body instanceof FormData) {
      config.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la solicitud');
  }
  
  return response.json();
}

// Funciones específicas para procedimientos
export const ProcedimientoAPI = {
  obtenerTodos: (token) => fetchAPI('/procedimientos', 'GET', null, token),
  crear: (procedimiento, token) => fetchAPI('/procedimientos', 'POST', procedimiento, token),
  obtenerPorId: (id, token) => fetchAPI(`/procedimientos/${id}`, 'GET', null, token),
  // Nueva para agregar doc a procedure
  agregarDocumento: (id, documentId, token) => fetchAPI(`/procedimientos/${id}/documents`, 'POST', { documentId }, token),
  // Más funciones...
};

// Funciones para documentos
export const DocumentoAPI = {
  crear: (name, description, token) => fetchAPI('/documents', 'POST', { name, description }, token),
  subirVersion: (documentId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchAPI(`/documents/${documentId}/versions`, 'POST', formData, token);
  },
};

// Funciones de autenticación
export const AuthAPI = {
  login: (credenciales) => fetchAPI('/auth/login', 'POST', credenciales),
};