import { StakeUIHelper } from './../../types/StakeUIHelper.d';
import { StakedTokenMockFactory } from './../../types/StakedTokenMockFactory';
import { StakedTokenMock } from './../../types/StakedTokenMock.d';
import BigNumber from 'bignumber.js';
import { APPROVAL_AMOUNT_LENDING_POOL, oneEther } from '../../helpers/constants';
import { deployStakeUIHelper } from '../../helpers/contracts-deployments';
import { convertToCurrencyDecimals } from '../../helpers/contracts-helpers';
import { DRE } from '../../helpers/misc-utils';
import { ProtocolErrors, RateMode } from '../../helpers/types';
import { makeSuite } from './helpers/make-suite';
import { calcExpectedVariableDebtTokenBalance } from './helpers/utils/calculations';
import { getReserveData, getUserData } from './helpers/utils/helpers';
import { parseEther } from 'ethers/lib/utils';
import { time } from 'console';

const chai = require('chai');
const { expect } = chai;

makeSuite('StakeUIHelper', (testEnv) => {
  let target: StakeUIHelper;
  let mockStakeToken: StakedTokenMock;
  beforeEach(async () => {
    const { dai, weth, users, lay, pool, oracle, deployer } = testEnv;

    mockStakeToken = await new StakedTokenMockFactory(deployer.signer).deploy();
    target = await deployStakeUIHelper([
      oracle.address,
      lay.address,
      mockStakeToken.address,
      dai.address,
    ]);
  });
  describe('getStkGeneralLayData', async () => {
    it('stakeAPY is 0 if totalSupply of StakeToken is 0', async () => {
      const data = await target.getStkGeneralLayData();
      expect(data.stakeApy).to.be.equal('0');
    });
    it('stakeAPY is 100 if totalSupply of StakeToken is not 0 ', async () => {
      await mockStakeToken.setTotalSupply(parseEther('1'));
      await mockStakeToken.setAsset({
        emissionPerSecond: parseEther('1000'),
        index: parseEther('1'),
        lastUpdateTimestamp: 1744936291,
      });
      await mockStakeToken.setDistributionEnd(1744936291);
      const data = await target.getStkGeneralLayData();
      expect(data.stakeApy).to.be.gt('0');
    });
  });
});
