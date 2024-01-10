import { task } from 'hardhat/config';
import {
  ConfigNames,
  getGenesisPoolAdmin,
  getLendingRateOracles,
  getQuoteCurrency,
  loadPoolConfig,
} from '../../helpers/configuration';
import {
  deployLendingRateOracle,
  // deployPriceAggregatorDiaImpl,
  deployPriceAggregatorAcalaImpl,
  deployStarlayFallbackOracle,
  deployStarlayOracle,
} from '../../helpers/contracts-deployments';
import {
  getFirstSigner,
  getLendingPoolAddressesProvider,
  getLendingRateOracle,
  // getPriceAggregator,
  getStarlayFallbackOracle,
  getStarlayOracle,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { setInitialMarketRatesInRatesOracleByHelper } from '../../helpers/oracles-helpers';
import { eNetwork, ICommonConfiguration, SymbolMap } from '../../helpers/types';
import {
  LendingRateOracle,
  PriceAggregatorAdapterAcalaImpl,
  StarlayFallbackOracle,
  StarlayOracle,
} from '../../types';

const sybil = '0xDDB38b50616c94feaAba75A99136358e4e14AED9';
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
        // DIAAggregator,
        // DIAAggregatorAddress,
        AcalaOracleAddress,
        // OracleQuoteCurrency,
      } = poolConfig as ICommonConfiguration;
      const lendingRateOracles = getLendingRateOracles(poolConfig);
      const addressesProvider = await getLendingPoolAddressesProvider();
      const admin = await getGenesisPoolAdmin(poolConfig);
      const starlayOracleAddress = getParamPerNetwork(poolConfig.StarlayOracle, network);
      // const priceAggregatorAddress = getParamPerNetwork(poolConfig.PriceAggregator, network);
      const lendingRateOracleAddress = getParamPerNetwork(poolConfig.LendingRateOracle, network);
      const fallbackOracleAddress = getParamPerNetwork(FallbackOracle, network);
      const reserveAssets = getParamPerNetwork(ReserveAssets, network);
      // const feedTokens = getParamPerNetwork(DIAAggregator, network);
      // const diaAggregatorAddress = getParamPerNetwork(DIAAggregatorAddress, network);
      const acalaOracleAddress = getParamPerNetwork(AcalaOracleAddress, network);
      const tokensToWatch: SymbolMap<string> = {
        ...reserveAssets,
        USD: UsdAddress,
      };

      let priceAggregatorAdapter: PriceAggregatorAdapterAcalaImpl;
      let starlayOracle: StarlayOracle;
      let lendingRateOracle: LendingRateOracle;
      let fallbackOracle: StarlayFallbackOracle;

      // priceAggregatorAdapter = notFalsyOrZeroAddress(priceAggregatorAddress)
      //   ? await getPriceAggregator(priceAggregatorAddress)
      //   : await deployPriceAggregatorDiaImpl([diaAggregatorAddress, OracleQuoteCurrency]);
      // await waitForTx(
      //   await priceAggregatorAdapter.setAssetSources(
      //     Object.values(feedTokens), // address
      //     Object.keys(feedTokens) // symbol
      //   )
      // );
      priceAggregatorAdapter = await deployPriceAggregatorAcalaImpl([acalaOracleAddress]);

      // deploy fallbackOracle
      if (notFalsyOrZeroAddress(fallbackOracleAddress)) {
        fallbackOracle = await getStarlayFallbackOracle(fallbackOracleAddress);
      } else {
        fallbackOracle = await deployStarlayFallbackOracle(verify);
        const currentSignerAddress = (
          await (await getFirstSigner()).getAddress()
        ).toLocaleLowerCase();
        await fallbackOracle.authorizeSybil(currentSignerAddress);
        await fallbackOracle.authorizeSybil(sybil);

        let assets: string[] = [];
        let prices: string[] = [];
        Object.keys(poolConfig.ReserveAssets[network]).map((key: string) => {
          assets.push(poolConfig.ReserveAssets[network][key]);
          prices.push(poolConfig.Mocks.AllAssetsInitialPrices[key]);
        });
        await fallbackOracle.submitPrices(assets, prices);
      }

      if (notFalsyOrZeroAddress(starlayOracleAddress)) {
        starlayOracle = await getStarlayOracle(starlayOracleAddress);
        await waitForTx(await starlayOracle.setPriceAggregator(priceAggregatorAdapter.address));
      } else {
        starlayOracle = await deployStarlayOracle(
          [
            priceAggregatorAdapter.address,
            fallbackOracle.address,
            await getQuoteCurrency(poolConfig),
            poolConfig.OracleQuoteUnit,
          ],
          verify
        );
        const currentSignerAddress = (
          await (await getFirstSigner()).getAddress()
        ).toLocaleLowerCase();
        await fallbackOracle.authorizeSybil(currentSignerAddress);
        await starlayOracle.authorizeSybil(sybil);
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

      console.log('Starlay Oracle: %s', starlayOracle.address);
      console.log('Lending Rate Oracle: %s', lendingRateOracle.address);

      // Register the proxy price provider on the addressesProvider
      await waitForTx(await addressesProvider.setPriceOracle(starlayOracle.address));
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
