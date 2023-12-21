import { task } from 'hardhat/config';
import { ConfigNames, getQuoteCurrency, loadPoolConfig } from '../../helpers/configuration';
import {
  getGenericLogic,
  getLendingRateOracle,
  getPriceAcalaAggregator,
  getReserveLogic,
  getStarlayFallbackOracle,
  getStarlayOracle,
  getUiIncentiveDataProviderV2,
  getUiPoolDataProviderV2,
  getValidationLogic,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork, verifyContract } from '../../helpers/contracts-helpers';
import { eContractid, eNetwork, ICommonConfiguration } from '../../helpers/types';
import { baseTokenAddress } from '../../helpers/constants';

task('verify:misc', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ pool }, localDRE) => {
    await localDRE.run('set-DRE');
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const {} = poolConfig as ICommonConfiguration;

    const reserveLogic = await getReserveLogic();
    const genericLogic = await getGenericLogic();
    const validationLogic = await getValidationLogic();
    const uiPoolDataProviderV2 = await getUiPoolDataProviderV2();
    const uiIncentiveDataProviderV2 = await getUiIncentiveDataProviderV2();
    const priceAggregatorAdapterAcalaImpl = await getPriceAcalaAggregator();

    // ReserveLogic
    console.log('\n- Verifying  ReserveLogic...\n');
    await verifyContract(eContractid.ReserveLogic, reserveLogic, []);

    // ValidationLogic
    console.log('\n- Verifying  ValidationLogic...\n');
    await verifyContract(eContractid.ValidationLogic, validationLogic, []);

    // GenericLogic
    console.log('\n- Verifying  GenericLogic...\n');
    await verifyContract(eContractid.GenericLogic, genericLogic, []);

    // UiPoolDataProviderV2
    console.log('\n- Verifying  UiPoolDataProviderV2...\n');
    await verifyContract(eContractid.UiPoolDataProviderV2, uiPoolDataProviderV2, [
      priceAggregatorAdapterAcalaImpl.address,
      baseTokenAddress[network],
    ]);

    // UiIncentiveDataProviderV2
    console.log('\n- Verifying  UiIncentiveDataProviderV2...\n');
    await verifyContract(eContractid.UiIncentiveDataProviderV2, uiIncentiveDataProviderV2, []);

    console.log('Finished verifications.');
  });
