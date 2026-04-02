import { ARCHIVE } from "../data/archive";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";

export default function HomePage({ navigate }) {
  const recent = ARCHIVE.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white flex items-center justify-between shadow">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Welcome back, Dr. Evans 👋</h2>
          <p className="text-blue-100 text-sm mt-1">
            You have <span className="font-bold text-white">3 scans</span> awaiting review today.
          </p>
        </div>
        <button
          onClick={() => navigate("upload")}
          className="bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow"
        >
          + New Patient Scan
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Scans" value="248" sub="All time" color="text-gray-800" />
        <StatCard label="Completed Today" value="12" sub="Oct 26, 2023" color="text-blue-600" />
        <StatCard label="Tumors Detected" value="37" sub="This month" color="text-red-500" />
        <StatCard label="Avg Confidence" value="96.4%" sub="Model accuracy" color="text-green-600" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: "⬆️", label: "Upload MRI Scan", page: "upload", color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
            { icon: "🤖", label: "View AI Analysis", page: "analysis", color: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
            { icon: "📋", label: "Results Archive", page: "archive", color: "bg-green-50 border-green-200 hover:bg-green-100" },
            { icon: "⚙️", label: "Settings", page: "settings", color: "bg-gray-50 border-gray-200 hover:bg-gray-100" }
          ].map(({ icon, label, page, color }) => (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={`border rounded-xl p-5 text-center transition-all cursor-pointer ${color}`}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-sm font-semibold text-gray-700">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Recent Scans</h3>
          <button onClick={() => navigate("archive")} className="text-xs text-blue-600 hover:underline font-medium">
            View All →
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-widest">
                <th className="text-left px-4 py-2.5 font-semibold">Patient ID</th>
                <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold">Scan Type</th>
                <th className="text-left px-4 py-2.5 font-semibold">Finding</th>
                <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((record, index) => (
                <tr
                  key={record.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "" : "bg-gray-50/30"}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{record.id}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{record.name}</td>
                  <td className="px-4 py-3 text-gray-500">{record.scan}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${record.type === "No Tumor" ? "text-green-600" : "text-red-500"}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{record.date}</td>
                  <td className="px-4 py-3">
                    <Badge text={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
