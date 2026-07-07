// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal view interface for Redbelly Individual Identifier (retail / IndividualOnboardingSDK).
interface IIndividualIdentifier {
    function fullName() external view returns (string memory);

    function identifierType() external view returns (string memory);

    function identifier() external view returns (string memory);

    function residentialAddress() external view returns (string memory);
}
