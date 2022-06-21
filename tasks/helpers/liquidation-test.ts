import { waitForTx } from './../../helpers/misc-utils';
import { ERC20Factory } from '../../types/ERC20Factory';
import BigNumber from 'bignumber.js';
import { parseEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  getLendingPool,
  getLendingPoolConfiguratorProxy,
  getStarlayOracle,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';
import { getEthersSigners } from '../../helpers/contracts-helpers';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import { getFirstSigner } from '../../helpers/contracts-getters';
import {
  LendingPoolCollateralManagerFactory,
  LendingPoolFactory,
  StarlayProtocolDataProviderFactory,
} from '../../types';

task('lq-tst', 'Excute Liquidation').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = <eNetwork>DRE.network.name;
  const poolConfig = loadPoolConfig(ConfigNames.Starlay);
  const {
    ProtocolGlobalParams: { UsdAddress },
    ReserveAssets,
    FallbackOracle,
  } = poolConfig as ICommonConfiguration;
  const configurator = await getLendingPoolConfiguratorProxy(
    '0x9A1760cEF7780B233E6b65D03Db2FCd652893f45'
  );
  const liquidator = (await getEthersSigners())[1];

  const pool = LendingPoolFactory.connect('0x8022327a333eAeFaD46A723CDcA1aeFdA12afA53', liquidator);
  const manager = LendingPoolCollateralManagerFactory.connect(
    '0x6D4d18661D1776fEa8b40E885AB2Ed8919dd2CF2',
    liquidator
  );
  const usdc = '0x458db3bEf6ffC5212f9359bbDAeD0D5A58129397';
  const wsdn = '0x7cA69766F4be8Ec93dD01E1d571e64b867455e58';
  const weth = '0x72fE832eB0452285e91CA9F46B85229A5107CeE8';
  const wbtc = '0xEdAA9f408ac11339766a4E5e0d4653BDee52fcA1';
  const usdt = '0xEdAA9f408ac11339766a4E5e0d4653BDee52fcA1';
  const wastr = '0x44a26AE046a01d99eBAbecc24B4d61B388656871';
  const lusdc = '0xF4D80e698D40Aae4F8486E59D3A52BB4b637e867';
  const target = '0x50414Ac6431279824df9968855181474c919a94B';
  const amountToLiquidate = parseEther('100000');
  const { collateral, debt, lToken, liquidate } = {
    collateral: usdc,
    debt: weth,
    lToken: lusdc,
    liquidate: false,
  };
  const lTokenInstance = ERC20Factory.connect(lToken, liquidator);
  console.log('health factor:', (await pool.getUserAccountData(target)).healthFactor.toString());
  console.log(
    'ltoken before amount:',
    await (await lTokenInstance.balanceOf(await liquidator.getAddress())).toString()
  );
  await ERC20Factory.connect(debt, liquidator).approve(manager.address, parseEther('2000000'));
  if (liquidate) {
    const tx = await pool
      .connect(liquidator)
      .liquidationCall(collateral, debt, target, amountToLiquidate, true);
    tx.wait();
  }
  const amountAfter = await lTokenInstance.balanceOf(await liquidator.getAddress());
  console.log('ltoken after amount:', amountAfter.toString());
});
