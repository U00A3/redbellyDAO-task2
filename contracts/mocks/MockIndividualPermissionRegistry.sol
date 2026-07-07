// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIndividualPermissionRegistry} from "../interfaces/IIndividualPermissionRegistry.sol";

contract MockIndividualPermissionRegistry is IIndividualPermissionRegistry {
    mapping(address => address) private _individualContracts;

    event IndividualLinked(address indexed wallet, address indexed individualContract);

    function linkIndividual(address wallet, address individualContract) external {
        _individualContracts[wallet] = individualContract;
        emit IndividualLinked(wallet, individualContract);
    }

    function unlinkIndividual(address wallet) external {
        delete _individualContracts[wallet];
    }

    function getIndividualContractAddress(address wallet)
        external
        view
        override
        returns (address individualContract)
    {
        return _individualContracts[wallet];
    }

    function hasIndividualPermission(address wallet) external view override returns (bool) {
        return _individualContracts[wallet] != address(0);
    }
}
