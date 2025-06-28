window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const patient_name = urlParams.get("name");
  const doctor_name = urlParams.get("doctor");
  const date = urlParams.get("date");
  const age = urlParams.get("age");
  const report = urlParams.get("report");

  if (!patient_name || !doctor_name || !date || !report) {
    alert("Missing data in URL parameters!");
    return;
  }

  try {
    const response = await fetch("template.docx");
    const content = await response.arrayBuffer();

    const zip = new PizZip(content);

    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      name: patient_name,
      doctor: doctor_name,
      date: date,
      report: report,
      age: age
    });

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // إنشاء رابط تحميل
    const link = document.createElement("a");
    link.href = URL.createObjectURL(out);
    link.download = `${patient_name}_medical_report.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // ✅ بعد التحميل: إظهار رسالة النجاح وإخفاء العناصر السابقة
    document.querySelector("h2").style.display = "none";
    document.querySelector(".loader").style.display = "none";
    document.querySelector(".message").style.display = "none";
    document.querySelector(".success").style.display = "block";

  } catch (error) {
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map((e) => e.properties.explanation)
        .join("\n");
      alert("Template errors occurred:\n" + errorMessages);
    } else {
      alert("An error occurred while generating the report: " + error.message);
    }

    console.error("Error details:", error);
  }
};
