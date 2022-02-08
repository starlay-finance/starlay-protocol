// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {ILendingPoolAddressesProvider} from '../interfaces/ILendingPoolAddressesProvider.sol';
import {IStarlayIncentivesController} from '../interfaces/IStarlayIncentivesController.sol';
import {IUiIncentiveDataProviderV3} from './interfaces/IUiIncentiveDataProviderV3.sol';
import {ILendingPool} from '../interfaces/ILendingPool.sol';
import {ILToken} from '../interfaces/ILToken.sol';
import {IVariableDebtToken} from '../interfaces/IVariableDebtToken.sol';
import {IStableDebtToken} from '../interfaces/IStableDebtToken.sol';
import {UserConfiguration} from '../protocol/libraries/configuration/UserConfiguration.sol';
import {DataTypes} from '../protocol/libraries/types/DataTypes.sol';
import {IERC20Detailed} from '../dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {IERC20DetailedBytes} from './interfaces/IERC20DetailedBytes.sol';

contract UiIncentiveDataProviderV2V3 is IUiIncentiveDataProviderV3 {
  using UserConfiguration for DataTypes.UserConfigurationMap;

  address public constant MKRAddress = 0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2;

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

      try ILToken(baseData.lTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController lTokenIncentiveController
      ) {
        RewardInfo[] memory lRewardsInformation = new RewardInfo[](1);
        if (address(lTokenIncentiveController) != address(0)) {
          address lRewardToken = lTokenIncentiveController.REWARD_TOKEN();

          try lTokenIncentiveController.getAssetData(baseData.lTokenAddress) returns (
            uint256 lTokenIncentivesIndex,
            uint256 lEmissionPerSecond,
            uint256 lIncentivesLastUpdateTimestamp
          ) {
            lRewardsInformation[0] = RewardInfo(
              getSymbol(lRewardToken),
              lRewardToken,
              address(0),
              lEmissionPerSecond,
              lIncentivesLastUpdateTimestamp,
              lTokenIncentivesIndex,
              lTokenIncentiveController.DISTRIBUTION_END(),
              0,
              IERC20Detailed(lRewardToken).decimals(),
              lTokenIncentiveController.PRECISION(),
              0
            );
            reserveIncentiveData.lIncentiveData = IncentiveData(
              baseData.lTokenAddress,
              address(lTokenIncentiveController),
              lRewardsInformation
            );
          } catch (
            bytes memory /*lowLevelData*/
          ) {
            (
              uint256 lEmissionPerSecond,
              uint256 lIncentivesLastUpdateTimestamp,
              uint256 lTokenIncentivesIndex
            ) = lTokenIncentiveController.assets(baseData.lTokenAddress);
            lRewardsInformation[0] = RewardInfo(
              getSymbol(lRewardToken),
              lRewardToken,
              address(0),
              lEmissionPerSecond,
              lIncentivesLastUpdateTimestamp,
              lTokenIncentivesIndex,
              lTokenIncentiveController.DISTRIBUTION_END(),
              0,
              IERC20Detailed(lRewardToken).decimals(),
              lTokenIncentiveController.PRECISION(),
              0
            );

            reserveIncentiveData.lIncentiveData = IncentiveData(
              baseData.lTokenAddress,
              address(lTokenIncentiveController),
              lRewardsInformation
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
        RewardInfo[] memory sdRewardsInformation = new RewardInfo[](1);
        if (address(sdTokenIncentiveController) != address(0)) {
          address sdRewardToken = sdTokenIncentiveController.REWARD_TOKEN();
          try sdTokenIncentiveController.getAssetData(baseData.stableDebtTokenAddress) returns (
            uint256 sdTokenIncentivesIndex,
            uint256 sdEmissionPerSecond,
            uint256 sdIncentivesLastUpdateTimestamp
          ) {
            sdRewardsInformation[0] = RewardInfo(
              getSymbol(sdRewardToken),
              sdRewardToken,
              address(0),
              sdEmissionPerSecond,
              sdIncentivesLastUpdateTimestamp,
              sdTokenIncentivesIndex,
              sdTokenIncentiveController.DISTRIBUTION_END(),
              0,
              IERC20Detailed(sdRewardToken).decimals(),
              sdTokenIncentiveController.PRECISION(),
              0
            );

            reserveIncentiveData.sdIncentiveData = IncentiveData(
              baseData.stableDebtTokenAddress,
              address(sdTokenIncentiveController),
              sdRewardsInformation
            );
          } catch (
            bytes memory /*lowLevelData*/
          ) {
            (
              uint256 sdEmissionPerSecond,
              uint256 sdIncentivesLastUpdateTimestamp,
              uint256 sdTokenIncentivesIndex
            ) = sdTokenIncentiveController.assets(baseData.stableDebtTokenAddress);

            sdRewardsInformation[0] = RewardInfo(
              getSymbol(sdRewardToken),
              sdRewardToken,
              address(0),
              sdEmissionPerSecond,
              sdIncentivesLastUpdateTimestamp,
              sdTokenIncentivesIndex,
              sdTokenIncentiveController.DISTRIBUTION_END(),
              0,
              IERC20Detailed(sdRewardToken).decimals(),
              sdTokenIncentiveController.PRECISION(),
              0
            );

            reserveIncentiveData.sdIncentiveData = IncentiveData(
              baseData.stableDebtTokenAddress,
              address(sdTokenIncentiveController),
              sdRewardsInformation
            );
          }
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {
        // Will not get here
      }

      try IVariableDebtToken(baseData.variableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController vdTokenIncentiveController
      ) {
        RewardInfo[] memory vdRewardsInformation = new RewardInfo[](1);
        if (address(vdTokenIncentiveController) != address(0)) {
          address vdRewardToken = vdTokenIncentiveController.REWARD_TOKEN();

          try vdTokenIncentiveController.getAssetData(baseData.variableDebtTokenAddress) returns (
            uint256 vdTokenIncentivesIndex,
            uint256 vdEmissionPerSecond,
            uint256 vdIncentivesLastUpdateTimestamp
          ) {
            vdRewardsInformation[0] = RewardInfo(
              getSymbol(vdRewardToken),
              vdRewardToken,
              address(0),
              vdEmissionPerSecond,
              vdIncentivesLastUpdateTimestamp,
              vdTokenIncentivesIndex,
              vdTokenIncentiveController.DISTRIBUTION_END(),
              0,
              IERC20Detailed(vdRewardToken).decimals(),
              vdTokenIncentiveController.PRECISION(),
              0
            );

            reserveIncentiveData.vdIncentiveData = IncentiveData(
              baseData.variableDebtTokenAddress,
              address(vdTokenIncentiveController),
              vdRewardsInformation
            );
          } catch (
            bytes memory /*lowLevelData*/
          ) {
            (
              uint256 vdEmissionPerSecond,
              uint256 vdIncentivesLastUpdateTimestamp,
              uint256 vdTokenIncentivesIndex
            ) = vdTokenIncentiveController.assets(baseData.variableDebtTokenAddress);

            vdRewardsInformation[0] = RewardInfo(
              getSymbol(vdRewardToken),
              vdRewardToken,
              address(0),
              vdEmissionPerSecond,
              vdIncentivesLastUpdateTimestamp,
              vdTokenIncentivesIndex,
              vdTokenIncentiveController.DISTRIBUTION_END(),
              0,
              IERC20Detailed(vdRewardToken).decimals(),
              vdTokenIncentiveController.PRECISION(),
              0
            );

            reserveIncentiveData.vdIncentiveData = IncentiveData(
              baseData.variableDebtTokenAddress,
              address(vdTokenIncentiveController),
              vdRewardsInformation
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

      try ILToken(baseData.lTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController lTokenIncentiveController
      ) {
        if (address(lTokenIncentiveController) != address(0)) {
          UserRewardInfo[] memory lUserRewardsInformation = new UserRewardInfo[](1);

          address lRewardToken = lTokenIncentiveController.REWARD_TOKEN();

          lUserRewardsInformation[0] = UserRewardInfo(
            getSymbol(lRewardToken),
            address(0),
            lRewardToken,
            lTokenIncentiveController.getUserUnclaimedRewards(user),
            lTokenIncentiveController.getUserAssetData(user, baseData.lTokenAddress),
            0,
            0,
            IERC20Detailed(lRewardToken).decimals()
          );

          userReservesIncentivesData[i].lTokenIncentivesUserData = UserIncentiveData(
            baseData.lTokenAddress,
            address(lTokenIncentiveController),
            lUserRewardsInformation
          );
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {}

      try IVariableDebtToken(baseData.variableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController vdTokenIncentiveController
      ) {
        if (address(vdTokenIncentiveController) != address(0)) {
          UserRewardInfo[] memory vdUserRewardsInformation = new UserRewardInfo[](1);

          address vdRewardToken = vdTokenIncentiveController.REWARD_TOKEN();

          vdUserRewardsInformation[0] = UserRewardInfo(
            getSymbol(vdRewardToken),
            address(0),
            vdRewardToken,
            vdTokenIncentiveController.getUserUnclaimedRewards(user),
            vdTokenIncentiveController.getUserAssetData(user, baseData.variableDebtTokenAddress),
            0,
            0,
            IERC20Detailed(vdRewardToken).decimals()
          );

          userReservesIncentivesData[i].vdTokenIncentivesUserData = UserIncentiveData(
            baseData.variableDebtTokenAddress,
            address(vdTokenIncentiveController),
            vdUserRewardsInformation
          );
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {}

      try IStableDebtToken(baseData.stableDebtTokenAddress).getIncentivesController() returns (
        IStarlayIncentivesController sdTokenIncentiveController
      ) {
        if (address(sdTokenIncentiveController) != address(0)) {
          UserRewardInfo[] memory sdUserRewardsInformation = new UserRewardInfo[](1);

          address sdRewardToken = sdTokenIncentiveController.REWARD_TOKEN();

          sdUserRewardsInformation[0] = UserRewardInfo(
            getSymbol(sdRewardToken),
            address(0),
            sdRewardToken,
            sdTokenIncentiveController.getUserUnclaimedRewards(user),
            sdTokenIncentiveController.getUserAssetData(user, baseData.stableDebtTokenAddress),
            0,
            0,
            IERC20Detailed(sdRewardToken).decimals()
          );

          userReservesIncentivesData[i].sdTokenIncentivesUserData = UserIncentiveData(
            baseData.stableDebtTokenAddress,
            address(sdTokenIncentiveController),
            sdUserRewardsInformation
          );
        }
      } catch (
        bytes memory /*lowLevelData*/
      ) {}
    }

    return (userReservesIncentivesData);
  }

  function getSymbol(address rewardToken) public view returns (string memory) {
    if (address(rewardToken) == address(MKRAddress)) {
      bytes32 symbol = IERC20DetailedBytes(rewardToken).symbol();
      return bytes32ToString(symbol);
    } else {
      return IERC20Detailed(rewardToken).symbol();
    }
  }

  function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
    uint8 i = 0;
    while (i < 32 && _bytes32[i] != 0) {
      i++;
    }
    bytes memory bytesArray = new bytes(i);
    for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
      bytesArray[i] = _bytes32[i];
    }
    return string(bytesArray);
  }
}
