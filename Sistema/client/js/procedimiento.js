document.addEventListener('DOMContentLoaded', () => {
  const uploadButton = document.querySelector('#uploadButton');
  const modal = document.querySelector('#uploadModal');
  const closeModal = document.querySelector('#closeModal');
  const cancelButton = document.querySelector('#cancelButton');
  const submitButton = document.querySelector('#submitButton');
  const nameInput = document.querySelector('#nameInput');
  const descriptionInput = document.querySelector('#descriptionInput');
  const fileInput = document.querySelector('#fileInput');
  const dropZone = document.querySelector('#dropZone');
  const successModal = document.querySelector('#successModal');
  const closeSuccess = document.querySelector('#closeSuccess');

  const urlParams = new URLSearchParams(window.location.search);
  const procedureId = urlParams.get('id');
  const token = localStorage.getItem('token');

  if (!procedureId || !token) {
    alert('Procedure ID o token no encontrado. Revisa login o URL.');
    return;
  }

  // Abrir modal
  uploadButton.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  // Cerrar modal
  closeModal.addEventListener('click', () => modal.style.display = 'none');
  cancelButton.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    fileInput.files = e.dataTransfer.files;
    updateFileLabel();
  });

  // File select
  fileInput.addEventListener('change', updateFileLabel);

  function updateFileLabel() {
    const label = document.querySelector('#fileLabel');
    label.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Selecciona el Archivo';
  }

  // Submit upload
  submitButton.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim() || '';
    const file = fileInput.files[0];

    if (!name || !file) {
      alert('Nombre y archivo son requeridos.');
      return;
    }

    // Validar tipos y tamaño
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/bmp', 'image/webp'];
    const extOk = /\.(pdf|docx?|jpe?g|png|bmp|webp)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !extOk) {
      alert('Solo Word, PDF e imágenes.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Archivo excede 10MB.');
      return;
    }

    try {
      const { documentId } = await DocumentoAPI.crear(name, description, token);
      await DocumentoAPI.subirVersion(documentId, file, token);
      await ProcedimientoAPI.agregarDocumento(procedureId, documentId, token);
      modal.style.display = 'none';
      successModal.style.display = 'block';
      loadArchivos();
    } catch (error) {
      alert(`Error al subir: ${error.message}`);
    }
  });

  // Cerrar success modal
  closeSuccess.addEventListener('click', () => successModal.style.display = 'none');

  // Función para cargar y renderizar tarjetas dinámicas
  async function loadArchivos() {
    try {
      const docs = await ProcedimientoAPI.getDocumentsByProcedure(procedureId, token);
      const list = document.querySelector('#archivosList');
      list.innerHTML = '';
      docs.forEach(doc => {
        const latestVersion = doc.VersionNumber || 1;
        const item = document.createElement('div');
        item.className = 'document-card relative border rounded-lg p-4 hover:shadow-md transition-all duration-300';
        item.innerHTML = `
          <div class="flex items-start">
            <div class="bg-blue-100 p-3 rounded-lg mr-3">
              <i class="fas fa-file-word text-blue-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <div class="font-medium">${doc.Name}</div>
              <div class="text-sm text-gray-500">v${latestVersion} - ${new Date(doc.UpdatedAt).toLocaleDateString()}</div>
              <div class="mt-2 flex space-x-2">
                <button onclick="verDocumento(${doc.DocumentID}, ${latestVersion})" class="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                  <i class="fas fa-eye mr-1"></i> Ver
                </button>
                <button onclick="descargarDocumento(${doc.DocumentID}, ${latestVersion}, '${doc.Name}')" class="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                  <i class="fas fa-download mr-1"></i> Descargar
                </button>
              </div>
            </div>
          </div>
        `;
        list.appendChild(item);
      });
    } catch (error) {
      console.error('Error cargando archivos:', error);
    }
  }

  // Función para ver (open blob)
  window.verDocumento = async (documentId, versionNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/versions/${documentId}-${versionNumber}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al obtener documento');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert('Error al ver: ' + error.message);
    }
  };

  // Función para descargar
  window.descargarDocumento = async (documentId, versionNumber, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/versions/${documentId}-${versionNumber}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al obtener documento');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `V${versionNumber}_${name}.docx`;  // Ajusta ext
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar: ' + error.message);
    }
  };

  // Carga inicial
  loadArchivos();
});