# Reviewer Guide - Task 2 (revision)

## Task board alignment

This submission maps to **Redbelly DAO Task 2 - Compliant Asset Tokenization (CAT) Vault** as follows.

| Task item | Submission evidence |
|-----------|---------------------|
| ERC-4626 (OpenZeppelin) | `contracts/CATVault.sol` |
| Read jurisdiction from Business Identifier on-chain | `JurisdictionHelper.sol`, `IBusinessIdentifier`, `IBusinessPermissionRegistry` |
| **Individual depositor path** | `IIndividualIdentifier`, `IIndividualPermissionRegistry`, dual-path `resolveJurisdiction` |
| **Admin-configurable allowlist (default deny)** | `allowedJurisdictions`, `setJurisdictionAllowed`, `setJurisdictionAllowedBatch` |
| **Benchmark: US allowed, SG blocked** | `test/CATVault.test.ts` (`allowUsOnly`, SG revert, US business + individual succeed) |
| Denied deposit reverts with jurisdiction error | `JurisdictionBlocked(account, jurisdiction)`; tests + testnet demo |
| Allowed deposit succeeds | tests + testnet deposit txs (business + individual paths) |
| `JurisdictionChecked` on every deposit and withdraw (with `depositorPath`) | `CATVault._enforceJurisdiction`; tests; UI history panel |
| Admin dashboard reflects on-chain admin functions | `ui/` (allowlist, preview, **Jurisdiction check history**, Tailwind layout) |
| Unit tests, >= 90% line coverage | `npm test` (46/46), `npm run coverage` |
| **COMPLIANCE_ROLE (AccessControl)** | `CATVault` — `onlyRole(COMPLIANCE_ROLE)` for allowlist; grantable to multisig/timelock |
| **Jurisdiction cache** | `cachedJurisdictions`; first parse stored, later txs skip `JurisdictionHelper` loops |
| Documentation 8-10 pages + Individual SDK trade-offs | [`docs/guide.md`](docs/guide.md) §3.4 |
| Deploy Redbelly Testnet | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`deployments/redbellyTestnet.json`](deployments/redbellyTestnet.json) |

**Failure criteria avoided:** denied jurisdictions can deposit (tested revert), silent parse failure (reverts `JurisdictionParseFailed`), missing jurisdiction events (asserted in tests + UI history).

---

## Revision summary (reviewer feedback, August 2026)

| Reviewer request | Status |
|------------------|--------|
| Tailwind / component layout + overflow-wrap for labels | Done — Tailwind CSS + `overflow-wrap: anywhere` on stat tiles / containers |
| AccessControl + `COMPLIANCE_ROLE` (deprecate Ownable) | Done — allowlist + cache invalidation gated by `COMPLIANCE_ROLE` |
| Jurisdiction cache `mapping(address => bytes2)` | Done — first parse cached; `refresh` / `invalidate` |

### Previous revision (July 2026)

| Reviewer request | Status |
|------------------|--------|
| Allowlist default deny (not blocklist) | Done — `allowedJurisdictions`, US-only benchmark |
| IndividualOnboardingSDK path + tests | Done — dual-path helper, Demo4, unit tests |
| UI transaction history (`JurisdictionChecked`) | Done — `ui/src/components/JurisdictionHistory.jsx` |
| Expand `docs/guide.md` + Individual trade-offs | Done — §3.4, updated coverage table |
| Coverage report + helper lines 63, 131 | Done — branch **96%+**; CATVault 100% branch |

---

## BusinessOnboardingSDK + Individual path: why the admin UI does not embed them

The task brief references [BusinessOnboardingSDK docs](https://docs.redbelly.network/pages/business-onboarding-sdk/) - that URL returns **404**. Live equivalents:

- [Business onboarding overview](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/business/overview/)
- [Individual onboarding overview](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/individual/overview/)

Both SDK flows require an **Averer API key**. **This submitter does not have that API key**, so neither widget is embedded in the admin dashboard.

### On-chain enforcement (same data the SDKs produce)

```
wallet -> Business registry (first) OR Individual registry (second)
       -> Identifier metadata
       -> JurisdictionHelper -> bytes2 ISO + depositorPath
       -> allowedJurisdictions (default deny)
```

**Jurisdiction preview** calls `checkJurisdiction(address)`. **Jurisdiction check history** indexes `JurisdictionChecked` events.

---

## Live URLs

- **Dashboard:** https://redbelly-dao-task2.vercel.app *(redeploy Vercel after push — `VITE_VAULT_ADDRESS` must match table below)*
- **Explorer:** https://redbelly.testnet.routescan.io
- **RPC:** https://governors.testnet.redbelly.network (chain ID **153**)

## Local verification (authoritative)

```bash
cd task2
npm install
npm test              # 46 tests
npm run coverage      # 95% lines, 96% branch; CATVault 100%
```

## Reviewer walkthrough

### Option A - Live dashboard (~2 minutes)

1. Open https://redbelly-dao-task2.vercel.app
2. **Jurisdiction preview:** `Demo1` → US · allowed · business; `Demo2` → SG · blocked; `Demo4` → US · allowed · individual
3. **Active allowlist:** only `US` allowed
4. **Jurisdiction check history:** rows from verified deposit txs below
5. Labels such as **Individual registry** wrap instead of overflowing the tile

No wallet connect required for preview/history.

### Option B - Your own deploy (full E2E)

```bash
cp .env.example .env
npm install
npm run deploy:testnet
npm run seed:demo
```

### Option C - Unit tests only

```bash
npm test && npm run coverage
```

---

## Testnet contracts (AccessControl + cache deploy)

| Contract | Address |
|----------|---------|
| CATVault | [`0x2985348f5B61B8a4073e9e9489FeF6D0AFc7B61A`](https://redbelly.testnet.routescan.io/address/0x2985348f5B61B8a4073e9e9489FeF6D0AFc7B61A) |
| MockAsset (catUSD) | [`0x1c9F2c14bb93851e3F236Fb91ef150Ba25FacE2F`](https://redbelly.testnet.routescan.io/address/0x1c9F2c14bb93851e3F236Fb91ef150Ba25FacE2F) |
| MockBusinessPermissionRegistry | [`0x7caFa152FE25196f0Ee3568DFAF1686fc6f5EE5A`](https://redbelly.testnet.routescan.io/address/0x7caFa152FE25196f0Ee3568DFAF1686fc6f5EE5A) |
| MockIndividualPermissionRegistry | [`0x8832dc665Cb7164e9C8A6A34230630c071313E44`](https://redbelly.testnet.routescan.io/address/0x8832dc665Cb7164e9C8A6A34230630c071313E44) |
| Vault DEFAULT_ADMIN / COMPLIANCE (deployer) | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

### Verified demo transactions

| Scenario | Tx / result |
|----------|-------------|
| US business deposit (allowed) | [0x65e907…9ea7](https://redbelly.testnet.routescan.io/tx/0x65e9070346bf154ba3a6e3a16070f6f1e6f1e8bebbc5e1b5041be9db05709ea7) |
| SG business deposit (denied) | Reverted `JurisdictionBlocked` |
| US individual deposit (allowed) | [0xd6af0e…8066](https://redbelly.testnet.routescan.io/tx/0xd6af0edb05a3d4d6974e935bfdc43903ee1cd17bed5af722603ed708c4398066) |

Details: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## Documentation index

| Document | Description |
|----------|-------------|
| [`docs/guide.md`](docs/guide.md) | Full technical guide (~10 pages), allowlist, dual-path, Individual SDK trade-offs |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Testnet addresses and demo transactions |

---

## Known limitations

- **No Averer API key:** SDK widgets not embedded; mock registries + `seed:demo` substitute for testnet KYB/KYC.
- **Mock registries:** not production Bootstrap permissions; production adapters included in repo.
- **Allowlist admin:** deployer holds `COMPLIANCE_ROLE` on testnet; grant to a multisig/timelock in production.
