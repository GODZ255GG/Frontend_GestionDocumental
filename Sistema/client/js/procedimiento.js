document.addEventListener('DOMContentLoaded', () => {
  const uploadButton = document.querySelector('#uploadButton'); // Botón "Subir Archivo" en sección Archivos
  const modal = document.querySelector('#uploadModal');
  const closeModal = document.querySelector('#closeModal');
  const cancelButton = document.querySelector('#cancelButton');
  const submitButton = document.querySelector('#submitButton');
  const nameInput = document.querySelector('#nameInput');
  const fileInput = document.querySelector('#fileInput');
  const dropZone = document.querySelector('#dropZone');
  const successModal = document.querySelector('#successModal');
  const closeSuccess = document.querySelector('#closeSuccess');

  // Asume procedureId de URL params (ej. Procedimiento.html?id=1)
  const urlParams = new URLSearchParams(window.location.search);
  const procedureId = urlParams.get('id');
  const token = localStorage.getItem('token'); // De login

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
    const file = fileInput.files[0];

    if (!name || !file) {
      alert('Nombre y archivo son requeridos.');
      return;
    }

    // Validar tipos y tamaño (según tu HTML: PDF, DOCX, etc., up to 10MB)
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Archivo excede 10MB.');
      return;
    }

    try {
      // Paso 1: Crear documento
      const { documentId } = await DocumentoAPI.crear(name, '', token); // Description vacío por ahora

      // Paso 2: Subir versión 1 con file
      await DocumentoAPI.subirVersion(documentId, file, token);

      // Paso 3: Asociar a procedure
      await ProcedimientoAPI.agregarDocumento(procedureId, documentId, token);

      modal.style.display = 'none';
      successModal.style.display = 'block'; // Muestra modal éxito
      loadArchivos(); // Recarga lista de archivos (implementa abajo)
    } catch (error) {
      alert(`Error al subir: ${error.message}`);
    }
  });

  // Cerrar success modal
  closeSuccess.addEventListener('click', () => successModal.style.display = 'none');

  // Función placeholder para recargar lista de archivos (agrega endpoint getDocumentsByProcedure en api.js si falta)
  async function loadArchivos() {
    try {
      const docs = await fetchAPI(`/procedimientos/${procedureId}/documents`, 'GET', null, token);
      const list = document.querySelector('#archivosList');
      list.innerHTML = ''; // Limpia
      docs.forEach(doc => {
        const item = document.createElement('div');
        item.innerHTML = `
          <div class="archivo-item">
            <h4>${doc.Name}</h4>
            <p>v${doc.VersionNumber || 1} - ${doc.UpdatedAt}</p>
            <button>Ver</button>
            <button>Descargar</button>
          </div>
        `;
        list.appendChild(item);
      });
    } catch (error) {
      console.error('Error cargando archivos:', error);
    }
  }

  // Carga inicial de archivos al load page
  loadArchivos();
});