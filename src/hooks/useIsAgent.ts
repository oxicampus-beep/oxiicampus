import { useDashboardRole } from "@/hooks/useDashboardRole";

/** True when user has agent or active sub-agent dashboard access (store tools, API, etc.). */
export const useIsAgent = () => {
  const { showAgentNav, loading } = useDashboardRole();
  return { isAgent: showAgentNav, loading };
};
