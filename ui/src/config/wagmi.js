import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const redbellyTestnet = defineChain({
  id: 153,
  name: "Redbelly Network Testnet",
  nativeCurrency: { name: "RBNT", symbol: "RBNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://governors.testnet.redbelly.network"] },
  },
  blockExplorers: {
    default: {
      name: "Routescan",
      url: "https://redbelly.testnet.routescan.io",
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "CAT Vault Admin",
  projectId: "b1e42d0cbe4a1c4890e948839b2e7e18",
  chains: [redbellyTestnet],
});

export const EXPLORER_URL = redbellyTestnet.blockExplorers.default.url;

export const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS || "";

export const CAT_VAULT_ABI = [
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "asset",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "totalAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowedJurisdictions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jurisdiction", type: "bytes2" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "checkJurisdiction",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "jurisdiction", type: "bytes2" },
      { name: "allowed", type: "bool" },
      { name: "depositorPath", type: "string" },
    ],
  },
  {
    name: "setJurisdictionAllowed",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jurisdiction", type: "bytes2" },
      { name: "allowed", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "setJurisdictionAllowedBatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jurisdictions", type: "bytes2[]" },
      { name: "allowed", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "businessRegistry",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "individualRegistry",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "JurisdictionAllowlistUpdated",
    inputs: [
      { indexed: true, name: "jurisdiction", type: "bytes2" },
      { indexed: false, name: "allowed", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "JurisdictionChecked",
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "jurisdiction", type: "bytes2" },
      { indexed: false, name: "allowed", type: "bool" },
      { indexed: false, name: "operation", type: "string" },
      { indexed: false, name: "depositorPath", type: "string" },
    ],
  },
];

export const REGISTRY_ABI = [
  {
    name: "getBusinessContractAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "hasBusinessPermission",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ type: "bool" }],
  },
];

export const INDIVIDUAL_REGISTRY_ABI = [
  {
    name: "getIndividualContractAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ type: "address" }],
  },
];

export const BUSINESS_IDENTIFIER_ABI = [
  { name: "companyName", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "identifierType", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "identifier", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "businessAddress", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
];

export const INDIVIDUAL_IDENTIFIER_ABI = [
  { name: "fullName", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "identifierType", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "identifier", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "residentialAddress", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
];

export function isoToBytes2(code) {
  if (!/^[A-Za-z]{2}$/.test(code)) throw new Error("Use a 2-letter ISO code");
  const upper = code.toUpperCase();
  const a = upper.charCodeAt(0);
  const b = upper.charCodeAt(1);
  return `0x${a.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function bytes2ToIso(bytes2) {
  if (!bytes2 || bytes2 === "0x0000") return "n/a";
  const hex = bytes2.replace("0x", "");
  return String.fromCharCode(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16));
}

export const TRACKED_JURISDICTIONS = [
  "US", "AU", "GB", "SG", "DE", "FR", "CN", "HK",
  "CA", "JP", "NZ", "RU", "CH", "NL", "AE", "KR",
];

export const JURISDICTION_NAMES = {
  US: "United States",
  AU: "Australia",
  GB: "United Kingdom",
  SG: "Singapore",
  DE: "Germany",
  FR: "France",
  CN: "China",
  HK: "Hong Kong",
  CA: "Canada",
  JP: "Japan",
  NZ: "New Zealand",
  RU: "Russia",
  CH: "Switzerland",
  NL: "Netherlands",
  AE: "UAE",
  KR: "South Korea",
};
