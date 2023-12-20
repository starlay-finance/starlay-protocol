// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;
import {IPriceAggregatorAdapter} from '../interfaces/IPriceAggregatorAdapter.sol';
import {Ownable} from '../dependencies/openzeppelin/contracts/Ownable.sol';
import {IAcalaOracle} from '../interfaces/IAcalaOracle.sol';
import {IERC20Detailed} from '../dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {SafeMath} from '../dependencies/openzeppelin/contracts/SafeMath.sol';

/// @title PriceAggregatorAdapterAcalaImpl
/// @author Starlay
/// @notice Price aggregator Acala implementation
contract PriceAggregatorAdapterAcalaImpl is IPriceAggregatorAdapter, Ownable {
  IAcalaOracle private _acala_oracle;
  using SafeMath for uint256;
  event OracleUpdated(address acala_oracle);

  constructor(address acala_oracle) public {
    _acala_oracle = IAcalaOracle(acala_oracle);
  }

  function setOracle(address acala_oracle) external onlyOwner {
    _acala_oracle = IAcalaOracle(acala_oracle);
    emit OracleUpdated(acala_oracle);
  }

  /// @dev Get current price of the asset
  /// @param asset The address of the asset
  /// @return The price of the asset
  function currentPrice(address asset) external view override returns (int256) {
    uint256 price = _acala_oracle.getPrice(asset);
    return int256(price);
  }

  function currentPrices(address[] memory assets) external view returns (int256[] memory) {
    int256[] memory prices = new int256[](assets.length);
    for (uint256 i = 0; i < assets.length; i++) {
      uint256 price = _acala_oracle.getPrice(assets[i]);
      prices[i] = int256(price);
    }
    return prices;
  }
}
