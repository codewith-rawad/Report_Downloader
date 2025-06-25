window.onload = async () => {
  // Extract data from the URL (e.g., ?patient=Ali&doctor=Dr+Sara&date=2025-06-25&report=Normal+lungs)
  const urlParams = new URLSearchParams(window.location.search);
  const patient_name = urlParams.get("patient");
  const doctor_name = urlParams.get("doctor");
  const date = urlParams.get("date");
  const report = urlParams.get("report");

  // Check if all required parameters are present
  if (!patient_name || !doctor_name || !date || !report) {
    alert("Missing data in URL parameters!");
    return;
  }

  try {
    // Load the Word template file (make sure the name is exactly "template.docx")
    const response = await fetch("template.docx");
    const content = await response.arrayBuffer();

    // Unzip the Word file using PizZip
    const zip = new PizZip(content);

    // Prepare Docxtemplater to use the template
    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Inject the variables into the template - the keys must match the placeholders in the .docx
    doc.render({
      patient_name: patient_name,
      doctor_name: doctor_name,
      report_date: date,
      report_text: report,
    });

    // Generate the final Word document as a Blob
    const out = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Create a download link for the file and click it automatically
    const link = document.createElement("a");
    link.href = URL.createObjectURL(out);
    link.download = `${patient_name}_medical_report.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (error) {
    // Show detailed error messages if there are issues in the template
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map(e => e.properties.explanation)
        .join("\n");
      alert("Template errors occurred:\n" + errorMessages);
    } else {
      alert("An error occurred while generating the report: " + error.message);
    }

    console.error("Error details:", error);
  }
};
