# Compliant Asset Tokenization (CAT) Vault - Technical Guide

**Task 2 · Redbelly Network · ERC-4626 with jurisdiction enforcement**

---

## 1. Executive summary

Tokenized real-world assets (RWA) frequently require **region-specific transfer and subscription restrictions**. Off-chain compliance databases break DeFi composability because vaults cannot atomically verify eligibility during `deposit()` or `withdraw()`.

This project delivers an **ERC-4626 vault** (`CATVault`) that reads **on-chain business and individual metadata** from Redbelly **Business Identifier** and **Individual Identifier** contracts (deployed after KYB/KYC via the [BusinessOnboardingSDK](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/business/overview/) and [Individual onboarding](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/individual/overview/)) and enforces an **admin-configurable jurisdiction allowlist (default deny)** at the smart-contract layer.

Every deposit and withdrawal:

1. Resolves the depositor through **Business Permission Registry first**, then **Individual Permission Registry** (dual-path).
2. Derives an ISO 3166-1 alpha-2 jurisdiction code via `JurisdictionHelper`.
3. Checks `allowedJurisdictions[jurisdiction]` — **only explicitly allowed regions pass** (default deny).
4. Emits `JurisdictionChecked` with jurisdiction, outcome, operation, and `depositorPath` (`"business"` | `"individual"`).
5. Reverts with `JurisdictionBlocked(account, jurisdiction)` when not allowed.

---

## 2. Problem statement and design goals

| Goal | Implementation |
|------|----------------|
| ERC-4626 composability | Inherit OpenZeppelin `ERC4626` / `ERC20` shares |
| On-chain jurisdiction source | Business Identifier fields (`identifierType`, `identifier`, `businessAddress`) |
| Admin-configurable allowlist (default deny) | `mapping(bytes2 => bool) allowedJurisdictions` + owner functions |
| Dual depositor paths | Business Identifier (institutional) + Individual Identifier (retail) |
| Clear failure modes | Custom errors; no silent parsing failures |
| Observable compliance | `JurisdictionChecked` on every deposit/withdraw |
| Operator UX | React admin dashboard calling real vault functions |

**Non-goals:** This vault does not replace full securities law analysis, off-chain KYC, or ZK eligibility proofs. It composes with Redbelly’s existing business onboarding layer rather than re-implementing KYB.

---

## 3. Redbelly Business Identifier integration

### 3.1 What the Business Identifier stores

After Averer (accredited issuer) completes KYB, Redbelly deploys a **Business Identifier** proxy containing verified corporate metadata ([identifier contract docs](https://vine.redbelly.network/business-verification/identifier-contract/)):

| Field | Example | Compliance use |
|-------|---------|----------------|
| `companyName` | Acme Pty Ltd | Display / audit |
| `incorporatedName` | Acme Pty Ltd | Legal entity name |
| `identifierType` | ISO3166-1, ABN, LEI | Typing of `identifier` |
| `identifier` | AU, 51824753556 | **Primary jurisdiction code when typed as ISO3166-1** |
| `businessAddress` | 100 George St, Sydney NSW 2000, Australia | **Fallback jurisdiction parsing** |
| `isBeneficialOwner` | true | Ownership attestation |

Delegated wallets (authorised representatives / delegates) receive business permission without repeating KYB. The vault checks the **depositor address** (receiver on deposit, owner on withdraw), not `msg.sender` alone, so smart-wallet patterns remain supported.

### 3.2 Resolving wallet → Business Identifier

The [useBusinessDetails](https://docs.redbelly.network/pages/eligibility-sdk/client/hooks/useBusinessDetails/) hook in the Eligibility SDK performs the same resolution client-side. On-chain, the vault uses `IBusinessPermissionRegistry`:

```
Bootstrap.getContractAddress("businessPermission")
        │
        ▼
BusinessPermission.getBusinessContractAddress(wallet)
        │
        ▼
BusinessIdentifier (metadata fields)
```

**Production:** `RedbellyBusinessRegistry` resolves Bootstrap → `businessPermission` on Redbelly mainnet/testnet when registered.

**Local / demo:** `MockBusinessPermissionRegistry` maps wallets to `MockBusinessIdentifier` contracts for reproducible tests and testnet demos when `businessPermission` is not yet configured (currently zero on testnet Bootstrap as of deployment).

### 3.3 Relationship to BusinessOnboardingSDK

**Note on the task brief URL:** Task 2 lists [BusinessOnboardingSDK docs](https://docs.redbelly.network/pages/business-onboarding-sdk/) as a resource. That URL currently returns **404 Not Found** (checked during implementation, June 2026). We therefore followed the **live** Redbelly documentation instead, primarily the [Business onboarding overview](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/business/overview/) and the [useBusinessDetails](https://docs.redbelly.network/pages/eligibility-sdk/client/hooks/useBusinessDetails/) hook docs, which describe the same KYB → Business Identifier flow.

Given that:

- the **BusinessOnboardingSDK** is an off-chain onboarding layer (KYB UX, accredited issuer workflow, automatic Business Identifier deployment), and
- this vault must enforce jurisdiction **inside** `deposit()` / `withdraw()` on-chain,

we decided to:

1. **Integrate at the smart-contract layer** - resolve wallet → Business Identifier via `IBusinessPermissionRegistry` and read metadata fields (`identifierType`, `identifier`, `businessAddress`) with `JurisdictionHelper`. This matches what the SDK exposes to front-ends, without requiring JS inside the vault.
2. **Ship `RedbellyBusinessRegistry`** for production/testnet when Bootstrap registers `businessPermission`, and **`MockBusinessPermissionRegistry` + `MockBusinessIdentifier`** for local tests and testnet demos when that registry is not yet configured (zero address on Bootstrap at deploy time).
3. **Document the mock path explicitly** in §9 so reviewers can reproduce US-allowed / SG-blocked flows without relying on production KYB.

Issuers embed BusinessOnboardingSDK (or Individual onboarding) in their portal; investors then deposit into this vault once their wallet is linked to a deployed Identifier. No SDK call is required from the vault contract itself; only `view` reads of deployed contracts.

### 3.4 IndividualOnboardingSDK path (retail depositors)

Institutional issuers use **BusinessOnboardingSDK** (KYB → Business Identifier). **Retail investors** follow the parallel **Individual onboarding** flow ([Individual overview](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/individual/overview/)), which deploys an **Individual Identifier** with `fullName`, `identifierType`, `identifier`, and `residentialAddress`.

| Aspect | Business path | Individual path |
|--------|---------------|-----------------|
| Onboarding SDK | BusinessOnboardingSDK (Averer KYB) | Individual onboarding (KYC) |
| On-chain contract | Business Identifier | Individual Identifier |
| Registry lookup | `getBusinessContractAddress(wallet)` | `getIndividualContractAddress(wallet)` |
| Address field parsed | `businessAddress` | `residentialAddress` |
| Vault resolution order | **First** (preferred if both linked) | **Second** (fallback) |
| Typical use | Corporate treasury, fund managers | Retail / HNW individuals |

**Trade-offs of dual-path resolution:**

- **Pros:** One vault serves both institutional and retail RWA products without separate share tokens; compliance officers see `depositorPath` in `JurisdictionChecked` events for audit trails.
- **Cons:** Operators must maintain **two** permission registries on Redbelly; if a wallet is linked in both registries, the **business** path wins (documented behaviour — corporate linkage takes precedence).
- **Production:** Both registries resolve via Bootstrap (`businessPermission`, `individualPermission`) when registered on mainnet/testnet.
- **This demo:** `MockBusinessPermissionRegistry` + `MockIndividualPermissionRegistry` with `npm run seed:demo` linking Demo1 (US business), Demo2 (SG business), Demo4 (US individual).

The vault does **not** embed IndividualOnboardingSDK in the admin UI (same rationale as BusinessOnboardingSDK — requires Averer API key). Jurisdiction preview and history panels read the same on-chain resolution path as `deposit()` / `withdraw()`.

### 3.5 Why not call the SDK from the admin UI?

The React admin dashboard calls **vault admin functions** (`setJurisdictionAllowed`, `checkJurisdiction`) directly. Jurisdiction preview uses the same on-chain dual-path resolution as the vault. A **Jurisdiction check history** panel indexes `JurisdictionChecked` logs (account, ISO, allowed/blocked, operation, depositorPath). That keeps the UI aligned with enforceable contract behaviour rather than duplicating SDK client logic in a separate compliance path.

---

## 4. Jurisdiction data approach (chosen strategy)

We deliberately avoid storing jurisdiction in a separate off-chain database. Instead, jurisdiction is **derived deterministically** from Business Identifier fields already attested during KYB.

### 4.1 Resolution order

1. **ISO3166-1 typed identifier (preferred)**  
   When `identifierType` ∈ {`ISO3166-1`, `ISO3166`, `COUNTRY`} (case-insensitive), use the first two characters of `identifier` as uppercase ISO code.  
   Example: `identifierType = ISO3166-1`, `identifier = au` → `AU`.

2. **Two-letter identifier fallback**  
   If `identifier` is exactly two alphabetic characters, treat it as ISO code (handles LEI-adjacent registrations that store country inline).

3. **Registered business address parsing**  
   Parse `businessAddress`:
   - Parenthesized ISO suffix: `"Level 3, Sydney (AU)"` → `AU`
   - Trailing country name after last comma: `"… Singapore"` → `SG`
   - Built-in country name → ISO map (Australia, United States, Singapore, …)

4. **Hard failure**  
   If no code can be derived, revert `JurisdictionParseFailed(account, reason)`. The vault **never** defaults to “allow” on ambiguous metadata.

### 4.4 Allowlist policy (default deny)

Unlike a blocklist (deny specific regions, allow everything else), this vault implements **default deny**:

- `allowedJurisdictions[code] == false` for all codes until the owner explicitly allows them.
- Benchmark scenario (reviewer revision): `allowedJurisdictions["US"] = true` only → US deposits succeed, SG deposits revert.
- Regulatory framing: suitable for products licensed in **enumerated** jurisdictions (e.g. Reg D / qualified jurisdictions only).

### 4.5 Why bytes2 jurisdiction keys

ISO 3166-1 alpha-2 codes fit in `bytes2`, minimizing storage gas for the allowlist mapping and enabling compact events. Admin UI converts human-readable `US` ↔ `0x5553` via helpers.

### 4.6 Regulatory rationale

Using issuer-verified registration data ties restrictions to **the same source of truth** investors already trust for business legitimacy on Redbelly. When a business updates its registered address on-chain (via accredited issuer re-verification), future deposits automatically reflect the new jurisdiction without redeploying the vault.

---

## 5. Smart contract architecture

### 5.1 CATVault

`CATVault` extends OpenZeppelin `ERC4626` and `Ownable`.

**Immutable dependencies:**

- `IBusinessPermissionRegistry businessRegistry`
- `IIndividualPermissionRegistry individualRegistry`

**Admin functions (owner):**

- `setJurisdictionAllowed(bytes2 jurisdiction, bool allowed)`
- `setJurisdictionAllowedBatch(bytes2[] jurisdictions, bool allowed)`

**Public views:**

- `checkJurisdiction(address account) → (bytes2 jurisdiction, bool allowed, string depositorPath)`
- `allowedJurisdictions(bytes2)`

**Hooks overridden:**

- `_deposit` → jurisdiction check on `receiver`
- `_withdraw` → jurisdiction check on `owner`

### 5.2 Events and errors

```solidity
event JurisdictionChecked(
    address indexed account,
    bytes2 indexed jurisdiction,
    bool allowed,
    string operation,      // "deposit" | "withdraw"
    string depositorPath   // "business" | "individual"
);

event JurisdictionAllowlistUpdated(bytes2 indexed jurisdiction, bool allowed);

error JurisdictionBlocked(address account, bytes2 jurisdiction);
error JurisdictionParseFailed(address account, string reason);
error InvalidJurisdictionCode();
```

Blocked deposits **revert before** asset transfer; allowed deposits emit `JurisdictionChecked` with `allowed = true` then proceed.

### 5.3 Interface layer

| File | Purpose |
|------|---------|
| `IBusinessIdentifier.sol` | View API for Business Identifier metadata |
| `IBusinessPermissionRegistry.sol` | Wallet → business contract resolution |
| `IBusinessPermission.sol` | Redbelly BusinessPermission contract surface |
| `IBootstrap.sol` | Bootstrap registry lookup |
| `IIndividualIdentifier.sol` | View API for Individual Identifier metadata |
| `IIndividualPermissionRegistry.sol` | Wallet → individual contract resolution |
| `JurisdictionHelper.sol` | Pure parsing + dual-path registry orchestration |

### 5.4 Mock contracts (testing / testnet demo)

| Contract | Role |
|----------|------|
| `MockBusinessIdentifier` | Configurable KYB metadata |
| `MockBusinessPermissionRegistry` | Link/unlink business wallets |
| `MockIndividualIdentifier` | Configurable KYC metadata |
| `MockIndividualPermissionRegistry` | Link/unlink individual wallets |
| `MockBusinessPermission` | Simulates on-chain BusinessPermission |
| `MockAsset` | ERC-20 underlying for vault |
| `MockBootstrap` | Configurable Bootstrap for registry tests |

---

## 6. ERC-4626 behaviour

The vault is a standard tokenized vault over a single underlying `IERC20`:

- `deposit` / `mint` trigger jurisdiction checks on the **share recipient**.
- `withdraw` / `redeem` trigger checks on the **share owner**.
- Share accounting, `totalAssets`, previews, and conversions follow OpenZeppelin defaults (1:1 at empty vault in tests).

Integrators (aggregators, lending markets) can treat shares as ordinary ERC-4626 tokens while relying on deposit-time compliance.

---

## 7. Admin dashboard

The React app in `ui/` is a **mockup wired to real contract ABIs**:

| UI panel | On-chain function |
|----------|-------------------|
| Vault overview | `totalAssets()`, `businessRegistry()`, `individualRegistry()` |
| Jurisdiction preview | `checkJurisdiction(address)` + registry/identifier reads; **Demo1–Demo4** aliases (§7.1) |
| Active allowlist | `allowedJurisdictions(bytes2)` per tracked ISO code |
| Allow / deny | `setJurisdictionAllowed`, `setJurisdictionAllowedBatch` |
| Jurisdiction check history | `JurisdictionChecked` event logs (account, ISO, status, op, path) |

Configure `VITE_VAULT_ADDRESS` after deployment. Only the vault **owner** wallet can submit allowlist transactions; other connected wallets can still preview jurisdiction outcomes and view transaction history.

### 7.1 Reviewer quick demo (testnet add-on)

This is **not part of the core Task 2 deliverable** - it makes the hosted admin UI easier to review without running Hardhat. Reviewers who prefer a full local flow can still deploy contracts and link wallets themselves (§9).

**Demo aliases** in the Jurisdiction preview panel map to fixed wallet addresses pre-linked in mock registries when you run `npm run seed:demo`:

| Alias | Wallet | Path | Jurisdiction | Preview (US-only allowlist) |
|-------|--------|------|--------------|-------------------------------|
| `Demo1` | `0x…D001` | business | US | **allowed** |
| `Demo2` | `0x…D002` | business | SG | **blocked** |
| `Demo3` | `0x…D003` | — | *(unlinked)* | parse failure |
| `Demo4` | `0x…D004` | individual | US | **allowed** (retail path) |

**Reviewer steps (no wallet connect required):**

1. Open the deployed admin UI (or `npm run dev` in `ui/` with `VITE_VAULT_ADDRESS` set).
2. Confirm **Active allowlist** shows only `US` allowed (default after `seed:demo`).
3. In **Jurisdiction preview**, type `Demo1` → expect `US · allowed · business`.
4. Type `Demo2` → expect `SG · blocked`.
5. Type `Demo4` → expect `US · allowed · individual`.
6. Optional: type `Demo3` → expect “not linked” message.
7. Check **Jurisdiction check history** after a test deposit — rows show ISO, allowed/blocked, operation, and depositor path.

Aliases are resolved in the UI to real addresses; the panel still calls on-chain `checkJurisdiction` - it is not a mocked response.

Configuration lives in `config/demoAccounts.json` (shared by the seed script and UI).

### 7.2 Transaction history view (deliverable 3)

The **Jurisdiction check history** panel (`ui/src/components/JurisdictionHistory.jsx`) turns the on-chain audit trail into a per-transaction table. It is the compliance-officer view: *which wallet attempted what, from which jurisdiction, on which path, and was it allowed?*

**Data source.** Every `deposit`, `mint`, `withdraw`, and `redeem` emits:

```solidity
event JurisdictionChecked(
    address indexed account,
    bytes2  indexed jurisdiction,
    bool    allowed,
    string  operation,     // "deposit" | "withdraw"
    string  depositorPath  // "business" | "individual"
);
```

**Indexing strategy.** The component uses two complementary paths:

1. **Backfill** — `publicClient.getLogs({ address, event, fromBlock: 0n, toBlock: "latest" })` fetches the full history when the panel mounts, decoding the ABI event into rows.
2. **Live tail** — `useWatchContractEvent` subscribes to new `JurisdictionChecked` logs and prepends them, deduplicating by `txHash + account + operation` so a log seen in both backfill and subscription is not double-counted.

**Rendered columns:** masked account, ISO code (decoded from `bytes2` via `bytes2ToIso`), an allowed/blocked status badge, operation, depositor path, and an explorer link to the transaction. Rows are capped at 50 (newest first) to keep the DOM light; the explorer link lets a reviewer drill into raw calldata and logs.

**Why events, not storage reads.** The mapping `allowedJurisdictions` only tells you the *current* policy. The history view answers *what actually happened over time* — including attempts that reverted are visible on the explorer, while successful checks are captured as events. This separation (policy state vs. audit log) mirrors how a real compliance dashboard is built: cheap on-chain events + client-side indexing, with the option to graduate to a subgraph for production-scale querying (§11).

**Production note.** For high-volume vaults, replace the `fromBlock: 0n` backfill with a bounded range or a subgraph/Dune query; the event schema is designed to be subgraph-friendly (indexed `account` and `jurisdiction` topics enable efficient filtering by wallet or region).

---

## 8. Testing and coverage

Test suite: Hardhat + TypeScript + `@nomicfoundation/hardhat-network-helpers`.

**Scenarios covered:**

- **Allowlist (default deny):** US allowed / SG blocked benchmark
- **Dual-path:** business depositor, individual depositor, business-preferred when both linked
- Allowed jurisdiction deposit / withdraw + `JurisdictionChecked` with `depositorPath`
- Denied jurisdiction deposit revert with `JurisdictionBlocked`
- Allowlist admin ACL (owner-only)
- ISO3166-1, address tail (line 131), short identifier revert (line 63), parenthesized code parsing
- Parse failure reverts
- `RedbellyBusinessRegistry` with configured BusinessPermission
- ERC-4626 mint/redeem paths

### 8.1 Test matrix

| # | Suite | Test | Requirement exercised |
|---|-------|------|-----------------------|
| 1 | allowlist | allow / revoke jurisdiction | admin allowlist mutation |
| 2 | allowlist | rejects zero jurisdiction code | input validation |
| 3 | allowlist | batch allowlist updates | `setJurisdictionAllowedBatch` |
| 4 | allowlist | restricts changes to owner | `onlyOwner` ACL |
| 5 | allowlist | **US allowed, SG blocked benchmark** | deliverable 1 (default deny) |
| 6 | dual-path | resolves business depositor path | deliverable 4 |
| 7 | dual-path | resolves individual depositor path | deliverable 4 |
| 8 | dual-path | business preferred when both linked | documented precedence |
| 9 | checkJurisdiction | parse from business address (no type) | address fallback |
| 10 | checkJurisdiction | revert when no identifier linked | parse failure |
| 11 | deposits | US business succeeds + event | allowed deposit |
| 12 | deposits | US individual retail succeeds | individual path deposit |
| 13 | deposits | SG business reverts | blocked deposit |
| 14 | deposits | unparseable metadata reverts | `JurisdictionParseFailed` |
| 15 | deposits | non-allowlisted jurisdiction reverts | default deny |
| 16 | withdrawals | allowed withdrawal + event | withdraw check |
| 17 | withdrawals | reverts after jurisdiction delisted | policy change enforcement |
| 18-19 | ERC-4626 | asset/convert, mint/redeem flows | EIP-4626 compliance |
| 20-21 | helper | parenthesized code, lowercase ISO | parsing branches |
| 22 | helper | **short ISO3166-1 reverts (line 63)** | deliverable 5 branch |
| 23 | helper | **two-letter address tail (line 131)** | deliverable 5 branch |
| 24 | helper | two-letter identifier fallback | LEI-adjacent |
| 25 | helper | country-name tail mapping | address parsing |
| 26 | helper | **full country-name table** | branch coverage |
| 27 | helper | alias resolution (USA/UK/UAE/Korea) | `\|\|` branches |
| 28 | helper | unknown country reverts | fall-through |
| 29 | helper | no-comma address parsing | trim path |
| 30 | registry | zero when BusinessPermission unset | production adapter |
| 31-32 | mocks | unlink business / individual | registry utilities |
| 33 | registry | delegates to BusinessPermission when set | Bootstrap path |

Run:

```bash
npm test
npm run coverage
```

**Latest coverage (revision, 40 tests passing):**

| Metric | All files | CATVault.sol | JurisdictionHelper.sol |
|--------|-----------|--------------|------------------------|
| Statements | **95.7%** | **100%** | **100%** |
| Branches | **96.2%** | **100%** | **95.7%** |
| Functions | 84.3% | **100%** | **100%** |
| Lines | **94.0%** | **100%** | **100%** |

Statement, branch, function, and line coverage are all reported per reviewer request. Core contracts (`CATVault.sol`, `JurisdictionHelper.sol`) reach **100% line, function, and branch coverage** on `CATVault` and **≥95% branch** on `JurisdictionHelper` (overall branch **96.2%**, up from ~64% pre-revision). Tests explicitly cover helper edge branches including short ISO3166-1 identifier revert, two-letter address-tail parsing, `ISO3166`/`COUNTRY` identifier types, full country-name aliases (`United States`, `United Kingdom`, `South Korea`, `United Arab Emirates`), empty-address fall-through, and dual-path resolution. The `% Functions` figure for “All files” is diluted only by unused view getters on mock contracts, not production code.

---

## 9. Deployment guide

### 9.1 Prerequisites

- Node.js 18+
- Funded Redbelly Testnet wallet (`RBNT` for gas)
- RPC: `https://rpc-testnet.redbelly.network` (chain `153`)

### 9.2 Steps

```bash
cp .env.example .env
# PRIVATE_KEY=0x...
npm run deploy:testnet
```

The deploy script:

1. Deploys `MockAsset` (demo underlying).
2. Deploys `MockBusinessPermissionRegistry` and `MockIndividualPermissionRegistry` (testnet demo).
3. Deploys `CATVault` pointing at both registries.
4. Writes `deployments/redbellyTestnet.json`.

### 9.3 Post-deploy demo flow

1. Run `npm run seed:demo` — links Demo1/Demo2 business wallets and Demo4 individual wallet; sets **US-only allowlist**.
2. Attempt `deposit` from SG-linked wallet (Demo2) → expect revert `JurisdictionBlocked`.
3. Attempt `deposit` from US business (Demo1) or US individual (Demo4) → success + `JurisdictionChecked` with correct `depositorPath`.
4. UI **Jurisdiction check history** shows the deposit events.

If you deploy your own registry, link wallets via Hardhat instead - the UI aliases are optional convenience for the reference testnet deployment.

---

## 10. Security considerations

- **Owner centralization:** Allowlist admin is `Ownable`; production should use multisig or timelock.
- **Registry trust:** Vault trusts both permission registries and Identifier contents verified by accredited issuers.
- **Parsing ambiguity:** Unknown address formats revert rather than silently allowing; operators must ensure KYB records include ISO3166-1 or parseable addresses.
- **Upgradeability:** Vault is non-upgradeable; registry/Business Identifier upgrades on Redbelly side are independent.
- **Withdrawals after delisting:** Existing share holders in a newly denied jurisdiction cannot withdraw until re-allowed; an explicit policy choice documented for operators.

---

## 11. Future enhancements

- Integrate live `businessPermission` and `individualPermission` on testnet when Bootstrap registers them.
- Optional ZK eligibility gating (Task 3 `Permission.isAllowed`) as an additional modifier.
- Extended ISO country map via compact merkle store for gas optimization.
- Timelock + events indexing subgraph for compliance audit trails.

---

## 12. References

- [Business onboarding overview](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/business/overview/) - live docs used in place of the task brief link `…/business-onboarding-sdk/` (404 as of June 2026)
- [Individual onboarding overview](https://docs.redbelly.network/pages/eligibility-sdk/onboarding/individual/overview/)
- [useBusinessDetails hook](https://docs.redbelly.network/pages/eligibility-sdk/client/hooks/useBusinessDetails/)
- [Business Identifier contract](https://vine.redbelly.network/business-verification/identifier-contract/)
- [OpenZeppelin ERC4626](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC20/extensions/ERC4626.sol)
- [EIP-4626](https://eips.ethereum.org/EIPS/eip-4626)

---

*Document version 1.1 - CAT Vault Task 2 revision (allowlist + dual-path)*
