// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Resolves a wallet address to its associated Business Identifier contract.
interface IBusinessPermissionRegistry {
    /// @return businessContract Address of the BusinessIdentifier contract, or zero if none.
    function getBusinessContractAddress(address wallet) external view returns (address businessContract);

    /// @return hasPermission True when the wallet is linked to a verified business entity.
    function hasBusinessPermission(address wallet) external view returns (bool hasPermission);
}
