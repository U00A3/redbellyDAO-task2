const EMPTY = "0x0000000000000000000000000000000000000000";

export function maskAddress(address) {
  if (!address || address === EMPTY) return "n/a";
  const normalized = address.toLowerCase();
  return `${normalized.slice(0, 6)}∴⟡∴${normalized.slice(-4)}`;
}
