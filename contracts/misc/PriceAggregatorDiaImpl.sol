// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import {IPriceAggregator} from '../interfaces/IPriceAggregator.sol';
import {Ownable} from '../dependencies/openzeppelin/contracts/Ownable.sol';
import {IDiaAggregator} from '../interfaces/IDiaAggregator.sol';
import {IERC20Detailed} from '../dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {SafeMath} from '../dependencies/openzeppelin/contracts/SafeMath.sol';

/// @title PriceAggregatorDiaImpl
/// @author Starley
/// @notice Price aggregator Dia implementation
contract PriceAggregatorDiaImpl is IPriceAggregator, Ownable {
  IDiaAggregator private _aggregator;
  using SafeMath for uint256;
  string private DELIMITER = '/';
  string private _baseTokenSymbol;
  mapping(address => string) private symbols;

  constructor(address aggregator, string memory baseTokenSymbol) public {
    _aggregator = IDiaAggregator(aggregator);
    _baseTokenSymbol = baseTokenSymbol;
  }

  /// @notice External function called by the Aave governance to set or replace sources of assets
  /// @param assets The addresses of the assets
  /// @param tokenSymbols The symbol of the source of each asset
  function setAssetSources(address[] calldata assets, string[] calldata tokenSymbols)
    external
    onlyOwner
  {
    _setAssetsSources(assets, tokenSymbols);
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

  function currentPrice(address asset) external view override returns (int256) {
    string memory symbol = tokenSymbol(asset);
    if (keccak256(abi.encodePacked((symbol))) == keccak256(abi.encodePacked(('')))) {
      return 0;
    }
    (uint128 price, ) = _aggregator.getValue(feedKey(symbol));
    return int256(price);
  }

  function feedKey(string memory symbol) internal view returns (string memory) {
    return string(abi.encodePacked(symbol, DELIMITER, _baseTokenSymbol));
  }

  function tokenSymbol(address asset) internal view returns (string memory) {
    return symbols[asset];
  }
}
