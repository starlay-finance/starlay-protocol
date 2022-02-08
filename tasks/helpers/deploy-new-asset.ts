import { task } from 'hardhat/config';
import { setDRE } from '../../helpers/misc-utils';
import { eEthereumNetwork } from '../../helpers/types';
import * as marketConfigs from '../../markets/starlay';
import * as reserveConfigs from '../../markets/starlay/reservesConfigs';
import { ZERO_ADDRESS } from './../../helpers/constants';
import {
  chooseATokenDeployment,
  deployDefaultReserveInterestRateStrategy,
  deployStableDebtToken,
  deployVariableDebtToken,
} from './../../helpers/contracts-deployments';
import { getLendingPoolAddressesProvider } from './../../helpers/contracts-getters';

const LENDING_POOL_ADDRESS_PROVIDER = {
  main: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
  kovan: '0x652B2937Efd0B5beA1c8d54293FC1289672AFC6b',
};

const isSymbolValid = (symbol: string, network: eEthereumNetwork) =>
  Object.keys(reserveConfigs).includes('strategy' + symbol) &&
  marketConfigs.StarlayConfig.ReserveAssets[network][symbol] &&
  marketConfigs.StarlayConfig.ReservesConfig[symbol] === reserveConfigs['strategy' + symbol];

task('external:deploy-new-asset', 'Deploy A token, Debt Tokens, Risk Parameters')
  .addParam('symbol', `Asset symbol, needs to have configuration ready`)
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify, symbol }, localBRE) => {
    const network = localBRE.network.name;
    if (!isSymbolValid(symbol, network as eEthereumNetwork)) {
      throw new Error(
        `
WRONG RESERVE ASSET SETUP:
        The symbol ${symbol} has no reserve Config and/or reserve Asset setup.
        update /markets/starlay/index.ts and add the asset address for ${network} network
        update /markets/starlay/reservesConfigs.ts and add parameters for ${symbol}
        `
      );
    }
    setDRE(localBRE);
    const strategyParams = reserveConfigs['strategy' + symbol];
    const reserveAssetAddress =
      marketConfigs.StarlayConfig.ReserveAssets[localBRE.network.name][symbol];
    const deployCustomAToken = chooseATokenDeployment(strategyParams.aTokenImpl);
    const addressProvider = await getLendingPoolAddressesProvider(
      LENDING_POOL_ADDRESS_PROVIDER[network]
    );
    const poolAddress = await addressProvider.getLendingPool();
    const aToken = await deployCustomAToken(verify);
    const stableDebt = await deployStableDebtToken(
      [
        poolAddress,
        reserveAssetAddress,
        ZERO_ADDRESS, // Incentives Controller
        `Starley stable debt bearing ${symbol}`,
        `sd${symbol}`,
      ],
      verify
    );
    const variableDebt = await deployVariableDebtToken(
      [
        poolAddress,
        reserveAssetAddress,
        ZERO_ADDRESS, // Incentives Controller
        `Starley variable debt bearing ${symbol}`,
        `vd${symbol}`,
      ],
      verify
    );
    const rates = await deployDefaultReserveInterestRateStrategy(
      [
        addressProvider.address,
        strategyParams.strategy.optimalUtilizationRate,
        strategyParams.strategy.baseVariableBorrowRate,
        strategyParams.strategy.variableRateSlope1,
        strategyParams.strategy.variableRateSlope2,
        strategyParams.strategy.stableRateSlope1,
        strategyParams.strategy.stableRateSlope2,
      ],
      verify
    );
    console.log(`
    New interest bearing asset deployed on ${network}:
    Interest bearing ib${symbol} address: ${aToken.address}
    Variable Debt vd${symbol} address: ${variableDebt.address}
    Stable Debt sd${symbol} address: ${stableDebt.address}
    Strategy Implementation for ${symbol} address: ${rates.address}
    `);
  });
