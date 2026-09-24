import { createContext, useContext } from "react";

const AdminPreviewContext = createContext(false);

export const AdminPreviewProvider = AdminPreviewContext.Provider;

export function useAdminPreview() {
  return useContext(AdminPreviewContext);
}
