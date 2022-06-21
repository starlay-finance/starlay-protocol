import BigNumber from 'bignumber.js';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  getLendingPool,
  getLendingPoolConfiguratorProxy,
  getStarlayOracle,
  getStarlayProtocolDataProvider
} from '../../helpers/contracts-getters';
import { getEthersSigners } from '../../helpers/contracts-helpers';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import { getFirstSigner } from './../../helpers/contracts-getters';

task('lq', 'Excute Liquidation').setAction(async ({}, DRE) => {
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
  const pool = await getLendingPool('0xcb7e8E25B3A7619c4b656f1d8cE808a0bE39862F');
  const usdc = '0x458db3bEf6ffC5212f9359bbDAeD0D5A58129397';
  const wsdn = '0x7cA69766F4be8Ec93dD01E1d571e64b867455e58';
  const borrower = '0x175d905470e85279899C37F89000b195f3d0c0C5';
  const helpersContract = await getStarlayProtocolDataProvider(
    '0xf75d10997bf74c2d17e19ca03f3867FA8eE3826f'
  );
  const userReserveDataBefore = await helpersContract.getUserReserveData(usdc, borrower);
  const usdcReserveDataBefore = await helpersContract.getReserveData(usdc);
  const wsdnReserveDataBefore = await helpersContract.getReserveData(wsdn);
  console.log('userReserveDataBefore:', userReserveDataBefore);
  const amountToLiquidate = new BigNumber(userReserveDataBefore.currentVariableDebt.toString())
    .div(2)
    .decimalPlaces(0, BigNumber.ROUND_DOWN)
    .toFixed(0);
  console.log('amountToLiquidate:', amountToLiquidate);
  const users = await getEthersSigners();
  const oracle = await getStarlayOracle();

  const tx = await pool
    .connect(await getFirstSigner())
    .liquidationCall(wsdn, usdc, borrower, amountToLiquidate, false);
  tx.wait();
});
