// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

contract MockAggregator {
  mapping(address => int256) private _prices;

  event AnswerUpdated(address[] assets, int256[] indexed prices);

  constructor(address[] memory assets, int256[] memory prices) public {
    require(assets.length == prices.length);
    for (uint256 i = 0; i < assets.length; i++) {
      _prices[assets[i]] = 1;
    }
  }

  function currentPrice(address asset) external view returns (int256) {
    return _prices[asset];
  }
}
