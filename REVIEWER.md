# Reviewer Guide - Task 2 (revision)

## Task board alignment

This submission maps to **Redbelly DAO Task 2 - Compliant Asset Tokenization (CAT) Vault** as follows.

| Task item | Submission evidence |
|-----------|---------------------|
| ERC-4626 (OpenZeppelin) | `contracts/CATVault.sol` |
| Read jurisdiction from Business Identifier on-chain | `JurisdictionHelper.sol`, `IBusinessIdentifier`, `IBusinessPermissionRegistry` |
| **Individual depositor path** | `IIndividualIdentifier`, `IIndividualPermissionRegistry`, dual-path `resolveJurisdiction` |
| **Admin-configurable allowlist + blocklist** | `allowedJurisdictions`, `blockedJurisdictions`, setters + batch |
| **Benchmark: US allowed, SG blocked** | seed + tests; SG blocked deposit leaves event in receipt |
| Denied deposit does not mint; hard check reverts | soft-reject `deposit`/`withdraw` return `0`; `requireJurisdictionAllowed` → `JurisdictionBlocked` |
| Allowed deposit succeeds | tests + testnet deposit txs (business + individual) |
| `JurisdictionChecked` on **every** attempt (incl. blocked) | external `recordJurisdictionCheck`; tests; UI history; [SG tx](https://redbelly.testnet.routescan.io/tx/0x7da9233efb9fdefd8c045dc5e07e59ba354756fcaee56191102a6a2cb4e7e436) |
| Admin dashboard + Task Board brand kit | `ui/` Kinetic Consensus tokens, DAO logos, allow/block editor, history |
| Unit tests, >= 90% line coverage, gas ≤100k | `npm test` (52), `npm run coverage` + gas assertions |
| **COMPLIANCE_ROLE (AccessControl)** | `onlyRole(COMPLIANCE_ROLE)` for allow/block; grantable to multisig/timelock |
| **Jurisdiction cache** | `cachedJurisdictions`; first parse stored, later txs skip helper loops |
| Documentation 8-10 pages + Individual SDK trade-offs | [`docs/guide.md`](docs/guide.md) §3.4 |
| Deploy Redbelly Testnet | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`deployments/redbellyTestnet.json`](deployments/redbellyTestnet.json) |

**Failure criteria avoided:** denied jurisdictions cannot mint shares (tested soft-reject + `requireJurisdictionAllowed` revert); silent parse failure (`JurisdictionParseFailed`); missing jurisdiction events on blocked attempts (receipt log asserted in tests + [SG demo tx](https://redbelly.testnet.routescan.io/tx/0x7da9233efb9fdefd8c045dc5e07e59ba354756fcaee56191102a6a2cb4e7e436)).

---

## Revision summary (reviewer feedback, August 2026 - round 2)

| Reviewer request | Status |
|------------------|--------|
| Events for **blocked** deposit/withdraw attempts | Done — external `recordJurisdictionCheck` so `JurisdictionChecked(allowed=false)` stays in the receipt (EVM discards logs on revert) |
| Configurable **allowlist and blocklist** | Done — `allowedJurisdictions` + `blockedJurisdictions` |
| Gas ceiling 100000 verified | Done — hardhat-gas-reporter + assertions on cached check and `checkJurisdiction` estimateGas |
| Task Board brand kit on live UI | Done — Kinetic Consensus tokens, Be Vietnam Pro / JetBrains Mono, DAO logo |

### Prior items (still in place)

| Reviewer request | Status |
|------------------|--------|
| Tailwind + overflow-wrap | Done |
| AccessControl + COMPLIANCE_ROLE | Done |
| Jurisdiction cache | Done |

### Previous revision (July 2026)

| Reviewer request | Status |
|------------------|--------|
| Allowlist default deny | Done — still default deny; blocklist is an additional explicit deny |
| IndividualOnboardingSDK path + tests | Done — dual-path helper, Demo4, unit tests |
| UI transaction history (`JurisdictionChecked`) | Done — includes blocked attempts |
| Expand `docs/guide.md` + Individual trade-offs | Done — §3.4, allow+block, event soft-reject |
| Coverage report + helper edges | Done — overall lines ≥90%; helper 100% lines |

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
       -> allowedJurisdictions (default deny) AND NOT blockedJurisdictions
```

**Jurisdiction preview** calls `checkJurisdiction(address)`. **Jurisdiction check history** indexes `JurisdictionChecked` events (allowed and blocked).

---

## Live URLs

- **Dashboard:** https://redbelly-dao-task2.vercel.app *(redeploy Vercel after push — `VITE_VAULT_ADDRESS` must match table below)*
- **Explorer:** https://redbelly.testnet.routescan.io
- **RPC:** https://governors.testnet.redbelly.network (chain ID **153**)

## Local verification (authoritative)

```bash
cd task2
npm install
npm test              # 52 tests
npm run coverage      # gas reporter also prints method costs
```

## Reviewer walkthrough

### Option A - Live dashboard (~2 minutes)

1. Open https://redbelly-dao-task2.vercel.app
2. **Jurisdiction preview:** `Demo1` → US · allowed · business; `Demo2` → SG · blocked; `Demo4` → US · allowed · individual
3. **Active allowlist / blocklist:** `US` allowed; `SG` blocked
4. **Jurisdiction check history:** includes blocked SG attempt (event in receipt)
5. Brand: Kinetic Consensus (DAO logo, Be Vietnam Pro / JetBrains Mono) — matches [Task Board brand kit](https://redbelly-dao-taskboard.vercel.app/brand)

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

## Testnet contracts (events + allow/block deploy)

| Contract | Address |
|----------|---------|
| CATVault | [`0x8BF14cba70f156792bd9313CEdCba05ACd60094F`](https://redbelly.testnet.routescan.io/address/0x8BF14cba70f156792bd9313CEdCba05ACd60094F) |
| MockAsset (catUSD) | [`0xf5D7D92f5C4AfF56F6b5C99c3C119FBCC7E69B1C`](https://redbelly.testnet.routescan.io/address/0xf5D7D92f5C4AfF56F6b5C99c3C119FBCC7E69B1C) |
| MockBusinessPermissionRegistry | [`0x40a0f7B01Ef6A156D6419bB16281916D40caBfc7`](https://redbelly.testnet.routescan.io/address/0x40a0f7B01Ef6A156D6419bB16281916D40caBfc7) |
| MockIndividualPermissionRegistry | [`0x02a4Ac4bea74B5Be9F53C22a312b746Ca0741fda`](https://redbelly.testnet.routescan.io/address/0x02a4Ac4bea74B5Be9F53C22a312b746Ca0741fda) |
| Vault DEFAULT_ADMIN / COMPLIANCE (deployer) | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

### Verified demo transactions

| Scenario | Tx / result |
|----------|-------------|
| US business deposit (allowed) | [0xf3d6b9…bea3](https://redbelly.testnet.routescan.io/tx/0xf3d6b9771f3e78251ea429c92a0b4cb263239905b68e7585ef0af1ab41bebea3) |
| SG business deposit (blocked, event in receipt) | [0x7da923…e436](https://redbelly.testnet.routescan.io/tx/0x7da9233efb9fdefd8c045dc5e07e59ba354756fcaee56191102a6a2cb4e7e436) |
| US individual deposit (allowed) | [0x8d594e…fe5b](https://redbelly.testnet.routescan.io/tx/0x8d594e12c920d7f8eae11d96ff1e2b6c92b0010181011f5523041d185205fe5b) |

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
