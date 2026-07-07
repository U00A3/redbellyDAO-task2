// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBusinessIdentifier} from "../interfaces/IBusinessIdentifier.sol";

/// @notice Testnet/local Business Identifier with configurable metadata fields.
contract MockBusinessIdentifier is IBusinessIdentifier {
    string private _companyName;
    string private _incorporatedName;
    string private _identifierType;
    string private _identifier;
    string private _businessAddress;
    bool private _isBeneficialOwner;

    function initialize(
        string memory companyName_,
        string memory incorporatedName_,
        string memory identifierType_,
        string memory identifier_,
        string memory businessAddress_,
        bool isBeneficialOwner_
    ) external {
        _companyName = companyName_;
        _incorporatedName = incorporatedName_;
        _identifierType = identifierType_;
        _identifier = identifier_;
        _businessAddress = businessAddress_;
        _isBeneficialOwner = isBeneficialOwner_;
    }

    function setIdentifier(string memory identifierType_, string memory identifier_) external {
        _identifierType = identifierType_;
        _identifier = identifier_;
    }

    function setBusinessAddress(string memory businessAddress_) external {
        _businessAddress = businessAddress_;
    }

    function companyName() external view override returns (string memory) {
        return _companyName;
    }

    function incorporatedName() external view override returns (string memory) {
        return _incorporatedName;
    }

    function identifierType() external view override returns (string memory) {
        return _identifierType;
    }

    function identifier() external view override returns (string memory) {
        return _identifier;
    }

    function businessAddress() external view override returns (string memory) {
        return _businessAddress;
    }

    function isBeneficialOwner() external view override returns (bool) {
        return _isBeneficialOwner;
    }
}
