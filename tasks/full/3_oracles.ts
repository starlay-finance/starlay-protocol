import { PriceAggregatorAdapterDiaImpl } from './../../types/PriceAggregatorAdapterDiaImpl.d';
import { task } from 'hardhat/config';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import {
  deployAaveOracle,
  deployLendingRateOracle,
  deployPriceAggregatorDiaImpl,
} from '../../helpers/contracts-deployments';
import { setInitialMarketRatesInRatesOracleByHelper } from '../../helpers/oracles-helpers';
import { ICommonConfiguration, eNetwork, SymbolMap } from '../../helpers/types';
import { waitForTx, notFalsyOrZeroAddress } from '../../helpers/misc-utils';
import {
  ConfigNames,
  loadPoolConfig,
  getGenesisPoolAdmin,
  getLendingRateOracles,
  getQuoteCurrency,
} from '../../helpers/configuration';
import {
  getAaveOracle,
  getLendingPoolAddressesProvider,
  getLendingRateOracle,
  getPriceAggregator,
} from '../../helpers/contracts-getters';
import { AaveOracle, LendingRateOracle } from '../../types';

task('full:deploy-oracles', 'Deploy oracles for dev enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const {
        ProtocolGlobalParams: { UsdAddress },
        ReserveAssets,
        FallbackOracle,
        DIAAggregator,
        DIAAggregatorAddress,
        OracleQuoteCurrency,
      } = poolConfig as ICommonConfiguration;
      const lendingRateOracles = getLendingRateOracles(poolConfig);
      const addressesProvider = await getLendingPoolAddressesProvider();
      const admin = await getGenesisPoolAdmin(poolConfig);
      const aaveOracleAddress = getParamPerNetwork(poolConfig.AaveOracle, network);
      const priceAggregatorAddress = getParamPerNetwork(poolConfig.PriceAggregator, network);
      const lendingRateOracleAddress = getParamPerNetwork(poolConfig.LendingRateOracle, network);
      const fallbackOracleAddress = await getParamPerNetwork(FallbackOracle, network);
      const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
      const feedTokens = await getParamPerNetwork(DIAAggregator, network);
      const diaAggregatorAddress = await getParamPerNetwork(DIAAggregatorAddress, network);
      const tokensToWatch: SymbolMap<string> = {
        ...reserveAssets,
        USD: UsdAddress,
      };

      let priceAggregatorAdapter: PriceAggregatorAdapterDiaImpl;
      let aaveOracle: AaveOracle;
      let lendingRateOracle: LendingRateOracle;

      priceAggregatorAdapter = notFalsyOrZeroAddress(priceAggregatorAddress)
        ? await await getPriceAggregator(priceAggregatorAddress)
        : await deployPriceAggregatorDiaImpl([diaAggregatorAddress, OracleQuoteCurrency]);
      await waitForTx(
        await priceAggregatorAdapter.setAssetSources(
          Object.keys(feedTokens),
          Object.values(feedTokens)
        )
      );

      if (notFalsyOrZeroAddress(aaveOracleAddress)) {
        aaveOracle = await await getAaveOracle(aaveOracleAddress);
        await waitForTx(await aaveOracle.setPriceAggregator(priceAggregatorAdapter.address));
      } else {
        aaveOracle = await deployAaveOracle(
          [
            priceAggregatorAdapter.address,
            fallbackOracleAddress,
            await getQuoteCurrency(poolConfig),
            poolConfig.OracleQuoteUnit,
          ],
          verify
        );
      }

      if (notFalsyOrZeroAddress(lendingRateOracleAddress)) {
        lendingRateOracle = await getLendingRateOracle(lendingRateOracleAddress);
      } else {
        lendingRateOracle = await deployLendingRateOracle(verify);
        const { USD, ...tokensAddressesWithoutUsd } = tokensToWatch;
        await setInitialMarketRatesInRatesOracleByHelper(
          lendingRateOracles,
          tokensAddressesWithoutUsd,
          lendingRateOracle,
          admin
        );
      }

      console.log('Aave Oracle: %s', aaveOracle.address);
      console.log('Lending Rate Oracle: %s', lendingRateOracle.address);

      // Register the proxy price provider on the addressesProvider
      await waitForTx(await addressesProvider.setPriceOracle(aaveOracle.address));
      await waitForTx(await addressesProvider.setLendingRateOracle(lendingRateOracle.address));
    } catch (error) {
      if (DRE.network.name.includes('tenderly')) {
        const transactionLink = `https://dashboard.tenderly.co/${DRE.config.tenderly.username}/${
          DRE.config.tenderly.project
        }/fork/${DRE.tenderly.network().getFork()}/simulation/${DRE.tenderly.network().getHead()}`;
        console.error('Check tx error:', transactionLink);
      }
      throw error;
    }
  });
