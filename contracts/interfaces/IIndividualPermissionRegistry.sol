// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Maps EOAs to deployed Individual Identifier contracts.
interface IIndividualPermissionRegistry {
    function getIndividualContractAddress(address wallet) external view returns (address individualContract);

    function hasIndividualPermission(address wallet) external view returns (bool);
}
