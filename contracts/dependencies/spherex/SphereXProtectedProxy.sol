// SPDX-License-Identifier: UNLICENSED
// (c) SphereX 2023 Terms&Conditions

pragma solidity 0.6.12;


import "../openzeppelin/contracts/Address.sol";
import "../openzeppelin/upgradeability/Proxy.sol";

import {SphereXProxyBase} from "./SphereXProxyBase.sol";

/**
 * @title SphereX abstract proxt contract which implements OZ's Proxy intereface.
 */
abstract contract SphereXProtectedProxy is SphereXProxyBase, Proxy {
    constructor(address admin, address operator, address engine) public SphereXProxyBase(admin, operator, engine) {}

    function _revert(bytes memory returndata) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert("FailedINNERcllse");
        }
    }

    /**
     * The main point of the contract, wrap the delegate operation with SphereX's protection modfifier
     * @param implementation delegate dst
     */
    function _protectedDelegate(address implementation)
        private
        sphereXGuardExternal(int256(uint256(uint32(msg.sig))))
        returns (bytes memory)
    {
        (bool success, bytes memory returndata) = implementation.delegatecall(msg.data);
        if (!success) {
            _revert(returndata);
        }
        return returndata;
    }

    /**
     * Override Proxy.sol _delegate to make every inheriting proxy delegate with sphere'x protection
     * @param implementation delegate dst
     */
    function _delegate(address implementation) internal virtual override {
        if (isProtectedFuncSig(msg.sig)) {
            bytes memory ret_data = _protectedDelegate(implementation);
            uint256 ret_size = ret_data.length;

            assembly {
                return(add(ret_data, 0x20), ret_size)
            }
        } else {
            super._delegate(implementation);
        }
    }
}
