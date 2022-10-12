// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import "./LTokenRev2.sol";

/**
 * @title Starlay ERC20 LToken Rev3
 * @dev Implementation of the interest bearing token for the Starlay protocol
 * @author Starlay
 */
contract LTokenRev3 is LTokenRev2 {
  uint256 public constant LTOKEN_REVISION_3 = 0x3;

  /// @inheritdoc VersionedInitializable
  function getRevision() internal pure virtual override returns (uint256) {
    return LTOKEN_REVISION_3;
  }
}
