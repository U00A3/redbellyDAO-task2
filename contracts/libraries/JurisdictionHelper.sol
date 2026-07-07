// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBusinessIdentifier} from "../interfaces/IBusinessIdentifier.sol";
import {IBusinessPermissionRegistry} from "../interfaces/IBusinessPermissionRegistry.sol";
import {IIndividualIdentifier} from "../interfaces/IIndividualIdentifier.sol";
import {IIndividualPermissionRegistry} from "../interfaces/IIndividualPermissionRegistry.sol";

/// @title JurisdictionHelper
/// @notice Derives ISO 3166-1 alpha-2 jurisdiction codes from Business or Individual Identifier metadata.
library JurisdictionHelper {
    error JurisdictionParseFailed(address account, string reason);

    /// @notice Resolve jurisdiction via Business Identifier first, then Individual Identifier (dual-path).
    function resolveJurisdiction(
        address account,
        IBusinessPermissionRegistry businessRegistry,
        IIndividualPermissionRegistry individualRegistry
    ) internal view returns (bytes2 jurisdictionCode, string memory depositorPath) {
        address businessContract = businessRegistry.getBusinessContractAddress(account);
        if (businessContract != address(0)) {
            IBusinessIdentifier business = IBusinessIdentifier(businessContract);
            jurisdictionCode = resolveFromIdentityFields(
                account,
                business.identifierType(),
                business.identifier(),
                business.businessAddress()
            );
            return (jurisdictionCode, "business");
        }

        address individualContract = individualRegistry.getIndividualContractAddress(account);
        if (individualContract != address(0)) {
            IIndividualIdentifier individual = IIndividualIdentifier(individualContract);
            jurisdictionCode = resolveFromIdentityFields(
                account,
                individual.identifierType(),
                individual.identifier(),
                individual.residentialAddress()
            );
            return (jurisdictionCode, "individual");
        }

        revert JurisdictionParseFailed(account, "No Business or Individual Identifier linked to wallet");
    }

    /// @notice Shared ISO3166-1 / address parsing for business and individual metadata.
    function resolveFromIdentityFields(
        address account,
        string memory identifierType,
        string memory identifier,
        string memory locationAddress
    ) internal pure returns (bytes2 jurisdictionCode) {
        bytes memory typeBytes = bytes(identifierType);
        if (_equalsIgnoreCase(typeBytes, bytes("ISO3166-1")) ||
            _equalsIgnoreCase(typeBytes, bytes("ISO3166")) ||
            _equalsIgnoreCase(typeBytes, bytes("COUNTRY"))) {
            return _codeFromIdentifier(account, identifier);
        }

        if (bytes(identifier).length == 2) {
            return _toUpperCode(identifier);
        }

        bytes2 fromAddress = _codeFromLocationAddress(locationAddress);
        if (fromAddress != bytes2(0)) {
            return fromAddress;
        }

        revert JurisdictionParseFailed(account, "Unable to derive jurisdiction from identity metadata");
    }

    function _codeFromIdentifier(address account, string memory identifier) private pure returns (bytes2) {
        bytes memory id = bytes(identifier);
        if (id.length < 2) {
            revert JurisdictionParseFailed(account, "Identifier too short for ISO3166-1 code");
        }
        return _toUpperCode(identifier);
    }

    function _toUpperCode(string memory code) private pure returns (bytes2) {
        bytes memory raw = bytes(code);
        require(raw.length >= 2, "code");
        uint8 a = uint8(raw[0]);
        uint8 b = uint8(raw[1]);
        if (a >= 97 && a <= 122) a -= 32;
        if (b >= 97 && b <= 122) b -= 32;
        require(a >= 65 && a <= 90 && b >= 65 && b <= 90, "invalid ISO code");
        return bytes2(uint16(a) << 8 | uint16(b));
    }

    function _codeFromLocationAddress(string memory locationAddress) private pure returns (bytes2) {
        bytes memory addr = bytes(locationAddress);
        if (addr.length == 0) return bytes2(0);

        for (uint256 i = 0; i + 3 < addr.length; i++) {
            if (addr[i] == "(" &&
                _isAlphaUpperOrLower(addr[i + 1]) &&
                _isAlphaUpperOrLower(addr[i + 2]) &&
                addr[i + 3] == ")") {
                return _toUpperCode(string(abi.encodePacked(addr[i + 1], addr[i + 2])));
            }
        }

        uint256 lastComma = type(uint256).max;
        for (uint256 i = 0; i < addr.length; i++) {
            if (addr[i] == ",") lastComma = i;
        }

        bytes memory tail;
        if (lastComma != type(uint256).max && lastComma + 1 < addr.length) {
            tail = _trim(_slice(addr, lastComma + 1, addr.length));
        } else {
            tail = _trim(addr);
        }

        return _countryNameToCode(tail);
    }

    function _countryNameToCode(bytes memory name) private pure returns (bytes2) {
        if (_equalsIgnoreCase(name, bytes("Australia"))) return bytes2("AU");
        if (_equalsIgnoreCase(name, bytes("United States")) || _equalsIgnoreCase(name, bytes("USA"))) return bytes2("US");
        if (_equalsIgnoreCase(name, bytes("United Kingdom")) || _equalsIgnoreCase(name, bytes("UK"))) return bytes2("GB");
        if (_equalsIgnoreCase(name, bytes("Singapore"))) return bytes2("SG");
        if (_equalsIgnoreCase(name, bytes("Germany"))) return bytes2("DE");
        if (_equalsIgnoreCase(name, bytes("France"))) return bytes2("FR");
        if (_equalsIgnoreCase(name, bytes("Japan"))) return bytes2("JP");
        if (_equalsIgnoreCase(name, bytes("Canada"))) return bytes2("CA");
        if (_equalsIgnoreCase(name, bytes("New Zealand"))) return bytes2("NZ");
        if (_equalsIgnoreCase(name, bytes("Switzerland"))) return bytes2("CH");
        if (_equalsIgnoreCase(name, bytes("Netherlands"))) return bytes2("NL");
        if (_equalsIgnoreCase(name, bytes("Hong Kong"))) return bytes2("HK");
        if (_equalsIgnoreCase(name, bytes("Ireland"))) return bytes2("IE");
        if (_equalsIgnoreCase(name, bytes("Italy"))) return bytes2("IT");
        if (_equalsIgnoreCase(name, bytes("Spain"))) return bytes2("ES");
        if (_equalsIgnoreCase(name, bytes("Brazil"))) return bytes2("BR");
        if (_equalsIgnoreCase(name, bytes("India"))) return bytes2("IN");
        if (_equalsIgnoreCase(name, bytes("China"))) return bytes2("CN");
        if (_equalsIgnoreCase(name, bytes("South Korea")) || _equalsIgnoreCase(name, bytes("Korea"))) return bytes2("KR");
        if (_equalsIgnoreCase(name, bytes("United Arab Emirates")) || _equalsIgnoreCase(name, bytes("UAE"))) return bytes2("AE");
        if (name.length == 2 && _isAlphaUpperOrLower(name[0]) && _isAlphaUpperOrLower(name[1])) {
            return _toUpperCode(string(name));
        }
        return bytes2(0);
    }

    function _equalsIgnoreCase(bytes memory a, bytes memory b) private pure returns (bool) {
        if (a.length != b.length) return false;
        for (uint256 i = 0; i < a.length; i++) {
            bytes1 ca = a[i];
            bytes1 cb = b[i];
            if (ca >= 0x41 && ca <= 0x5A) ca = bytes1(uint8(ca) + 32);
            if (cb >= 0x41 && cb <= 0x5A) cb = bytes1(uint8(cb) + 32);
            if (ca != cb) return false;
        }
        return true;
    }

    function _isAlphaUpperOrLower(bytes1 c) private pure returns (bool) {
        return (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A);
    }

    function _slice(bytes memory data, uint256 start, uint256 end) private pure returns (bytes memory) {
        require(end >= start, "slice");
        bytes memory out = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            out[i - start] = data[i];
        }
        return out;
    }

    function _trim(bytes memory data) private pure returns (bytes memory) {
        uint256 start;
        uint256 end = data.length;
        while (start < end && data[start] == " ") start++;
        while (end > start && data[end - 1] == " ") end--;
        return _slice(data, start, end);
    }
}
