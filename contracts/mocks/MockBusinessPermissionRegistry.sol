// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBusinessPermissionRegistry} from "../interfaces/IBusinessPermissionRegistry.sol";

/// @notice Maps EOAs to deployed MockBusinessIdentifier contracts for local/testnet flows.
contract MockBusinessPermissionRegistry is IBusinessPermissionRegistry {
    mapping(address => address) private _businessContracts;

    event BusinessLinked(address indexed wallet, address indexed businessContract);

    function linkBusiness(address wallet, address businessContract) external {
        _businessContracts[wallet] = businessContract;
        emit BusinessLinked(wallet, businessContract);
    }

    function unlinkBusiness(address wallet) external {
        delete _businessContracts[wallet];
    }

    function getBusinessContractAddress(address wallet)
        external
        view
        override
        returns (address businessContract)
    {
        return _businessContracts[wallet];
    }

    function hasBusinessPermission(address wallet) external view override returns (bool) {
        return _businessContracts[wallet] != address(0);
    }
}
