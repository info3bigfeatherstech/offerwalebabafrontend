// ADMIN_TABS/DEMO_SEGMENT/SettingsTab.jsx
// (In your real project split this into its own file)
export function SettingsTab() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Settings Sub-Tab</h3>
      <p className="text-sm text-gray-500">
        Third sub-tab. To remove it: delete this file and its entry from{" "}
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">demoTabRegistry.js</code>.
        Nothing else changes.
      </p>
    </div>
  );
}
 
// Make SettingsTab the default export so lazy() works
export default SettingsTab;