import { expect } from 'chai';
import { ethers } from 'ethers';
import { APPROVAL_AMOUNT_LENDING_POOL, ZERO_ADDRESS } from '../../helpers/constants';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { convertToCurrencyDecimals } from '../../helpers/contracts-helpers';
import { createRandomAddress } from '../../helpers/misc-utils';
import { ProtocolErrors, RateMode } from '../../helpers/types';
import { CommonsConfig } from '../../markets/starlay/commons';
import { LTokenFactory } from '../../types';
import { makeSuite, TestEnv } from './helpers/make-suite';

makeSuite('LToken: Initialize', (testEnv: TestEnv) => {
  it('revert if treasury is zero address', async () => {
    const { dai } = testEnv;
    const lTokenImpl = await new LTokenFactory(await getFirstSigner()).deploy();
    const randomAddress = createRandomAddress();
    await expect(
      lTokenImpl.initialize(
        randomAddress,
        ZERO_ADDRESS,
        dai.address,
        randomAddress,
        '18',
        'lDAI',
        'lDAI',
        '0x10'
      )
    ).to.be.revertedWith('treasury address cannot be empty');
  });
  it('revert if underlying asset is zero address', async () => {
    const { dai } = testEnv;
    const lTokenImpl = await new LTokenFactory(await getFirstSigner()).deploy();
    const randomAddress = createRandomAddress();
    await expect(
      lTokenImpl.initialize(
        randomAddress,
        ZERO_ADDRESS,
        dai.address,
        randomAddress,
        '18',
        'lDAI',
        'lDAI',
        '0x10'
      )
    ).to.be.revertedWith('treasury address cannot be empty');
    it('revert if lending pool is zero address', async () => {
      const { dai } = testEnv;
      const lTokenImpl = await new LTokenFactory(await getFirstSigner()).deploy();
      const randomAddress = createRandomAddress();
      await expect(
        lTokenImpl.initialize(
          ZERO_ADDRESS,
          randomAddress,
          dai.address,
          randomAddress,
          '18',
          'lDAI',
          'lDAI',
          '0x10'
        )
      ).to.be.revertedWith('pool address cannot be empty');
    });
  });
});
