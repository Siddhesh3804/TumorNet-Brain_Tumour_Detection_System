export default function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-1">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-black ${color || "text-gray-800"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
