import { expect } from 'chai';
import { ProtocolErrors } from '../../helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';

makeSuite('LToken: Modifiers', (testEnv: TestEnv) => {
  const { CT_CALLER_MUST_BE_LENDING_POOL } = ProtocolErrors;

  it('Tries to invoke mint not being the LendingPool', async () => {
    const { deployer, lDai } = testEnv;
    await expect(lDai.mint(deployer.address, '1', '1')).to.be.revertedWith(
      CT_CALLER_MUST_BE_LENDING_POOL
    );
  });

  it('Tries to invoke burn not being the LendingPool', async () => {
    const { deployer, lDai } = testEnv;
    await expect(lDai.burn(deployer.address, deployer.address, '1', '1')).to.be.revertedWith(
      CT_CALLER_MUST_BE_LENDING_POOL
    );
  });

  it('Tries to invoke transferOnLiquidation not being the LendingPool', async () => {
    const { deployer, users, lDai } = testEnv;
    await expect(
      lDai.transferOnLiquidation(deployer.address, users[0].address, '1')
    ).to.be.revertedWith(CT_CALLER_MUST_BE_LENDING_POOL);
  });

  it('Tries to invoke transferUnderlyingTo not being the LendingPool', async () => {
    const { deployer, lDai } = testEnv;
    await expect(lDai.transferUnderlyingTo(deployer.address, '1')).to.be.revertedWith(
      CT_CALLER_MUST_BE_LENDING_POOL
    );
  });
});
