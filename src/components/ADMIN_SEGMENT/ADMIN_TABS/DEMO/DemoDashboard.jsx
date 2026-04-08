// ADMIN_TABS/DEMO_SEGMENT/DemoDashboard.jsx
//
// This file is an exact copy of the CustomerDashboard pattern.
// Every new top-level tab with sub-tabs gets one of these.
// Copy this file, point it at your own registry — done.

import React, { Suspense }  from "react";
import { useSearchParams }  from "react-router-dom";
import { DEMO_TAB_REGISTRY } from "./demoTabRegistry";

const DemoDashboard = () => {
  const [searchParams] = useSearchParams();

  const activeCtab = searchParams.get("ctab") || DEMO_TAB_REGISTRY[0]?.id;

  const activeTabConfig = DEMO_TAB_REGISTRY.find((t) => t.id === activeCtab);
  const SubTabComponent = activeTabConfig?.component ?? null;

  return (
    <div className="w-full">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        {SubTabComponent
          ? <SubTabComponent />
          : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Sub-tab not found
            </div>
          )
        }
      </Suspense>
    </div>
  );
};

export default DemoDashboard;