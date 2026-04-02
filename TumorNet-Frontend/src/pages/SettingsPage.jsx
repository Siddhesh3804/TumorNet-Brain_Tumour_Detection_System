import { useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Dr. Ananya Evans",
    email: "evans@neuroscan.ai",
    role: "Senior Radiologist",
    hospital: "Apollo Hospital, Mumbai"
  });
  const [model, setModel] = useState({
    model: "DenseNet-201",
    threshold: 85,
    autoAnalyze: true,
    saveSegmentation: true
  });
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    criticalOnly: false
  });
  const [saved, setSaved] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportData = () => {
    const payload = {
      profile,
      model,
      notifications,
      twoFactor,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "neuroscan-settings.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = () => {
    const confirmed = window.confirm("This will reset local profile/settings data. Continue?");
    if (!confirmed) return;

    setProfile({
      name: "",
      email: "",
      role: "",
      hospital: ""
    });
    setModel({
      model: "DenseNet-201",
      threshold: 85,
      autoAnalyze: true,
      saveSegmentation: true
    });
    setNotifications({
      email: false,
      browser: false,
      criticalOnly: false
    });
    setTwoFactor(false);
  };

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? "translate-x-5" : ""
        }`}
      />
    </button>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4 border-b border-gray-100 pb-2">
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-600 font-medium w-40">{label}</label>
      <div className="flex-1 max-w-xs">{children}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={save}
          className={`text-sm font-bold px-5 py-2 rounded-lg transition-all ${
            saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Section title="Profile Information">
          {[
            { key: "name", label: "Full Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "role", label: "Role", type: "text" },
            { key: "hospital", label: "Hospital", type: "text" }
          ].map(({ key, label, type }) => (
            <Field key={key} label={label}>
              <input
                type={type}
                value={profile[key]}
                onChange={(event) => setProfile((prev) => ({ ...prev, [key]: event.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </Field>
          ))}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{profile.name}</p>
              <p className="text-xs text-gray-500">{profile.role}</p>
              <p className="text-xs text-blue-500">{profile.email}</p>
            </div>
          </div>
        </Section>

        <Section title="AI Model Settings">
          <Field label="Active Model">
            <select
              value={model.model}
              onChange={(event) => setModel((prev) => ({ ...prev, model: event.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option>DenseNet-201 (Brain Model V4)</option>
              <option>ResNet-50 (Brain Model V3)</option>
              <option>EfficientNet-B7 (Beta)</option>
            </select>
          </Field>
          <Field label="Confidence Threshold">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="99"
                value={model.threshold}
                onChange={(event) => setModel((prev) => ({ ...prev, threshold: +event.target.value }))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm font-bold text-gray-700 w-10">{model.threshold}%</span>
            </div>
          </Field>
          <Field label="Auto-Analyze on Upload">
            <Toggle value={model.autoAnalyze} onChange={(value) => setModel((prev) => ({ ...prev, autoAnalyze: value }))} />
          </Field>
          <Field label="Save Segmentation Mask">
            <Toggle
              value={model.saveSegmentation}
              onChange={(value) => setModel((prev) => ({ ...prev, saveSegmentation: value }))}
            />
          </Field>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <strong>DenseNet-201</strong> achieves 98.7% accuracy on T1-Weighted MRI scans for Meningioma detection.
          </div>
        </Section>

        <Section title="Notifications">
          <Field label="Email Alerts">
            <Toggle value={notifications.email} onChange={(value) => setNotifications((prev) => ({ ...prev, email: value }))} />
          </Field>
          <Field label="Browser Notifications">
            <Toggle
              value={notifications.browser}
              onChange={(value) => setNotifications((prev) => ({ ...prev, browser: value }))}
            />
          </Field>
          <Field label="Critical Findings Only">
            <Toggle
              value={notifications.criticalOnly}
              onChange={(value) => setNotifications((prev) => ({ ...prev, criticalOnly: value }))}
            />
          </Field>
        </Section>

        <Section title="Account & Security">
          <Field label="Change Password">
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </Field>
          <Field label="Two-Factor Auth">
            <div className="flex items-center gap-3">
              <Toggle value={twoFactor} onChange={setTwoFactor} />
              <span className="text-xs text-gray-400">Recommended</span>
            </div>
          </Field>
          <Field label="Session Timeout">
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </Field>
          <div className="pt-2 border-t border-gray-100 flex gap-3">
            <button
              onClick={exportData}
              className="flex-1 text-xs font-semibold py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Export Data
            </button>
            <button
              onClick={deleteAccount}
              className="flex-1 text-xs font-semibold py-2 border border-red-300 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
