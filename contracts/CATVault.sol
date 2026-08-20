// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IBusinessPermissionRegistry} from "./interfaces/IBusinessPermissionRegistry.sol";
import {IIndividualPermissionRegistry} from "./interfaces/IIndividualPermissionRegistry.sol";
import {JurisdictionHelper} from "./libraries/JurisdictionHelper.sol";

/// @title CATVault
/// @notice ERC-4626 vault with jurisdiction allowlist + blocklist, COMPLIANCE_ROLE admin,
///         cached ISO codes, and JurisdictionChecked logs on every deposit/withdraw attempt.
/// @dev A top-level `revert` discards logs in the same transaction. Blocked attempts therefore
///      emit `JurisdictionChecked(allowed=false)` via an external self-call and then return
///      without minting/burning (balances unchanged). `requireJurisdictionAllowed` still reverts
///      with `JurisdictionBlocked` for integrators that want a hard error without a state change.
contract CATVault is ERC4626, AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 private constant PATH_BUSINESS = keccak256("business");
    bytes32 private constant PATH_INDIVIDUAL = keccak256("individual");

    IBusinessPermissionRegistry public immutable businessRegistry;
    IIndividualPermissionRegistry public immutable individualRegistry;

    /// @dev Default-deny allowlist: must be explicitly true to pass.
    mapping(bytes2 => bool) public allowedJurisdictions;

    /// @dev Explicit blocklist: always denies, even if also on the allowlist.
    mapping(bytes2 => bool) public blockedJurisdictions;

    /// @dev Cached ISO 3166-1 alpha-2 from the first successful parse for `account`.
    mapping(address => bytes2) public cachedJurisdictions;

    mapping(address => bytes32) private _cachedDepositorPath;

    event JurisdictionChecked(
        address indexed account,
        bytes2 indexed jurisdiction,
        bool allowed,
        string operation,
        string depositorPath
    );

    event JurisdictionAllowlistUpdated(bytes2 indexed jurisdiction, bool allowed);

    event JurisdictionBlocklistUpdated(bytes2 indexed jurisdiction, bool blocked);

    event JurisdictionCacheUpdated(
        address indexed account,
        bytes2 indexed jurisdiction,
        string depositorPath
    );

    error JurisdictionBlocked(address account, bytes2 jurisdiction);
    error InvalidJurisdictionCode();

    constructor(
        IERC20 asset_,
        IBusinessPermissionRegistry businessRegistry_,
        IIndividualPermissionRegistry individualRegistry_,
        string memory name_,
        string memory symbol_
    ) ERC4626(asset_) ERC20(name_, symbol_) {
        businessRegistry = businessRegistry_;
        individualRegistry = individualRegistry_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }

    /// @notice Live preview (no cache). `allowed` is false when blocklisted or not allowlisted.
    function checkJurisdiction(address account)
        public
        view
        returns (bytes2 jurisdiction, bool allowed, string memory depositorPath)
    {
        (jurisdiction, depositorPath) = JurisdictionHelper.resolveJurisdiction(
            account,
            businessRegistry,
            individualRegistry
        );
        allowed = _isPermitted(jurisdiction);
    }

    /// @notice Reverts with JurisdictionBlocked when the account is not permitted.
    function requireJurisdictionAllowed(address account) public view {
        (bytes2 jurisdiction, bool allowed, ) = checkJurisdiction(account);
        if (!allowed) revert JurisdictionBlocked(account, jurisdiction);
    }

    function cachedDepositorPath(address account) external view returns (string memory) {
        return _pathToString(_cachedDepositorPath[account]);
    }

    /// @notice Record a jurisdiction check on-chain (always succeeds, always emits).
    /// @dev External so a subsequent soft-reject in the caller can keep this log.
    function recordJurisdictionCheck(address account, string calldata operation)
        external
        returns (bytes2 jurisdiction, bool allowed, string memory depositorPath)
    {
        return _logJurisdictionCheck(account, operation);
    }

    function refreshJurisdictionCache(address account) external {
        _writeCache(account);
    }

    function invalidateJurisdictionCache(address account) external onlyRole(COMPLIANCE_ROLE) {
        delete cachedJurisdictions[account];
        delete _cachedDepositorPath[account];
        emit JurisdictionCacheUpdated(account, bytes2(0), "");
    }

    function setJurisdictionAllowed(bytes2 jurisdiction, bool allowed)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        _setAllowed(jurisdiction, allowed);
    }

    function setJurisdictionAllowedBatch(bytes2[] calldata jurisdictions, bool allowed)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        for (uint256 i = 0; i < jurisdictions.length; i++) {
            _setAllowed(jurisdictions[i], allowed);
        }
    }

    function setJurisdictionBlocked(bytes2 jurisdiction, bool blocked)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        _setBlocked(jurisdiction, blocked);
    }

    function setJurisdictionBlockedBatch(bytes2[] calldata jurisdictions, bool blocked)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        for (uint256 i = 0; i < jurisdictions.length; i++) {
            _setBlocked(jurisdictions[i], blocked);
        }
    }

    /// @inheritdoc ERC4626
    function deposit(uint256 assets, address receiver) public override returns (uint256 shares) {
        if (!_passJurisdiction(receiver, "deposit")) {
            return 0;
        }
        return super.deposit(assets, receiver);
    }

    /// @inheritdoc ERC4626
    function mint(uint256 shares, address receiver) public override returns (uint256 assets) {
        if (!_passJurisdiction(receiver, "deposit")) {
            return 0;
        }
        return super.mint(shares, receiver);
    }

    /// @inheritdoc ERC4626
    function withdraw(uint256 assets, address receiver, address owner)
        public
        override
        returns (uint256 shares)
    {
        if (!_passJurisdiction(owner, "withdraw")) {
            return 0;
        }
        return super.withdraw(assets, receiver, owner);
    }

    /// @inheritdoc ERC4626
    function redeem(uint256 shares, address receiver, address owner)
        public
        override
        returns (uint256 assets)
    {
        if (!_passJurisdiction(owner, "withdraw")) {
            return 0;
        }
        return super.redeem(shares, receiver, owner);
    }

    /// @dev External self-call emits the log in a successful sub-frame, then soft-rejects if needed.
    function _passJurisdiction(address account, string memory operation) private returns (bool) {
        (, bool allowed, ) = this.recordJurisdictionCheck(account, operation);
        return allowed;
    }

    function _logJurisdictionCheck(address account, string memory operation)
        private
        returns (bytes2 jurisdiction, bool allowed, string memory depositorPath)
    {
        jurisdiction = cachedJurisdictions[account];
        if (jurisdiction == bytes2(0)) {
            (jurisdiction, depositorPath) = _writeCache(account);
        } else {
            depositorPath = _pathToString(_cachedDepositorPath[account]);
        }
        allowed = _isPermitted(jurisdiction);
        emit JurisdictionChecked(account, jurisdiction, allowed, operation, depositorPath);
    }

    function _isPermitted(bytes2 jurisdiction) private view returns (bool) {
        if (blockedJurisdictions[jurisdiction]) return false;
        return allowedJurisdictions[jurisdiction];
    }

    function _setAllowed(bytes2 jurisdiction, bool allowed) private {
        if (jurisdiction == bytes2(0)) revert InvalidJurisdictionCode();
        allowedJurisdictions[jurisdiction] = allowed;
        emit JurisdictionAllowlistUpdated(jurisdiction, allowed);
    }

    function _setBlocked(bytes2 jurisdiction, bool blocked) private {
        if (jurisdiction == bytes2(0)) revert InvalidJurisdictionCode();
        blockedJurisdictions[jurisdiction] = blocked;
        emit JurisdictionBlocklistUpdated(jurisdiction, blocked);
    }

    function _writeCache(address account)
        private
        returns (bytes2 jurisdiction, string memory depositorPath)
    {
        (jurisdiction, depositorPath) = JurisdictionHelper.resolveJurisdiction(
            account,
            businessRegistry,
            individualRegistry
        );
        cachedJurisdictions[account] = jurisdiction;
        _cachedDepositorPath[account] = keccak256(bytes(depositorPath));
        emit JurisdictionCacheUpdated(account, jurisdiction, depositorPath);
    }

    function _pathToString(bytes32 path) private pure returns (string memory) {
        if (path == PATH_BUSINESS) return "business";
        if (path == PATH_INDIVIDUAL) return "individual";
        return "";
    }
}
