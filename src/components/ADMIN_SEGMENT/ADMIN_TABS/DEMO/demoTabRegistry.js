// ADMIN_TABS/DEMO_SEGMENT/demoTabRegistry.js
//
// ════════════════════════════════════════════════════════════════
//  HOW TO ADD A NEW TOP-LEVEL TAB WITH SUB-TABS — FULL TEMPLATE
// ════════════════════════════════════════════════════════════════
//
// Step 1 — Create this registry file (you are here)
// Step 2 — Create DemoDashboard.jsx (copy CustomerDashboard.jsx, point to this registry)
// Step 3 — Create each sub-tab component (OverviewTab, StatsTab, etc.)
// Step 4 — Register in TabRegistry.js:
//             import { DEMO_TAB_REGISTRY } from "./ADMIN_TABS/DEMO_SEGMENT/demoTabRegistry";
//             { id: "demo", component: DemoDashboard, subItems: DEMO_TAB_REGISTRY }
//
// That's it. The sidebar dropdown appears automatically. Nothing else changes.
// ════════════════════════════════════════════════════════════════

import { lazy } from "react";

const OverviewTab  = lazy(() => import("./OverviewTab"));
const StatsTab     = lazy(() => import("./StatsTab"));
const SettingsTab  = lazy(() => import("./SettingsTab"));

export const DEMO_TAB_REGISTRY = [
  {
    id:        "overview",
    label:     "Overview",
    icon:      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    component: OverviewTab,
  },
  {
    id:        "stats",
    label:     "Stats",
    icon:      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    component: StatsTab,
  },
  {
    id:        "settings",
    label:     "Settings",
    icon:      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    component: SettingsTab,
  },

  // ── Add more sub-tabs here ────────────────────────────────────
  // {
  //   id:        "logs",
  //   label:     "Logs",
  //   icon:      "...svg path...",
  //   component: lazy(() => import("./LogsTab")),
  // },
];