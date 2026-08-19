# Deployment notes

## Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Redbelly Testnet | 153 | https://governors.testnet.redbelly.network |

## Latest testnet deployment (AccessControl + jurisdiction cache)

| Contract | Address |
|----------|---------|
| CATVault | `0x2985348f5B61B8a4073e9e9489FeF6D0AFc7B61A` |
| Asset (catUSD) | `0x1c9F2c14bb93851e3F236Fb91ef150Ba25FacE2F` |
| MockBusinessPermissionRegistry | `0x7caFa152FE25196f0Ee3568DFAF1686fc6f5EE5A` |
| MockIndividualPermissionRegistry | `0x8832dc665Cb7164e9C8A6A34230630c071313E44` |
| Deployer / DEFAULT_ADMIN + COMPLIANCE_ROLE | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

Bootstrap: `0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5`

Full manifest: [`deployments/redbellyTestnet.json`](../deployments/redbellyTestnet.json)

## Deploy

```bash
cp .env.example .env   # PRIVATE_KEY + REDBELLY_TESTNET_RPC
npm run deploy:testnet
npm run seed:demo      # US-only allowlist, link Demo1–Demo4, verify US ok / SG revert
```

## Demo results (verified)

| Scenario | Result |
|----------|--------|
| **US business deposit** (allowed) | [0x65e907…9ea7](https://redbelly.testnet.routescan.io/tx/0x65e9070346bf154ba3a6e3a16070f6f1e6f1e8bebbc5e1b5041be9db05709ea7) — `depositorPath: business` |
| **SG business deposit** (denied) | Reverted `JurisdictionBlocked` (US-only allowlist; cache invalidated before retry) |
| **US individual deposit** (allowed) | [0xd6af0e…8066](https://redbelly.testnet.routescan.io/tx/0xd6af0edb05a3d4d6974e935bfdc43903ee1cd17bed5af722603ed708c4398066) — `depositorPath: individual` |

Allowlist policy: `setJurisdictionAllowed(US, true)` only — **default deny** for all other jurisdictions.

Note: On Redbelly testnet only permissioned wallets can send transactions. `seed:demo` uses the deployer wallet for on-chain demo calls.

## Reviewer quick demo (UI aliases)

After `npm run seed:demo`, the admin UI **Jurisdiction preview** accepts demo aliases:

| Alias | Path | Jurisdiction | Expected (US-only allowlist) |
|-------|------|--------------|------------------------------|
| `Demo1` | business | US | allowed |
| `Demo2` | business | SG | blocked |
| `Demo3` | — | unlinked | parse failure |
| `Demo4` | individual | US | allowed |

**Jurisdiction check history** panel lists on-chain `JurisdictionChecked` events (ISO, status, operation, path).

Set `VITE_VAULT_ADDRESS=0x2985348f5B61B8a4073e9e9489FeF6D0AFc7B61A` in Vercel / `ui/.env.production`.

See `docs/guide.md` §7.1 for the full reviewer walkthrough.
