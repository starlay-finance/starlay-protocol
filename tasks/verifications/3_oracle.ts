import { task } from 'hardhat/config';
import { ConfigNames, getQuoteCurrency, loadPoolConfig } from '../../helpers/configuration';
import {
  getLendingRateOracle,
  getPriceAcalaAggregator,
  getStarlayFallbackOracle,
  getStarlayOracle,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork, verifyContract } from '../../helpers/contracts-helpers';
import { eContractid, eNetwork, ICommonConfiguration } from '../../helpers/types';

task('verify:oracle', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ pool }, localDRE) => {
    await localDRE.run('set-DRE');
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const { AcalaOracleAddress, OracleQuoteUnit } = poolConfig as ICommonConfiguration;

    const acalaOracleAddress = getParamPerNetwork(AcalaOracleAddress, network);
    const priceAggregatorAdapterAcalaImpl = await getPriceAcalaAggregator();
    const starlayFallbackOracle = await getStarlayFallbackOracle();
    const starlayOracle = await getStarlayOracle();
    const lendingRateOracle = await getLendingRateOracle();

    // PriceAggregatorAdapterAcalaImpl
    console.log('\n- Verifying  PriceAggregatorAdapterAcalaImpl...\n');
    await verifyContract(
      eContractid.PriceAggregatorAdapterAcalaImpl,
      priceAggregatorAdapterAcalaImpl,
      [acalaOracleAddress]
    );

    // StarlayFallbackOracle
    console.log('\n- Verifying  StarlayFallbackOracle...\n');
    await verifyContract(eContractid.StarlayFallbackOracle, starlayFallbackOracle, []);

    // StarlayOracle
    console.log('\n- Verifying  StarlayOracle...\n');
    await verifyContract(eContractid.StarlayOracle, starlayOracle, [
      priceAggregatorAdapterAcalaImpl.address,
      starlayFallbackOracle.address,
      await getQuoteCurrency(poolConfig),
      OracleQuoteUnit,
    ]);

    // LendingRateOracle
    console.log('\n- Verifying  LendingRateOracle...\n');
    await verifyContract(eContractid.LendingRateOracle, lendingRateOracle, []);

    console.log('Finished verifications.');
  });
