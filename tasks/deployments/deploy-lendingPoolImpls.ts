import { LendingPoolV4Factory } from './../../types/LendingPoolV4Factory';
import { RefundableLendingPoolFactory } from './../../types/RefundableLendingPoolFactory';
import { task } from 'hardhat/config';
import {
  deployStarlayLibraries,
  deployUiIncentiveDataProviderV2,
} from '../../helpers/contracts-deployments';
import { eContractid } from '../../helpers/types';
import { getFirstSigner } from '../../helpers/contracts-getters';

task(`deploy-LendingPoolImpls`, `Deploys LendingPoolImpls`)
  .addFlag('verify', 'Verify UiIncentiveDataProviderV2 contract via Etherscan API.')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }
    const libs = {
      ['__$de8c0cf1a7d7c36c802af9a64fb9d86036$__']: '0xaCF53F9307A5B1616C7E35Fc0dEbd85e9925339A',
      ['__$22cd43a9dda9ce44e9b92ba393b88fb9ac$__']: '0xa549A423BC2Aff1A566B644911C00c6Dc2F0390F',
    };
    const refundable = await new RefundableLendingPoolFactory(libs, await getFirstSigner()).deploy(
      '0x5336C37c96B612749d019F86828885708f6BD10E'
    );
    console.log('refundable pool deployed at:', refundable.address);
    const v4 = await new LendingPoolV4Factory(libs, await getFirstSigner()).deploy();
    console.log('pool v4 deployed at:', v4.address);
  });
