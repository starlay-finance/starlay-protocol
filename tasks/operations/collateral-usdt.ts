import { task } from 'hardhat/config';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import { getLendingPoolConfiguratorImpl } from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { Wallet } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { NETWORKS_RPC_URL } from '../../helper-hardhat-config';
require('dotenv').config();

task(`collateral-usdt`, `Deploys the StakeUIHelper contract`)
  .addFlag('verify', 'Verify StakeUIHelper contract via Etherscan API.')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addParam('configurator', `PoolConfigurator address`)
  .setAction(async ({ verify, pool, configurator }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }
    const adminPK = process.env.POOL_ADMIN_PRIVATE_KEY || '';
    const network = <eNetwork>localBRE.network.name;
    const rpc = getParamPerNetwork(NETWORKS_RPC_URL, network);
    const poolAdmin = new Wallet(
      adminPK,
      new JsonRpcProvider(rpc, localBRE.network.config.chainId)
    );
    const poolConfig = loadPoolConfig(pool);
    const { ReserveAssets, ReservesConfig } = poolConfig as ICommonConfiguration;
    const assets = getParamPerNetwork(ReserveAssets, network);
    const config = ReservesConfig.USDT;
    const configuratorInstance = await getLendingPoolConfiguratorImpl(configurator);
    const usdt = assets['USDT'];
    console.log('usdt address:', usdt);
    console.log('config:', config);
    const tx = await configuratorInstance
      .connect(poolAdmin)
      .configureReserveAsCollateral(
        usdt,
        config.baseLTVAsCollateral,
        config.liquidationThreshold,
        config.liquidationBonus
      );
    console.log(tx);
  });
