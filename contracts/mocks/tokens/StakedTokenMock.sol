// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {IStakedToken} from '../../interfaces/IStakedToken.sol';

/// @title StarlayOracle
/// @author Starlay
/// @notice Proxy smart contract to get the price of an asset from a price source, with DIA Aggregator
///         smart contracts as primary option
/// - If the returned price by a DIA aggregator is <= 0, the call is forwarded to a fallbackOracle
contract StakedTokenMock is IStakedToken {
  uint256 public _totalSupply = 0;
  uint256 public _coolDownSeconds = 0;
  uint256 public _unstakeWindow = 0;
  uint256 public _distributionEnd = 0;
  AssetData public _assetData;
  uint256 public _balance = 0;
  uint256 public _totalRewardsBalance = 0;
  uint256 public _stakeCooldown = 0;

  function totalSupply() external view override returns (uint256) {
    return _totalSupply;
  }

  function setTotalSupply(uint256 __totalSupply) public {
    _totalSupply = __totalSupply;
  }

  function COOLDOWN_SECONDS() external view override returns (uint256) {
    return _coolDownSeconds;
  }

  function setCooldownSeconds(uint256 __cooldownSeconds) public {
    _coolDownSeconds = __cooldownSeconds;
  }

  function UNSTAKE_WINDOW() external view override returns (uint256) {
    return _unstakeWindow;
  }

  function setUnstakeWindow(uint256 __unstakeWindow) public {
    _unstakeWindow = __unstakeWindow;
  }

  function DISTRIBUTION_END() external view override returns (uint256) {
    return _distributionEnd;
  }

  function setDistributionEnd(uint256 __distributionEnd) public {
    _distributionEnd = __distributionEnd;
  }

  function assets(address asset) external view override returns (AssetData memory) {
    return _assetData;
  }

  function setAsset(AssetData memory __asset) public {
    _assetData = __asset;
  }

  function balanceOf(address user) external view override returns (uint256) {
    return _balance;
  }

  function setBalance(uint256 __balance) public {
    _balance = __balance;
  }

  function getTotalRewardsBalance(address user) external view override returns (uint256) {
    return _totalRewardsBalance;
  }

  function setTotalRewardsBalance(uint256 balance) public {
    _totalRewardsBalance = balance;
  }

  function stakersCooldowns(address user) external view override returns (uint256) {
    return 1;
  }

  function setStakersCooldowns(uint256 __stakeCooldown) public {
    _stakeCooldown = __stakeCooldown;
  }
}
