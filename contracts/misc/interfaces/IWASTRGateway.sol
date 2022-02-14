// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

interface IWASTRGateway {
  function depositASTR(
    address lendingPool,
    address onBehalfOf,
    uint16 referralCode
  ) external payable;

  function withdrawASTR(
    address lendingPool,
    uint256 amount,
    address onBehalfOf
  ) external;

  function repayASTR(
    address lendingPool,
    uint256 amount,
    uint256 rateMode,
    address onBehalfOf
  ) external payable;

  function borrowASTR(
    address lendingPool,
    uint256 amount,
    uint256 interesRateMode,
    uint16 referralCode
  ) external;
}
