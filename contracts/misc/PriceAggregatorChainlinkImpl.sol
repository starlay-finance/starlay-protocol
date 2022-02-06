// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
import {IPriceAggregator} from '../interfaces/IPriceAggregator.sol';
import {IChainlinkAggregator} from '../interfaces/IChainlinkAggregator.sol';
import {Ownable} from '../dependencies/openzeppelin/contracts/Ownable.sol';

/// @title PriceAggregatorChainlinkImpl
/// @author Starley
/// @notice Price aggregator Chainlink implementation
contract PriceAggregatorChainlinkImpl is IPriceAggregator, Ownable {
  mapping(address => IChainlinkAggregator) private assetsSources;

  function currentPrice(address asset) external view override returns (int256) {
    IChainlinkAggregator source = assetsSources[asset];
    if (address(source) == address(0)) {
      return 0;
    }
    return IChainlinkAggregator(source).latestAnswer();
  }

  /// @notice External function called by the Aave governance to set or replace sources of assets
  /// @param assets The addresses of the assets
  /// @param sources The address of the source of each asset
  function setAssetSources(address[] calldata assets, address[] calldata sources)
    external
    onlyOwner
  {
    _setAssetsSources(assets, sources);
  }

  /// @notice Internal function to set the sources for each asset
  /// @param assets The addresses of the assets
  /// @param sources The address of the source of each asset
  function _setAssetsSources(address[] memory assets, address[] memory sources) internal {
    require(assets.length == sources.length, 'INCONSISTENT_PARAMS_LENGTH');
    for (uint256 i = 0; i < assets.length; i++) {
      assetsSources[assets[i]] = IChainlinkAggregator(sources[i]);
    }
  }
}
