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
    // intentar leer JSON seguro, si no, lanzar texto
    let errorBody;
    try { errorBody = await response.json(); }
    catch { 
      const text = await response.text().catch(()=>null);
      throw new Error(text || `HTTP ${response.status}`);
    }
    throw new Error(errorBody.message || JSON.stringify(errorBody) || 'Error en la solicitud');
  }
  
  // intentar parsear JSON, si no viene JSON devolver texto
  try { return await response.json(); }
  catch { return await response.text(); }
}

// Funciones específicas para procedimientos (se exponen en window para scripts clásicos)
window.ProcedimientoAPI = {
  obtenerTodos: (token) => fetchAPI('/procedimientos', 'GET', null, token),
  crear: (procedimiento, token) => fetchAPI('/procedimientos', 'POST', procedimiento, token),
  obtenerPorId: (id, token) => fetchAPI(`/procedimientos/${id}`, 'GET', null, token),

  // agregarDocumento: intenta endpoint en español y en inglés
  agregarDocumento: async (id, documentId, token) => {
    const payload = { documentId };
    // probar /procedimientos primero
    try {
      return await fetchAPI(`/procedimientos/${id}/documents`, 'POST', payload, token);
    } catch (err) {
      // fallback a /procedures
      return await fetchAPI(`/procedures/${id}/documents`, 'POST', payload, token);
    }
  },

  // getDocumentsByProcedure: obtener documentos asociados al procedimiento (fallback múltiple)
  getDocumentsByProcedure: async (id, token) => {
    if (!id) return [];
    try {
      const r = await fetchAPI(`/procedimientos/${id}/documents`, 'GET', null, token);
      // normalizar: si backend devuelve { data: [...] } o [...]
      return r?.data || r || [];
    } catch (err) {
      try {
        const r2 = await fetchAPI(`/procedures/${id}/documents`, 'GET', null, token);
        return r2?.data || r2 || [];
      } catch (err2) {
        // no hay documentos o endpoint no disponible
        return [];
      }
    }
  }
};

// Funciones para documentos
window.DocumentoAPI = {
  crear: (name, description, token) => fetchAPI('/documents', 'POST', { name, description }, token),
  subirVersion: (documentId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchAPI(`/documents/${documentId}/versions`, 'POST', formData, token);
  },
};

// Funciones de autenticación
window.AuthAPI = {
  login: (credenciales) => fetchAPI('/auth/login', 'POST', credenciales),
};