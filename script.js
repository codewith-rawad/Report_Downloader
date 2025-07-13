// Global variables
let isProcessing = false;

// Utility functions
function showError(message) {
  const modal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  modal.style.display = 'block';
}

function hideError() {
  const modal = document.getElementById('errorModal');
  modal.style.display = 'none';
}

function showSuccess() {
  // Get elements safely
  const h2 = document.querySelector("h2");
  const loader = document.querySelector(".loader");
  const message = document.querySelector(".message");
  const success = document.querySelector(".success");
  
  // Hide elements only if they exist
  if (h2) h2.style.display = "none";
  if (loader) loader.style.display = "none";
  if (message) message.style.display = "none";
  
  // Show success message only if it exists
  if (success) success.style.display = "block";
}

function validateParameters(params) {
  const required = ['name', 'doctor', 'date', 'report'];
  const missing = required.filter(param => !params[param]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required data: ${missing.join(', ')}`);
  }
  
  return true;
}

async function loadTemplate() {
  try {
    const response = await fetch("template.docx");
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    throw new Error(`Error loading report template: ${error.message}`);
  }
}

function createDocument(content) {
  try {
    const zip = new PizZip(content);
    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });
    return doc;
  } catch (error) {
    throw new Error(`Error creating document: ${error.message}`);
  }
}

function renderDocument(doc, data) {
  try {
    doc.render(data);
    return doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch (error) {
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map((e) => e.properties.explanation)
        .join("\n");
      throw new Error(`Template errors:\n${errorMessages}`);
    } else {
      throw new Error(`Error processing document: ${error.message}`);
    }
  }
}

function downloadDocument(blob, filename) {
  try {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    throw new Error(`Error downloading file: ${error.message}`);
  }
}

// Main function
async function generateReport() {
  if (isProcessing) {
    return;
  }
  
  isProcessing = true;
  
  try {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const patientData = {
      name: urlParams.get("name"),
      doctor: urlParams.get("doctor"),
      date: urlParams.get("date"),
      age: urlParams.get("age"),
      report: urlParams.get("report")
    };

    // Validate parameters
    validateParameters(patientData);

    // Load template
    const content = await loadTemplate();

    // Create document
    const doc = createDocument(content);

    // Render document with data
    const blob = renderDocument(doc, patientData);

    // Download document
    const filename = `${patientData.name}_medical_report.docx`;
    downloadDocument(blob, filename);

    // Show success message
    setTimeout(() => {
      showSuccess();
    }, 1000);

  } catch (error) {
    console.error("Error details:", error);
    showError(error.message);
  } finally {
    isProcessing = false;
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Close modal when clicking on X
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = hideError;
  }

  // Close modal when clicking outside
  window.onclick = (event) => {
    const modal = document.getElementById('errorModal');
    if (event.target === modal) {
      hideError();
    }
  };

  // Start generating report when page loads
  generateReport();
});

// Handle window load event as fallback
window.onload = generateReport;
