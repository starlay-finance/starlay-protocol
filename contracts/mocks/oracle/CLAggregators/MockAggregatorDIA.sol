// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import {IDiaAggregator} from '../../../interfaces/IDiaAggregator.sol';

contract MockAggregatorDIA is IDiaAggregator {
  mapping(string => int256) public _prices;

  event AnswerUpdated(address[] assets, int256[] indexed prices);

  constructor(string[] memory currencyPairs, int256[] memory prices) public {
    require(currencyPairs.length == prices.length);
    for (uint256 i = 0; i < currencyPairs.length; i++) {
      _prices[currencyPairs[i]] = prices[i];
    }
  }

  function getValue(string memory key) external view override returns (uint128, uint128) {
    return (uint128(_prices[key]), 0);
  }
}
