// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import {IPriceAggregatorAdapter} from '../interfaces/IPriceAggregatorAdapter.sol';
import {Ownable} from '../dependencies/openzeppelin/contracts/Ownable.sol';
import {IDiaAggregator} from '../interfaces/IDiaAggregator.sol';
import {IERC20Detailed} from '../dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {SafeMath} from '../dependencies/openzeppelin/contracts/SafeMath.sol';

/// @title PriceAggregatorDiaImpl
/// @author Starlay
/// @notice Price aggregator Dia implementation
contract PriceAggregatorAdapterDiaImpl is IPriceAggregatorAdapter, Ownable {
  IDiaAggregator private _aggregator;
  using SafeMath for uint256;
  string private DELIMITER = '/';
  string private _baseTokenSymbol;
  mapping(address => string) public symbols;
  event AggregatorUpdated(address aggregator);
  event AssetSourcesUpdated(address[] assets, string[] tokenSymbols);

  constructor(address aggregator, string memory baseTokenSymbol) public {
    _aggregator = IDiaAggregator(aggregator);
    _baseTokenSymbol = baseTokenSymbol;
  }

  function setAggregator(address aggregator) external onlyOwner {
    _aggregator = IDiaAggregator(aggregator);
    emit AggregatorUpdated(aggregator);
  }

  /// @notice External function called by the Starlay governance to set or replace sources of assets
  /// @param assets The addresses of the assets
  /// @param tokenSymbols The symbol of the source of each asset
  function setAssetSources(address[] calldata assets, string[] calldata tokenSymbols)
    external
    onlyOwner
  {
    _setAssetsSources(assets, tokenSymbols);
    emit AssetSourcesUpdated(assets, tokenSymbols);
  }

  /// @notice Internal function to set the sources for each asset
  /// @param assets The addresses of the assets
  /// @param tokenSymbols The symbol of the source of each asset
  function _setAssetsSources(address[] calldata assets, string[] calldata tokenSymbols) internal {
    require(assets.length == tokenSymbols.length, 'INCONSISTENT_PARAMS_LENGTH');
    for (uint256 i = 0; i < assets.length; i++) {
      symbols[assets[i]] = tokenSymbols[i];
    }
  }

  /// @dev Get current price of the asset
  /// @param asset The address of the asset
  /// @return The price of the asset
  function currentPrice(address asset) external view override returns (int256) {
    if (bytes(symbols[asset]).length == 0) {
      return 0;
    }
    (uint128 price, ) = _aggregator.getValue(toCurPair(symbols[asset]));
    return int256(price);
  }

  function toCurPair(string memory symbol) internal view returns (string memory) {
    return string(abi.encodePacked(symbol, DELIMITER, _baseTokenSymbol));
  }
}
