// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {ILendingPoolAddressesProvider} from '../../interfaces/ILendingPoolAddressesProvider.sol';
import {IStarlayIncentivesController} from '../../interfaces/IStarlayIncentivesController.sol';

interface IUiPoolDataProvider {
  struct AggregatedReserveData {
    address underlyingAsset;
    string name;
    string symbol;
    uint256 decimals;
    uint256 baseLTVasCollateral;
    uint256 reserveLiquidationThreshold;
    uint256 reserveLiquidationBonus;
    uint256 reserveFactor;
    bool usageAsCollateralEnabled;
    bool borrowingEnabled;
    bool stableBorrowRateEnabled;
    bool isActive;
    bool isFrozen;
    // base data
    uint128 liquidityIndex;
    uint128 variableBorrowIndex;
    uint128 liquidityRate;
    uint128 variableBorrowRate;
    uint128 stableBorrowRate;
    uint40 lastUpdateTimestamp;
    address lTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    address interestRateStrategyAddress;
    //
    uint256 availableLiquidity;
    uint256 totalPrincipalStableDebt;
    uint256 averageStableRate;
    uint256 stableDebtLastUpdateTimestamp;
    uint256 totalScaledVariableDebt;
    uint256 priceInEth;
    uint256 variableRateSlope1;
    uint256 variableRateSlope2;
    uint256 stableRateSlope1;
    uint256 stableRateSlope2;
    // incentives
    uint256 lEmissionPerSecond;
    uint256 vdEmissionPerSecond;
    uint256 sdEmissionPerSecond;
    uint256 lIncentivesLastUpdateTimestamp;
    uint256 vdIncentivesLastUpdateTimestamp;
    uint256 sdIncentivesLastUpdateTimestamp;
    uint256 lTokenIncentivesIndex;
    uint256 vdTokenIncentivesIndex;
    uint256 sdTokenIncentivesIndex;
  }

  struct UserReserveData {
    address underlyingAsset;
    uint256 scaledLTokenBalance;
    bool usageAsCollateralEnabledOnUser;
    uint256 stableBorrowRate;
    uint256 scaledVariableDebt;
    uint256 principalStableDebt;
    uint256 stableBorrowLastUpdateTimestamp;
    // incentives
    uint256 lTokenincentivesUserIndex;
    uint256 vdTokenincentivesUserIndex;
    uint256 sdTokenincentivesUserIndex;
  }

  struct IncentivesControllerData {
    uint256 userUnclaimedRewards;
    uint256 emissionEndTimestamp;
  }

  function getReservesList(ILendingPoolAddressesProvider provider)
    external
    view
    returns (address[] memory);

  function incentivesController() external view returns (IStarlayIncentivesController);

  function getSimpleReservesData(ILendingPoolAddressesProvider provider)
    external
    view
    returns (
      AggregatedReserveData[] memory,
      uint256, // usd price eth
      uint256 // emission end timestamp
    );

  function getUserReservesData(ILendingPoolAddressesProvider provider, address user)
    external
    view
    returns (
      UserReserveData[] memory,
      uint256 // user unclaimed rewards
    );

  // generic method with full data
  function getReservesData(ILendingPoolAddressesProvider provider, address user)
    external
    view
    returns (
      AggregatedReserveData[] memory,
      UserReserveData[] memory,
      uint256,
      IncentivesControllerData memory
    );
}
