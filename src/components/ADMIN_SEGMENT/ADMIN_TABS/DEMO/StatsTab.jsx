// ADMIN_TABS/DEMO_SEGMENT/StatsTab.jsx
export default function StatsTab() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Stats Sub-Tab</h3>
      <p className="text-sm text-gray-500">
        Another sub-tab inside the Demo segment. Same pattern — pure component,
        no routing, no registry imports.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {[["Total Visits", "24,891"], ["Bounce Rate", "34%"]].map(([label, val]) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}