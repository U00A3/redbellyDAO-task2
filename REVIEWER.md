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
| Admin dashboard reflects on-chain admin functions | `ui/` (allowlist, preview, **Jurisdiction check history**) |
| Unit tests, >= 90% line coverage | `npm test` (40/40), `npm run coverage` (94% lines, **96% branch**; CATVault 100% branch) |
| Documentation 8-10 pages + Individual SDK trade-offs | [`docs/guide.md`](docs/guide.md) §3.4 |
| Deploy Redbelly Testnet | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`deployments/redbellyTestnet.json`](deployments/redbellyTestnet.json) |

**Failure criteria avoided:** denied jurisdictions can deposit (tested revert), silent parse failure (reverts `JurisdictionParseFailed`), missing jurisdiction events (asserted in tests + UI history).

---

## Revision summary (reviewer feedback, July 2026)

| Reviewer request | Status |
|------------------|--------|
| Allowlist default deny (not blocklist) | Done — `allowedJurisdictions`, US-only benchmark |
| IndividualOnboardingSDK path + tests | Done — dual-path helper, Demo4, unit tests |
| UI transaction history (`JurisdictionChecked`) | Done — `ui/src/components/JurisdictionHistory.jsx` |
| Expand `docs/guide.md` + Individual trade-offs | Done — §3.4, updated coverage table |
| Coverage report + helper lines 63, 131 | Done — 40 tests; branch **96%** (was 64%); CATVault 100% branch |

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
npm test              # 40 tests
npm run coverage      # 94% lines, 96% branch; CATVault 100% branch
```

## Reviewer walkthrough

### Option A - Live dashboard (~2 minutes)

1. Open https://redbelly-dao-task2.vercel.app
2. **Jurisdiction preview:** `Demo1` → US · allowed · business; `Demo2` → SG · blocked; `Demo4` → US · allowed · individual
3. **Active allowlist:** only `US` allowed
4. **Jurisdiction check history:** rows from verified deposit txs below

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

## Testnet contracts (revision deploy)

| Contract | Address |
|----------|---------|
| CATVault | [`0xC8A405e8CEB8c2dd2dFC03f1d7DdF9f20bEd964D`](https://redbelly.testnet.routescan.io/address/0xC8A405e8CEB8c2dd2dFC03f1d7DdF9f20bEd964D) |
| MockAsset (catUSD) | [`0xE5278DB20f95e582f9Eff5cb30C414944847EEbC`](https://redbelly.testnet.routescan.io/address/0xE5278DB20f95e582f9Eff5cb30C414944847EEbC) |
| MockBusinessPermissionRegistry | [`0xf6e36ecBe3094872c164654aE6B9F98f43B76b42`](https://redbelly.testnet.routescan.io/address/0xf6e36ecBe3094872c164654aE6B9F98f43B76b42) |
| MockIndividualPermissionRegistry | [`0xDED51Cbba458Ba7F01A011fB3525c5294596383A`](https://redbelly.testnet.routescan.io/address/0xDED51Cbba458Ba7F01A011fB3525c5294596383A) |
| Vault owner | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

### Verified demo transactions

| Scenario | Tx / result |
|----------|-------------|
| US business deposit (allowed) | [0xa9a308…6aad](https://redbelly.testnet.routescan.io/tx/0xa9a3085748a8ebd4aefdefe4996ad15bba70b8ab8c5e38615517e09a3dfe6aad) |
| SG business deposit (denied) | Reverted `JurisdictionBlocked` |
| US individual deposit (allowed) | [0xf45248…31f7](https://redbelly.testnet.routescan.io/tx/0xf452480bea34f8106a5da1428cba37ebaac7e8839dfc0924c2ed0344093331f7) |

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
- **Allowlist admin:** only vault **owner** can submit allowlist transactions on testnet.
