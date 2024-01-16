import { getTreasuryAddress } from '../../helpers/configuration';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { DRE, setDRE } from '../../helpers/misc-utils';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import * as marketConfigs from '../../markets/starlay';
import { MOCK_PRICE_AGGREGATORS_PRICES } from '../../helpers/constants';
import {
  getLendingPoolAddressesProvider,
  getLendingPoolConfiguratorProxy,
  getPriceAggregator as getPriceAggregatorAdapterDiaImpl,
  getStarlayFallbackOracle,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';

task('external:configure-acala-config', 'Update configuration for BUSD for freezing').setAction(
  async ({ verify }, localBRE) => {
    const network = <eNetwork>localBRE.network.name;
    setDRE(localBRE);

    const reserveAssetAddress = marketConfigs.StarlayConfig.ReserveAssets[network];
    const addressProvider = await getLendingPoolAddressesProvider();

    console.log('*** configure reserves ***');
    const lendingPoolConfiguratorProxy = await getLendingPoolConfiguratorProxy(
      await addressProvider.getLendingPoolConfigurator()
    );

    await lendingPoolConfiguratorProxy.setReserveFactor(reserveAssetAddress['DOT'], 0);
    await lendingPoolConfiguratorProxy.setReserveFactor(reserveAssetAddress['LDOT'], 0);
    await lendingPoolConfiguratorProxy.setReserveFactor(reserveAssetAddress['USDC'], 0);
  }
);
