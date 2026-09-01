export function calculatePackageCount(quantity: number, itemsPerPackage: number): number {
  return itemsPerPackage > 0 ? Math.floor(quantity / itemsPerPackage) : 0;
}
