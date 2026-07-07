// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBusinessPermissionRegistry} from "./interfaces/IBusinessPermissionRegistry.sol";
import {IBootstrap} from "./interfaces/IBootstrap.sol";
import {IBusinessPermission} from "./interfaces/IBusinessPermission.sol";

/// @title RedbellyBusinessRegistry
/// @notice Resolves Business Identifier contracts via Redbelly Bootstrap → BusinessPermission.
/// @dev When BusinessPermission is not yet registered on a network, reads return zero/false.
contract RedbellyBusinessRegistry is IBusinessPermissionRegistry {
    address public immutable businessPermission;

    constructor(address bootstrap) {
        businessPermission = IBootstrap(bootstrap).getContractAddress("businessPermission");
    }

    function getBusinessContractAddress(address wallet)
        external
        view
        override
        returns (address businessContract)
    {
        if (businessPermission == address(0)) return address(0);
        return IBusinessPermission(businessPermission).getBusinessContractAddress(wallet);
    }

    function hasBusinessPermission(address wallet) external view override returns (bool) {
        if (businessPermission == address(0)) return false;
        return IBusinessPermission(businessPermission).hasBusinessPermission(wallet);
    }
}
