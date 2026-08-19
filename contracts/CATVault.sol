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
/// @notice ERC-4626 vault enforcing jurisdiction-based deposit and withdrawal restrictions
///         using on-chain Business or Individual Identifier metadata and an allowlist (default deny).
/// @dev Allowlist mutations require COMPLIANCE_ROLE (grantable to a multisig or timelock).
///      Parsed ISO codes are cached per account so repeat deposits/withdrawals skip string parsing.
contract CATVault is ERC4626, AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 private constant PATH_BUSINESS = keccak256("business");
    bytes32 private constant PATH_INDIVIDUAL = keccak256("individual");

    IBusinessPermissionRegistry public immutable businessRegistry;
    IIndividualPermissionRegistry public immutable individualRegistry;

    /// @dev Default-deny: only explicitly allowed jurisdictions may deposit or withdraw.
    mapping(bytes2 => bool) public allowedJurisdictions;

    /// @dev Cached ISO 3166-1 alpha-2 code from the first successful parse for `account`.
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

    /// @notice Preview live jurisdiction resolution and allowlist status (does not read the cache).
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
        allowed = allowedJurisdictions[jurisdiction];
    }

    /// @notice Cached depositor path (`business` / `individual`) or empty if uncached.
    function cachedDepositorPath(address account) external view returns (string memory) {
        return _pathToString(_cachedDepositorPath[account]);
    }

    /// @notice Re-parse identifier metadata and overwrite the cache (anyone may warm or refresh).
    function refreshJurisdictionCache(address account) external {
        _writeCache(account);
    }

    /// @notice Drop a stale cache entry (e.g. after KYC metadata change). COMPLIANCE_ROLE only.
    function invalidateJurisdictionCache(address account) external onlyRole(COMPLIANCE_ROLE) {
        delete cachedJurisdictions[account];
        delete _cachedDepositorPath[account];
        emit JurisdictionCacheUpdated(account, bytes2(0), "");
    }

    /// @notice Allow or deny deposits and withdrawals from a jurisdiction (default deny when false).
    function setJurisdictionAllowed(bytes2 jurisdiction, bool allowed)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        _setAllowed(jurisdiction, allowed);
    }

    /// @notice Batch-update the jurisdiction allowlist.
    function setJurisdictionAllowedBatch(bytes2[] calldata jurisdictions, bool allowed)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        for (uint256 i = 0; i < jurisdictions.length; i++) {
            _setAllowed(jurisdictions[i], allowed);
        }
    }

    function _setAllowed(bytes2 jurisdiction, bool allowed) private {
        if (jurisdiction == bytes2(0)) revert InvalidJurisdictionCode();
        allowedJurisdictions[jurisdiction] = allowed;
        emit JurisdictionAllowlistUpdated(jurisdiction, allowed);
    }

    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override {
        _enforceJurisdiction(receiver, "deposit");
        super._deposit(caller, receiver, assets, shares);
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override {
        _enforceJurisdiction(owner, "withdraw");
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    function _enforceJurisdiction(address account, string memory operation) private {
        bytes2 jurisdiction = cachedJurisdictions[account];
        string memory depositorPath;

        if (jurisdiction == bytes2(0)) {
            (jurisdiction, depositorPath) = _writeCache(account);
        } else {
            depositorPath = _pathToString(_cachedDepositorPath[account]);
        }

        bool allowed = allowedJurisdictions[jurisdiction];
        emit JurisdictionChecked(account, jurisdiction, allowed, operation, depositorPath);
        if (!allowed) revert JurisdictionBlocked(account, jurisdiction);
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
