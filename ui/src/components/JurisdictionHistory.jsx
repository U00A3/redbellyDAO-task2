import { useEffect, useMemo, useState } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { parseAbiItem } from "viem";
import { CAT_VAULT_ABI, EXPLORER_URL, bytes2ToIso } from "../config/wagmi";
import { maskAddress } from "../utils/format";
import { IconExternalLink } from "./icons";

function ExplorerLink({ href, children, title }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="explorer-link" title={title}>
      <span className="explorer-link-text">{children}</span>
      <IconExternalLink className="explorer-link-icon" size={13} />
    </a>
  );
}

export default function JurisdictionHistory({ vaultAddress }) {
  const publicClient = usePublicClient();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const appendEntry = (log) => {
    const { account, jurisdiction, allowed, operation, depositorPath, transactionHash, blockNumber } =
      log;
    setEntries((prev) => {
      const key = `${transactionHash}-${account}-${operation}`;
      if (prev.some((e) => e.key === key)) return prev;
      return [
        {
          key,
          account,
          jurisdiction: bytes2ToIso(jurisdiction),
          allowed,
          operation,
          depositorPath,
          txHash: transactionHash,
          blockNumber: blockNumber?.toString(),
        },
        ...prev,
      ].slice(0, 50);
    });
  };

  const jurisdictionCheckedEvent = useMemo(
    () =>
      parseAbiItem(
        "event JurisdictionChecked(address indexed account, bytes2 indexed jurisdiction, bool allowed, string operation, string depositorPath)"
      ),
    []
  );

  useEffect(() => {
    if (!vaultAddress || !publicClient) return;
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      try {
        const logs = await publicClient.getLogs({
          address: vaultAddress,
          event: jurisdictionCheckedEvent,
          fromBlock: 0n,
          toBlock: "latest",
        });

        if (cancelled) return;

        const mapped = logs
          .map((log) => ({
            key: `${log.transactionHash}-${log.args.account}-${log.args.operation}`,
            account: log.args.account,
            jurisdiction: bytes2ToIso(log.args.jurisdiction),
            allowed: log.args.allowed,
            operation: log.args.operation,
            depositorPath: log.args.depositorPath,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber?.toString(),
          }))
          .reverse()
          .slice(0, 50);

        setEntries(mapped);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [vaultAddress, publicClient, jurisdictionCheckedEvent]);

  useWatchContractEvent({
    address: vaultAddress,
    abi: CAT_VAULT_ABI,
    eventName: "JurisdictionChecked",
    enabled: !!vaultAddress,
    onLogs(logs) {
      logs.forEach((log) => {
        appendEntry({
          account: log.args.account,
          jurisdiction: log.args.jurisdiction,
          allowed: log.args.allowed,
          operation: log.args.operation,
          depositorPath: log.args.depositorPath,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        });
      });
    },
  });

  return (
    <div className="deposit-card admin-panel-block">
      <h3 className="panel-heading" style={{ marginTop: 0 }}>
        Jurisdiction check history
      </h3>
      <p className="overview-lead">
        On-chain <code>JurisdictionChecked</code> events from deposits and withdrawals (newest first).
      </p>
      {loading && (
        <div className="step-loading">
          <div className="spinner" />
          <p>Loading event history…</p>
        </div>
      )}
      {!loading && entries.length === 0 && (
        <p className="jurisdiction-meta">No jurisdiction checks recorded yet for this vault.</p>
      )}
      {!loading && entries.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>ISO</th>
                <th>Status</th>
                <th>Op</th>
                <th>Path</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row.key}>
                  <td title={row.account}>{maskAddress(row.account)}</td>
                  <td>{row.jurisdiction}</td>
                  <td>
                    <span className={`status-badge ${row.allowed ? "ok" : "warn"}`}>
                      {row.allowed ? "allowed" : "blocked"}
                    </span>
                  </td>
                  <td>{row.operation}</td>
                  <td>{row.depositorPath}</td>
                  <td>
                    <ExplorerLink href={`${EXPLORER_URL}/tx/${row.txHash}`} title={row.txHash}>
                      {maskAddress(row.txHash)}
                    </ExplorerLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
