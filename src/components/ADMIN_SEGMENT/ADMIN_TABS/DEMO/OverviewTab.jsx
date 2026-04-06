// ADMIN_TABS/DEMO_SEGMENT/OverviewTab.jsx
// ─────────────────────────────────────────────────────────────────
// This is a demo sub-tab. Replace with your real content.
// Notice: no routing logic, no registry imports — pure UI component.

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Overview Sub-Tab</h3>
        <p className="text-sm text-gray-500">
          This is the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">OverviewTab</code> component
          inside the Demo segment. It has zero routing logic — it's a plain React component.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["Pattern", "Registry", "Dashboard"].map((label, i) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-2xl font-bold text-blue-600">{i + 1}</p>
            <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
            <p className="text-xs text-gray-400 mt-1">
              {i === 0 && "One registry file per segment"}
              {i === 1 && "One dashboard file per segment"}
              {i === 2 && "Sub-tabs are plain components"}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <p className="text-sm font-semibold text-blue-800 mb-2">How to add another sub-tab here</p>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Create your component file (e.g. <code className="bg-blue-100 px-1 rounded text-xs">LogsTab.jsx</code>)</li>
          <li>Add one entry to <code className="bg-blue-100 px-1 rounded text-xs">demoTabRegistry.js</code></li>
          <li>Done — sidebar dropdown updates automatically</li>
        </ol>
      </div>
    </div>
  );
}