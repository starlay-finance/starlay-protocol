// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {Ownable} from '../dependencies/openzeppelin/contracts/Ownable.sol';
import {IERC20} from '../dependencies/openzeppelin/contracts/IERC20.sol';
import {IWASTR} from './interfaces/IWASTR.sol';
import {IWASTRGateway} from './interfaces/IWASTRGateway.sol';
import {ILendingPool} from '../interfaces/ILendingPool.sol';
import {ILToken} from '../interfaces/ILToken.sol';
import {ReserveConfiguration} from '../protocol/libraries/configuration/ReserveConfiguration.sol';
import {UserConfiguration} from '../protocol/libraries/configuration/UserConfiguration.sol';
import {Helpers} from '../protocol/libraries/helpers/Helpers.sol';
import {DataTypes} from '../protocol/libraries/types/DataTypes.sol';

contract WASTRGateway is IWASTRGateway, Ownable {
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
  using UserConfiguration for DataTypes.UserConfigurationMap;

  IWASTR internal immutable WASTR;

  /**
   * @dev Sets the WASTR address and the LendingPoolAddressesProvider address. Infinite approves lending pool.
   * @param wastr Address of the Wrapped Astar contract
   **/
  constructor(address wastr) public {
    WASTR = IWASTR(wastr);
  }

  function authorizeLendingPool(address lendingPool) external onlyOwner {
    WASTR.approve(lendingPool, uint256(-1));
  }

  /**
   * @dev deposits WASTR into the reserve, using native ASTAR. A corresponding amount of the overlying asset (lTokens)
   * is minted.
   * @param lendingPool address of the targeted underlying lending pool
   * @param onBehalfOf address of the user who will receive the lTokens representing the deposit
   * @param referralCode integrators are assigned a referral code and can potentially receive rewards.
   **/
  function depositASTR(
    address lendingPool,
    address onBehalfOf,
    uint16 referralCode
  ) external payable override {
    WASTR.deposit{value: msg.value}();
    ILendingPool(lendingPool).deposit(address(WASTR), msg.value, onBehalfOf, referralCode);
  }

  /**
   * @dev withdraws the WASTR _reserves of msg.sender.
   * @param lendingPool address of the targeted underlying lending pool
   * @param amount amount of lWASTR to withdraw and receive native ASTAR
   * @param to address of the user who will receive native ASTAR
   */
  function withdrawASTR(
    address lendingPool,
    uint256 amount,
    address to
  ) external override {
    ILToken lWASTR = ILToken(ILendingPool(lendingPool).getReserveData(address(WASTR)).lTokenAddress);
    uint256 userBalance = lWASTR.balanceOf(msg.sender);
    uint256 amountToWithdraw = amount;

    // if amount is equal to uint(-1), the user wants to redeem everything
    if (amount == type(uint256).max) {
      amountToWithdraw = userBalance;
    }
    lWASTR.transferFrom(msg.sender, address(this), amountToWithdraw);
    ILendingPool(lendingPool).withdraw(address(WASTR), amountToWithdraw, address(this));
    WASTR.withdraw(amountToWithdraw);
    _safeTransferASTAR(to, amountToWithdraw);
  }

  /**
   * @dev repays a borrow on the WASTR reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified).
   * @param lendingPool address of the targeted underlying lending pool
   * @param amount the amount to repay, or uint256(-1) if the user wants to repay everything
   * @param rateMode the rate mode to repay
   * @param onBehalfOf the address for which msg.sender is repaying
   */
  function repayASTR(
    address lendingPool,
    uint256 amount,
    uint256 rateMode,
    address onBehalfOf
  ) external payable override {
    (uint256 stableDebt, uint256 variableDebt) =
      Helpers.getUserCurrentDebtMemory(
        onBehalfOf,
        ILendingPool(lendingPool).getReserveData(address(WASTR))
      );

    uint256 paybackAmount =
      DataTypes.InterestRateMode(rateMode) == DataTypes.InterestRateMode.STABLE
        ? stableDebt
        : variableDebt;

    if (amount < paybackAmount) {
      paybackAmount = amount;
    }
    require(msg.value >= paybackAmount, 'msg.value is less than repayment amount');
    WASTR.deposit{value: paybackAmount}();
    ILendingPool(lendingPool).repay(address(WASTR), msg.value, rateMode, onBehalfOf);

    // refund remaining dust astar
    if (msg.value > paybackAmount) _safeTransferASTAR(msg.sender, msg.value - paybackAmount);
  }

  /**
   * @dev borrow WASTR, unwraps to ASTAR and send both the ASTAR and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendingPool.borrow`.
   * @param lendingPool address of the targeted underlying lending pool
   * @param amount the amount of ASTAR to borrow
   * @param interesRateMode the interest rate mode
   * @param referralCode integrators are assigned a referral code and can potentially receive rewards
   */
  function borrowASTR(
    address lendingPool,
    uint256 amount,
    uint256 interesRateMode,
    uint16 referralCode
  ) external override {
    ILendingPool(lendingPool).borrow(
      address(WASTR),
      amount,
      interesRateMode,
      referralCode,
      msg.sender
    );
    WASTR.withdraw(amount);
    _safeTransferASTAR(msg.sender, amount);
  }

  /**
   * @dev transfer ASTAR to an address, revert if it fails.
   * @param to recipient of the transfer
   * @param value the amount to send
   */
  function _safeTransferASTAR(address to, uint256 value) internal {
    (bool success, ) = to.call{value: value}(new bytes(0));
    require(success, 'ASTAR_TRANSFER_FAILED');
  }

  /**
   * @dev transfer ERC20 from the utility contract, for ERC20 recovery in case of stuck tokens due
   * direct transfers to the contract address.
   * @param token token to transfer
   * @param to recipient of the transfer
   * @param amount amount to send
   */
  function emergencyTokenTransfer(
    address token,
    address to,
    uint256 amount
  ) external onlyOwner {
    IERC20(token).transfer(to, amount);
  }

  /**
   * @dev transfer native Astar from the utility contract, for native Astar recovery in case of stuck Astar
   * due selfdestructs or transfer astar to pre-computated contract address before deployment.
   * @param to recipient of the transfer
   * @param amount amount to send
   */
  function emergencyAstarTransfer(address to, uint256 amount) external onlyOwner {
    _safeTransferASTAR(to, amount);
  }

  /**
   * @dev Get WASTR address used by WASTRGateway
   */
  function getWASTRAddress() external view returns (address) {
    return address(WASTR);
  }

  /**
   * @dev Only WASTR contract is allowed to transfer ASTAR here. Prevent other addresses to send Astar to this contract.
   */
  receive() external payable {
    require(msg.sender == address(WASTR), 'Receive not allowed');
  }

  /**
   * @dev Revert fallback calls
   */
  fallback() external payable {
    revert('Fallback not allowed');
  }
}
