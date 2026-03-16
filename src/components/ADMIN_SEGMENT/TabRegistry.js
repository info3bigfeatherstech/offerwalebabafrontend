import { lazy } from 'react';

// Lazy load tabs for better performance
const ProductsTab = lazy(() => import('./ADMIN_TABS/ProductsTab'));
const AnalyticsTab = lazy(() => import('./ADMIN_TABS/AnalyticsTab'));
const ArchivedTab = lazy(() => import('./ADMIN_TABS/ArchivedTab'));
const Bulkupload = lazy(() => import('./ADMIN_TABS/BulkUploadTab'));

// Badge selectors for tab counts
export const getProductsBadge = (state) => state.adminGetProducts?.products?.length || 0;
export const getArchivedBadge = (state) => state.adminArchived?.products?.length || 0;
export const getAnalysticsTab = (state) => state.getAnalysticsTab?.products?.length || 2;

// Registry - add new tabs here, that's it
export const TAB_REGISTRY = [
  {
    id: 'products',
    label: 'Products',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    component: ProductsTab,
    badge: getProductsBadge
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    component: AnalyticsTab,
    badge: getAnalysticsTab
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    component: ArchivedTab,
    badge: getArchivedBadge
  },
  {
    id: 'bulkupload',
    label: 'Bulkupload',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    component: Bulkupload,
    badge: null
  },
];