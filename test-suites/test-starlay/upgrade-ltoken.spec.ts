import { expect } from 'chai';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployGenericLTokenImpl, deployGenericLTokenRev2Impl } from '../../helpers/contracts-deployments';
import { getLTokenExtraParams } from '../../helpers/init-helpers';
import { createRandomAddress, DRE } from '../../helpers/misc-utils';
import { eContractid } from '../../helpers/types';
import { LendingPool, LendingPoolConfigurator, LToken, LTokenFactory, LTokenRev2, LTokenRev2Factory, MintableERC20 } from '../../types';
import { makeSuite, TestEnv } from './helpers/make-suite';

type UpdateLTokenInputParams = {
  asset: string;
  treasury: string;
  incentivesController: string;
  name: string;
  symbol: string;
  implementation: string;
  params: string;
}

makeSuite("upgrade-ltoken", (testEnv: TestEnv) => {
  describe("LendingPoolConfigurator#updateLToken", () => {
    let _configurator: LendingPoolConfigurator
    let _lendingPool: LendingPool
    let _dai: MintableERC20
    let _lDaiAddress: string
    before(async () => {
      const { configurator, pool, dai, lDai } = testEnv;
      _configurator = configurator;
      _lendingPool = pool;
      _dai = dai;
      _lDaiAddress = lDai.address;
    })
    it("fail if using implementation of the same version to deployed", async () => {
      const hre = DRE as HardhatRuntimeEnvironment;
      const reserveData = await _lendingPool.getReserveData(_dai.address)
      expect(reserveData.lTokenAddress.toLowerCase()).to.eq(_lDaiAddress.toLowerCase())
      const lDaiProxy = LTokenFactory.connect(reserveData.lTokenAddress, hre.ethers.provider)

      const newLTokenImpl = await deployGenericLTokenImpl(false)
      console.log(`newLTokenImpl ... ${newLTokenImpl.address}`)

      const updateLTokenInputParams: UpdateLTokenInputParams = {
        asset: _dai.address,
        treasury: createRandomAddress(),
        incentivesController: createRandomAddress(),
        name: "Starlay interest bearing DAI UPDATED",
        symbol: "lDAI UPDATIED",
        implementation: newLTokenImpl.address,
        params: await getLTokenExtraParams(eContractid.LToken, _dai.address),
      };

      await expect(_configurator.updateLToken(updateLTokenInputParams)).to.reverted
      const [name, symbol] = await Promise.all([
        lDaiProxy.name(),
        lDaiProxy.symbol(),
      ])
      expect(name).not.to.eq("Starlay interest bearing DAI UPDATED")
      expect(symbol).not.to.eq("lDAI UPDATIED")
    })
    it("success", async () => {
      const hre = DRE as HardhatRuntimeEnvironment;
      const reserveData = await _lendingPool.getReserveData(_dai.address)
      expect(reserveData.lTokenAddress.toLowerCase()).to.eq(_lDaiAddress.toLowerCase())

      const lDaiProxy = LTokenFactory.connect(reserveData.lTokenAddress, hre.ethers.provider)
      const _lDaiProxy = LTokenRev2Factory.connect(reserveData.lTokenAddress, hre.ethers.provider)

      const [name, symbol, decimals, underlyingAsset, pool, treasury, incentivesController, scaledTotalSupply, revision] = await Promise.all([
        lDaiProxy.name(),
        lDaiProxy.symbol(),
        lDaiProxy.decimals(),
        lDaiProxy.UNDERLYING_ASSET_ADDRESS(),
        lDaiProxy.POOL(),
        lDaiProxy.RESERVE_TREASURY_ADDRESS(),
        lDaiProxy.getIncentivesController(),
        lDaiProxy.scaledTotalSupply(),
        lDaiProxy.LTOKEN_REVISION(),
      ])
      expect(name).to.eq("Starlay interest bearing DAI")
      expect(symbol).to.eq("lDAI")
      expect(decimals).to.eq(18)
      expect(underlyingAsset.toLowerCase()).to.eq(_dai.address.toLowerCase())
      expect(revision.toNumber()).to.eq(1)

      const newLTokenImpl = await deployGenericLTokenRev2Impl(false)
      console.log(`newLTokenImpl ... ${newLTokenImpl.address}`)

      const _treasuryArg = createRandomAddress();
      const _incentivesControllerArg = createRandomAddress();
      const _nameArg = `${name} V2`
      const updateLTokenInputParams: UpdateLTokenInputParams = {
        asset: _dai.address,
        treasury: _treasuryArg,
        incentivesController: _incentivesControllerArg,
        name: _nameArg,
        symbol: symbol,
        implementation: newLTokenImpl.address,
        params: await getLTokenExtraParams(eContractid.LToken, _dai.address),
      };

      await expect(_configurator.updateLToken(updateLTokenInputParams)).to.emit(_configurator, "LTokenUpgraded").withArgs(
        _dai.address,
        reserveData.lTokenAddress,
        newLTokenImpl.address
      )

      const [_name, _symbol, _decimals, _underlyingAsset, _pool, _treasury, _incentivesController, _scaledTotalSupply, _revision, _REVISION] = await Promise.all([
        _lDaiProxy.name(),
        _lDaiProxy.symbol(),
        _lDaiProxy.decimals(),
        _lDaiProxy.UNDERLYING_ASSET_ADDRESS(),
        _lDaiProxy.POOL(),
        _lDaiProxy.RESERVE_TREASURY_ADDRESS(),
        _lDaiProxy.getIncentivesController(),
        _lDaiProxy.scaledTotalSupply(),
        _lDaiProxy.getCurrentRevision(),
        _lDaiProxy.LTOKEN_REVISION_2(),
      ])
      expect(_name).to.eq("Starlay interest bearing DAI V2")
      expect(_symbol).to.eq(symbol)
      expect(_decimals).to.eq(decimals)
      expect(_underlyingAsset.toLowerCase()).to.eq(underlyingAsset.toLowerCase())
      expect(_pool.toLowerCase()).to.eq(pool.toLowerCase())
      expect(_scaledTotalSupply.eq(scaledTotalSupply)).to.be.true
      expect(_treasury).to.eq(_treasuryArg)
      expect(_treasury.toLowerCase()).to.not.eq(treasury.toLowerCase())
      expect(_incentivesController).to.eq(_incentivesControllerArg)
      expect(_incentivesController.toLowerCase()).to.not.eq(incentivesController.toLowerCase())
      expect(_revision.toNumber()).to.eq(2)
      expect(_REVISION.toNumber()).to.eq(2)
    })
  })
})