import { useRef, useState } from "react";
import BrainSVG from "../components/brain/BrainSVG";
import { API_BASE_URL } from "../config/api";

export default function UploadPage({ navigate, onAnalysisReady }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState("");
  const fileRef = useRef();

  const [form, setForm] = useState({
    patientId: "",
    name: "",
    age: "",
    date: "",
    scanType: "MRI (T1-Weighted)"
  });

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview("dicom");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const runUpload = async () => {
    if (!file) return;

    setApiError("");
    setUploading(true);
    setProgress(5);

    const formData = new FormData();
    formData.append("file", file);

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 8;
      setProgress(Math.min(90, Math.round(currentProgress)));
    }, 150);

    try {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Prediction request failed");
      }

      const result = await response.json();
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);

      onAnalysisReady({
        ...result,
        patient: form,
        image_url_full: `${API_BASE_URL}${result.image_url}`
      });

      navigate("analysis");
    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
      setApiError(error.message || "Unable to upload and analyze this file.");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-gray-800">Upload New Scan</h1>
        <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
          Status: Awaiting Upload
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">Patient Information</p>
            <div className="flex flex-col gap-3">
              {[
                { key: "patientId", label: "Patient ID", placeholder: "NS-98350" },
                { key: "name", label: "Patient Name", placeholder: "Full name" }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Age</label>
                  <input
                    type="number"
                    placeholder="54"
                    value={form.age}
                    onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Scan Type</label>
                <select
                  value={form.scanType}
                  onChange={(event) => setForm((prev) => ({ ...prev, scanType: event.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option>MRI (T1-Weighted)</option>
                  <option>MRI (T2-Weighted)</option>
                  <option>CT Scan</option>
                  <option>fMRI</option>
                  <option>PET Scan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">How It Works</p>
            <ol className="space-y-3">
              {[
                "Fill in patient details.",
                "Upload MRI / CT scan file.",
                "Click Run AI Analysis.",
                "Download or share the report."
              ].map((text, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-xs text-gray-500">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-600 tracking-widest uppercase">Upload MRI Input</span>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            className={`mx-3 mt-3 border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <div className="text-4xl mb-2">{file ? "✅" : "🧲"}</div>
            {file ? (
              <>
                <p className="text-sm font-bold text-green-700">{file.name}</p>
                <p className="text-xs text-green-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB — Ready</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-700">DRAG & DROP MRI FILE</p>
                <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                <p className="text-xs text-gray-400 mt-0.5">.dcm · .nii · .nii.gz · .png · .jpg</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".dcm,.nii,.png,.jpg,.jpeg"
              onChange={(event) => handleFile(event.target.files[0])}
            />
          </div>

          <div className="mx-3 mt-3 bg-black rounded-lg overflow-hidden relative flex items-center justify-center" style={{ aspectRatio: "1" }}>
            {preview && preview !== "dicom" ? (
              <img src={preview} alt="scan" className="w-full h-full object-cover" />
            ) : (
              <div className={preview === "dicom" ? "opacity-50" : "opacity-20"} style={{ width: "100%", height: "100%" }}>
                <BrainSVG dim={!preview} />
              </div>
            )}
            {!preview && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-white/30 text-5xl mb-2">⬆</div>
                <p className="text-white/30 text-xs font-semibold tracking-widest uppercase">No Scan Uploaded</p>
              </div>
            )}
            {preview === "dicom" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white/70 text-sm font-bold">DICOM File Ready</p>
                <p className="text-white/40 text-xs mt-1">{file?.name}</p>
              </div>
            )}
          </div>

          <div className="px-3 py-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{uploading ? "UPLOADING FILE..." : file ? "FILE READY" : "AWAITING FILE..."}</span>
              <span className="font-bold text-gray-700">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="px-3 pb-3">
            <button
              onClick={runUpload}
              disabled={!file || uploading}
              className={`w-full font-bold py-2.5 rounded-lg text-sm transition-colors ${
                file && !uploading
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {uploading ? `Uploading... ${progress}%` : "▶ RUN AI ANALYSIS"}
            </button>
            {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase">AI Analysis Preview</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              {[
                ["📊", "Tumor Volume", "—"],
                ["📍", "Localization", "—"],
                ["🎯", "Confidence", "—%"],
                ["🧬", "Tumor Type", "—"]
              ].map(([icon, label, value]) => (
                <div key={label} className="border border-gray-100 rounded-lg p-2 text-center">
                  <div className="text-gray-300 text-lg">{icon}</div>
                  <div>{label}</div>
                  <div className="text-gray-300 font-bold">{value}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">Upload a scan to see results</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">Radiologist Notes</p>
            <textarea
              placeholder="Add pre-scan notes..."
              className="w-full h-28 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-700 mb-1">💡 Tip</p>
            <p className="text-xs text-blue-600">
              For best results, use T1-Weighted MRI scans with contrast. DenseNet-201 achieves 98%+ accuracy on high-resolution inputs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
