import { StarlayFallbackOracle } from '../types';
import { LendingRateOracle } from '../types/LendingRateOracle';
import { PriceOracle } from '../types/PriceOracle';
import { deployMockAggregator } from './contracts-deployments';
import { getStableAndVariableTokensHelper } from './contracts-getters';
import { chunk, waitForTx } from './misc-utils';
import { iAssetBase, IMarketRates, iMultiPoolsAssets, SymbolMap, tEthereumAddress } from './types';

export const setInitialMarketRatesInRatesOracleByHelper = async (
  marketRates: iMultiPoolsAssets<IMarketRates>,
  assetsAddresses: { [x: string]: tEthereumAddress },
  lendingRateOracleInstance: LendingRateOracle,
  admin: tEthereumAddress
) => {
  const stableAndVariableTokenHelper = await getStableAndVariableTokensHelper();
  const assetAddresses: string[] = [];
  const borrowRates: string[] = [];
  const symbols: string[] = [];
  for (const [assetSymbol, { borrowRate }] of Object.entries(marketRates) as [
    string,
    IMarketRates
  ][]) {
    const assetAddressIndex = Object.keys(assetsAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, assetAddress] = (Object.entries(assetsAddresses) as [string, string][])[
      assetAddressIndex
    ];
    assetAddresses.push(assetAddress);
    borrowRates.push(borrowRate);
    symbols.push(assetSymbol);
  }
  // Set borrow rates per chunks
  const ratesChunks = 20;
  const chunkedTokens = chunk(assetAddresses, ratesChunks);
  const chunkedRates = chunk(borrowRates, ratesChunks);
  const chunkedSymbols = chunk(symbols, ratesChunks);

  // Set helper as owner
  await waitForTx(
    await lendingRateOracleInstance.transferOwnership(stableAndVariableTokenHelper.address)
  );

  console.log(`- Oracle borrow initalization in ${chunkedTokens.length} txs`);
  for (let chunkIndex = 0; chunkIndex < chunkedTokens.length; chunkIndex++) {
    const tx3 = await waitForTx(
      await stableAndVariableTokenHelper.setOracleBorrowRates(
        chunkedTokens[chunkIndex],
        chunkedRates[chunkIndex],
        lendingRateOracleInstance.address
      )
    );
    console.log(`  - Setted Oracle Borrow Rates for: ${chunkedSymbols[chunkIndex].join(', ')}`);
  }
  // Set back ownership
  await waitForTx(
    await stableAndVariableTokenHelper.setOracleOwnership(lendingRateOracleInstance.address, admin)
  );
};

export const setInitialAssetPricesInOracle = async (
  prices: iAssetBase<tEthereumAddress>,
  assetsAddresses: iAssetBase<tEthereumAddress>,
  priceOracleInstance: PriceOracle
) => {
  for (const [assetSymbol, price] of Object.entries(prices) as [string, string][]) {
    const assetAddressIndex = Object.keys(assetsAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, assetAddress] = (Object.entries(assetsAddresses) as [string, string][])[
      assetAddressIndex
    ];
    await waitForTx(await priceOracleInstance.setAssetPrice(assetAddress, price));
  }
};

export const setAssetPricesInFallbackOracle = async (
  prices: iAssetBase<tEthereumAddress>,
  assetsAddresses: iAssetBase<tEthereumAddress>,
  priceOracleInstance: StarlayFallbackOracle
) => {
  let addresses: string[] = [];
  let assetPrices: string[] = [];
  for (const [assetSymbol, price] of Object.entries(prices) as [string, string][]) {
    const assetAddressIndex = Object.keys(assetsAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, assetAddress] = (Object.entries(assetsAddresses) as [string, string][])[
      assetAddressIndex
    ];
    addresses.push(assetAddress);
    assetPrices.push(price);
    console.log(`set fallback price ${assetAddress}:${price}`);
  }
  await waitForTx(await priceOracleInstance.submitPrices(addresses, assetPrices));
};

export const setAssetPricesInOracle = async (
  prices: iAssetBase<tEthereumAddress>,
  assetsAddresses: SymbolMap<tEthereumAddress>,
  priceOracleInstance: PriceOracle
) => {
  for (const [assetSymbol, price] of Object.entries(prices) as [string, string][]) {
    const assetAddressIndex = Object.keys(assetsAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, assetAddress] = (Object.entries(assetsAddresses) as [string, string][])[
      assetAddressIndex
    ];
    await waitForTx(await priceOracleInstance.setAssetPrice(assetAddress, price));
  }
};

export const deployMockAggregators = async (
  prices: iAssetBase<tEthereumAddress>,
  assetsAddresses: iAssetBase<tEthereumAddress>,
  verify?: boolean
) => {
  let addresses: string[] = [];
  let assetPrices: string[] = [];
  for (const [assetSymbol, price] of Object.entries(prices) as [string, string][]) {
    const assetAddressIndex = Object.keys(assetsAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, assetAddress] = (Object.entries(assetsAddresses) as [string, string][])[
      assetAddressIndex
    ];
    addresses.push(assetAddress);
    assetPrices.push(price);
  }
  return deployMockAggregator([addresses, assetPrices], verify);
};
