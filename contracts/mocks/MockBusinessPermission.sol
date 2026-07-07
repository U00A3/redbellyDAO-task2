// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBusinessPermission} from "../interfaces/IBusinessPermission.sol";

contract MockBusinessPermission is IBusinessPermission {
    mapping(address => address) private _contracts;

    function link(address wallet, address businessContract) external {
        _contracts[wallet] = businessContract;
    }

    function getBusinessContractAddress(address walletAddress)
        external
        view
        override
        returns (address)
    {
        return _contracts[walletAddress];
    }

    function hasBusinessPermission(address walletAddress) external view override returns (bool) {
        return _contracts[walletAddress] != address(0);
    }
}
