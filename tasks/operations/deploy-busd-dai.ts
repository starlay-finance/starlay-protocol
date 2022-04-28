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
  getPriceAggregator as getPriceAggregatorAdapterDiaImpl,
  getStarlayFallbackOracle,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';

const LENDING_POOL_ADDRESS_PROVIDER = {
  main: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
  shiden: '0xa70fFbaFE4B048798bBCBDdfB995fcCec2D1f2CA',
};

const DATA_PROVIDER = {
  main: '',
  shiden: '0x3fD308785Cf41F30993038c145cE50b7fF677a71',
};

const FALLBACK_ORACLE = {
  main: '',
  shiden: '0xA42D5A35b6bbC93fe63FE54536f320faC9996f4C',
};

const PRICE_ORACLE_DIA_IMPL = {
  main: '',
  shiden: '0x8F2fFfF56375CDeD7f53E0D90259711Cd122Da31',
};

task(
  'external:deploy-busd-dai',
  'Deploy A token, Debt Tokens, Risk Parameters and initialize reserves'
).setAction(async ({ verify }, localBRE) => {
  const network = <eNetwork>localBRE.network.name;
  const pool = ConfigNames.Starlay;
  setDRE(localBRE);
  const busd = 'BUSD';
  const dai = 'DAI';
  await DRE.run('external:deploy-new-asset', { symbol: busd, pool: 'Starlay' });
  await DRE.run('external:deploy-new-asset', { symbol: dai, pool: 'Starlay' });
  const poolConfig = loadPoolConfig(pool);

  const {
    LTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    ReservesConfig,
    IncentivesController,
  } = poolConfig as ICommonConfiguration;
  const reserveAssetAddressBUSD =
    marketConfigs.StarlayConfig.ReserveAssets[localBRE.network.name][busd];
  const reserveAssetAddressDAI =
    marketConfigs.StarlayConfig.ReserveAssets[localBRE.network.name][dai];
  const addressProvider = await getLendingPoolAddressesProvider(
    LENDING_POOL_ADDRESS_PROVIDER[network]
  );

  const admin = await addressProvider.getPoolAdmin();
  const treasuryAddress = await getTreasuryAddress(poolConfig);
  const incentivesController = getParamPerNetwork(IncentivesController, network);

  console.log('=== init reserves ===');
  await initReservesByHelper(
    ReservesConfig,
    {
      BUSD: reserveAssetAddressBUSD,
      DAI: reserveAssetAddressDAI,
    },
    LTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    treasuryAddress,
    incentivesController,
    pool,
    false
  );
  const testHelpers = await getStarlayProtocolDataProvider(DATA_PROVIDER[network]);
  console.log('*** configure reserves ***');
  await configureReservesByHelper(
    ReservesConfig,
    {
      BUSD: reserveAssetAddressBUSD,
      DAI: reserveAssetAddressDAI,
    },
    testHelpers,
    admin
  );

  console.log('*** submit mock prices to fallback oracle ***');
  const priceOracle = await getStarlayFallbackOracle(FALLBACK_ORACLE[network]);
  await priceOracle.submitPrices([reserveAssetAddressBUSD], [MOCK_PRICE_AGGREGATORS_PRICES.BUSD]);
  await priceOracle.submitPrices([reserveAssetAddressDAI], [MOCK_PRICE_AGGREGATORS_PRICES.DAI]);

  console.log('*** set asset sources to price oracle dia impl ***');
  const priceOracleDiaImpl = await getPriceAggregatorAdapterDiaImpl(PRICE_ORACLE_DIA_IMPL[network]);
  await priceOracleDiaImpl.setAssetSources([reserveAssetAddressBUSD], ['BUSD']);
  await priceOracleDiaImpl.setAssetSources([reserveAssetAddressDAI], ['DAI']);
});
