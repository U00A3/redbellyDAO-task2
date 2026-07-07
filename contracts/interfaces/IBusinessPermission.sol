// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice On-chain BusinessPermission contract used by Redbelly after KYB onboarding.
interface IBusinessPermission {
    function getBusinessContractAddress(address walletAddress) external view returns (address);

    function hasBusinessPermission(address walletAddress) external view returns (bool);
}
