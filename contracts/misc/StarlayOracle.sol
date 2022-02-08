// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {Ownable} from '../dependencies/openzeppelin/contracts/Ownable.sol';
import {IERC20} from '../dependencies/openzeppelin/contracts/IERC20.sol';
import {IPriceAggregatorAdapter} from '../interfaces/IPriceAggregatorAdapter.sol';

import {IPriceOracleGetter} from '../interfaces/IPriceOracleGetter.sol';
import {SafeERC20} from '../dependencies/openzeppelin/contracts/SafeERC20.sol';

/// @title StarlayOracle
/// @author Starlay
/// @notice Proxy smart contract to get the price of an asset from a price source, with DIA Aggregator
///         smart contracts as primary option
/// - If the returned price by a DIA aggregator is <= 0, the call is forwarded to a fallbackOracle
contract StarlayOracle is IPriceOracleGetter, Ownable {
  using SafeERC20 for IERC20;

  event BaseCurrencySet(address indexed baseCurrency, uint256 baseCurrencyUnit);
  event AssetSourceUpdated(address indexed priceAggregator);
  event FallbackOracleUpdated(address indexed fallbackOracle);

  IPriceOracleGetter private _fallbackOracle;
  IPriceAggregatorAdapter private _adapter;
  address public immutable BASE_CURRENCY;
  uint256 public immutable BASE_CURRENCY_UNIT;

  /// @notice Constructor
  /// @param priceAggregatorAdapter The address of the price aggregator adapter to use feed prices
  /// @param fallbackOracle The address of the fallback oracle to use if the data of an
  ///        aggregator is not consistent
  /// @param baseCurrency the base currency used for the price quotes. If USD is used, base currency is 0x0
  /// @param baseCurrencyUnit the unit of the base currency
  constructor(
    address priceAggregatorAdapter,
    address fallbackOracle,
    address baseCurrency,
    uint256 baseCurrencyUnit
  ) public {
    _setFallbackOracle(fallbackOracle);
    _setPriceAggregatorAdapter(priceAggregatorAdapter);
    BASE_CURRENCY = baseCurrency;
    BASE_CURRENCY_UNIT = baseCurrencyUnit;
    emit BaseCurrencySet(baseCurrency, baseCurrencyUnit);
  }

  function setPriceAggregator(address priceAggregator) external onlyOwner {
    _setPriceAggregatorAdapter(priceAggregator);
  }

  /// @notice Sets the fallbackOracle
  /// - Callable only by the Starlay governance
  /// @param fallbackOracle The address of the fallbackOracle
  function setFallbackOracle(address fallbackOracle) external onlyOwner {
    _setFallbackOracle(fallbackOracle);
  }

  /// @notice Internal function to set the fallbackOracle
  /// @param fallbackOracle The address of the fallbackOracle
  function _setFallbackOracle(address fallbackOracle) internal {
    _fallbackOracle = IPriceOracleGetter(fallbackOracle);
    emit FallbackOracleUpdated(fallbackOracle);
  }

  function _setPriceAggregatorAdapter(address priceAggregatorAdapter) internal {
    _adapter = IPriceAggregatorAdapter(priceAggregatorAdapter);
    emit AssetSourceUpdated(priceAggregatorAdapter);
  }

  /// @notice Gets an asset price by address
  /// @param asset The asset address
  function getAssetPrice(address asset) public view override returns (uint256) {
    if (asset == BASE_CURRENCY) {
      return BASE_CURRENCY_UNIT;
    } else {
      int256 price = _adapter.currentPrice(asset);
      if (price > 0) {
        return uint256(price);
      } else {
        return _fallbackOracle.getAssetPrice(asset);
      }
    }
  }

  /// @notice Gets a list of prices from a list of assets addresses
  /// @param assets The list of assets addresses
  function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory) {
    uint256[] memory prices = new uint256[](assets.length);
    for (uint256 i = 0; i < assets.length; i++) {
      prices[i] = getAssetPrice(assets[i]);
    }
    return prices;
  }

  /// @notice Gets the address of the fallback oracle
  /// @return address The addres of the fallback oracle
  function getFallbackOracle() external view returns (address) {
    return address(_fallbackOracle);
  }
}
