// roles.js
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for role-based tab access.
// To give a role access to a new tab → just add the tab id here.
// To add a new role → add one new key with its allowed tab ids.
// Nothing else in the codebase needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN:              "admin",
  LISTING_MANAGER:    "listing_manager",
  ORDER_MANAGER:      "order_manager",
  MARKETING_MANAGER:  "marketing_manager",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]:             ["products", "analytics", "archived", "seoanalysis","customers","staff","demo", "orders","support"],
  [ROLES.LISTING_MANAGER]:   ["products", "archived"],
  [ROLES.ORDER_MANAGER]:     ["orders"],
  [ROLES.MARKETING_MANAGER]: ["analytics"],
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]:             "Super Admin",
  [ROLES.LISTING_MANAGER]:   "Listing Manager",
  [ROLES.ORDER_MANAGER]:     "Order Manager",
  [ROLES.MARKETING_MANAGER]: "Marketing Manager",
};    