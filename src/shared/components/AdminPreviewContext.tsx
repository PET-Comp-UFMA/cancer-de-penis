import { createContext, useContext } from "react";

// True when a logged-in admin is browsing the public site, so the headers can
// offer a way back to the panel. Filled in _app from the page's `adminPreview` prop.
const AdminPreviewContext = createContext(false);

export const AdminPreviewProvider = AdminPreviewContext.Provider;

export function useAdminPreview() {
  return useContext(AdminPreviewContext);
}
