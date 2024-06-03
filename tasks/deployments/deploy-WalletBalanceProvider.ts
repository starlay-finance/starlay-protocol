import { task } from 'hardhat/config';
import { deployWalletBalancerProvider } from '../../helpers/contracts-deployments';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { eContractid } from '../../helpers/types';

task(`deploy-${eContractid.WalletBalanceProvider}`, `Deploys the WalletBalanceProvider contract`)
  .addFlag('verify', 'Verify WalletBalanceProvider contract via Etherscan API.')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n signer address = ${await (await getFirstSigner()).getAddress()}`);
    console.log(`\n network config = ${JSON.stringify(localBRE.network.config)}`);

    console.log(`\n- WalletBalancerProvider deployment`);

    const walletBalanceProvider = await deployWalletBalancerProvider(verify);
    console.log('WalletBalanceProvider deployed :', walletBalanceProvider.address);
    console.log(`\tFinished UiPoolDataProvider deployment`);
  });
