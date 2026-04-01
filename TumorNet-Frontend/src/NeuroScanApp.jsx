import { useState } from "react";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import AnalysisPage from "./pages/AnalysisPage";
import ArchivePage from "./pages/ArchivePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [analysisData, setAnalysisData] = useState(null);
  const [uiMessage, setUiMessage] = useState("");

  const openAnalysisWithData = (recordData) => {
    setAnalysisData(recordData);
    setPage("analysis");
  };

  const clearAnalysis = () => {
    setAnalysisData(null);
  };

  const notify = (message) => {
    setUiMessage(message);
    setTimeout(() => setUiMessage(""), 2200);
  };

  const navItems = [
    { icon: "🏠", label: "Home", page: "home" },
    { icon: "⬆️", label: "Upload Scan", page: "upload" },
    { icon: "🤖", label: "AI Analysis", page: "analysis" },
    { icon: "📋", label: "Results Archive", page: "archive" },
    { icon: "⚙️", label: "Settings", page: "settings" }
  ];

  const titles = {
    home: "Dashboard",
    upload: "Upload Scan",
    analysis: "AI Analysis",
    archive: "Results Archive",
    settings: "Settings"
  };

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage navigate={setPage} />;
      case "upload":
        return <UploadPage navigate={setPage} onAnalysisReady={setAnalysisData} />;
      case "analysis":
        return (
          <AnalysisPage
            analysisData={analysisData}
            navigate={setPage}
            onClearAnalysis={clearAnalysis}
            onNotify={notify}
          />
        );
      case "archive":
        return <ArchivePage navigate={setPage} onOpenRecord={openAnalysisWithData} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <HomePage navigate={setPage} />;
    }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-gray-100 overflow-hidden text-sm">
      <aside className="w-48 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="text-blue-400 text-xl">🧠</span>
          <span className="text-white font-bold text-base tracking-wide">NeuroScan AI</span>
        </div>
        <nav className="flex-1 px-2 flex flex-col gap-1 mt-2">
          {navItems.map(({ icon, label, page: navPage }) => (
            <button
              key={navPage}
              onClick={() => setPage(navPage)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm w-full transition-colors ${
                page === navPage
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={() => setPage("upload")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg tracking-wide transition-colors"
          >
            NEW PATIENT SCAN
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 h-12 flex-shrink-0">
          <nav className="flex gap-1 h-full">
            {["Dashboard", "Patient History", "Research", "Support"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 text-sm font-medium h-full border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <div className="relative cursor-pointer">
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center leading-none">
                3
              </span>
            </div>
            <img
              src="https://ui-avatars.com/api/?name=Dr+Evans&background=0369a1&color=fff&size=32"
              alt="avatar"
              className="w-8 h-8 rounded-full cursor-pointer"
            />
          </div>
        </header>

        <div className="bg-white border-b border-gray-100 px-6 py-1.5 flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => setPage("home")}>
            Home
          </span>
          {page !== "home" && (
            <>
              <span>›</span>
              <span className="text-gray-700 font-medium">{titles[page]}</span>
            </>
          )}
        </div>

        {uiMessage && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 font-medium">{uiMessage}</div>
        )}

        <div className="flex-1 overflow-y-auto">{renderPage()}</div>
      </div>
    </div>
  );
}
