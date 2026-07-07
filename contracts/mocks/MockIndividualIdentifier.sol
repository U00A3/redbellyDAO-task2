// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIndividualIdentifier} from "../interfaces/IIndividualIdentifier.sol";

/// @notice Testnet/local Individual Identifier (IndividualOnboardingSDK output shape).
contract MockIndividualIdentifier is IIndividualIdentifier {
    string private _fullName;
    string private _identifierType;
    string private _identifier;
    string private _residentialAddress;

    function initialize(
        string memory fullName_,
        string memory identifierType_,
        string memory identifier_,
        string memory residentialAddress_
    ) external {
        _fullName = fullName_;
        _identifierType = identifierType_;
        _identifier = identifier_;
        _residentialAddress = residentialAddress_;
    }

    function fullName() external view override returns (string memory) {
        return _fullName;
    }

    function identifierType() external view override returns (string memory) {
        return _identifierType;
    }

    function identifier() external view override returns (string memory) {
        return _identifier;
    }

    function residentialAddress() external view override returns (string memory) {
        return _residentialAddress;
    }
}
