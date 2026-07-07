// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBusinessPermissionRegistry} from "./interfaces/IBusinessPermissionRegistry.sol";
import {IIndividualPermissionRegistry} from "./interfaces/IIndividualPermissionRegistry.sol";
import {JurisdictionHelper} from "./libraries/JurisdictionHelper.sol";

/// @title CATVault
/// @notice ERC-4626 vault enforcing jurisdiction-based deposit and withdrawal restrictions
///         using on-chain Business or Individual Identifier metadata and an allowlist (default deny).
contract CATVault is ERC4626, Ownable {
    IBusinessPermissionRegistry public immutable businessRegistry;
    IIndividualPermissionRegistry public immutable individualRegistry;

    /// @dev Default-deny: only explicitly allowed jurisdictions may deposit or withdraw.
    mapping(bytes2 => bool) public allowedJurisdictions;

    event JurisdictionChecked(
        address indexed account,
        bytes2 indexed jurisdiction,
        bool allowed,
        string operation,
        string depositorPath
    );

    event JurisdictionAllowlistUpdated(bytes2 indexed jurisdiction, bool allowed);

    error JurisdictionBlocked(address account, bytes2 jurisdiction);
    error InvalidJurisdictionCode();

    constructor(
        IERC20 asset_,
        IBusinessPermissionRegistry businessRegistry_,
        IIndividualPermissionRegistry individualRegistry_,
        string memory name_,
        string memory symbol_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable() {
        businessRegistry = businessRegistry_;
        individualRegistry = individualRegistry_;
    }

    /// @notice Preview jurisdiction resolution and allowlist status for an account.
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

    /// @notice Allow or deny deposits and withdrawals from a jurisdiction (default deny when false).
    function setJurisdictionAllowed(bytes2 jurisdiction, bool allowed) external onlyOwner {
        _setAllowed(jurisdiction, allowed);
    }

    /// @notice Batch-update the jurisdiction allowlist.
    function setJurisdictionAllowedBatch(bytes2[] calldata jurisdictions, bool allowed)
        external
        onlyOwner
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
        (bytes2 jurisdiction, bool allowed, string memory depositorPath) = checkJurisdiction(account);
        emit JurisdictionChecked(account, jurisdiction, allowed, operation, depositorPath);
        if (!allowed) revert JurisdictionBlocked(account, jurisdiction);
    }
}
