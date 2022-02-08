import { expect } from 'chai';
import { ethers } from 'ethers';
import { ConfigNames, getTreasuryAddress, loadPoolConfig } from '../../helpers/configuration';
import { ZERO_ADDRESS } from '../../helpers/constants';
import {
  deployDelegationAwareLToken,
  deployMintableDelegationERC20,
} from '../../helpers/contracts-deployments';
import { ProtocolErrors } from '../../helpers/types';
import StarlayConfig from '../../markets/starlay';
import { DelegationAwareLToken } from '../../types/DelegationAwareLToken';
import { MintableDelegationERC20 } from '../../types/MintableDelegationERC20';
import { makeSuite, TestEnv } from './helpers/make-suite';

const { parseEther } = ethers.utils;

makeSuite('LToken: underlying delegation', (testEnv: TestEnv) => {
  const poolConfig = loadPoolConfig(ConfigNames.Commons);
  let delegationLToken = <DelegationAwareLToken>{};
  let delegationERC20 = <MintableDelegationERC20>{};

  it('Deploys a new MintableDelegationERC20 and a DelegationAwareLToken', async () => {
    const { pool } = testEnv;

    delegationERC20 = await deployMintableDelegationERC20(['DEL', 'DEL', '18']);

    delegationLToken = await deployDelegationAwareLToken(
      [
        pool.address,
        delegationERC20.address,
        await getTreasuryAddress(StarlayConfig),
        ZERO_ADDRESS,
        'aDEL',
        'aDEL',
      ],
      false
    );

    //await delegationLToken.initialize(pool.address, ZERO_ADDRESS, delegationERC20.address, ZERO_ADDRESS, '18', 'aDEL', 'aDEL');

    console.log((await delegationLToken.decimals()).toString());
  });

  it('Tries to delegate with the caller not being the Starlay admin', async () => {
    const { users } = testEnv;

    await expect(
      delegationLToken.connect(users[1].signer).delegateUnderlyingTo(users[2].address)
    ).to.be.revertedWith(ProtocolErrors.CALLER_NOT_POOL_ADMIN);
  });

  it('Tries to delegate to user 2', async () => {
    const { users } = testEnv;

    await delegationLToken.delegateUnderlyingTo(users[2].address);

    const delegateeAddress = await delegationERC20.delegatee();

    expect(delegateeAddress).to.be.equal(users[2].address);
  });
});
