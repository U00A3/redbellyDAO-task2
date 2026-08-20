# Deployment notes

## Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Redbelly Testnet | 153 | https://governors.testnet.redbelly.network |

## Latest testnet deployment (events + allow/block + brand kit)

| Contract | Address |
|----------|---------|
| CATVault | `0x8BF14cba70f156792bd9313CEdCba05ACd60094F` |
| Asset (catUSD) | `0xf5D7D92f5C4AfF56F6b5C99c3C119FBCC7E69B1C` |
| MockBusinessPermissionRegistry | `0x40a0f7B01Ef6A156D6419bB16281916D40caBfc7` |
| MockIndividualPermissionRegistry | `0x02a4Ac4bea74B5Be9F53C22a312b746Ca0741fda` |
| Deployer / DEFAULT_ADMIN + COMPLIANCE_ROLE | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

Bootstrap: `0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5`

Full manifest: [`deployments/redbellyTestnet.json`](../deployments/redbellyTestnet.json)

## Deploy

```bash
cp .env.example .env   # PRIVATE_KEY + REDBELLY_TESTNET_RPC
npm run deploy:testnet
npm run seed:demo
```

## Demo results (verified)

| Scenario | Result |
|----------|--------|
| **US business deposit** (allowed) | [0xf3d6b9…bea3](https://redbelly.testnet.routescan.io/tx/0xf3d6b9771f3e78251ea429c92a0b4cb263239905b68e7585ef0af1ab41bebea3) |
| **SG business deposit** (blocked) | [0x7da923…e436](https://redbelly.testnet.routescan.io/tx/0x7da9233efb9fdefd8c045dc5e07e59ba354756fcaee56191102a6a2cb4e7e436) — receipt includes `JurisdictionChecked(allowed=false)` |
| **US individual deposit** (allowed) | [0x8d594e…fe5b](https://redbelly.testnet.routescan.io/tx/0x8d594e12c920d7f8eae11d96ff1e2b6c92b0010181011f5523041d185205fe5b) |

Policy: US on allowlist; SG on blocklist. Hardhat gas reporter enabled; cached jurisdiction checks assert `gasUsed <= 100000`.

Set `VITE_VAULT_ADDRESS=0x8BF14cba70f156792bd9313CEdCba05ACd60094F` in Vercel / `ui/.env.production`.

UI follows the [Task Board brand kit](https://redbelly-dao-taskboard.vercel.app/brand).

See `REVIEWER.md` for the walkthrough.
