export default function BrainSVG({ dim = false }) {
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full">
      <rect width="280" height="280" fill="#000" />
      <ellipse cx="140" cy="150" rx="115" ry="120" fill={dim ? "#1c1c1c" : "#1a1a1a"} stroke="#555" strokeWidth="1" />
      <ellipse cx="140" cy="144" rx="96" ry="102" fill={dim ? "#2e2e2e" : "#282828"} />
      <ellipse cx="140" cy="138" rx="76" ry="84" fill={dim ? "#3a3a3a" : "#343434"} />
      <path d="M140 76 Q194 98 192 148 Q191 198 140 216 Q89 198 88 148 Q86 98 140 76" fill={dim ? "#434343" : "#3d3d3d"} />
      <line x1="140" y1="66" x2="140" y2="224" stroke="#2a2a2a" strokeWidth="2" />
      <ellipse cx="112" cy="138" rx="22" ry="26" fill={dim ? "#515151" : "#464646"} />
      <ellipse cx="168" cy="138" rx="22" ry="26" fill={dim ? "#515151" : "#464646"} />
      <ellipse cx="140" cy="178" rx="18" ry="13" fill={dim ? "#5b5b5b" : "#505050"} />
      <ellipse cx="140" cy="110" rx="30" ry="20" fill={dim ? "#494949" : "#444"} />
    </svg>
  );
}
