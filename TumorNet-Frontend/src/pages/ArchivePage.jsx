import { useState } from "react";
import { ARCHIVE } from "../data/archive";
import BrainSVG from "../components/brain/BrainSVG";
import BrainTumorSVG from "../components/brain/BrainTumorSVG";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";

export default function ArchivePage({ navigate, onOpenRecord }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const statuses = ["All", "Completed", "Reviewing", "Pending"];

  const openRecordAnalysis = (record) => {
    const confidenceNumber = Number.parseFloat(String(record.conf).replace("%", "")) || 0;
    const normalizedLabel =
      record.type.toLowerCase() === "no tumor"
        ? "notumor"
        : record.type.toLowerCase();

    onOpenRecord({
      predicted_label: normalizedLabel,
      confidence_percent: confidenceNumber,
      image_url_full: null,
      probabilities: {
        [normalizedLabel]: confidenceNumber
      },
      patient: {
        patientId: record.id,
        name: record.name,
        age: record.age,
        date: record.date,
        scanType: record.scan
      }
    });
  };
  const filtered = ARCHIVE.filter((record) => {
    const matchFilter = filter === "All" || record.status === filter;
    const query = search.toLowerCase();
    const matchSearch =
      record.id.toLowerCase().includes(query) ||
      record.name.toLowerCase().includes(query) ||
      record.type.toLowerCase().includes(query);

    return matchFilter && matchSearch;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Results Archive</h1>
        <button
          onClick={() => navigate("upload")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + New Scan
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Records" value={ARCHIVE.length} sub="All scans" />
        <StatCard
          label="Completed"
          value={ARCHIVE.filter((record) => record.status === "Completed").length}
          sub=""
          color="text-green-600"
        />
        <StatCard
          label="Under Review"
          value={ARCHIVE.filter((record) => record.status === "Reviewing").length}
          sub=""
          color="text-yellow-600"
        />
        <StatCard
          label="Pending"
          value={ARCHIVE.filter((record) => record.status === "Pending").length}
          sub=""
          color="text-red-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search patient ID, name, finding..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <div className="flex gap-1">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} records</span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-widest">
                <th className="text-left px-4 py-3 font-semibold">Patient ID</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Age</th>
                <th className="text-left px-4 py-3 font-semibold">Scan</th>
                <th className="text-left px-4 py-3 font-semibold">Finding</th>
                <th className="text-left px-4 py-3 font-semibold">Conf.</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelected(record)}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    selected?.id === record.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{record.id}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{record.name}</td>
                  <td className="px-4 py-3 text-gray-500">{record.age}</td>
                  <td className="px-4 py-3 text-gray-500">{record.scan}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${record.type === "No Tumor" ? "text-green-600" : "text-red-500"}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-semibold">{record.conf}</td>
                  <td className="px-4 py-3 text-gray-500">{record.date}</td>
                  <td className="px-4 py-3">
                    <Badge text={record.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openRecordAnalysis(record);
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-56 bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-600 tracking-widest uppercase">Details</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">
                ✕
              </button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden mb-3" style={{ aspectRatio: "1" }}>
              {selected.type !== "No Tumor" ? <BrainTumorSVG /> : <BrainSVG />}
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                ["ID", selected.id],
                ["Name", selected.name],
                ["Age", selected.age],
                ["Scan", selected.scan],
                ["Finding", selected.type],
                ["Volume", selected.vol],
                ["Conf.", selected.conf],
                ["Date", selected.date]
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">{key}</span>
                  <span className={`font-semibold ${key === "Finding" && selected.type !== "No Tumor" ? "text-red-500" : "text-gray-700"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => openRecordAnalysis(selected)}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
            >
              Open Analysis →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
