// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface IERC20 {
	function approve(address spender, uint256 amount) external returns (bool);

	function transferFrom(
		address sender,
		address recipient,
		uint256 amount
	) external returns (bool);

	function approveDelegation(address delegatee, uint256 amount) external;
}

interface ILendingPool {
	struct ReserveConfigurationMap {
		//bit 0-15: LTV
		//bit 16-31: Liq. threshold
		//bit 32-47: Liq. bonus
		//bit 48-55: Decimals
		//bit 56: Reserve is active
		//bit 57: reserve is frozen
		//bit 58: borrowing is enabled
		//bit 59: stable rate borrowing enabled
		//bit 60-63: reserved
		//bit 64-79: reserve factor
		uint256 data;
	}
	// refer to the whitepaper, section 1.1 basic concepts for a formal description of these properties.
	struct ReserveData {
		//stores the reserve configuration
		ReserveConfigurationMap configuration;
		//the liquidity index. Expressed in ray
		uint128 liquidityIndex;
		//variable borrow index. Expressed in ray
		uint128 variableBorrowIndex;
		//the current supply rate. Expressed in ray
		uint128 currentLiquidityRate;
		//the current variable borrow rate. Expressed in ray
		uint128 currentVariableBorrowRate;
		//the current stable borrow rate. Expressed in ray
		uint128 currentStableBorrowRate;
		uint40 lastUpdateTimestamp;
		//tokens addresses
		address lTokenAddress;
		address stableDebtTokenAddress;
		address variableDebtTokenAddress;
		//address of the interest rate strategy
		address interestRateStrategyAddress;
		//the id of the reserve. Represents the position in the list of the active reserves
		uint8 id;
	}

	/**
	 * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying lTokens.
	 * - E.g. User deposits 100 USDC and gets in return 100 lUSDC
	 * @param asset The address of the underlying asset to deposit
	 * @param amount The amount to be deposited
	 * @param onBehalfOf The address that will receive the lTokens, same as msg.sender if the user
	 *   wants to receive them on his own wallet, or a different address if the beneficiary of lTokens
	 *   is a different wallet
	 * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
	 *   0 if the action is executed directly by the user, without any middle-man
	 **/
	function deposit(
		address asset,
		uint256 amount,
		address onBehalfOf,
		uint16 referralCode
	) external;

	/**
	 * @dev Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
	 * already deposited enough collateral, or he was given enough allowance by a credit delegator on the
	 * corresponding debt token (StableDebtToken or VariableDebtToken)
	 * - E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet
	 *   and 100 stable/variable debt tokens, depending on the `interestRateMode`
	 * @param asset The address of the underlying asset to borrow
	 * @param amount The amount to be borrowed
	 * @param interestRateMode The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable
	 * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
	 *   0 if the action is executed directly by the user, without any middle-man
	 * @param onBehalfOf Address of the user who will receive the debt. Should be the address of the borrower itself
	 * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
	 * if he has been given credit delegation allowance
	 **/
	function borrow(
		address asset,
		uint256 amount,
		uint256 interestRateMode,
		uint16 referralCode,
		address onBehalfOf
	) external;

	/**
	 * @dev Returns the configuration of the reserve
	 * @param asset The address of the underlying asset of the reserve
	 * @return The configuration of the reserve
	 **/
	function getConfiguration(address asset)
		external
		view
		returns (ReserveConfigurationMap memory);

	/**
	 * @dev Returns the state and configuration of the reserve
	 * @param asset The address of the underlying asset of the reserve
	 * @return The state of the reserve
	 **/
	function getReserveData(address asset)
		external
		view
		returns (ReserveData memory);
}

contract Leverager {
	uint16 internal constant LEVERAGE_CODE = 10;
	uint256 internal constant LTV_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000; // prettier-ignore

	address public immutable lendingPool;

	constructor(address pool) public {
		lendingPool = pool;
	}

	/// @notice Loop the depositing and borrowing
	/// @param asset The address of the target token
	/// @param amount The total deposit amount
	/// @param interestRateMode The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable
	/// @param borrowRatio the percentage of the usage of the borrowed amount
	///                        e.g. 80% -> 8000
	/// @param loopCount The looping count how many times to deposit
	function loop(
		address asset,
		uint256 amount,
		uint256 interestRateMode,
		uint256 borrowRatio,
		uint256 loopCount
	) external {
		uint256 _ltv = ltv(asset);
		require(
			borrowRatio > 0 && borrowRatio <= _ltv,
			"Inappropriate borrow rate"
		);
		require(loopCount >= 2 && loopCount <= 40, "Inappropriate loop count");

		IERC20(asset).transferFrom(msg.sender, address(this), amount);
		IERC20(asset).approve(
			lendingPool,
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
		);
		uint256 _nextDepositAmount = amount;
		for (uint256 i = 0; i < loopCount - 1; i++) {
			ILendingPool(lendingPool).deposit(
				asset,
				_nextDepositAmount,
				msg.sender,
				LEVERAGE_CODE
			);
			_nextDepositAmount = (_nextDepositAmount * borrowRatio) / 10000;
			if (_nextDepositAmount == 0) {
				break;
			}
			ILendingPool(lendingPool).borrow(
				asset,
				_nextDepositAmount,
				interestRateMode,
				LEVERAGE_CODE,
				msg.sender
			);
		}
		if (_nextDepositAmount != 0) {
			ILendingPool(lendingPool).deposit(
				asset,
				_nextDepositAmount,
				msg.sender,
				0
			);
		}
	}

	function getConfiguration(address asset) public view returns (uint256 data) {
		data = ILendingPool(lendingPool).getConfiguration(asset).data;
	}

	/// @notice Get Loan to value of the asset.
	/// @param asset address of the target token
	/// @return ltv percentage: e.g. 80% -> 8000
	function ltv(address asset) public view returns (uint256) {
		uint256 data = getConfiguration(asset);
		return data & ~LTV_MASK;
	}
}