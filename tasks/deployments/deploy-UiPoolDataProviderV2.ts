import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import { deployUiPoolDataProviderV2 } from '../../helpers/contracts-deployments';

task(`deploy-${eContractid.UiPoolDataProviderV2}`, `Deploys the UiPoolDataProviderV2 contract`)
  .addFlag('verify', 'Verify UiPoolDataProviderV2 contract via Etherscan API.')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(
      `\n- UiPoolDataProviderV2 price aggregator: ${
        chainlinkAggregatorProxy[localBRE.network.name]
      }`
    );
    console.log(`\n- UiPoolDataProviderV2 deployment`);

    const UiPoolDataProviderV2 = await deployUiPoolDataProviderV2(
      chainlinkAggregatorProxy[localBRE.network.name],
      chainlinkEthUsdAggregatorProxy[localBRE.network.name],
      verify
    );
    at;
    console.log('UiPoolDataProviderV2 deployed :', UiPoolDataProviderV2.address);
    console.log(`\tFinished UiPoolDataProvider deployment`);
  });
