import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { INITIAL_PRICES } from '../../helpers/constants';
import { getStarlayFallbackOracle } from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress } from '../../helpers/misc-utils';
import { setAssetPricesInFallbackOracle } from '../../helpers/oracles-helpers';
import {
  eNetwork,
  iAssetBase,
  ICommonConfiguration,
  SymbolMap,
  TokenContractId,
} from '../../helpers/types';

task('set-price-in-fallback-oracle', 'Set prices in StarlayFallbackOracle').setAction(
  async ({}, DRE) => {
    await DRE.run('set-DRE');
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Starlay);
    const {
      ProtocolGlobalParams: { UsdAddress },
      ReserveAssets,
      FallbackOracle,
    } = poolConfig as ICommonConfiguration;
    const reserveAssets = getParamPerNetwork(ReserveAssets, network);
    const fallbackOracleAddress = getParamPerNetwork(FallbackOracle, network);

    if (!notFalsyOrZeroAddress(fallbackOracleAddress)) {
      throw 'Fallback Oracle Address is undefined. Check configuration at config directory';
    }

    const fallbackOracle = await getStarlayFallbackOracle(fallbackOracleAddress);

    const allReserveAssets: SymbolMap<string> = {
      ...reserveAssets,
      USD: UsdAddress,
    };
    const defaultTokenList = {
      ...Object.fromEntries(Object.values(TokenContractId).map((symbol) => [symbol, ''])),
      USD: UsdAddress,
    } as iAssetBase<string>;
    const reserveAssetsAddress = Object.keys(allReserveAssets).reduce<iAssetBase<string>>(
      (prev, curr) => {
        prev[curr as keyof iAssetBase<string>] = allReserveAssets[curr];
        return prev;
      },
      defaultTokenList
    );

    await setAssetPricesInFallbackOracle(INITIAL_PRICES, reserveAssetsAddress, fallbackOracle);
  }
);
