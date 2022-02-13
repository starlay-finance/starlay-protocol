import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { deployPriceOracle } from '../../helpers/contracts-deployments';
import { getStarlayOracle } from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import { setInitialAssetPricesInOracle } from '../../helpers/oracles-helpers';
import {
  eNetwork,
  iAssetBase,
  ICommonConfiguration,
  SymbolMap,
  TokenContractId,
} from '../../helpers/types';

task('set-fallback-oracle', 'Deploy FallbackOracle, and set it to StarlayOracle')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, DRE) => {
    await DRE.run('set-DRE');
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(ConfigNames.Starlay);
    const {
      Mocks: { AllAssetsInitialPrices },
      ProtocolGlobalParams: { UsdAddress, MockUsdPriceInWei },
      ReserveAssets,
    } = poolConfig as ICommonConfiguration;
    const reserveAssets = getParamPerNetwork(ReserveAssets, network);
    const starlayOracleAddress = getParamPerNetwork(poolConfig.StarlayOracle, network);
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
    console.log('reserveAssetsAddress:', reserveAssetsAddress);

    const fallbackOracle = await deployPriceOracle(verify);
    await waitForTx(await fallbackOracle.setEthUsdPrice(MockUsdPriceInWei));
    await setInitialAssetPricesInOracle(
      AllAssetsInitialPrices,
      reserveAssetsAddress,
      fallbackOracle
    );
    const starlayOracle = await getStarlayOracle(starlayOracleAddress);
    await waitForTx(await starlayOracle.setFallbackOracle(fallbackOracle.address));
  });
