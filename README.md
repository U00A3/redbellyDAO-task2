# CAT Vault - Task 2 (Compliant Asset Tokenization)

[![Redbelly testnet](https://img.shields.io/badge/Redbelly-testnet-c41e3a?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTUwIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNDYyLjI1LDE0NS41NiwyNTYuMDcsMjYuNjNhMTIuMTMsMTIuMTMsMCwwLDAtMTIuMTQsMEwzNy43NSwxNDUuNTZhMTIuMTUsMTIuMTUsMCwwLDAtNi4wNywxMC41MVYzOTMuOTRhMTIuMTYsMTIuMTYsMCwwLDAsNi4wNywxMC41MUwyNDMuOTMsNTIzLjM4YTEyLjE4LDEyLjE4LDAsMCwwLDEyLjE0LDBMNDYyLjI1LDQwNC40NWExMi4xNiwxMi4xNiwwLDAsMCw2LjA3LTEwLjUxVjE1Ni4wN0ExMi4xNSwxMi4xNSwwLDAsMCw0NjIuMjUsMTQ1LjU2Wk0yNTAsNTEuMTVsMTkwLjYzLDExMGMtMzEuMDUsMTcuNTItNTcuMjUsMzkuNzctNzkuMzUsNjQuNTctNDMuMTItNTAuODQtMTAzLTEwMS0xODQuMzgtMTMyLjM3Wk00MDQuMzUsMzA4LjkxYTEzLjcsMTMuNywwLDAsMS0xMi41NS04LjIxLDEzLjU4LDEzLjU4LDAsMSwxLDI1LjA5LDBBMTMuNjksMTMuNjksMCwwLDEsNDA0LjM1LDMwOC45MVptMC00MC43M2EyNy4yMywyNy4yMywwLDAsMC05LjU0LDEuOGMtNy43Ny0xMS40Ny0xNi4xOC0yMy4xNC0yNS43LTM0LjkyYTMwMi4zNiwzMDIuMzYsMCwwLDEsNzAuNDctNTkuMjksNjYxLjI5LDY2MS4yOSwwLDAsMC0zNC4yNyw5Mi41MUM0MDUsMjY4LjI3LDQwNC42OCwyNjguMTgsNDA0LjM1LDI2OC4xOFpNMzUzLjI4LDIzNWMtMjEuOSwyNi4zNi0zOS40Nyw1NS4xOS01My41Niw4NC02LjgxLTk4LjczLTgyLjctMTc2LjA2LTEyMy40My0yMTNDMjU0LjM3LDEzNi45NCwzMTEuODQsMTg1LjczLDM1My4yOCwyMzVabS02MiwxMjdhMTMuNywxMy43LDAsMCwxLTEyLjU1LTguMjEsMTMuNDQsMTMuNDQsMCwwLDEtMS01LjEyLDEzLjYyLDEzLjYyLDAsMSwxLDEzLjU3LDEzLjMzWm0tMy43NC00MC4zNWEyNy40NywyNy40NywwLDAsMC02LjgxLDEuNzQsNDgwLjk0LDQ4MC45NCwwLDAsMC0xMDEuNzQtMTAyLjQsMjcsMjcsMCwwLDAsMy43Ni0xMy42MiwyNy4zOCwyNy4zOCwwLDAsMC0yMS4zOS0yNi42OFYxMDguOUMxOTguNzcsMTQyLjA2LDI4MS4zOSwyMjAuOTIsMjg3LjQ5LDMyMS41N1pNMTY3LjgzLDIxMi40MWExMy43LDEzLjcsMCwwLDEtMjUuMSwwLDEzLjM5LDEzLjM5LDAsMCwxLTEtNS4xMSwxMy41NywxMy41NywwLDAsMSwyNy4xNCwwQTEzLjM5LDEzLjM5LDAsMCwxLDE2Ny44MywyMTIuNDFabS0xOC42Ny0xMDMuMXY3MS4zM2EyNy4zMiwyNy4zMiwwLDAsMC0xNiwxMC41NEE0NDMuMjcsNDQzLjI3LDAsMCwwLDYzLDE1OVpNNTYsMTgwLjUzYzE4LjEyLDI2Ljg0LDUzLjczLDg0LjEzLDc1LjMxLDE0OC4yLS4yNC4xNS0uNTEuMjctLjc0LjQzQTQ1Mi42LDQ1Mi42LDAsMCwwLDU2LDI3Ni42OVpNMTU5LjU2LDM1MS43OGExMy40NCwxMy40NCwwLDAsMS0xLDUuMTIsMTMuNTIsMTMuNTIsMCwxLDEsMS01LjEyWm0tMTEsODguNTRMNTYsMzg2LjkzVjI5MC42N2E0MzUuMTMsNDM1LjEzLDAsMCwxLDY2LjI0LDQ3LjcxQTI3LjA5LDI3LjA5LDAsMCwwLDE0NC4zMiwzNzlDMTQ4LjE2LDM5OS42MiwxNTAsNDIwLjI5LDE0OC41Myw0NDAuMzJaTTE2MC4xNiw0NDdjMi40LTIyLjkyLjcxLTQ2LjU2LTMuNTUtNzBhMjcsMjcsMCwwLDAsMy43MS0yLDUxOS41Miw1MTkuNTIsMCwwLDEsODIsMTE5LjQxWm04OC43NywzMy41N2E1MzAuODgsNTMwLjg4LDAsMCwwLTgwLTExMy44OUEyNy4zNSwyNy4zNSwwLDAsMCwxNDYsMzI0LjM4YTI3Ljg4LDI3Ljg4LDAsMCwwLTMuMDUuMzFDMTIwLjczLDI1OC4zNCw4NCwxOTkuODcsNjUuNTQsMTcyLjg0YTQzMi4xLDQzMi4xLDAsMCwxLDYyLjgyLDI5LjQ5LDI3Ljg5LDI3Ljg5LDAsMCwwLS41LDUsMjcuNCwyNy40LDAsMCwwLDQyLjkxLDIyLjU5QTQ2Ny45LDQ2Ny45LDAsMCwxLDI3MC44OCwzMzAuMzlhMjcuMDgsMjcuMDgsMCwwLDAsNi42MSw0MS43OEE2NDAuMTYsNjQwLjE2LDAsMCwwLDI0OC45Myw0ODAuNlptMTAuMjEsMTNhNjI0LjY3LDYyNC42NywwLDAsMSwyOS43OS0xMTcuODNjLjc3LjA3LDEuNTEuMjMsMi4zLjIzYTI3LjA3LDI3LjA3LDAsMCwwLDguNzEtMS41NEE1MjMuNzEsNTIzLjcxLDAsMCwxLDMzNi40MSw0NDlabTg3LjkxLTUwLjcxYTUzNy4yLDUzNy4yLDAsMCwwLTM2Ljc1LTc0LjY1QTI3LjE0LDI3LjE0LDAsMCwwLDMwOSwzMjcuODVjMTMuNjgtMjguNTksMzAuNjgtNTcuMjMsNTIuMTYtODMuNCw4LjY2LDEwLjgyLDE2LjQsMjEuNTQsMjMuNTcsMzIuMDlhMjcuMjMsMjcuMjMsMCwwLDAsNy45LDQzLjY5LDUzOS42NSw1MzkuNjUsMCwwLDAtMTAuODQsMTAyLjYzWk0zOTQsNDE1Ljc5QTUzMC4zNCw1MzAuMzQsMCwwLDEsNDA0LjQ5LDMyM2EyNy4wOCwyNy4wOCwwLDAsMCw3Ljc4LTEuMjgsNTAzLjE1LDUwMy4xNSwwLDAsMSwzMC4zMyw2Ni4wOFptNTAtNTdjLTUuMzgtMTIuMzgtMTIuNTEtMjcuMTEtMjEuMjQtNDMuMUEyNy4xNCwyNy4xNCwwLDAsMCw0MTcsMjcxLjM5LDY1My4zMiw2NTMuMzIsMCwwLDEsNDQ0LDE5NS41NVoiIC8%2BPC9zdmc%2B&logoWidth=36&style=plastic)](https://redbelly.network/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white&style=plastic)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-FFF1E7?logo=hardhat&logoColor=000&style=plastic)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=plastic)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=plastic)](https://www.typescriptlang.org/)
[![wagmi](https://img.shields.io/badge/wagmi-2.x-000000?style=plastic)](https://wagmi.sh/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4.9-4E5EE4?logo=openzeppelin&logoColor=white&style=plastic)](https://openzeppelin.com/contracts/)
[![Tests](https://img.shields.io/badge/tests-52%20passing-success?style=plastic)](#quick-start)
[![Coverage](https://img.shields.io/badge/lines-95%25%20|%20branch%2096%25-brightgreen?style=plastic)](#quick-start)
[![Live dashboard](https://img.shields.io/badge/Dashboard-redbelly--dao--task2.vercel.app-c41e3a?style=plastic)](https://redbelly-dao-task2.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=plastic)](#license)

ERC-4626 vault on **Redbelly Testnet** (chain ID **153**) with **jurisdiction-based deposit and withdrawal restrictions** enforced from on-chain **Business** and **Individual Identifier** metadata and an admin-configurable **allowlist (default deny)**.

Community submission for **Redbelly DAO Task 2** - Compliant Asset Tokenization (CAT) Vault. Not an official Redbelly product; see [redbelly.network](https://redbelly.network/) for authoritative documentation.

> **Docs note:** The task brief links to `https://docs.redbelly.network/pages/business-onboarding-sdk/` (404). This project integrates at the **on-chain Identifier** layer using live Redbelly docs. See [docs/guide.md §3.4](docs/guide.md).

## Task requirements (quick map)

| Task requirement | Where to verify |
|------------------|-----------------|
| Reviewer walkthrough (SDK, demo, no Averer API) | [`REVIEWER.md`](REVIEWER.md) |
| ERC-4626 vault (OpenZeppelin) | `contracts/CATVault.sol` |
| Business + Individual Identifier jurisdiction reads | `JurisdictionHelper.sol`, dual-path registries |
| Admin-configurable allowlist (default deny) | `allowedJurisdictions`, `setJurisdictionAllowed` |
| US allowed / SG blocked benchmark | `test/CATVault.test.ts`, testnet demo |
| `JurisdictionChecked` + `depositorPath` on deposit/withdraw | `CATVault.sol`, tests, UI history panel |
| Admin dashboard wired to on-chain functions | `ui/` (Tailwind + overflow-safe tiles) |
| Unit tests, coverage >= 90% lines | `npm test` (46/46), `npm run coverage` |
| COMPLIANCE_ROLE (AccessControl, not Ownable) | `CATVault.sol` |
| Jurisdiction cache | `cachedJurisdictions` |
| 8-10 page guide + Individual SDK trade-offs | [`docs/guide.md`](docs/guide.md) |
| Testnet deploy | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [live dashboard](https://redbelly-dao-task2.vercel.app) |

## Quick start

```bash
npm install
npm run compile
npm test                 # 52 tests
npm run coverage         # 95% lines, 96% branch; CATVault 100% stmts/branch/funcs/lines
```

Deploy to testnet (requires `PRIVATE_KEY` in `.env` - see `.env.example`):

```bash
npm run deploy:testnet
npm run seed:demo        # US-only allowlist, Demo1–Demo4, verify US ok / SG revert
```

Admin UI:

```bash
cd ui && npm install
npm run dev              # ui/.env.development
```

Or open the [live dashboard](https://redbelly-dao-task2.vercel.app). In **Jurisdiction preview**, type **`Demo1`** (US business, allowed), **`Demo2`** (SG, blocked), or **`Demo4`** (US individual, allowed). See [docs/guide.md §7.1](docs/guide.md).

## Documentation

| Document | Description |
|----------|-------------|
| [`REVIEWER.md`](REVIEWER.md) | DAO reviewer walkthrough, revision checklist, demo aliases |
| [`docs/guide.md`](docs/guide.md) | Full technical guide (~10 pages) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Testnet addresses and demo transactions |

## Testnet contracts (revision deploy)

| Contract | Address |
|----------|---------|
| CATVault | [`0x8BF14cba70f156792bd9313CEdCba05ACd60094F`](https://redbelly.testnet.routescan.io/address/0x8BF14cba70f156792bd9313CEdCba05ACd60094F) |
| MockAsset (catUSD) | [`0xf5D7D92f5C4AfF56F6b5C99c3C119FBCC7E69B1C`](https://redbelly.testnet.routescan.io/address/0xf5D7D92f5C4AfF56F6b5C99c3C119FBCC7E69B1C) |
| MockBusinessPermissionRegistry | [`0x40a0f7B01Ef6A156D6419bB16281916D40caBfc7`](https://redbelly.testnet.routescan.io/address/0x40a0f7B01Ef6A156D6419bB16281916D40caBfc7) |
| MockIndividualPermissionRegistry | [`0x02a4Ac4bea74B5Be9F53C22a312b746Ca0741fda`](https://redbelly.testnet.routescan.io/address/0x02a4Ac4bea74B5Be9F53C22a312b746Ca0741fda) |
| Vault DEFAULT_ADMIN / COMPLIANCE (deployer) | `0xA2c6a3fC1E12dF79B9e3D099FaA2Ffe860450F76` |

**Verified demo:** US business [0xf3d6b9…bea3](https://redbelly.testnet.routescan.io/tx/0xf3d6b9771f3e78251ea429c92a0b4cb263239905b68e7585ef0af1ab41bebea3); SG blocked with on-chain event [0x7da923…e436](https://redbelly.testnet.routescan.io/tx/0x7da9233efb9fdefd8c045dc5e07e59ba354756fcaee56191102a6a2cb4e7e436); US individual [0x8d594e…fe5b](https://redbelly.testnet.routescan.io/tx/0x8d594e12c920d7f8eae11d96ff1e2b6c92b0010181011f5523041d185205fe5b).

Explorer: https://redbelly.testnet.routescan.io

## License

**MIT**

## Submitter

Questions about this Task 2 submission or feedback from reviewers?

[![Tag @1F592 on Discord](https://img.shields.io/badge/Tag%20%401F592-Discord-5865F2?logo=discord&logoColor=white&style=plastic)](https://discord.com/channels/969088176322908160/1378117350619873311)
