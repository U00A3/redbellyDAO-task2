// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal view interface for Redbelly Business Identifier contracts.
/// @dev Matches on-chain fields documented at vine.redbelly.network/business-verification/identifier-contract/
interface IBusinessIdentifier {
    function companyName() external view returns (string memory);

    function incorporatedName() external view returns (string memory);

    function identifierType() external view returns (string memory);

    function identifier() external view returns (string memory);

    function businessAddress() external view returns (string memory);

    function isBeneficialOwner() external view returns (bool);
}
