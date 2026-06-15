export type DataPackage = {
  id: string;
  network: string;
  size_gb: number;
  user_price: number;
  agent_price: number;
  validity: string;
  active?: boolean;
};

export function resolvePackagePrice(pkg: DataPackage, isAgent: boolean): number {
  return Number(isAgent ? pkg.agent_price : pkg.user_price);
}

export function withResolvedPrice<T extends DataPackage>(pkg: T, isAgent: boolean): T & { price: number } {
  return { ...pkg, price: resolvePackagePrice(pkg, isAgent) };
}
