import { task } from 'hardhat/config';
import { aggregatorProxy, baseTokenAddress } from '../../helpers/constants';
import { deployUiPoolDataProviderV2V3 } from '../../helpers/contracts-deployments';
import { eContractid } from '../../helpers/types';

task(`deploy-${eContractid.UiPoolDataProviderV2V3}`, `Deploys the UiPoolDataProviderV2V3 contract`)
  .addFlag('verify', 'Verify UiPoolDataProviderV2V3 contract via Etherscan API.')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(
      `\n- UiPoolDataProviderV2V3 price aggregator: ${aggregatorProxy[localBRE.network.name]}`
    );
    console.log(
      `\n- UiPoolDataProviderV2V3 eth/usd price aggregator: ${
        aggregatorProxy[localBRE.network.name]
      }`
    );
    console.log(`\n- UiPoolDataProviderV2V3 deployment`);

    const UiPoolDataProviderV2V3 = await deployUiPoolDataProviderV2V3(
      aggregatorProxy[localBRE.network.name],
      baseTokenAddress[localBRE.network.name],
      verify
    );

    console.log('UiPoolDataProviderV2V3 deployed at:', UiPoolDataProviderV2V3.address);
    console.log(`\tFinished UiPoolDataProvider deployment`);
  });
