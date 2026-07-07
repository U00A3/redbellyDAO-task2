// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBootstrap} from "../interfaces/IBootstrap.sol";

contract MockBootstrap is IBootstrap {
    mapping(string => address) private _addresses;

    function setContractAddress(string calldata name, address addr) external {
        _addresses[name] = addr;
    }

    function getContractAddress(string calldata name) external view override returns (address) {
        return _addresses[name];
    }
}
