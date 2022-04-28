import { expect } from 'chai';
import { ZERO_ADDRESS } from '../../helpers/constants';
import {
  deployMockLToken,
  deployMockStableDebtToken,
  deployMockVariableDebtToken,
} from '../../helpers/contracts-deployments';
import {
  getLToken,
  getMockStableDebtToken,
  getMockVariableDebtToken,
  getStableDebtToken,
  getVariableDebtToken,
} from '../../helpers/contracts-getters';
import { createRandomAddress } from '../../helpers/misc-utils';
import { ProtocolErrors } from '../../helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';

makeSuite('Upgradeability', (testEnv: TestEnv) => {
  const { CALLER_NOT_POOL_ADMIN } = ProtocolErrors;
  let newLTokenAddress: string;
  let newStableTokenAddress: string;
  let newVariableTokenAddress: string;

  before('deploying instances', async () => {
    const { dai, pool } = testEnv;
    const lTokenInstance = await deployMockLToken([
      pool.address,
      dai.address,
      pool.address,
      pool.address,
      'Starlay Interest bearing DAI updated',
      'lDai',
      '0x10',
    ]);

    const stableDebtTokenInstance = await deployMockStableDebtToken([
      pool.address,
      dai.address,
      pool.address,
      'Starlay stable debt bearing DAI updated',
      'stableDebtDAI',
      '0x10',
    ]);

    const variableDebtTokenInstance = await deployMockVariableDebtToken([
      pool.address,
      dai.address,
      pool.address,
      'Starlay variable debt bearing DAI updated',
      'variableDebtDAI',
      '0x10',
    ]);

    newLTokenAddress = lTokenInstance.address;
    newVariableTokenAddress = variableDebtTokenInstance.address;
    newStableTokenAddress = stableDebtTokenInstance.address;
  });

  it('Tries to update the DAI LToken implementation with a different address than the lendingPoolManager', async () => {
    const { dai, configurator, users } = testEnv;

    const name = await (await getLToken(newLTokenAddress)).name();
    const symbol = await (await getLToken(newLTokenAddress)).symbol();

    const updateLTokenInputParams: {
      asset: string;
      treasury: string;
      incentivesController: string;
      name: string;
      symbol: string;
      implementation: string;
      params: string;
    } = {
      asset: dai.address,
      treasury: ZERO_ADDRESS,
      incentivesController: ZERO_ADDRESS,
      name: name,
      symbol: symbol,
      implementation: newLTokenAddress,
      params: '0x10',
    };
    await expect(
      configurator.connect(users[1].signer).updateLToken(updateLTokenInputParams)
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it('Upgrades the DAI LToken implementation ', async () => {
    const { dai, configurator, lDai } = testEnv;

    const name = await (await getLToken(newLTokenAddress)).name();
    const symbol = await (await getLToken(newLTokenAddress)).symbol();
    const randomAddress = createRandomAddress();

    const updateLTokenInputParams: {
      asset: string;
      treasury: string;
      incentivesController: string;
      name: string;
      symbol: string;
      implementation: string;
      params: string;
    } = {
      asset: dai.address,
      treasury: randomAddress,
      incentivesController: randomAddress,
      name: name,
      symbol: symbol,
      implementation: newLTokenAddress,
      params: '0x10',
    };
    await configurator.updateLToken(updateLTokenInputParams);

    const tokenName = await lDai.name();

    expect(tokenName).to.be.eq('Starlay Interest bearing DAI updated', 'Invalid token name');
  });

  it('Tries to update the DAI Stable debt token implementation with a different address than the lendingPoolManager', async () => {
    const { dai, configurator, users } = testEnv;

    const name = await (await getStableDebtToken(newStableTokenAddress)).name();
    const symbol = await (await getStableDebtToken(newStableTokenAddress)).symbol();

    const updateDebtTokenInput: {
      asset: string;
      incentivesController: string;
      name: string;
      symbol: string;
      implementation: string;
      params: string;
    } = {
      asset: dai.address,
      incentivesController: ZERO_ADDRESS,
      name: name,
      symbol: symbol,
      implementation: newStableTokenAddress,
      params: '0x10',
    };

    await expect(
      configurator.connect(users[1].signer).updateStableDebtToken(updateDebtTokenInput)
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it('Upgrades the DAI stable debt token implementation ', async () => {
    const { dai, configurator, pool, helpersContract } = testEnv;

    const name = await (await getStableDebtToken(newStableTokenAddress)).name();
    const symbol = await (await getStableDebtToken(newStableTokenAddress)).symbol();

    const updateDebtTokenInput: {
      asset: string;
      incentivesController: string;
      name: string;
      symbol: string;
      implementation: string;
      params: string;
    } = {
      asset: dai.address,
      incentivesController: ZERO_ADDRESS,
      name: name,
      symbol: symbol,
      implementation: newStableTokenAddress,
      params: '0x10',
    };

    await configurator.updateStableDebtToken(updateDebtTokenInput);

    const { stableDebtTokenAddress } = await helpersContract.getReserveTokensAddresses(dai.address);

    const debtToken = await getMockStableDebtToken(stableDebtTokenAddress);

    const tokenName = await debtToken.name();

    expect(tokenName).to.be.eq('Starlay stable debt bearing DAI updated', 'Invalid token name');
  });

  it('Tries to update the DAI variable debt token implementation with a different address than the lendingPoolManager', async () => {
    const { dai, configurator, users } = testEnv;

    const name = await (await getVariableDebtToken(newVariableTokenAddress)).name();
    const symbol = await (await getVariableDebtToken(newVariableTokenAddress)).symbol();

    const updateDebtTokenInput: {
      asset: string;
      incentivesController: string;
      name: string;
      symbol: string;
      implementation: string;
      params: string;
    } = {
      asset: dai.address,
      incentivesController: ZERO_ADDRESS,
      name: name,
      symbol: symbol,
      implementation: newVariableTokenAddress,
      params: '0x10',
    };

    await expect(
      configurator.connect(users[1].signer).updateVariableDebtToken(updateDebtTokenInput)
    ).to.be.revertedWith(CALLER_NOT_POOL_ADMIN);
  });

  it('Upgrades the DAI variable debt token implementation ', async () => {
    const { dai, configurator, pool, helpersContract } = testEnv;

    const name = await (await getVariableDebtToken(newVariableTokenAddress)).name();
    const symbol = await (await getVariableDebtToken(newVariableTokenAddress)).symbol();

    const updateDebtTokenInput: {
      asset: string;
      incentivesController: string;
      name: string;
      symbol: string;
      implementation: string;
      params: string;
    } = {
      asset: dai.address,
      incentivesController: ZERO_ADDRESS,
      name: name,
      symbol: symbol,
      implementation: newVariableTokenAddress,
      params: '0x10',
    };
    //const name = await (await getLToken(newLTokenAddress)).name();

    await configurator.updateVariableDebtToken(updateDebtTokenInput);

    const { variableDebtTokenAddress } = await helpersContract.getReserveTokensAddresses(
      dai.address
    );

    const debtToken = await getMockVariableDebtToken(variableDebtTokenAddress);

    const tokenName = await debtToken.name();

    expect(tokenName).to.be.eq('Starlay variable debt bearing DAI updated', 'Invalid token name');
  });
});
