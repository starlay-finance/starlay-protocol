// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {IAcalaOracle} from '../../interfaces/IAcalaOracle.sol';
import {Ownable} from '../../dependencies/openzeppelin/contracts/Ownable.sol';

contract PriceOracle is IAcalaOracle, Ownable {
  mapping(address => uint256) private prices;

  function setPrice(address token, uint256 price) external onlyOwner {
    prices[token] = price;
  }

  function getPrice(address token) external view override returns (uint256) {}
}
