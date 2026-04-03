export default function Badge({ text }) {
  const map = {
    Completed: "bg-green-100 text-green-700",
    Reviewing: "bg-yellow-100 text-yellow-700",
    Pending: "bg-red-100 text-red-600"
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[text] || "bg-gray-100 text-gray-600"}`}>
      {text}
    </span>
  );
}
