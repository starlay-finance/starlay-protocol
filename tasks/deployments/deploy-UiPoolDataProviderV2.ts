import { task } from 'hardhat/config';
import { deployUiPoolDataProviderV2 } from '../../helpers/contracts-deployments';
import { eContractid } from '../../helpers/types';
import { aggregatorProxy, baseTokenAddress } from './../../helpers/constants';

task(`deploy-${eContractid.UiPoolDataProviderV2}`, `Deploys the UiPoolDataProviderV2 contract`)
  .addFlag('verify', 'Verify UiPoolDataProviderV2 contract via Etherscan API.')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(
      `\n- UiPoolDataProviderV2 price aggregator: ${aggregatorProxy[localBRE.network.name]}`
    );
    console.log(`\n- UiPoolDataProviderV2 deployment`);

    const UiPoolDataProviderV2 = await deployUiPoolDataProviderV2(
      aggregatorProxy[localBRE.network.name],
      baseTokenAddress[localBRE.network.name],
      verify
    );
    console.log('UiPoolDataProviderV2 deployed :', UiPoolDataProviderV2.address);
    console.log(`\tFinished UiPoolDataProvider deployment`);
  });
