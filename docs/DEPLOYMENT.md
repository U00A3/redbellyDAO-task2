# Deployment notes

## Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Redbelly Testnet | 153 | https://governors.testnet.redbelly.network |

## Latest testnet deployment (revision — allowlist + dual-path)

| Contract | Address |
|----------|---------|
| CATVault | `0xC8A405e8CEB8c2dd2dFC03f1d7DdF9f20bEd964D` |
| Asset (catUSD) | `0xE5278DB20f95e582f9Eff5cb30C414944847EEbC` |
| MockBusinessPermissionRegistry | `0xf6e36ecBe3094872c164654aE6B9F98f43B76b42` |
| MockIndividualPermissionRegistry | `0xDED51Cbba458Ba7F01A011fB3525c5294596383A` |
| Deployer / vault owner | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

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
| **US business deposit** (allowed) | [0xa9a308…6aad](https://redbelly.testnet.routescan.io/tx/0xa9a3085748a8ebd4aefdefe4996ad15bba70b8ab8c5e38615517e09a3dfe6aad) — `depositorPath: business` |
| **SG business deposit** (denied) | Reverted `JurisdictionBlocked` (US-only allowlist) |
| **US individual deposit** (allowed) | [0xf45248…31f7](https://redbelly.testnet.routescan.io/tx/0xf452480bea34f8106a5da1428cba37ebaac7e8839dfc0924c2ed0344093331f7) — `depositorPath: individual` |

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

Set `VITE_VAULT_ADDRESS=0xC8A405e8CEB8c2dd2dFC03f1d7DdF9f20bEd964D` in Vercel / `ui/.env.production`.

See `docs/guide.md` §7.1 for the full reviewer walkthrough.
