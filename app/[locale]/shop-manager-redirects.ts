// Mapping of old shop-manager routes to new dashboard routes
// Used by middleware or catch-all redirect page
export const SHOP_MANAGER_REDIRECTS: Record<string, string> = {
  "/shop-manager": "/dashboard",
  "/shop-manager/inventory": "/dashboard/inventory",
  "/shop-manager/inventory/new": "/dashboard/inventory/new",
  "/shop-manager/sales": "/dashboard/sales",
  "/shop-manager/offers": "/dashboard/offers",
  "/shop-manager/messages": "/dashboard/messages",
  "/shop-manager/notifications": "/dashboard/notifications",
  "/shop-manager/analytics": "/dashboard/analytics",
  "/shop-manager/branding": "/dashboard/branding",
  "/shop-manager/plan": "/dashboard/plan",
};
