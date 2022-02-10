import { task } from 'hardhat/config';
import { ConfigNames, getQuoteCurrency, loadPoolConfig } from '../../helpers/configuration';
import {
  deployLendingRateOracle,
  deployPriceOracle,
  deployStarlayOracle,
} from '../../helpers/contracts-deployments';
import {
  getAllMockedTokens,
  getLendingPoolAddressesProvider,
} from '../../helpers/contracts-getters';
import { waitForTx } from '../../helpers/misc-utils';
import {
  deployMockAggregators,
  setInitialAssetPricesInOracle,
  setInitialMarketRatesInRatesOracleByHelper,
} from '../../helpers/oracles-helpers';
import { iAssetBase, ICommonConfiguration, TokenContractId } from '../../helpers/types';

task('dev:deploy-oracles', 'Deploy oracles for dev environment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run('set-DRE');
    const poolConfig = loadPoolConfig(pool);
    const {
      Mocks: { AllAssetsInitialPrices },
      ProtocolGlobalParams: { UsdAddress, MockUsdPriceInWei },
      LendingRateOracleRatesCommon,
      OracleQuoteUnit,
    } = poolConfig as ICommonConfiguration;

    const defaultTokenList = {
      ...Object.fromEntries(Object.values(TokenContractId).map((symbol) => [symbol, ''])),
      USD: UsdAddress,
    } as iAssetBase<string>;
    const mockTokens = await getAllMockedTokens();
    const mockTokensAddress = Object.keys(mockTokens).reduce<iAssetBase<string>>((prev, curr) => {
      prev[curr as keyof iAssetBase<string>] = mockTokens[curr].address;
      return prev;
    }, defaultTokenList);
    const addressesProvider = await getLendingPoolAddressesProvider();
    const admin = await addressesProvider.getPoolAdmin();

    const fallbackOracle = await deployPriceOracle(verify);
    await waitForTx(await fallbackOracle.setEthUsdPrice(MockUsdPriceInWei));
    await setInitialAssetPricesInOracle(AllAssetsInitialPrices, mockTokensAddress, fallbackOracle);
    const mockAggregator = await deployMockAggregators(
      AllAssetsInitialPrices,
      mockTokensAddress,
      verify
    );

    await deployStarlayOracle(
      [
        mockAggregator.address,
        fallbackOracle.address,
        await getQuoteCurrency(poolConfig),
        OracleQuoteUnit,
      ],
      verify
    );
    await waitForTx(await addressesProvider.setPriceOracle(fallbackOracle.address));

    const lendingRateOracle = await deployLendingRateOracle(verify);
    await waitForTx(await addressesProvider.setLendingRateOracle(lendingRateOracle.address));

    const { USD, ...tokensAddressesWithoutUsd } = mockTokensAddress;
    const allReservesAddresses = {
      ...tokensAddressesWithoutUsd,
    };
    await setInitialMarketRatesInRatesOracleByHelper(
      LendingRateOracleRatesCommon,
      allReservesAddresses,
      lendingRateOracle,
      admin
    );
  });
