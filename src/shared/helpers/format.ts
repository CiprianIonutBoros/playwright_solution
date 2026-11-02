/** Formats integer cents as the USD string shown by the DemoShop UI, for example 4990 becomes $49.90. */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
