// SPDX-License-Identifier: UNLICENSED
// (c) SphereX 2023 Terms&Conditions


import {ISphereXEngine, ModifierLocals} from "./ISphereXEngine.sol";

/**
 * @title SphereX base Customer contract template
 */
abstract contract SphereXProtectedBase {
    /**
     * @dev we would like to avoid occupying storage slots
     * @dev to easily incorporate with existing contracts
     */
    bytes32 private constant SPHEREX_ADMIN_STORAGE_SLOT = bytes32(uint256(keccak256("eip1967.spherex.spherex")) - 1);
    bytes32 private constant SPHEREX_PENDING_ADMIN_STORAGE_SLOT =
        bytes32(uint256(keccak256("eip1967.spherex.pending")) - 1);
    bytes32 private constant SPHEREX_OPERATOR_STORAGE_SLOT = bytes32(uint256(keccak256("eip1967.spherex.operator")) - 1);
    bytes32 private constant SPHEREX_ENGINE_STORAGE_SLOT =
        bytes32(uint256(keccak256("eip1967.spherex.spherex_engine")) - 1);

    event ChangedSpherexOperator(address oldSphereXAdmin, address newSphereXAdmin);
    event ChangedSpherexEngineAddress(address oldEngineAddress, address newEngineAddress);
    event SpherexAdminTransferStarted(address currentAdmin, address pendingAdmin);
    event SpherexAdminTransferCompleted(address oldAdmin, address newAdmin);
    event NewAllowedSenderOnchain(address sender);

    /**
     * @dev used when the client doesn't use a proxy
     */
    constructor(address admin, address operator, address engine) public {
        __SphereXProtectedBase_init(admin, operator, engine);
    }

    /**
     * @dev used when the client uses a proxy - should be called by the inhereter initialization
     */
    function __SphereXProtectedBase_init(address admin, address operator, address engine) internal virtual {
        _setAddress(SPHEREX_ADMIN_STORAGE_SLOT, admin);
        emit SpherexAdminTransferCompleted(address(0), admin);

        _setAddress(SPHEREX_OPERATOR_STORAGE_SLOT, operator);
        emit ChangedSpherexOperator(address(0), operator);

        _checkSphereXEngine(engine);
        _setAddress(SPHEREX_ENGINE_STORAGE_SLOT, engine);
        emit ChangedSpherexEngineAddress(address(0), engine);
    }

    // ============ Helper functions ============

    function _sphereXEngine() private view returns (ISphereXEngine) {
        return ISphereXEngine(_getAddress(SPHEREX_ENGINE_STORAGE_SLOT));
    }

    /**
     * Stores a new address in an arbitrary slot
     * @param slot where to store the address
     * @param newAddress address to store in given slot
     */
    function _setAddress(bytes32 slot, address newAddress) internal {
        // solhint-disable-next-line no-inline-assembly
        // slither-disable-next-line assembly
        assembly {
            sstore(slot, newAddress)
        }
    }

    /**
     * Returns an address from an arbitrary slot.
     * @param slot to read an address from
     */
    function _getAddress(bytes32 slot) internal view returns (address addr) {
        // solhint-disable-next-line no-inline-assembly
        // slither-disable-next-line assembly
        assembly {
            addr := sload(slot)
        }
    }

    // ============ Local modifiers ============

    modifier onlySphereXAdmin() {
        require(msg.sender == _getAddress(SPHEREX_ADMIN_STORAGE_SLOT), "SphereX error: admin required");
        _;
    }

    modifier spherexOnlyOperator() {
        require(msg.sender == _getAddress(SPHEREX_OPERATOR_STORAGE_SLOT), "SphereX error: operator required");
        _;
    }

    modifier returnsIfNotActivated() {
        if (address(_sphereXEngine()) == address(0)) {
            return;
        }

        _;
    }

    // ============ Management ============

    /**
     * Returns the currently pending admin address, the one that can call acceptSphereXAdminRole to become the admin.
     * @dev Could not use OZ Ownable2Step because the client's contract might use it.
     */
    function pendingSphereXAdmin() public view returns (address) {
        return _getAddress(SPHEREX_PENDING_ADMIN_STORAGE_SLOT);
    }

    /**
     * Returns the current admin address, the one that can call acceptSphereXAdminRole to become the admin.
     * @dev Could not use OZ Ownable2Step because the client's contract might use it.
     */
    function sphereXAdmin() public view returns (address) {
        return _getAddress(SPHEREX_ADMIN_STORAGE_SLOT);
    }

    /**
     * Returns the current operator address.
     */
    function sphereXOperator() public view returns (address) {
        return _getAddress(SPHEREX_OPERATOR_STORAGE_SLOT);
    }

    /**
     * Returns the current engine address.
     */
    function sphereXEngine() public view returns (address) {
        return _getAddress(SPHEREX_ENGINE_STORAGE_SLOT);
    }

    /**
     * Setting the address of the next admin. this address will have to accept the role to become the new admin.
     * @dev Could not use OZ Ownable2Step because the client's contract might use it.
     */
    function transferSphereXAdminRole(address newAdmin) public virtual onlySphereXAdmin {
        _setAddress(SPHEREX_PENDING_ADMIN_STORAGE_SLOT, newAdmin);
        emit SpherexAdminTransferStarted(sphereXAdmin(), newAdmin);
    }

    /**
     * Accepting the admin role and completing the transfer.
     * @dev Could not use OZ Ownable2Step because the client's contract might use it.
     */
    function acceptSphereXAdminRole() public virtual {
        require(pendingSphereXAdmin() == msg.sender, "SphereX error: not the pending account");
        address oldAdmin = sphereXAdmin();
        _setAddress(SPHEREX_ADMIN_STORAGE_SLOT, msg.sender);
        _setAddress(SPHEREX_PENDING_ADMIN_STORAGE_SLOT, address(0));
        emit SpherexAdminTransferCompleted(oldAdmin, msg.sender);
    }

    /**
     *
     * @param newSphereXOperator new address of the new operator account
     */
    function changeSphereXOperator(address newSphereXOperator) external onlySphereXAdmin {
        address oldSphereXOperator = _getAddress(SPHEREX_OPERATOR_STORAGE_SLOT);
        _setAddress(SPHEREX_OPERATOR_STORAGE_SLOT, newSphereXOperator);
        emit ChangedSpherexOperator(oldSphereXOperator, newSphereXOperator);
    }

    /**
     * Checks the given address implements ISphereXEngine or is address(0)
     * @param newSphereXEngine new address of the spherex engine
     */
    function _checkSphereXEngine(address newSphereXEngine) private view {
        require(
            newSphereXEngine == address(0)
                || ISphereXEngine(newSphereXEngine).supportsInterface(type(ISphereXEngine).interfaceId),
            "SphereX error: not a SphereXEngine"
        );
    }

    /**
     *
     * @param newSphereXEngine new address of the spherex engine
     * @dev this is also used to actually enable the defense
     * (because as long is this address is 0, the protection is disabled).
     */
    function changeSphereXEngine(address newSphereXEngine) external spherexOnlyOperator {
        _checkSphereXEngine(newSphereXEngine);
        address oldEngine = _getAddress(SPHEREX_ENGINE_STORAGE_SLOT);
        _setAddress(SPHEREX_ENGINE_STORAGE_SLOT, newSphereXEngine);
        emit ChangedSpherexEngineAddress(oldEngine, newSphereXEngine);
    }
    // ============ Engine interaction ============

    function _addAllowedSenderOnChain(address newSender) internal {
        ISphereXEngine engine = _sphereXEngine();
        if (address(engine) != address(0)) {
            engine.addAllowedSenderOnChain(newSender);
        }
        emit NewAllowedSenderOnchain(newSender);
    }

    // ============ Hooks ============

    /**
     * @dev internal function for engine communication. We use it to reduce contract size.
     *  Should be called before the code of a function.
     * @param num function identifier
     * @param isExternalCall set to true if this was called externally
     *  or a 'public' function from another address
     */
    function _sphereXValidatePre(int256 num, bool isExternalCall)
        private
        returnsIfNotActivated
        returns (ModifierLocals memory locals)
    {
        ISphereXEngine sphereXEngine = _sphereXEngine();
        if (isExternalCall) {
            locals.storageSlots = sphereXEngine.sphereXValidatePre(num, msg.sender, msg.data);
        } else {
            locals.storageSlots = sphereXEngine.sphereXValidateInternalPre(num);
        }
        locals.valuesBefore = _readStorage(locals.storageSlots);
        locals.gas = gasleft();
        return locals;
    }

    /**
     * @dev internal function for engine communication. We use it to reduce contract size.
     *  Should be called after the code of a function.
     * @param num function identifier
     * @param isExternalCall set to true if this was called externally
     *  or a 'public' function from another address
     */
    function _sphereXValidatePost(int256 num, bool isExternalCall, ModifierLocals memory locals)
        private
        returnsIfNotActivated
    {
        uint256 gas = locals.gas - gasleft();

        ISphereXEngine sphereXEngine = _sphereXEngine();

        bytes32[] memory valuesAfter;
        valuesAfter = _readStorage(locals.storageSlots);

        if (isExternalCall) {
            sphereXEngine.sphereXValidatePost(num, gas, locals.valuesBefore, valuesAfter);
        } else {
            sphereXEngine.sphereXValidateInternalPost(num, gas, locals.valuesBefore, valuesAfter);
        }
    }

    /**
     * @dev internal function for engine communication. We use it to reduce contract size.
     *  Should be called before the code of a function.
     * @param num function identifier
     * @return locals ModifierLocals
     */
    function _sphereXValidateInternalPre(int256 num)
        internal
        returnsIfNotActivated
        returns (ModifierLocals memory locals)
    {
        locals.storageSlots = _sphereXEngine().sphereXValidateInternalPre(num);
        locals.valuesBefore = _readStorage(locals.storageSlots);
        locals.gas = gasleft();
        return locals;
    }

    /**
     * @dev internal function for engine communication. We use it to reduce contract size.
     *  Should be called after the code of a function.
     * @param num function identifier
     * @param locals ModifierLocals
     */
    function _sphereXValidateInternalPost(int256 num, ModifierLocals memory locals) internal returnsIfNotActivated {
        bytes32[] memory valuesAfter;
        valuesAfter = _readStorage(locals.storageSlots);
        _sphereXEngine().sphereXValidateInternalPost(num, locals.gas - gasleft(), locals.valuesBefore, valuesAfter);
    }

    /**
     *  @dev Modifier to be incorporated in all internal protected non-view functions
     */
    modifier sphereXGuardInternal(int256 num) {
        ModifierLocals memory locals = _sphereXValidateInternalPre(num);
        _;
        _sphereXValidateInternalPost(-num, locals);
    }

    /**
     *  @dev Modifier to be incorporated in all external protected non-view functions
     */
    modifier sphereXGuardExternal(int256 num) {
        ModifierLocals memory locals = _sphereXValidatePre(num, true);
        _;
        _sphereXValidatePost(-num, true, locals);
    }

    /**
     *  @dev Modifier to be incorporated in all public protected non-view functions
     */
    modifier sphereXGuardPublic(int256 num, bytes4 selector) {
        ModifierLocals memory locals = _sphereXValidatePre(num, msg.sig == selector);
        _;
        _sphereXValidatePost(-num, msg.sig == selector, locals);
    }

    // ============ Internal Storage logic ============

    /**
     * Internal function that reads values from given storage slots and returns them
     * @param storageSlots list of storage slots to read
     * @return list of values read from the various storage slots
     */
    function _readStorage(bytes32[] memory storageSlots) internal view returns (bytes32[] memory) {
        uint256 arrayLength = storageSlots.length;
        bytes32[] memory values = new bytes32[](arrayLength);
        // create the return array data

        for (uint256 i = 0; i < arrayLength; i++) {
            bytes32 slot = storageSlots[i];
            bytes32 temp_value;
            // solhint-disable-next-line no-inline-assembly
            // slither-disable-next-line assembly
            assembly {
                temp_value := sload(slot)
            }

            values[i] = temp_value;
        }
        return values;
    }
}
