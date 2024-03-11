// SPDX-License-Identifier: UNLICENSED
// (c) SphereX 2023 Terms&Conditions

pragma solidity 0.6.12;

import {SphereXProtectedBase} from "./SphereXProtectedBase.sol";

contract SphereXProxyBase is SphereXProtectedBase {
    constructor(address admin, address operator, address engine) public SphereXProtectedBase(admin, operator, engine) {}

    event AddedProtectedFuncSigs(bytes4[] patterns);
    event RemovedProtectedFuncSigs(bytes4[] patterns);

    /**
     * @dev As we dont want to conflict with the imp's storage we implenment the protected
     * @dev functions map in an arbitrary slot.
     */
    bytes32 private constant PROTECTED_FUNC_SIG_BASE_POSITION =
        bytes32(uint256(keccak256("eip1967.spherex.protection_sig_base")) - 1);

    /**
     * Sets the value of a functions signature in the protected functions map stored in an arbitrary slot
     * @param func_sig of the wanted function
     * @param value bool value to set for the given function signature
     */
    function _setProtectedFuncSig(bytes4 func_sig, bool value) internal {
        bytes32 position = keccak256(abi.encodePacked(func_sig, PROTECTED_FUNC_SIG_BASE_POSITION));
        assembly {
            sstore(position, value)
        }
    }

    /**
     * Adds several functions' signature to the protected functions map stored in an arbitrary slot
     * @param keys of the functions added to the protected map
     */
    function addProtectedFuncSigs(bytes4[] memory keys) public spherexOnlyOperator {
        for (uint256 i = 0; i < keys.length; ++i) {
            _setProtectedFuncSig(keys[i], true);
        }
        emit AddedProtectedFuncSigs(keys);
    }

    /**
     * Removes given functions' signature from the protected functions map
     * @param keys of the functions removed from the protected map
     */
    function removeProtectedFuncSigs(bytes4[] memory keys) public spherexOnlyOperator {
        for (uint256 i = 0; i < keys.length; ++i) {
            _setProtectedFuncSig(keys[i], false);
        }
        emit RemovedProtectedFuncSigs(keys);
    }

    /**
     * Getter for a specific function signature in the protected map
     * @param func_sig of the wanted function
     */
    function isProtectedFuncSig(bytes4 func_sig) public view virtual returns (bool value) {
        bytes32 position = keccak256(abi.encodePacked(func_sig, PROTECTED_FUNC_SIG_BASE_POSITION));
        assembly {
            value := sload(position)
        }
    }
}
