// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {ILendingPoolAddressesProvider} from '../interfaces/ILendingPoolAddressesProvider.sol';
import {IStarlayIncentivesController} from '../interfaces/IStarlayIncentivesController.sol';
import {IUiIncentiveDataProviderV2} from './interfaces/IUiIncentiveDataProviderV2.sol';
import {ILendingPool} from '../interfaces/ILendingPool.sol';
import {ILToken} from '../interfaces/ILToken.sol';
import {IVariableDebtToken} from '../interfaces/IVariableDebtToken.sol';
import {IStableDebtToken} from '../interfaces/IStableDebtToken.sol';
import {UserConfiguration} from '../protocol/libraries/configuration/UserConfiguration.sol';
import {DataTypes} from '../protocol/libraries/types/DataTypes.sol';
import {IERC20Detailed} from '../dependencies/openzeppelin/contracts/IERC20Detailed.sol';

contract UiIncentiveDataProviderV2 is IUiIncentiveDataProviderV2 {
  using UserConfiguration for DataTypes.UserConfigurationMap;

  constructor() public {}

  function getFullReservesIncentiveData(ILendingPoolAddressesProvider provider, address user)
    external
    view
    override
    returns (AggregatedReserveIncentiveData[] memory, UserReserveIncentiveData[] memory)
  {
    return (_getReservesIncentivesData(provider), _getUserReservesIncentivesData(provider, user));
  }

  function getReservesIncentivesData(ILendingPoolAddressesProvider provider)
    external
    view
    override
    returns (AggregatedReserveIncentiveData[] memory)
  {
    return _getReservesIncentivesData(provider);
  }

  function _getReservesIncentivesData(ILendingPoolAddressesProvider provider)
    private
    view
    returns (AggregatedReserveIncentiveData[] memory)
  {
    ILendingPool lendingPool = ILendingPool(provider.getLendingPool());
    address[] memory reserves = lendingPool.getReservesList();
    AggregatedReserveIncentiveData[] memory reservesIncentiveData =
      new AggregatedReserveIncentiveData[](reserves.length);

    for (uint256 i = 0; i < reserves.length; i++) {
      AggregatedReserveIncentiveData memory reserveIncentiveData = reservesIncentiveData[i];
      reserveIncentiveData.underlyingAsset = reserves[i];

      DataTypes.ReserveData memory baseData = lendingPool.getReserveData(reserves[i]);

      try IStableDebtToken(baseData.lTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController lTokenIncentiveController
      ) {
        if (address(lTokenIncentiveController) != address(0)) {
          address lRewardToken = lTokenIncentiveController.REWARD_TOKEN();

          try lTokenIncentiveController.getAssetData(baseData.lTokenAddress) returns (
            uint256 lTokenIncentivesIndex,
            uint256 lEmissionPerSecond,
            uint256 lIncentivesLastUpdateTimestamp
          ) {
            reserveIncentiveData.lIncentiveData = IncentiveData(
              lEmissionPerSecond,
              lIncentivesLastUpdateTimestamp,
              lTokenIncentivesIndex,
              lTokenIncentiveController.DISTRIBUTION_END(),
              baseData.lTokenAddress,
              lRewardToken,
              address(lTokenIncentiveController),
              IERC20Detailed(lRewardToken).decimals(),
              lTokenIncentiveController.PRECISION()
            );
          } catch (
            bytes memory /*lowLevelData*/
          ) {
            (
              uint256 lEmissionPerSecond,
              uint256 lIncentivesLastUpdateTimestamp,
              uint256 lTokenIncentivesIndex
            ) = lTokenIncentiveController.assets(baseData.lTokenAddress);

            reserveIncentiveData.lIncentiveData = IncentiveData(
              lEmissionPerSecond,
              lIncentivesLastUpdateTimestamp,
              lTokenIncentivesIndex,
              lTokenIncentiveController.DISTRIBUTION_END(),
              baseData.lTokenAddress,
              lRewardToken,
              address(lTokenIncentiveController),
              IERC20Detailed(lRewardToken).decimals(),
              lTokenIncentiveController.PRECISION()
            );
          }
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {
        // Will not get here
      }

      try IStableDebtToken(baseData.stableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController sdTokenIncentiveController
      ) {
        if (address(sdTokenIncentiveController) != address(0)) {
          address sdRewardToken = sdTokenIncentiveController.REWARD_TOKEN();
          try sdTokenIncentiveController.getAssetData(baseData.stableDebtTokenAddress) returns (
            uint256 sdTokenIncentivesIndex,
            uint256 sdEmissionPerSecond,
            uint256 sdIncentivesLastUpdateTimestamp
          ) {
            reserveIncentiveData.sdIncentiveData = IncentiveData(
              sdEmissionPerSecond,
              sdIncentivesLastUpdateTimestamp,
              sdTokenIncentivesIndex,
              sdTokenIncentiveController.DISTRIBUTION_END(),
              baseData.stableDebtTokenAddress,
              sdRewardToken,
              address(sdTokenIncentiveController),
              IERC20Detailed(sdRewardToken).decimals(),
              sdTokenIncentiveController.PRECISION()
            );
          } catch (
            bytes memory /*lowLevelData*/
          ) {
            (
              uint256 sdEmissionPerSecond,
              uint256 sdIncentivesLastUpdateTimestamp,
              uint256 sdTokenIncentivesIndex
            ) = sdTokenIncentiveController.assets(baseData.stableDebtTokenAddress);

            reserveIncentiveData.sdIncentiveData = IncentiveData(
              sdEmissionPerSecond,
              sdIncentivesLastUpdateTimestamp,
              sdTokenIncentivesIndex,
              sdTokenIncentiveController.DISTRIBUTION_END(),
              baseData.stableDebtTokenAddress,
              sdRewardToken,
              address(sdTokenIncentiveController),
              IERC20Detailed(sdRewardToken).decimals(),
              sdTokenIncentiveController.PRECISION()
            );
          }
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {
        // Will not get here
      }

      try IStableDebtToken(baseData.variableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController vdTokenIncentiveController
      ) {
        if (address(vdTokenIncentiveController) != address(0)) {
          address vdRewardToken = vdTokenIncentiveController.REWARD_TOKEN();

          try vdTokenIncentiveController.getAssetData(baseData.variableDebtTokenAddress) returns (
            uint256 vdTokenIncentivesIndex,
            uint256 vdEmissionPerSecond,
            uint256 vdIncentivesLastUpdateTimestamp
          ) {
            reserveIncentiveData.vdIncentiveData = IncentiveData(
              vdEmissionPerSecond,
              vdIncentivesLastUpdateTimestamp,
              vdTokenIncentivesIndex,
              vdTokenIncentiveController.DISTRIBUTION_END(),
              baseData.variableDebtTokenAddress,
              vdRewardToken,
              address(vdTokenIncentiveController),
              IERC20Detailed(vdRewardToken).decimals(),
              vdTokenIncentiveController.PRECISION()
            );
          } catch (
            bytes memory /*lowLevelData*/
          ) {
            (
              uint256 vdEmissionPerSecond,
              uint256 vdIncentivesLastUpdateTimestamp,
              uint256 vdTokenIncentivesIndex
            ) = vdTokenIncentiveController.assets(baseData.variableDebtTokenAddress);

            reserveIncentiveData.vdIncentiveData = IncentiveData(
              vdEmissionPerSecond,
              vdIncentivesLastUpdateTimestamp,
              vdTokenIncentivesIndex,
              vdTokenIncentiveController.DISTRIBUTION_END(),
              baseData.variableDebtTokenAddress,
              vdRewardToken,
              address(vdTokenIncentiveController),
              IERC20Detailed(vdRewardToken).decimals(),
              vdTokenIncentiveController.PRECISION()
            );
          }
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {
        // Will not get here
      }
    }
    return (reservesIncentiveData);
  }

  function getUserReservesIncentivesData(ILendingPoolAddressesProvider provider, address user)
    external
    view
    override
    returns (UserReserveIncentiveData[] memory)
  {
    return _getUserReservesIncentivesData(provider, user);
  }

  function _getUserReservesIncentivesData(ILendingPoolAddressesProvider provider, address user)
    private
    view
    returns (UserReserveIncentiveData[] memory)
  {
    ILendingPool lendingPool = ILendingPool(provider.getLendingPool());
    address[] memory reserves = lendingPool.getReservesList();

    UserReserveIncentiveData[] memory userReservesIncentivesData =
      new UserReserveIncentiveData[](user != address(0) ? reserves.length : 0);

    for (uint256 i = 0; i < reserves.length; i++) {
      DataTypes.ReserveData memory baseData = lendingPool.getReserveData(reserves[i]);

      // user reserve data
      userReservesIncentivesData[i].underlyingAsset = reserves[i];

      IUiIncentiveDataProviderV2.UserIncentiveData memory lUserIncentiveData;

      try ILToken(baseData.lTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController lTokenIncentiveController
      ) {
        if (address(lTokenIncentiveController) != address(0)) {
          address lRewardToken = lTokenIncentiveController.REWARD_TOKEN();
          lUserIncentiveData.tokenincentivesUserIndex = lTokenIncentiveController.getUserAssetData(
            user,
            baseData.lTokenAddress
          );
          lUserIncentiveData.userUnclaimedRewards = lTokenIncentiveController
            .getUserUnclaimedRewards(user);
          lUserIncentiveData.tokenAddress = baseData.lTokenAddress;
          lUserIncentiveData.rewardTokenAddress = lRewardToken;
          lUserIncentiveData.incentiveControllerAddress = address(lTokenIncentiveController);
          lUserIncentiveData.rewardTokenDecimals = IERC20Detailed(lRewardToken).decimals();
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {}

      userReservesIncentivesData[i].lTokenIncentivesUserData = lUserIncentiveData;

      UserIncentiveData memory vdUserIncentiveData;

      try IVariableDebtToken(baseData.variableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController vdTokenIncentiveController
      ) {
        if (address(vdTokenIncentiveController) != address(0)) {
          address vdRewardToken = vdTokenIncentiveController.REWARD_TOKEN();
          vdUserIncentiveData.tokenincentivesUserIndex = vdTokenIncentiveController
            .getUserAssetData(user, baseData.variableDebtTokenAddress);
          vdUserIncentiveData.userUnclaimedRewards = vdTokenIncentiveController
            .getUserUnclaimedRewards(user);
          vdUserIncentiveData.tokenAddress = baseData.variableDebtTokenAddress;
          vdUserIncentiveData.rewardTokenAddress = vdRewardToken;
          vdUserIncentiveData.incentiveControllerAddress = address(vdTokenIncentiveController);
          vdUserIncentiveData.rewardTokenDecimals = IERC20Detailed(vdRewardToken).decimals();
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {}

      userReservesIncentivesData[i].vdTokenIncentivesUserData = vdUserIncentiveData;

      UserIncentiveData memory sdUserIncentiveData;

      try IStableDebtToken(baseData.stableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController sdTokenIncentiveController
      ) {
        if (address(sdTokenIncentiveController) != address(0)) {
          address sdRewardToken = sdTokenIncentiveController.REWARD_TOKEN();
          sdUserIncentiveData.tokenincentivesUserIndex = sdTokenIncentiveController
            .getUserAssetData(user, baseData.stableDebtTokenAddress);
          sdUserIncentiveData.userUnclaimedRewards = sdTokenIncentiveController
            .getUserUnclaimedRewards(user);
          sdUserIncentiveData.tokenAddress = baseData.stableDebtTokenAddress;
          sdUserIncentiveData.rewardTokenAddress = sdRewardToken;
          sdUserIncentiveData.incentiveControllerAddress = address(sdTokenIncentiveController);
          sdUserIncentiveData.rewardTokenDecimals = IERC20Detailed(sdRewardToken).decimals();
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {}

      userReservesIncentivesData[i].sdTokenIncentivesUserData = sdUserIncentiveData;
    }

    return (userReservesIncentivesData);
  }
}
