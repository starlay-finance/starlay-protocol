// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import "./LToken.sol";

/**
 * @title Starlay ERC20 LToken Rev2
 * @dev Implementation of the interest bearing token for the Starlay protocol
 *      - change _trasury for bonus of voting escrow
 * @author Starlay
 */
contract LTokenRev2 is LToken {
  uint256 public constant LTOKEN_REVISION_2 = 0x2;

  function getRevision() internal pure virtual override returns (uint256) {
    return LTOKEN_REVISION_2;
  }
}
