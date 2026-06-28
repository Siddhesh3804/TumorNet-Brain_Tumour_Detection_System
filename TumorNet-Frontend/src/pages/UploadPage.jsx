import API from "../services/api";
import { useRef, useState } from "react";
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { useAuth } from "../context/AuthContext";
import {
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  Info,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
} from "lucide-react";

const probabilityColors = {
  glioma: "#6d3ff2",
  meningioma: "#126dff",
  pituitary: "#16c7bd",
  notumor: "#a8b3c7",
};

const labelNames = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  pituitary: "Pituitary Tumor",
  notumor: "No Tumor",
};

const fallbackInfo = {
  display_name: "Awaiting Scan",
  status: "Upload Required",
  description: "Upload an MRI scan and run analysis to generate a prediction from the trained backend model.",
  growth_rate: "—",
  common_in: "—",
  treatment_options: "—",
};

const emptyProbabilities = [
  ["glioma", 0],
  ["meningioma", 0],
  ["pituitary", 0],
  ["notumor", 0],
];

const cancerCenters = [
  ["Tata Memorial Hospital", "Dr. E Borges Road, Parel, Mumbai, Maharashtra 400012", "+91 22 2417 7000", "info@tmc.gov.in"],
  ["AIIMS Cancer Centre", "Ansari Nagar, New Delhi, Delhi 110029", "+91 11 2658 8500", "info@aiims.edu"],
  ["Apollo Cancer Centre", "21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006", "+91 44 2829 3333", "enquiry@apollohospitals.com"],
  ["HCG Cancer Centre", "K. R. Road, Bengaluru, Karnataka 560027", "+91 80 4660 7700", "info@hcgoncology.com"],
];

const reportTypeDescriptions = {
  glioma:
    "Glioma begins in brain or spinal cord support cells. Grade, size, and location should be reviewed by a specialist.",
  meningioma:
    "Meningioma forms in the protective brain and spinal cord coverings. Many grow slowly but still need clinical review.",
  pituitary:
    "Pituitary tumors occur near the hormone-control gland and may affect vision or hormone balance.",
  notumor:
    "No supported tumor pattern was detected. Clinical review is still advised if symptoms are present.",
};

function buildProbabilityRows(result) {
  const probabilities = result?.probabilities || {};
  return ["glioma", "meningioma", "pituitary", "notumor"].map((key) => [
    key,
    Number(probabilities[key] || 0),
  ]);
}

function buildDonutGradient(rows) {
  let start = 0;
  const segments = rows.map(([key, value]) => {
    const end = start + value;
    const segment = `${probabilityColors[key]} ${start}% ${end}%`;
    start = end;
    return segment;
  });

  return `conic-gradient(${segments.join(", ") || "#e2e8f0 0% 100%"})`;
}

function ProbabilityBlock({ analyzed, result }) {
  const rows = analyzed ? buildProbabilityRows(result) : emptyProbabilities;

  return (
    <div className="inline-probability">
      <h2>Probability Distribution</h2>
      <div className="donut-wrap">
        <div className="donut" style={{ background: buildDonutGradient(rows) }} />
        <div className="legend">
          {rows.map(([key, value]) => (
            <div key={key}>
              <i style={{ background: probabilityColors[key] }} />
              <span>{labelNames[key]}</span>
              <b>{analyzed ? `${value.toFixed(2)}%` : "—"}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function createReportHtml({ currentUser, result, preview, file }) {
  const downloadedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const patientName = currentUser?.full_name || "Registered User";
  const username = currentUser?.username || "—";
  const email = currentUser?.email || "—";
  const detectedType = result?.display_label || "—";
  const status = result?.status || "—";
  const confidence = Number(result?.confidence_percent || 0).toFixed(2);
  const description = result?.info?.description || "No prediction information available.";
  const probabilities = buildProbabilityRows(result);

  return `<!doctype html>
<html>
<head>
  <title>TumorNet MRI Analysis Report</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: Inter, Arial, sans-serif; color: #0f172a; margin: 0; background: #fff; }
    .letterhead { border-bottom: 3px solid #2563eb; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .mark { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#1d4ed8,#60a5fa); color: #fff; display: grid; place-items: center; font-weight: 900; font-size: 20px; }
    h1 { font-size: 25px; margin: 0; letter-spacing: -0.8px; }
    .subtitle { color: #64748b; margin-top: 3px; font-size: 12px; }
    .meta { text-align: right; color: #475569; font-size: 11px; line-height: 1.55; }
    .section { margin-top: 22px; }
    h2 { font-size: 14px; margin: 0 0 10px; color: #1e3a8a; text-transform: uppercase; letter-spacing: .08em; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; background: #f8fafc; }
    .label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
    .value { font-size: 13px; font-weight: 700; }
    .result { border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 16px; padding: 18px; }
    .type { font-size: 30px; color: #5b21d9; font-weight: 800; letter-spacing: -1px; margin: 3px 0; }
    .status { display: inline-block; background: #ede9fe; color: #6d28d9; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
    .confidence { font-size: 24px; font-weight: 800; color: #2563eb; margin-top: 12px; }
    .scan { width: 100%; max-height: 250px; object-fit: contain; background: #020617; border-radius: 12px; padding: 10px; border: 1px solid #e2e8f0; }
    p { color: #334155; font-size: 12px; line-height: 1.7; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 9px 6px; }
    th { color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
    .hospital { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
    .hospital:last-child { border-bottom: 0; margin-bottom: 0; padding-bottom: 0; }
    .hospital b { display: block; font-size: 12px; margin-bottom: 3px; }
    .hospital span { display: block; color: #475569; font-size: 11px; line-height: 1.5; }
    .disclaimer { margin-top: 22px; padding: 12px; border-radius: 12px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; font-size: 11px; line-height: 1.6; }
    .footer { margin-top: 18px; color: #94a3b8; font-size: 10px; text-align: center; }
    @media print { .no-print { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <header class="letterhead">
    <div class="brand"><div class="mark">TN</div><div><h1>TumorNet</h1><div class="subtitle">Brain Tumour Detection System · AI MRI Analysis Report</div></div></div>
    <div class="meta"><b>Downloaded:</b> ${downloadedAt}<br/><b>File:</b> ${file?.name || "MRI scan"}</div>
  </header>

  <section class="section grid">
    <div class="card"><div class="label">Registered User</div><div class="value">${patientName}</div></div>
    <div class="card"><div class="label">Username</div><div class="value">${username}</div></div>
    <div class="card"><div class="label">Email</div><div class="value">${email}</div></div>
    <div class="card"><div class="label">Report Date & Time</div><div class="value">${downloadedAt}</div></div>
  </section>

  <section class="section grid">
    <div class="result">
      <h2>Detection Summary</h2>
      <div class="status">${status}</div>
      <div class="type">${detectedType}</div>
      <div class="confidence">${confidence}% Confidence</div>
    </div>
    <div>${preview ? `<img class="scan" src="${preview}" alt="Uploaded MRI scan" />` : `<div class="card">No scan preview available.</div>`}</div>
  </section>

  <section class="section">
    <h2>Information About Detected Type</h2>
    <div class="card"><p>${description}</p></div>
  </section>

  <section class="section">
    <h2>Probability Distribution</h2>
    <table>
      <thead><tr><th>Class</th><th>Probability</th></tr></thead>
      <tbody>${probabilities.map(([key, value]) => `<tr><td>${labelNames[key]}</td><td>${value.toFixed(2)}%</td></tr>`).join("")}</tbody>
    </table>
  </section>

  <section class="section">
    <h2>Recommended Oncology Centers (Reference Only)</h2>
    <div class="card">${cancerCenters.map(([name, address, phone]) => `<div class="hospital"><b>${name}</b><span>${address}</span><span>Contact: ${phone}</span></div>`).join("")}</div>
  </section>

  <div class="disclaimer"><b>Medical Disclaimer:</b> This AI-generated report is for educational and decision-support use only. It must not replace diagnosis, treatment, or advice from a qualified radiologist, neurologist, oncologist, or healthcare professional.</div>
  <div class="footer">© TumorNet · Generated by TumorNet Brain Tumour Detection System</div>
</body>
</html>`;
}

function openReportWindow(reportHtml, shouldPrint = false) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!reportWindow) return;
  reportWindow.document.open();
  reportWindow.document.write(reportHtml);
  reportWindow.document.close();
  if (shouldPrint) {
    reportWindow.onload = () => {
      reportWindow.focus();
      reportWindow.print();
    };
  }
}

function escapePdfText(text) {
  return String(text ?? "—").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfText(text, maxChars = 92) {
  const words = String(text ?? "—").split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function sanitizePdfText(text) {
  return String(text ?? "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "-");
}

function createLegacyReportPdfBlob({ currentUser, result, file }) {
  const downloadedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const rows = buildProbabilityRows(result);
  const centers = cancerCenters.map(([name, address, phone]) => `${name} — ${address} | ${phone}`);
  const lines = [
    ["TumorNet", 24, true],
    ["Brain Tumour Detection System — AI MRI Analysis Report", 11],
    [`Generated: ${downloadedAt}`, 10],
    ["", 8],
    ["Patient / Registered User", 14, true],
    [`Name: ${currentUser?.full_name || "Registered User"}`, 11],
    [`Username: ${currentUser?.username || "—"}`, 11],
    [`Email: ${currentUser?.email || "—"}`, 11],
    [`Uploaded File: ${file?.name || "MRI scan"}`, 11],
    ["", 8],
    ["Detection Summary", 14, true],
    [`Status: ${result?.status || "—"}`, 11],
    [`Detected Type: ${result?.display_label || "—"}`, 11],
    [`Confidence Score: ${Number(result?.confidence_percent || 0).toFixed(2)}%`, 11],
    ["", 8],
    ["Information About Detected Type", 14, true],
    ...wrapPdfText(result?.info?.description || "No prediction information available.", 88).map((line) => [line, 10]),
    ["", 8],
    ["Probability Distribution", 14, true],
    ...rows.map(([key, value]) => [`${labelNames[key]}: ${value.toFixed(2)}%`, 10]),
    ["", 8],
    ["Recommended Oncology Centers (Reference Only)", 14, true],
    ...centers.flatMap((center) => wrapPdfText(center, 88).map((line) => [line, 10])),
    ["", 8],
    ["Medical Disclaimer", 14, true],
    ...wrapPdfText("This AI-generated report is for educational and decision-support use only. It must not replace diagnosis, treatment, or advice from a qualified radiologist, neurologist, oncologist, or healthcare professional.", 88).map((line) => [line, 10]),
  ];

  const pageWidth = 595;
  const pageHeight = 842;
  const left = 48;
  const top = 56;
  const bottom = 52;
  const pages = [];
  let commands = [];
  let y = pageHeight - top;

  const newPage = () => {
    if (commands.length) pages.push(commands.join("\n"));
    commands = [
      "0.94 0.97 1 rg 0 792 595 50 re f",
      "0.15 0.39 0.92 RG 48 792 m 547 792 l S",
    ];
    y = pageHeight - top;
  };

  const draw = (text, size = 10, bold = false) => {
    if (y < bottom) newPage();
    const font = bold ? "F2" : "F1";
    commands.push(`BT /${font} ${size} Tf ${left} ${y} Td (${escapePdfText(sanitizePdfText(text))}) Tj ET`);
    y -= Math.max(size + 6, 15);
  };

  newPage();
  lines.forEach(([text, size, bold]) => {
    if (!text) {
      y -= Number(size) || 8;
      return;
    }
    draw(text, size, bold);
  });
  pages.push(commands.join("\n"));

  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageRefs = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);
  pages.forEach((stream, index) => {
    const pageObjectId = 3 + index * 2;
    const streamObjectId = pageObjectId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${streamObjectId} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
}

function createManualReportPdfBlob({ currentUser, result, file }) {
  const generatedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const rows = buildProbabilityRows(result);
  const safe = (value) => sanitizePdfText(value);
  const patientName = safe(currentUser?.full_name || "Registered User");
  const username = safe(currentUser?.username || "-");
  const email = safe(currentUser?.email || "-");
  const fileName = safe(file?.name || "MRI scan");
  const detectedType = safe(result?.display_label || "-");
  const status = safe(result?.status || "-");
  const confidence = `${Number(result?.confidence_percent || 0).toFixed(2)}%`;
  const description = safe(
    reportTypeDescriptions[result?.predicted_label] ||
      result?.info?.description ||
      "No prediction information available."
  );
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const bottom = 48;
  const pages = [];
  let commands = [];
  let y = 748;

  const write = (text, x, yy, size = 10, bold = false, rgb = "0.05 0.10 0.20") => {
    const font = bold ? "F2" : "F1";
    commands.push(`${rgb} rg BT /${font} ${size} Tf ${x} ${yy} Td (${escapePdfText(safe(text))}) Tj ET`);
  };

  const line = (x1, y1, x2, y2, rgb = "0.87 0.91 0.96") => {
    commands.push(`${rgb} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const rect = (x, rectY, w, h, fill = "0.98 0.99 1", stroke = "0.87 0.91 0.96") => {
    commands.push(`${fill} rg ${x} ${rectY} ${w} ${h} re f`);
    commands.push(`${stroke} RG ${x} ${rectY} ${w} ${h} re S`);
  };

  const newPage = () => {
    if (commands.length) pages.push(commands.join("\n"));
    commands = [
      "1 1 1 rg 0 0 595 842 re f",
      "0.94 0.97 1 rg 0 780 595 62 re f",
      "0.12 0.33 0.82 rg 42 795 34 34 re f",
      "1 1 1 rg BT /F2 15 Tf 50 805 Td (TN) Tj ET",
      "0.05 0.10 0.20 rg BT /F2 23 Tf 86 814 Td (TumorNet) Tj ET",
      "0.33 0.40 0.50 rg BT /F1 9 Tf 87 799 Td (Brain Tumour Detection System - AI MRI Analysis Report) Tj ET",
      "0.15 0.39 0.92 RG 42 780 m 553 780 l S",
    ];
    y = 748;
  };

  const ensure = (height) => {
    if (y - height < bottom) newPage();
  };

  const sectionTitle = (title) => {
    ensure(34);
    write(title.toUpperCase(), margin, y, 10.5, true, "0.12 0.33 0.82");
    y -= 13;
    line(margin, y, pageWidth - margin, y);
    y -= 16;
  };

  const keyValue = (label, value, x, valueY, w) => {
    write(label.toUpperCase(), x, valueY + 18, 7, true, "0.39 0.45 0.55");
    const maxChars = Math.max(14, Math.floor(w / 4.7));
    wrapPdfText(safe(value), maxChars)
      .slice(0, 2)
      .map((part, index, parts) => {
        if (index === 1 && parts.length > 1 && safe(value).length > maxChars * 2) {
          return `${part.slice(0, Math.max(0, maxChars - 3))}...`;
        }
        return part;
      })
      .forEach((part, index) => {
      write(part, x, valueY + 3 - index * 10, 8.8, index === 0);
    });
  };

  const paragraph = (text, x, w, size = 9.5, maxLines = 8) => {
    wrapPdfText(safe(text), Math.floor(w / 4.9)).slice(0, maxLines).forEach((part) => {
      ensure(13);
      write(part, x, y, size, false, "0.20 0.28 0.38");
      y -= 12;
    });
  };

  newPage();
  write(`Generated: ${generatedAt}`, 395, 814, 9, false, "0.33 0.40 0.50");
  write(`File: ${fileName.slice(0, 34)}`, 395, 800, 9, false, "0.33 0.40 0.50");

  sectionTitle("Patient Information");
  rect(margin, y - 70, 511, 82);
  line(296, y - 62, 296, y + 4, "0.87 0.91 0.96");
  line(54, y - 31, 541, y - 31, "0.87 0.91 0.96");
  keyValue("Full Name", patientName, 58, y - 12, 205);
  keyValue("Username", username, 314, y - 12, 205);
  keyValue("Email", email, 58, y - 50, 205);
  keyValue("Report Date & Time", generatedAt, 314, y - 50, 205);
  y -= 102;

  sectionTitle("MRI Analysis Result");
  rect(margin, y - 124, 511, 138, "0.94 0.97 1", "0.72 0.82 0.98");
  write("Detected Type", 62, y - 12, 8, true, "0.39 0.45 0.55");
  write(detectedType, 62, y - 37, 22, true, "0.37 0.20 0.84");
  write(`Status: ${status}`, 315, y - 18, 9.5, true, "0.12 0.33 0.82");
  write(`Confidence: ${confidence}`, 315, y - 36, 9.5, true, "0.12 0.33 0.82");
  commands.push(`0.88 0.92 0.98 rg 315 ${y - 54} 180 6 re f`);
  commands.push(`0.12 0.39 0.92 rg 315 ${y - 54} ${Math.min(180, Number(result?.confidence_percent || 0) * 1.8)} 6 re f`);
  write("Description", 62, y - 62, 8.5, true, "0.39 0.45 0.55");
  y -= 78;
  paragraph(description, 62, 460, 8.7, 4);
  y = 456;

  sectionTitle("Probability Distribution");
  rows.forEach(([key, value], index) => {
    ensure(24);
    const rowY = y;
    if (index % 2 === 0) commands.push(`0.98 0.99 1 rg 42 ${rowY - 7} 511 21 re f`);
    write(labelNames[key], 58, rowY, 10, true);
    write(`${value.toFixed(2)}%`, 458, rowY, 10, true, "0.12 0.33 0.82");
    commands.push(`0.88 0.92 0.98 rg 190 ${rowY - 2} 240 6 re f`);
    commands.push(`0.43 0.25 0.95 rg 190 ${rowY - 2} ${Math.min(240, value * 2.4)} 6 re f`);
    y -= 24;
  });
  y -= 12;

  sectionTitle("Recommended Oncology Centers (Reference Only)");
  cancerCenters.forEach(([name, address, phone, hospitalEmail]) => {
    ensure(38);
    write(name, margin, y, 9.2, true);
    write(address, margin, y - 11, 7.8, false, "0.33 0.40 0.50");
    write(`Contact: ${phone} | Email: ${hospitalEmail}`, margin, y - 22, 7.8, false, "0.12 0.33 0.82");
    y -= 34;
  });

  sectionTitle("Medical Disclaimer");
  paragraph("This AI-generated report is for educational and decision-support use only. It must not replace diagnosis, treatment, or advice from a qualified radiologist, neurologist, oncologist, or healthcare professional.", margin, 511, 8.4, 3);
  y -= 10;
  line(margin, y, pageWidth - margin, y);
  write("TumorNet - Brain Tumour Detection System", margin, y - 18, 8, false, "0.58 0.64 0.72");
  write(`Report downloaded on ${generatedAt}`, 372, y - 18, 8, false, "0.58 0.64 0.72");
  pages.push(commands.join("\n"));

  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageRefs = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);
  pages.forEach((stream, index) => {
    const pageObjectId = 3 + index * 2;
    const streamObjectId = pageObjectId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${streamObjectId} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
}

const reportStyles = StyleSheet.create({
  page: { paddingTop: 23, paddingBottom: 24, paddingHorizontal: 20, fontFamily: "Helvetica", color: "#111827", fontSize: 8.4, lineHeight: 1.25 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1.4, borderBottomColor: "#0B3B82", paddingBottom: 14, marginBottom: 14 },
  brand: { flexDirection: "row" },
  logo: { width: 52, height: 52, backgroundColor: "#0B3B82", color: "#FFFFFF", fontSize: 25, fontFamily: "Helvetica-Bold", textAlign: "center", paddingTop: 13, marginRight: 12, borderRadius: 6 },
  title: { fontSize: 25, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 16 },
  titleAccent: { color: "#0B3B82" },
  subtitle: { fontSize: 10.5, color: "#111827", marginBottom: 4 },
  reportSubtitle: { fontSize: 10.5, color: "#0B3B82", fontFamily: "Helvetica-Bold" },
  meta: { width: 155, borderLeftWidth: 1, borderLeftColor: "#C8D9E6", paddingLeft: 14 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  metaIcon: { width: 13, color: "#0B3B82", fontFamily: "Helvetica-Bold", fontSize: 9 },
  metaLabel: { fontSize: 7.2, color: "#2F4156", fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 3 },
  metaValue: { fontSize: 8.8, color: "#111827" },
  section: { marginBottom: 10 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7 },
  sectionIcon: { width: 12, color: "#0B3B82", fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0B3B82", textTransform: "uppercase" },
  tableBox: { borderWidth: 1, borderColor: "#D9E2EC", borderRadius: 4, overflow: "hidden" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#D9E2EC" },
  lastRow: { borderBottomWidth: 0 },
  cell: { flex: 1, paddingVertical: 9, paddingHorizontal: 14, minHeight: 42, flexDirection: "row", gap: 8 },
  cellBorder: { borderRightWidth: 1, borderRightColor: "#D9E2EC" },
  cellIcon: { width: 15, color: "#0B3B82", fontFamily: "Helvetica-Bold", fontSize: 12, paddingTop: 7 },
  label: { fontSize: 7.4, color: "#2F4156", marginBottom: 3 },
  value: { fontSize: 8.8, fontFamily: "Helvetica-Bold", color: "#111827" },
  analysisBox: { borderWidth: 1, borderColor: "#D9E2EC", borderRadius: 4, overflow: "hidden", flexDirection: "row" },
  analysisLeft: { width: "46%", padding: 14, borderRightWidth: 1, borderRightColor: "#D9E2EC" },
  imageSide: { width: "54%", padding: 9, backgroundColor: "#FFFFFF" },
  detected: { fontSize: 19, fontFamily: "Helvetica-Bold", color: "#15803D", marginBottom: 8, lineHeight: 1.15 },
  detectedTumor: { color: "#0B3B82" },
  statusPill: { alignSelf: "flex-start", backgroundColor: "#DCFCE7", borderRadius: 12, paddingVertical: 5, paddingHorizontal: 9, marginBottom: 9 },
  status: { fontSize: 8.4, fontFamily: "Helvetica-Bold", color: "#15803D" },
  confidence: { fontSize: 9.6, fontFamily: "Helvetica-Bold", marginBottom: 7 },
  confidenceValue: { color: "#15803D" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#D9E2EC", marginVertical: 9 },
  bodyText: { fontSize: 8.5, lineHeight: 1.35, color: "#111827" },
  mriImage: { width: "100%", height: 166, objectFit: "contain", borderRadius: 5, backgroundColor: "#050505" },
  imageFallback: { height: 166, borderWidth: 1, borderColor: "#D9E2EC", borderRadius: 4, textAlign: "center", paddingTop: 72, color: "#4A5568" },
  caption: { fontSize: 7.2, color: "#4A5568", textAlign: "center", marginTop: 2, fontStyle: "italic" },
  probabilityHeader: { flexDirection: "row", backgroundColor: "#153E75" },
  probabilityHeaderText: { color: "#FFFFFF", fontSize: 8.5, fontFamily: "Helvetica-Bold", paddingVertical: 6, paddingHorizontal: 10 },
  probType: { width: "65%" },
  probValue: { width: "35%", textAlign: "right" },
  probabilityRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#D9E2EC" },
  highlightRow: { backgroundColor: "#EAF2FF" },
  probText: { fontSize: 8.6, paddingVertical: 5.2, paddingHorizontal: 10 },
  hospitalGrid: { flexDirection: "row", borderWidth: 1, borderColor: "#D9E2EC", borderRadius: 4, overflow: "hidden" },
  hospitalColumn: { width: "25%", paddingVertical: 8, paddingHorizontal: 9, borderRightWidth: 1, borderRightColor: "#D9E2EC" },
  hospitalLast: { borderRightWidth: 0 },
  hospitalName: { fontSize: 7.9, fontFamily: "Helvetica-Bold", color: "#0B3B82", marginBottom: 5 },
  hospitalText: { fontSize: 6.9, color: "#111827", lineHeight: 1.25, marginBottom: 3 },
  disclaimer: { borderWidth: 1, borderColor: "#D9E2EC", backgroundColor: "#F8FBFF", borderRadius: 4, padding: 12, flexDirection: "row", gap: 10},
  disclaimerIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#0B3B82", color: "#FFFFFF", textAlign: "center", paddingTop: 5, fontSize: 9, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", left: 20, right: 20, bottom: 12, borderTopWidth: 1.4, borderTopColor: "#0B3B82", paddingTop: 9, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.2, color: "#0B3B82" },
});

function shortReportDescription(result) {
  return (
    reportTypeDescriptions[result?.predicted_label] ||
    "The AI model has generated a brain MRI classification result. Please consult a qualified healthcare professional for clinical interpretation."
  );
}

function fitText(text, maxLength = 120) {
  const value = String(text || "-").replace(/\s+/g, " ").trim();
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function TumorNetReportDocument({ currentUser, result, preview, file, generatedAt, reportId }) {
  const rows = buildProbabilityRows(result);
  const topPrediction = rows.reduce((best, row) => (row[1] > best[1] ? row : best), rows[0] || ["", 0]);
  const isNoTumor = result?.predicted_label === "notumor";
  const statusText = isNoTumor ? "Normal" : result?.status || "Tumor Detected";
  const statusColor = isNoTumor ? "#2E7D32" : "#C62828";
  const confidence = Number(result?.confidence_percent || 0).toFixed(2);
  const description = shortReportDescription(result);

  return (
    <Document title={`TumorNet Report ${reportId}`}>
      <Page size="A4" style={reportStyles.page}>
        <View style={reportStyles.header} fixed>
          <View style={reportStyles.brand}>
            <Text style={reportStyles.logo}>TN</Text>
            <View>
              <Text style={reportStyles.title}>Tumor<Text style={reportStyles.titleAccent}>Net</Text></Text>
              <Text style={reportStyles.subtitle}>AI Brain Tumor Detection System</Text>
              <Text style={reportStyles.reportSubtitle}>MRI Analysis Report</Text>
            </View>
          </View>
          <View style={reportStyles.meta}>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaIcon}>ID</Text>
              <View>
                <Text style={reportStyles.metaLabel}>Report ID</Text>
                <Text style={reportStyles.metaValue}>{reportId}</Text>
              </View>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaIcon}>DT</Text>
              <View>
                <Text style={reportStyles.metaLabel}>Report Generated</Text>
                <Text style={reportStyles.metaValue}>{generatedAt}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={reportStyles.section}>
          <View style={reportStyles.sectionTitleRow}>
            {/* <Text style={reportStyles.sectionIcon}>01</Text> */}
            <Text style={reportStyles.sectionTitle}>1. Patient Information</Text>
          </View>
          <View style={reportStyles.tableBox}>
            <View style={reportStyles.row}>
              <View style={[reportStyles.cell, reportStyles.cellBorder]}>
                {/* <Text style={reportStyles.cellIcon}>U</Text> */}
                <View><Text style={reportStyles.label}>Full Name</Text><Text style={reportStyles.value}>{fitText(currentUser?.full_name || currentUser?.name || "-", 42)}</Text></View>
              </View>
              <View style={reportStyles.cell}>
                {/* <Text style={reportStyles.cellIcon}>U</Text> */}
                <View><Text style={reportStyles.label}>Username</Text><Text style={reportStyles.value}>{fitText(currentUser?.username || "-", 42)}</Text></View>
              </View>
            </View>
            <View style={[reportStyles.row, currentUser?.patient_id || currentUser?.age || currentUser?.gender ? null : reportStyles.lastRow]}>
              <View style={[reportStyles.cell, reportStyles.cellBorder]}>
                {/* <Text style={reportStyles.cellIcon}>@</Text> */}
                <View><Text style={reportStyles.label}>Email</Text><Text style={reportStyles.value}>{fitText(currentUser?.email || "-", 44)}</Text></View>
              </View>
              <View style={reportStyles.cell}>
                {/* <Text style={reportStyles.cellIcon}>DT</Text> */}
                <View><Text style={reportStyles.label}>Report Date & Time</Text><Text style={reportStyles.value}>{generatedAt}</Text></View>
              </View>
            </View>
            {(currentUser?.patient_id || currentUser?.age || currentUser?.gender) && (
              <View style={[reportStyles.row, reportStyles.lastRow]}>
                <View style={[reportStyles.cell, reportStyles.cellBorder]}>
                  <Text style={reportStyles.label}>Patient ID</Text>
                  <Text style={reportStyles.value}>{fitText(currentUser?.patient_id || "-", 42)}</Text>
                </View>
                <View style={reportStyles.cell}>
                  <Text style={reportStyles.label}>Age / Gender</Text>
                  <Text style={reportStyles.value}>{fitText([currentUser?.age, currentUser?.gender].filter(Boolean).join(" / ") || "-", 42)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={reportStyles.section}>
          <View style={reportStyles.sectionTitleRow}>
            {/* <Text style={reportStyles.sectionIcon}>02</Text> */}
            <Text style={reportStyles.sectionTitle}>2. MRI Analysis Result</Text>
          </View>
          <View style={reportStyles.analysisBox}>
            <View style={reportStyles.analysisLeft}>
              <Text style={reportStyles.label}>Detected Type</Text>
              <Text style={[reportStyles.detected, isNoTumor ? null : reportStyles.detectedTumor]}>{result?.display_label || "-"}</Text>
              <View style={[reportStyles.statusPill, isNoTumor ? null : { backgroundColor: "#FEE2E2" }]}>
                <Text style={[reportStyles.status, { color: statusColor }]}>Status: {statusText}</Text>
              </View>
              <Text style={reportStyles.confidence}>Confidence Score: <Text style={[reportStyles.confidenceValue, { color: statusColor }]}>{confidence}%</Text></Text>
              <View style={reportStyles.divider} />
              <Text style={reportStyles.label}>Description</Text>
              <Text style={reportStyles.bodyText}>{description}</Text>
            </View>
            <View style={reportStyles.imageSide}>
              {preview ? <Image src={preview} style={reportStyles.mriImage} /> : <Text style={reportStyles.imageFallback}>No MRI Image Available</Text>}
              <Text style={reportStyles.caption}>{file?.name ? fitText(`Uploaded Brain MRI - ${file.name}`, 62) : "Uploaded Brain MRI"}</Text>
            </View>
          </View>
        </View>

        <View style={reportStyles.section}>
          <View style={reportStyles.sectionTitleRow}>
            <Text style={reportStyles.sectionIcon}>03</Text>
            <Text style={reportStyles.sectionTitle}>3. Classification Results</Text>
          </View>
          <View style={reportStyles.tableBox}>
            <View style={reportStyles.probabilityHeader}>
              <Text style={[reportStyles.probabilityHeaderText, reportStyles.probType]}>Tumor Type</Text>
              <Text style={[reportStyles.probabilityHeaderText, reportStyles.probValue]}>Detection Probability</Text>
            </View>
            {rows.map(([key, value]) => (
              <View key={key} style={[reportStyles.probabilityRow, key === topPrediction[0] ? reportStyles.highlightRow : null]}>
                <Text style={[reportStyles.probText, reportStyles.probType]}>{labelNames[key]}</Text>
                <Text style={[reportStyles.probText, reportStyles.probValue, key === topPrediction[0] ? { fontFamily: "Helvetica-Bold", color: "#153E75" } : null]}>{value.toFixed(2)}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={reportStyles.section}>
          <View style={reportStyles.sectionTitleRow}>
            {/* <Text style={reportStyles.sectionIcon}>04</Text> */}
            <Text style={reportStyles.sectionTitle}>4. Recommended Oncology Centers (Reference Only)</Text>
          </View>
          <View style={reportStyles.hospitalGrid}>
            {cancerCenters.map(([name, address, phone, hospitalEmail], index) => (
              <View key={name} style={[reportStyles.hospitalColumn, index === cancerCenters.length - 1 ? reportStyles.hospitalLast : null]}>
                <Text style={reportStyles.hospitalName}>{name}</Text>
                <Text style={reportStyles.hospitalText}>{fitText(address, 92)}</Text>
                <Text style={reportStyles.hospitalText}>Phone: {phone}</Text>
                <Text style={reportStyles.hospitalText}>Email: {hospitalEmail}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={reportStyles.section}>
          <View style={reportStyles.sectionTitleRow}>
            <Text style={reportStyles.sectionTitle}>5. Medical Disclaimer</Text>
          </View>
          <View style={reportStyles.disclaimer}>
            <Text style={reportStyles.disclaimerIcon}>i</Text>
            <Text style={reportStyles.bodyText}>
              This AI-generated report is intended for educational and decision-support purposes only. It is not a substitute for diagnosis or treatment{"\n"} by a qualified radiologist, neurologist, oncologist, or healthcare professional.
            </Text>
          </View>
        </View>

        <View style={reportStyles.footer} fixed>
          <Text style={reportStyles.footerText}>TumorNet - AI Based Brain Tumor Detection System</Text>
          <Text style={reportStyles.footerText}>Confidential Medical Report</Text>
          <Text style={reportStyles.footerText}>Generated on: {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}

async function createReportPdfBlob({ currentUser, result, preview, file }) {
  const generatedDate = new Date();
  const generatedAt = generatedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const reportId = `TN-${generatedDate.getFullYear()}${String(generatedDate.getMonth() + 1).padStart(2, "0")}${String(generatedDate.getDate()).padStart(2, "0")}-${String(generatedDate.getHours()).padStart(2, "0")}${String(generatedDate.getMinutes()).padStart(2, "0")}${String(generatedDate.getSeconds()).padStart(2, "0")}`;
  return pdf(
    <TumorNetReportDocument
      currentUser={currentUser}
      result={result}
      preview={preview}
      file={file}
      generatedAt={generatedAt}
      reportId={reportId}
    />
  ).toBlob();
}

function ActionsBlock({ analyzed, reset, reportData, latestPdfUrl, setLatestPdfUrl, setNotice }) {
  const downloadReport = async () => {
    if (!analyzed) return;
    if (latestPdfUrl) URL.revokeObjectURL(latestPdfUrl);
    const blob = await createReportPdfBlob(reportData);
    const url = URL.createObjectURL(blob);
    const filename = `TumorNet_Report_${Date.now()}.pdf`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setLatestPdfUrl(url);
    setNotice("Report has been downloaded.");

    try {
      const userId = reportData.currentUser?.id;
      if (!userId) return;
      const formData = new FormData();
      formData.append("title", `${reportData.result?.display_label || "MRI"} Analysis Report`);
      formData.append("detected_type", reportData.result?.display_label || "-");
      formData.append("analysis_date", new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }));
      formData.append("pdf_file", blob, filename);

      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Report save failed");
      }
      setNotice("Report has been downloaded and saved to Reports.");
    } catch {
      setNotice("Report downloaded, but could not be saved to Reports.");
    }
  };

  const viewReport = () => {
    if (!latestPdfUrl) {
      setNotice("Please download the report first.");
      return;
    }
    window.open(latestPdfUrl, "_blank");
  };

  return (
    <section className="actions-card inline-actions">
      <h2>Actions</h2>
      <div className="icon-actions">
        <button className="primary-action" disabled={!analyzed} onClick={downloadReport} aria-label="Download Report PDF" title="Download Report PDF"><Download /></button>
        <button disabled={!analyzed} onClick={viewReport} aria-label="View Full Report" title="View Full Report"><FileText /></button>
        <button onClick={reset} aria-label="Predict Another Scan" title="Predict Another Scan"><RefreshCw /></button>
      </div>
    </section>
  );
}

export default function UploadPage() {
  const { currentUser } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [latestPdfUrl, setLatestPdfUrl] = useState("");
  const [notice, setNotice] = useState("");

  const chooseFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setAnalyzed(false);
    setResult(null);
    setError("");
    setNotice("");

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview("");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview("");
    setAnalyzed(false);
    setAnalyzing(false);
    setResult(null);
    setError("");
    setNotice("");
    if (latestPdfUrl) {
      URL.revokeObjectURL(latestPdfUrl);
      setLatestPdfUrl("");
    }
  };

  const analyzeScan = async () => {
    if (!file || analyzing) return;

    setAnalyzing(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || "Prediction failed");
      }

      setResult(data);
      setAnalyzed(true);
    } catch (predictionError) {
      setAnalyzed(false);
      setResult(null);
      setError(predictionError.message || "Unable to analyze this MRI scan.");
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const reportData = { currentUser, result, preview, file };

  return (
    <div className="upload-workspace">
      <div className="result-grid">
        <section className="result-card scan-panel">
          <h2>Uploaded MRI Scan</h2>
          <button
            className={`drop-scan ${dragging ? "dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              chooseFile(event.dataTransfer.files?.[0]);
            }}
          >
            {preview ? (
              <img src={preview} alt="Uploaded MRI scan preview" />
            ) : (
              <div className="scan-placeholder">
                <Upload />
                <b>Drop MRI scan here</b>
                <span>or click to browse JPG, JPEG, PNG</span>
              </div>
            )}
            <i>L</i>
          </button>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".jpg,.jpeg,.png"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          <div className="scan-meta">
            <span><Calendar />{file ? uploadedAt : "Awaiting upload"}</span>
            <span><FileImage />{file?.name || "No file selected"}</span>
          </div>
          <button className="analyze-btn" disabled={!file || analyzing} onClick={analyzeScan}>
            <BrainCircuit /> {analyzing ? "Analyzing..." : analyzed ? "Analysis Complete" : "Analyze MRI"}
          </button>
          {error && <p className="prediction-error">{error}</p>}

          <ActionsBlock
            analyzed={analyzed}
            reset={reset}
            reportData={reportData}
            latestPdfUrl={latestPdfUrl}
            setLatestPdfUrl={setLatestPdfUrl}
            setNotice={setNotice}
          />
          {notice && <p className="report-notice">{notice}</p>}
        </section>

        <section className="result-card prediction-panel">
          <h2>Prediction</h2>
          <div className="prediction-center">
            <div>
              <h3>{analyzed ? result?.display_label : "Awaiting Scan"}</h3>
              <span>{analyzed ? result?.status : "Upload Required"}</span>
              <p>{analyzed ? `The trained backend model predicted ${result?.display_label}.` : "Upload an MRI scan and run analysis to generate a prediction."}</p>
            </div>
          </div>
          <div className="confidence">
            <b>Confidence Score <Info /></b>
            <strong>{analyzed ? `${Number(result?.confidence_percent || 0).toFixed(2)}%` : "—"}</strong>
            <div className="confidence-bar"><span style={{ width: analyzed ? `${Number(result?.confidence_percent || 0)}%` : "0%" }} /></div>
            <div className="confidence-scale"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
          </div>
          <div className={`confidence-note ${analyzed ? "show" : ""}`}>
            <CheckCircle2 /> High confidence prediction. Please consult a medical professional for accurate diagnosis.
          </div>

          <ProbabilityBlock analyzed={analyzed} result={result} />
        </section>

        <section className="result-card tumor-info">
          <h2>Tumor Information</h2>
          {[
            ["Tumor Type", analyzed ? result?.info?.display_name : fallbackInfo.display_name, BrainCircuit],
            ["Description", analyzed ? result?.info?.description : fallbackInfo.description, FileText],
            ["Growth Rate", analyzed ? result?.info?.growth_rate : fallbackInfo.growth_rate, RefreshCw],
            ["Common in", analyzed ? result?.info?.common_in : fallbackInfo.common_in, UserRound],
            ["Treatment Options", analyzed ? result?.info?.treatment_options : fallbackInfo.treatment_options, Stethoscope],
          ].map(([label, value, Icon]) => (
            <div className="info-row" key={label}>
              <span><Icon /></span>
              <div><b>{label}</b><p>{value}</p></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}