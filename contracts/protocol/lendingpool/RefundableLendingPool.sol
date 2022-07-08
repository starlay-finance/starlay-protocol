// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {LendingPool} from './LendingPool.sol';
import {ILendingPoolAddressesProvider} from '../../interfaces/ILendingPoolAddressesProvider.sol';
import {IERC20} from '../../dependencies/openzeppelin/contracts/IERC20.sol';

/**
 * @title LendingPool contract
 * @dev Main point of interaction with an Starlay protocol's market
 * pool admin can refund tokens from Leverager.
 * @author Starlay
 **/
contract RefundableLendingPool is LendingPool {
  function getRevision() internal pure virtual override returns (uint256) {
    return 0x3;
  }

  address public immutable _leverager;

  constructor(address leverager) public LendingPool() {
    _leverager = leverager;
  }

  function refundFromLeverager(address token) external {
    address poolAdmin = ILendingPoolAddressesProvider(_addressesProvider).getPoolAdmin();
    require(msg.sender == poolAdmin, 'only pool admin');
    uint256 balance = IERC20(token).balanceOf(_leverager);
    if (balance > 0) {
      IERC20(token).transferFrom(_leverager, poolAdmin, balance);
    }
  }
}
