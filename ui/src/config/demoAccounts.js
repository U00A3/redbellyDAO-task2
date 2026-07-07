import demoAccountsJson from "../../../config/demoAccounts.json";
import { getAddress, isAddress } from "viem";

/** @type {Record<string, { address: string; jurisdiction: string | null; companyName: string | null; linked: boolean }>} */
export const DEMO_ACCOUNTS = Object.fromEntries(
  Object.entries(demoAccountsJson).map(([alias, entry]) => [
    alias,
    { ...entry, address: getAddress(entry.address) },
  ])
);

export const DEMO_ACCOUNT_ALIASES = Object.keys(DEMO_ACCOUNTS);

/**
 * Resolve a preview input to an on-chain wallet address.
 * Accepts demo aliases (Demo1, demo2, …) or a standard 0x address.
 */
export function resolveWalletPreviewInput(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { address: undefined, alias: undefined, invalid: false };
  }

  const aliasKey = DEMO_ACCOUNT_ALIASES.find(
    (key) => key.toLowerCase() === trimmed.toLowerCase()
  );
  if (aliasKey) {
    return {
      address: DEMO_ACCOUNTS[aliasKey].address,
      alias: aliasKey,
      invalid: false,
    };
  }

  if (isAddress(trimmed)) {
    return { address: getAddress(trimmed), alias: undefined, invalid: false };
  }

  return { address: undefined, alias: undefined, invalid: true };
}
