// ADMIN_TABS/CUSTOMER_SEGMENT/CustomerDashboard.jsx
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams }                       from "react-router-dom";
import { useSelector }                           from "react-redux";
import { USER_TAB_REGISTRY }                     from "./userTabRegistry";

const CustomerDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState(
    searchParams.get("ctab") || "customers"
  );

  // Badge counts — read from RTK Query cache, no extra fetches
  const BADGE_MAP = {
    customers: useSelector((s) => {
      const q = s.userAnalyticsApi?.queries ?? {};
      const key = Object.keys(q).find(k => k.startsWith("getAllUsers"));
      return q[key]?.data?.pagination?.total ?? null;
    }),
    carts: useSelector((s) => {
      const q = s.userAnalyticsApi?.queries ?? {};
      const key = Object.keys(q).find(k => k.startsWith("getAllCarts"));
      return q[key]?.data?.pagination?.total ?? null;
    }),
    wishlists: useSelector((s) => {
      const q = s.userAnalyticsApi?.queries ?? {};
      const key = Object.keys(q).find(k => k.startsWith("getAllWishlists"));
      return q[key]?.data?.pagination?.total ?? null;
    }),
  };

  // Sync ctab from URL (handles browser back/forward)
  useEffect(() => {
    const ctabFromUrl = searchParams.get("ctab");
    if (ctabFromUrl && ctabFromUrl !== activeSubTab) {
      setActiveSubTab(ctabFromUrl);
    }
  }, [searchParams]);

  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId);
    // Preserve existing params (tab=customers stays), only update ctab
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("ctab", tabId);
      return next;
    });
  };

  const activeTabConfig = USER_TAB_REGISTRY.find((t) => t.id === activeSubTab);
  const SubTabComponent = activeTabConfig?.component ?? null;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-180px)]">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sticky top-24">

          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-2">
            Customer Segment
          </p>

          <nav className="flex flex-col gap-1">
            {USER_TAB_REGISTRY.map((tab) => {
              const isActive = activeSubTab === tab.id;
              const badge    = BADGE_MAP[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange(tab.id)}
                  className={`
                    flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 text-left
                    ${isActive
                      ? "bg-violet-50 text-violet-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <span className="flex items-center gap-2.5">
                    <svg
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-violet-600" : "text-gray-400"}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </span>

                  {badge != null && badge > 0 && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${isActive ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"}
                    `}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {SubTabComponent && (
            <SubTabComponent onSwitchTab={handleSubTabChange} />
          )}
        </Suspense>
      </div>

    </div>
  );
};

export default CustomerDashboard;