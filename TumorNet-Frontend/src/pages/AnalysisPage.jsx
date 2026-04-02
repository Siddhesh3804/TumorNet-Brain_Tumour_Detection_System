import { useState } from "react";
import BrainSVG from "../components/brain/BrainSVG";
import BrainTumorSVG from "../components/brain/BrainTumorSVG";
import { toTitleCase } from "../utils/text";

export default function AnalysisPage({ analysisData, navigate, onClearAnalysis, onNotify }) {
  const [brightness, setBrightness] = useState(70);
  const [slice, setSlice] = useState(14);
  const [notes, setNotes] = useState(
    "Requires review by Dr. Evans.\nLocation noted near motor cortex.\nSegmented mask saved."
  );
  const [zoomLevel, setZoomLevel] = useState(100);

  const confidenceScore = analysisData?.confidence_percent ?? 98.7;
  const predictedLabel = analysisData?.predicted_label
    ? analysisData.predicted_label.toUpperCase()
    : "MENINGIOMA";
  const imageUrl = analysisData?.image_url_full;
  const hasTumor = analysisData ? analysisData.predicted_label !== "notumor" : true;
  const patient = analysisData?.patient || {};

  const safeNotify = (message) => {
    if (onNotify) onNotify(message);
  };

  const handleCopyAiOutput = async () => {
    const outputText = [
      `Tumor Type: ${predictedLabel}`,
      `Confidence: ${confidenceScore.toFixed(1)}%`,
      `Patient ID: ${patient.patientId || "N/A"}`,
      `Patient Name: ${patient.name || "N/A"}`,
      `Scan Type: ${patient.scanType || "N/A"}`,
      "",
      "Radiologist Notes:",
      notes
    ].join("\n");

    try {
      await navigator.clipboard.writeText(outputText);
      safeNotify("AI output copied to clipboard.");
    } catch {
      safeNotify("Could not access clipboard on this browser.");
    }
  };

  const handleDelete = () => {
    onClearAnalysis?.();
    safeNotify("Current analysis removed.");
    navigate?.("upload");
  };

  const handleClearAll = () => {
    setBrightness(70);
    setSlice(14);
    setZoomLevel(100);
    setNotes("");
    onClearAnalysis?.();
    safeNotify("Analysis view reset.");
  };

  const handleDownloadReport = () => {
    const reportContent = `NeuroScan AI Report\n\nTumor Type: ${predictedLabel}\nConfidence: ${confidenceScore.toFixed(
      1
    )}%\nPatient ID: ${patient.patientId || "N/A"}\nPatient Name: ${patient.name || "N/A"}\nAge: ${patient.age || "N/A"}\nDate: ${
      patient.date || "N/A"
    }\nScan Type: ${patient.scanType || "N/A"}\n\nNotes:\n${notes}\n`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `neuroscan-report-${patient.patientId || "scan"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    safeNotify("Report downloaded.");
  };

  const handleShare = async () => {
    const summary = `NeuroScan summary: ${predictedLabel} (${confidenceScore.toFixed(1)}%)`;

    try {
      await navigator.clipboard.writeText(summary);
      safeNotify("Summary copied. You can paste it to share.");
    } catch {
      safeNotify("Share summary could not be copied.");
    }
  };

  const probabilityEntries = analysisData?.probabilities
    ? Object.entries(analysisData.probabilities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([label, pct], index) => ({
          label: toTitleCase(label),
          val: `${Number(pct).toFixed(1)}%`,
          pct: Number(pct),
          color: ["#3b82f6", "#94a3b8", "#cbd5e1", "#e2e8f0"][index]
        }))
    : [
        { label: "Meningioma", val: "98.7%", pct: 98.7, color: "#3b82f6" },
        { label: "Glioma", val: "1.1%", pct: 1.1, color: "#94a3b8" },
        { label: "Pituitary", val: "0.2%", pct: 0.2, color: "#cbd5e1" }
      ];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Clinical Dashboard</h1>
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Patient ID:</span> {patient.patientId || "NS-98341"} &nbsp;|&nbsp;
          <span className="font-semibold">Age:</span> {patient.age || 54} &nbsp;|&nbsp;
          <span className="font-semibold">Scan Type:</span> {patient.scanType || "MRI (T1-Weighted)"} &nbsp;|&nbsp;
          <span className="font-semibold">Date:</span> {patient.date || "Oct 26, 2023"} &nbsp;|&nbsp;
          <span className="font-semibold">Status:</span>{" "}
          <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded">Completed</span>
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-600 tracking-widest uppercase">Uploaded MRI Input</span>
            <div className="flex gap-2 text-gray-400 text-base">
              <button className="hover:text-gray-600" onClick={() => setZoomLevel((value) => Math.min(160, value + 10))}>⊞</button>
              <button
                className="hover:text-gray-600"
                onClick={() => {
                  setZoomLevel(100);
                  setBrightness(70);
                }}
              >
                ⊡
              </button>
              <button className="hover:text-gray-600" onClick={() => safeNotify("Use + / − controls for image inspection.")}>⋯</button>
            </div>
          </div>
          <div className="relative bg-black mx-3 mt-3 rounded overflow-hidden" style={{ aspectRatio: "1" }}>
            <div style={{ filter: `brightness(${brightness}%)`, width: "100%", height: "100%", transform: `scale(${zoomLevel / 100})` }}>
              {imageUrl ? <img src={imageUrl} alt="Uploaded MRI" className="w-full h-full object-cover" /> : <BrainSVG />}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 text-white text-xs font-bold px-4 py-1.5 rounded border border-white/20 tracking-widest">
                BRAIN SCAN UPLOADED
              </div>
            </div>
            <div className="absolute top-2 right-8 bg-blue-600/80 text-white text-xs px-1.5 py-0.5 rounded">MRI</div>
            <div className="absolute right-1 top-8 bottom-8 flex flex-col items-center justify-between">
              <span className="text-white/50 text-xs">+</span>
              <input
                type="range"
                min="20"
                max="150"
                value={brightness}
                onChange={(event) => setBrightness(+event.target.value)}
                className="h-20 accent-blue-400"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
              />
              <span className="text-white/50 text-xs">−</span>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center gap-2 text-gray-500 text-xs">
            <button className="hover:text-gray-800" onClick={() => setBrightness((value) => Math.min(150, value + 10))}>◑</button>
            <button className="hover:text-gray-800" onClick={() => setBrightness((value) => Math.max(20, value - 10))}>◐</button>
            <button className="hover:text-gray-800" onClick={() => setZoomLevel((value) => Math.min(160, value + 10))}>⊖</button>
            <input
              type="range"
              min="70"
              max="160"
              value={zoomLevel}
              onChange={(event) => setZoomLevel(Number(event.target.value))}
              className="flex-1 accent-blue-500 h-1"
            />
            <button className="hover:text-gray-800" onClick={() => setZoomLevel((value) => Math.max(70, value - 10))}>⊕</button>
            <button className="hover:text-gray-800" onClick={() => setSlice((value) => Math.max(1, value - 1))}>‹</button>
            <span className="text-gray-600 font-medium">{slice}/22</span>
            <button className="hover:text-gray-800" onClick={() => setSlice((value) => Math.min(22, value + 1))}>›</button>
          </div>
          <div
            className="mx-3 mb-3 border-2 border-dashed border-gray-300 rounded-lg py-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => navigate?.("upload")}
          >
            <p className="text-sm font-semibold text-gray-600">DRAG & DROP MRI</p>
            <p className="text-xs text-gray-400 mt-0.5">or Click to Upload</p>
          </div>
          <div className="px-3 pb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>MODEL RUNNING INFERENCE...</span>
              <span className="font-bold text-gray-700">100%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div className="h-full bg-blue-500 rounded-full w-full" />
            </div>
          </div>
        </div>

        <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-600 tracking-widest uppercase">AI Analysis Result</span>
          </div>
          <div className="flex gap-3 p-3 flex-1">
            <div className="relative bg-black rounded-lg overflow-hidden flex-shrink-0" style={{ width: "55%", aspectRatio: "1" }}>
              {hasTumor ? <BrainTumorSVG /> : <BrainSVG />}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <div
                  className={`bg-black/65 text-xs font-bold px-3 py-1 rounded tracking-widest ${
                    hasTumor ? "text-red-400 border border-red-500/40" : "text-green-400 border border-green-500/40"
                  }`}
                >
                  {hasTumor ? "TUMOR DETECTED" : "NO TUMOR DETECTED"}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1 pt-1">
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Confidence Score</p>
              <svg viewBox="0 0 140 82" className="w-36 h-20">
                <path d="M 12 74 A 58 58 0 0 1 128 74" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                <path
                  d="M 12 74 A 58 58 0 0 1 128 74"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(confidenceScore / 100) * 181} 181`}
                />
                <text x="70" y="70" textAnchor="middle" fill="#1e293b" fontSize="15" fontWeight="bold">
                  {confidenceScore.toFixed(1)}%
                </text>
              </svg>
              <div className="mt-1 text-center">
                <p className="text-xs text-gray-500">Tumor Type:</p>
                <p className="text-base font-black text-gray-800 tracking-wide">{predictedLabel}</p>
                <p className="text-xs text-blue-500">(Confirmed by AI)</p>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Model:</p>
                  <p className="text-sm font-bold text-gray-700">DenseNet-201</p>
                  <p className="text-xs text-gray-400">(Brain Model V4)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 px-3 pb-3">
            <button
              onClick={handleCopyAiOutput}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              ✏️ AI OUTPUT
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 border border-gray-300 text-gray-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
            >
              🗑 DELETE
            </button>
          </div>

          <div className="border-t border-gray-200 px-3 py-3">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-2">Workflow & Reports</p>
            <div className="flex gap-2">
              <button onClick={handleDownloadReport} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                ⬇ DOWNLOAD AI REPORT (PDF)
              </button>
              <button onClick={handleShare} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                ↗ SHARE WITH SPECIALIST
              </button>
              <button
                onClick={handleClearAll}
                className="px-2 py-2 border border-gray-300 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                CLEAR ALL
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">Analysis Details</p>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Tumor Volume</span>
                <span className="font-semibold text-gray-800">14.2 cm³</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Localization</span>
                <span className="font-semibold text-blue-600 text-xs">Left Frontal Lobe</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">Confidence Chart</p>
            {probabilityEntries.map(({ label, val, pct, color }) => (
              <div key={label} className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{label}</span>
                  <span className="font-semibold">{val}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">Radiologist Notes</p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full h-32 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
