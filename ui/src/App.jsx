import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress } from "viem";
import {
  VAULT_ADDRESS,
  CAT_VAULT_ABI,
  REGISTRY_ABI,
  BUSINESS_IDENTIFIER_ABI,
  INDIVIDUAL_REGISTRY_ABI,
  INDIVIDUAL_IDENTIFIER_ABI,
  EXPLORER_URL,
  isoToBytes2,
  bytes2ToIso,
  TRACKED_JURISDICTIONS,
  JURISDICTION_NAMES,
} from "./config/wagmi";
import {
  DEMO_ACCOUNTS,
  DEMO_ACCOUNT_ALIASES,
  resolveWalletPreviewInput,
} from "./config/demoAccounts";
import { maskAddress } from "./utils/format";
import { IconExternalLink } from "./components/icons";
import JurisdictionHistory from "./components/JurisdictionHistory";

const COMMON_JURISDICTIONS = TRACKED_JURISDICTIONS;

function useTrackedAllowlist(vaultAddress) {
  const contracts = useMemo(
    () =>
      TRACKED_JURISDICTIONS.map((iso) => ({
        address: vaultAddress,
        abi: CAT_VAULT_ABI,
        functionName: "allowedJurisdictions",
        args: [isoToBytes2(iso)],
      })),
    [vaultAddress]
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: !!vaultAddress },
  });

  const statuses = useMemo(() => {
    return TRACKED_JURISDICTIONS.map((iso, i) => ({
      iso,
      name: JURISDICTION_NAMES[iso] || iso,
      allowed: data?.[i]?.status === "success" ? Boolean(data[i].result) : undefined,
    }));
  }, [data]);

  const allowedList = statuses.filter((s) => s.allowed === true);
  const deniedCount = statuses.filter((s) => s.allowed === false).length;

  return { statuses, allowedList, deniedCount, isLoading, refetch };
}

function AllowlistLivePanel({ vaultAddress, selectedCode, onSelect, refreshKey }) {
  const { statuses, allowedList, deniedCount, isLoading, refetch } =
    useTrackedAllowlist(vaultAddress);

  useEffect(() => {
    if (refreshKey > 0) refetch();
  }, [refreshKey, refetch]);

  return (
    <div className="deposit-card blocklist-live admin-panel-block">
      <div className="blocklist-live-header">
        <h3 className="panel-heading blocklist-live-title">Active allowlist</h3>
        {!isLoading && vaultAddress && (
          <span className="status-badge neutral">
            {allowedList.length} allowed · {deniedCount} denied (default)
          </span>
        )}
      </div>
      <p className="overview-lead">
        Default deny: only jurisdictions explicitly allowed can deposit or withdraw. All other
        tracked regions are blocked.
      </p>

      {isLoading && (
        <div className="step-loading blocklist-loading">
          <div className="spinner" />
          <p>Reading on-chain allowlist…</p>
        </div>
      )}

      {!isLoading && vaultAddress && allowedList.length === 0 && (
        <div className="blocklist-empty">
          <span className="status-badge warn">No jurisdictions allowed</span>
          <p className="blocklist-empty-text">
            All deposits revert until the vault owner allows at least one region.
          </p>
        </div>
      )}

      {!isLoading && allowedList.length > 0 && (
        <div className="blocklist-active-chips">
          {allowedList.map(({ iso, name }) => (
            <button
              key={iso}
              type="button"
              className={`jurisdiction-chip jurisdiction-chip-open ${
                selectedCode === iso ? "jurisdiction-chip-selected" : ""
              }`}
              onClick={() => onSelect(iso)}
              title={`${name} - allowed`}
            >
              <span className="jurisdiction-chip-code">{iso}</span>
              <span className="jurisdiction-chip-name">{name}</span>
            </button>
          ))}
        </div>
      )}

      {!isLoading && vaultAddress && (
        <>
          <p className="field-label blocklist-grid-label">Tracked regions</p>
          <div className="blocklist-grid">
            {statuses.map(({ iso, name, allowed: isAllowed }) => (
              <button
                key={iso}
                type="button"
                className={[
                  "jurisdiction-chip",
                  "jurisdiction-chip-compact",
                  isAllowed ? "jurisdiction-chip-open" : "jurisdiction-chip-blocked",
                  selectedCode === iso ? "jurisdiction-chip-selected" : "",
                ].join(" ")}
                onClick={() => onSelect(iso)}
                title={`${name} - ${isAllowed ? "allowed" : "denied"}`}
              >
                <span className="jurisdiction-chip-code">{iso}</span>
                {isAllowed && <span className="jurisdiction-chip-dot" aria-hidden />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FA423C" fillOpacity="0.15" />
      <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill="#FA423C" />
      <circle cx="24" cy="20" r="4" stroke="#FA423C" strokeWidth="2" fill="none" />
    </svg>
  );
}

function ExplorerLink({ href, children, title }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="explorer-link"
      title={title}
    >
      <span className="explorer-link-text">{children}</span>
      <IconExternalLink className="explorer-link-icon" size={13} />
    </a>
  );
}

function useVaultAddress() {
  return VAULT_ADDRESS && isAddress(VAULT_ADDRESS) ? VAULT_ADDRESS : undefined;
}

export default function App() {
  const vaultAddress = useVaultAddress();
  const { address, isConnected } = useAccount();

  const { data: owner } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "owner",
    query: { enabled: !!vaultAddress },
  });

  const isOwner =
    isConnected && owner && address && owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="app-wrapper app-expanded">
      <header className="page-header">
        <h1 className="page-title">CAT Vault Admin</h1>
        <p className="page-subtitle">
          Task 2 · ERC-4626 · Jurisdiction Allowlist · Redbelly Testnet
        </p>
      </header>

      <div className="widget-container">
        <div className="widget-header">
          <div className="widget-logo">
            <Logo />
            CAT Vault Task 2
          </div>
          {isConnected && (
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
          )}
        </div>

        <div className="widget-content fade-in">
          {!vaultAddress && (
            <div className="info-block info-block-warn admin-panel-block">
              <div className="info-block-title">Configuration required</div>
              <p className="info-block-text">
                Set <code>VITE_VAULT_ADDRESS</code> in <code>ui/.env.development</code> (local)
                or <code>ui/.env.production</code> (Vercel). Admin functions map 1:1 to{" "}
                <code>CATVault.sol</code>.
              </p>
            </div>
          )}

          <div className="dashboard-grid">
            <section className="dashboard-panel dashboard-panel-overview">
              <p className="widget-app-name">Vault overview</p>
              <VaultOverview vaultAddress={vaultAddress} />
              <JurisdictionPreview vaultAddress={vaultAddress} />
              <OnChainFunctions />
            </section>

            <section className="dashboard-panel dashboard-panel-holder">
              <p className="widget-app-name">Admin actions</p>

              {isConnected ? (
                <div className="wallet-info admin-panel-block">
                  <span className="wallet-address" title={address}>
                    {maskAddress(address)}
                  </span>
                  <span className={`status-badge ${isOwner ? "ok" : "warn"}`}>
                    {isOwner ? "Vault owner" : "Read-only"}
                  </span>
                </div>
              ) : (
                <div className="connect-gate connect-gate-panel admin-panel-block">
                  <div className="info-block info-block-compact">
                    <div className="info-block-title">Connect wallet</div>
                    <p className="info-block-text">
                      Connect the vault owner wallet to update the jurisdiction allowlist. Jurisdiction
                      preview and transaction history work without a wallet.
                    </p>
                  </div>
                  <div className="connect-btn-wrapper">
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button type="button" className="btn-connect" onClick={openConnectModal}>
                          Connect Wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                  </div>
                </div>
              )}

              {!isOwner && isConnected && owner && (
                <div className="info-block info-block-hint admin-panel-block">
                  <div className="info-block-title">Owner required for transactions</div>
                  <p className="info-block-text">
                    Allowlist changes require vault owner{" "}
                    <code title={owner}>{maskAddress(owner)}</code>.
                  </p>
                </div>
              )}

              <AllowlistManager
                vaultAddress={vaultAddress}
                isOwner={isOwner}
                isConnected={isConnected}
              />

              <JurisdictionHistory vaultAddress={vaultAddress} />
            </section>
          </div>

          <div className="dashboard-footer">
            <div className="info-block info-block-inline">
              <div className="info-block-title">On-chain events</div>
              <p className="info-block-text">
                <code>JurisdictionChecked</code>, <code>JurisdictionAllowlistUpdated</code> on{" "}
                <a href={EXPLORER_URL} target="_blank" rel="noreferrer">
                  Routescan explorer
                </a>
                {vaultAddress && (
                  <>
                    {" "}
                    ·{" "}
                    <ExplorerLink href={`${EXPLORER_URL}/address/${vaultAddress}`} title={vaultAddress}>
                      Vault contract
                    </ExplorerLink>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="widget-info">
        <a
          href="https://github.com/U00A3/redbellyDAO-task2"
          target="_blank"
          rel="noreferrer"
        >
          redbellyDAO-task2
        </a>{" "}
        · Chain ID 153
      </p>
    </div>
  );
}

function VaultOverview({ vaultAddress }) {
  const { data: totalAssets } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "totalAssets",
    query: { enabled: !!vaultAddress },
  });

  const { data: registry } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "businessRegistry",
    query: { enabled: !!vaultAddress },
  });

  const { data: individualRegistry } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "individualRegistry",
    query: { enabled: !!vaultAddress },
  });

  return (
    <div className="admin-panel-block">
      <p className="overview-lead">Read-only ERC-4626 metrics from the deployed CAT vault.</p>
      <div className="stat-grid stat-grid-overview">
        <div className="stat-tile">
          <span className="stat-tile-label">Total assets (raw)</span>
          <span className="stat-tile-value">
            {totalAssets !== undefined ? String(totalAssets) : "n/a"}
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Vault</span>
          <span className="stat-tile-value stat-tile-value-sm">
            {vaultAddress ? (
              <ExplorerLink href={`${EXPLORER_URL}/address/${vaultAddress}`} title={vaultAddress}>
                {maskAddress(vaultAddress)}
              </ExplorerLink>
            ) : (
              <span className="muted-text">not configured</span>
            )}
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Business registry</span>
          <span className="stat-tile-value stat-tile-value-sm">
            {registry ? (
              <ExplorerLink href={`${EXPLORER_URL}/address/${registry}`} title={registry}>
                {maskAddress(registry)}
              </ExplorerLink>
            ) : (
              <span className="muted-text">n/a</span>
            )}
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Individual registry</span>
          <span className="stat-tile-value stat-tile-value-sm">
            {individualRegistry ? (
              <ExplorerLink
                href={`${EXPLORER_URL}/address/${individualRegistry}`}
                title={individualRegistry}
              >
                {maskAddress(individualRegistry)}
              </ExplorerLink>
            ) : (
              <span className="muted-text">n/a</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function OnChainFunctions() {
  return (
    <div className="deposit-card admin-panel-block">
      <h3 className="panel-heading" style={{ marginTop: 0 }}>
        Admin functions (on-chain)
      </h3>
      <ul className="function-list">
        <li>
          <code>setJurisdictionAllowed(bytes2, bool)</code> - owner only
        </li>
        <li>
          <code>setJurisdictionAllowedBatch(bytes2[], bool)</code> - owner only
        </li>
        <li>
          <code>checkJurisdiction(address)</code> - returns jurisdiction, allowed, depositorPath
        </li>
        <li>
          <code>allowedJurisdictions(bytes2)</code> - public view
        </li>
      </ul>
    </div>
  );
}

function JurisdictionPreview({ vaultAddress }) {
  const [wallet, setWallet] = useState("");

  const { address: resolvedWallet, alias, invalid } = resolveWalletPreviewInput(wallet);

  const { data: checkResult, isFetching, isError } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "checkJurisdiction",
    args: [resolvedWallet],
    query: { enabled: !!vaultAddress && !!resolvedWallet },
  });

  const { data: registryAddr } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "businessRegistry",
    query: { enabled: !!vaultAddress },
  });

  const { data: individualRegistryAddr } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "individualRegistry",
    query: { enabled: !!vaultAddress },
  });

  const { data: businessContract } = useReadContract({
    address: registryAddr,
    abi: REGISTRY_ABI,
    functionName: "getBusinessContractAddress",
    args: [resolvedWallet],
    query: { enabled: !!registryAddr && !!resolvedWallet },
  });

  const { data: individualContract } = useReadContract({
    address: individualRegistryAddr,
    abi: INDIVIDUAL_REGISTRY_ABI,
    functionName: "getIndividualContractAddress",
    args: [resolvedWallet],
    query: { enabled: !!individualRegistryAddr && !!resolvedWallet },
  });

  const { data: companyName } = useReadContract({
    address: businessContract,
    abi: BUSINESS_IDENTIFIER_ABI,
    functionName: "companyName",
    query: {
      enabled:
        !!businessContract &&
        businessContract !== "0x0000000000000000000000000000000000000000",
    },
  });

  const { data: fullName } = useReadContract({
    address: individualContract,
    abi: INDIVIDUAL_IDENTIFIER_ABI,
    functionName: "fullName",
    query: {
      enabled:
        !!individualContract &&
        individualContract !== "0x0000000000000000000000000000000000000000",
    },
  });

  const jurisdiction = checkResult?.[0];
  const allowed = checkResult?.[1];
  const depositorPath = checkResult?.[2];
  const zero = "0x0000000000000000000000000000000000000000";
  const hasBusiness =
    businessContract && businessContract !== zero;
  const hasIndividual =
    individualContract && individualContract !== zero;
  const unlinkedDemo =
    alias === "Demo3" ||
    (!hasBusiness && !hasIndividual && !isFetching && !!resolvedWallet);

  const previewError =
    invalid
      ? "Enter a valid 0x address or a testnet demo alias (Demo1–Demo4)."
      : isError
        ? "Jurisdiction check reverted - wallet may not be linked in either registry."
        : unlinkedDemo && !isFetching && !checkResult
          ? "No Business or Individual Identifier linked to this wallet (expected for Demo3)."
          : null;

  return (
    <div className="deposit-card admin-panel-block">
      <h3 className="panel-heading" style={{ marginTop: 0 }}>
        Jurisdiction preview
      </h3>
      <p className="overview-demo-note">
        Testnet demo aliases call live <code>checkJurisdiction</code> on-chain (run{" "}
        <code>npm run seed:demo</code> first). <strong>Demo1</strong> (US business) and{" "}
        <strong>Demo4</strong> (US individual) should show allowed when only US is on the allowlist;{" "}
        <strong>Demo2</strong> (SG) blocked; <strong>Demo3</strong> unlinked.
      </p>
      <label className="field-label" htmlFor="wallet">
        Depositor wallet or demo alias
      </label>
      <input
        id="wallet"
        className="field-input"
        placeholder="Demo1, Demo4, or 0x…"
        value={wallet}
        onChange={(e) => setWallet(e.target.value.trim())}
      />
      <div className="demo-alias-row" role="group" aria-label="Testnet demo aliases">
        {DEMO_ACCOUNT_ALIASES.map((demoAlias) => (
          <button
            key={demoAlias}
            type="button"
            className={`demo-alias-chip ${wallet === demoAlias ? "demo-alias-chip-selected" : ""}`}
            onClick={() => setWallet(demoAlias)}
          >
            {demoAlias}
            {DEMO_ACCOUNTS[demoAlias].jurisdiction
              ? ` · ${DEMO_ACCOUNTS[demoAlias].jurisdiction}`
              : " · unlinked"}
            {DEMO_ACCOUNTS[demoAlias].depositorPath === "individual" ? " · retail" : ""}
          </button>
        ))}
      </div>
      {wallet && (
        <div className="jurisdiction-result">
          {invalid ? (
            <span className="status-badge warn">{previewError}</span>
          ) : isFetching ? (
            <div className="step-loading">
              <div className="spinner" />
              <p>Reading identifier metadata…</p>
            </div>
          ) : previewError && !checkResult ? (
            <>
              <span className="status-badge warn">{previewError}</span>
              {alias && (
                <p className="jurisdiction-meta">
                  Resolved <strong>{alias}</strong> →{" "}
                  <code>{resolvedWallet}</code>
                </p>
              )}
            </>
          ) : (
            <>
              {alias && (
                <p className="jurisdiction-meta">
                  Demo alias <strong>{alias}</strong> →{" "}
                  <ExplorerLink
                    href={`${EXPLORER_URL}/address/${resolvedWallet}`}
                    title={resolvedWallet}
                  >
                    {maskAddress(resolvedWallet)}
                  </ExplorerLink>
                </p>
              )}
              <span className={`status-badge ${allowed ? "ok" : "warn"}`}>
                {bytes2ToIso(jurisdiction)} · {allowed ? "allowed" : "blocked"}
              </span>
              {depositorPath && (
                <p className="jurisdiction-meta">
                  Depositor path: <strong>{depositorPath}</strong>
                </p>
              )}
              {companyName && (
                <p className="jurisdiction-meta">Business: {companyName}</p>
              )}
              {fullName && (
                <p className="jurisdiction-meta">Individual: {fullName}</p>
              )}
              {hasBusiness && (
                <p className="jurisdiction-meta">
                  Business Identifier:{" "}
                  <ExplorerLink
                    href={`${EXPLORER_URL}/address/${businessContract}`}
                    title={businessContract}
                  >
                    {maskAddress(businessContract)}
                  </ExplorerLink>
                </p>
              )}
              {hasIndividual && (
                <p className="jurisdiction-meta">
                  Individual Identifier:{" "}
                  <ExplorerLink
                    href={`${EXPLORER_URL}/address/${individualContract}`}
                    title={individualContract}
                  >
                    {maskAddress(individualContract)}
                  </ExplorerLink>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AllowlistManager({ vaultAddress, isOwner, isConnected }) {
  const [code, setCode] = useState("US");
  const [batchCodes, setBatchCodes] = useState("US,SG,AU");
  const [refreshKey, setRefreshKey] = useState(0);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const bytes2 = useMemo(() => {
    try {
      return isoToBytes2(code);
    } catch {
      return undefined;
    }
  }, [code]);

  const { data: isAllowed, refetch: refetchSelected } = useReadContract({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    functionName: "allowedJurisdictions",
    args: [bytes2],
    query: { enabled: !!vaultAddress && !!bytes2 },
  });

  function setAllowed(allowed) {
    if (!vaultAddress || !bytes2) return;
    writeContract({
      address: vaultAddress,
      abi: CAT_VAULT_ABI,
      functionName: "setJurisdictionAllowed",
      args: [bytes2, allowed],
    });
  }

  function setBatchAllowed(allowed) {
    if (!vaultAddress) return;
    const codes = batchCodes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => isoToBytes2(c));
    writeContract({
      address: vaultAddress,
      abi: CAT_VAULT_ABI,
      functionName: "setJurisdictionAllowedBatch",
      args: [codes, allowed],
    });
  }

  useEffect(() => {
    if (isSuccess) {
      refetchSelected();
      setRefreshKey((k) => k + 1);
    }
  }, [isSuccess, refetchSelected]);

  const selectedName = JURISDICTION_NAMES[code] || code;

  return (
    <>
      <AllowlistLivePanel
        vaultAddress={vaultAddress}
        selectedCode={code}
        onSelect={setCode}
        refreshKey={refreshKey}
      />

      <div className="deposit-card admin-panel-block">
        <h3 className="panel-heading" style={{ marginTop: 0 }}>
          Edit allowlist
        </h3>
        <p className="overview-lead">
          Selected: <strong>{code}</strong> ({selectedName}) -{" "}
          <span className={`status-badge ${isAllowed ? "ok" : "warn"}`}>
            {isAllowed ? "allowed" : "denied (default)"}
          </span>
        </p>

        <div className="admin-row">
          <div>
            <label className="field-label" htmlFor="iso">
              ISO 3166-1 alpha-2
            </label>
            <select
              id="iso"
              className="field-select"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            >
              {COMMON_JURISDICTIONS.map((c) => (
                <option key={c} value={c}>
                  {c} - {JURISDICTION_NAMES[c] || c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="btn-row">
          <button
            type="button"
            className="btn-admin"
            disabled={!isOwner || isPending || confirming || isAllowed}
            onClick={() => setAllowed(true)}
          >
            Allow {code}
          </button>
          <button
            type="button"
            className="btn-admin-secondary"
            disabled={!isOwner || isPending || confirming || !isAllowed}
            onClick={() => setAllowed(false)}
          >
            Deny {code}
          </button>
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          <label className="field-label" htmlFor="batch">
            Batch update (comma-separated ISO codes)
          </label>
          <input
            id="batch"
            className="field-input"
            value={batchCodes}
            onChange={(e) => setBatchCodes(e.target.value)}
          />
          <div className="btn-row">
            <button
              type="button"
              className="btn-admin"
              disabled={!isOwner || isPending || confirming}
              onClick={() => setBatchAllowed(true)}
            >
              Allow batch
            </button>
            <button
              type="button"
              className="btn-admin-secondary"
              disabled={!isOwner || isPending || confirming}
              onClick={() => setBatchAllowed(false)}
            >
              Deny batch
            </button>
          </div>
        </div>

        {!isConnected && (
          <p className="footnote">Connect vault owner wallet to submit allowlist transactions.</p>
        )}
        {(isPending || confirming) && (
          <p className="message-warn">Waiting for transaction…</p>
        )}
        {isSuccess && <p className="message-success">Allowlist updated on-chain.</p>}
        {error && (
          <p className="message-warn">Error: {error.shortMessage || error.message}</p>
        )}
      </div>
    </>
  );
}
