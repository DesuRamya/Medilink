import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brand = {
  primary: "#1d4ed8",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
};

const formatDate = (dateInput) => {
  if (!dateInput) return "Not available";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not available";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const collectDiseases = (diseases = {}) => {
  if (!diseases || typeof diseases !== "object") return [];
  return Object.entries(diseases)
    .filter(([, list]) => Array.isArray(list) && list.length > 0)
    .map(([category, list]) => ({
      category,
      items: list,
    }));
};

export const generatePatientSummaryPdf = async (patient, { fromDate, toDate }) => {
  const rangeEnabled = Boolean(fromDate || toDate);
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;
  if (to) {
    to.setHours(23, 59, 59, 999);
  }

  const inRange = (dateString) => {
    if (!dateString) return false;
    if (!rangeEnabled) return true;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const buildDateValue = (dateValue, measuredValue) => {
    if (!dateValue) {
      return { date: "Not available", value: formatValue(measuredValue) };
    }
    if (!inRange(dateValue)) {
      return rangeEnabled
        ? { date: "Outside range", value: "Outside range" }
        : { date: formatDate(dateValue), value: formatValue(measuredValue) };
    }
    return { date: formatDate(dateValue), value: formatValue(measuredValue) };
  };

  const tests = [
    {
      label: "Blood Pressure",
      has: formatValue(patient.hasBp),
      ...buildDateValue(patient.bpTestDate, patient.bp),
    },
    {
      label: "Diabetic Levels",
      has: formatValue(patient.hasDiabetics),
      ...buildDateValue(patient.diabeticTestDate, patient.diabetic),
    },
    {
      label: "Hemoglobin",
      has: "N/A",
      ...buildDateValue(patient.hbTestDate, patient.hemoglobin),
    },
  ];

  const diseases = collectDiseases(patient.diseases);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const buffers = [];

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;
  const usableWidth = right - left;

  const drawSectionTitle = (title) => {
    doc
      .moveDown(0.6)
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(brand.primary)
      .text(title, left, doc.y);
    doc
      .moveDown(0.2)
      .strokeColor(brand.border)
      .lineWidth(1)
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.moveDown(0.5);
  };

  const drawKeyValueRow = (label, value) => {
    const labelWidth = 120;
    const valueWidth = usableWidth - labelWidth - 10;
    const y = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(brand.text)
      .text(label, left, y, { width: labelWidth });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(brand.text)
      .text(formatValue(value), left + labelWidth + 10, y, {
        width: valueWidth,
      });
    doc.moveDown(0.5);
  };

  const drawTable = ({ headers, rows, columnWidths }) => {
    const startY = doc.y;
    const rowHeight = 20;
    const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    const x = left;
    let y = startY;

    doc
      .rect(x, y, totalWidth, rowHeight)
      .fill(brand.primary);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, i) => {
      const colX = x + columnWidths.slice(0, i).reduce((s, w) => s + w, 0) + 6;
      doc.text(header, colX, y + 6, { width: columnWidths[i] - 12 });
    });
    y += rowHeight;

    doc.fillColor(brand.text).font("Helvetica").fontSize(10);
    rows.forEach((row, idx) => {
      if (y + rowHeight > pageHeight - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.y;
      }

      if (idx % 2 === 0) {
        doc.rect(x, y, totalWidth, rowHeight).fill("#f8fafc");
        doc.fillColor(brand.text);
      }

      row.forEach((cell, i) => {
        const colX = x + columnWidths.slice(0, i).reduce((s, w) => s + w, 0) + 6;
        doc.text(cell, colX, y + 6, { width: columnWidths[i] - 12 });
      });

      doc
        .strokeColor(brand.border)
        .lineWidth(1)
        .moveTo(x, y + rowHeight)
        .lineTo(x + totalWidth, y + rowHeight)
        .stroke();

      y += rowHeight;
    });

    doc.moveDown(0.5);
  };

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(brand.primary)
      .text("Medilink Patient Summary", { align: "left" });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(brand.muted)
      .text(`Generated: ${formatDate(new Date())}`, { align: "left" });
    doc.moveDown(0.6);
    doc
      .strokeColor(brand.border)
      .lineWidth(1)
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.moveDown();

    drawSectionTitle("Patient Information");
    drawKeyValueRow("Name", patient.name);
    drawKeyValueRow("Age", patient.age);
    drawKeyValueRow("Gender", patient.gender);
    drawKeyValueRow("Blood Group", patient.bloodGroup);
    drawKeyValueRow("Phone", patient.phone);

    drawSectionTitle("Conditions");
    if (diseases.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(brand.text).text("No conditions recorded.");
      doc.moveDown(0.5);
    } else {
      const rows = diseases.map((entry) => [
        String(entry.category).replace(/_/g, " "),
        formatValue(entry.items),
      ]);
      drawTable({
        headers: ["Category", "Items"],
        rows,
        columnWidths: [150, usableWidth - 150],
      });
    }

    drawSectionTitle("Prescription Image");
    if (patient.prescriptionImage) {
      const relativePath = patient.prescriptionImage.startsWith("/")
        ? patient.prescriptionImage.slice(1)
        : patient.prescriptionImage;
      const absolutePath = path.join(__dirname, "..", relativePath);
      if (fs.existsSync(absolutePath)) {
        const imageTopY = doc.y;
        const imageHeight = 360;
        if (imageTopY + imageHeight > pageHeight - doc.page.margins.bottom) {
          doc.addPage();
        }
        const placedY = doc.y;
        doc.image(absolutePath, left, placedY, {
          fit: [usableWidth, imageHeight],
          align: "left",
          valign: "top",
        });
        doc.y = placedY + imageHeight + 12;
      } else {
        doc.font("Helvetica").fontSize(10).fillColor(brand.muted).text(
          "Prescription image not available.",
          { align: "left" }
        );
        doc.moveDown(0.5);
      }
    } else {
      doc.font("Helvetica").fontSize(10).fillColor(brand.text).text(
        "No prescription image uploaded.",
        { align: "left" }
      );
      doc.moveDown(0.5);
    }

    if (doc.y > pageHeight - doc.page.margins.bottom - 120) {
      doc.addPage();
    }

    drawSectionTitle("Measurements In Range");
    const rows = tests.map((test) => [
      test.label,
      test.has,
      test.date,
      test.value,
    ]);
    drawTable({
      headers: ["Measurement", "Has", "Last Test Date", "Value"],
      rows,
      columnWidths: [150, 70, 140, usableWidth - 360],
    });

    doc.fontSize(9).fillColor(brand.muted).text(
      "This summary is generated from Medilink records. Please consult a doctor for clinical decisions.",
      { align: "left" }
    );

    doc.end();
  });
};
