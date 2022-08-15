import { expect } from 'chai';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployGenericLTokenImpl, deployGenericLTokenRev2Impl, deployGenericLTokenRev3Impl } from '../../helpers/contracts-deployments';
import { getLTokenExtraParams } from '../../helpers/init-helpers';
import { createRandomAddress, DRE } from '../../helpers/misc-utils';
import { eContractid } from '../../helpers/types';
import { LendingPool, LendingPoolConfigurator, LToken, LTokenFactory, LTokenRev2, LTokenRev2Factory, LTokenRev3Factory, MintableERC20 } from '../../types';
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
    it("Prerequisite", async () => {
      const hre = DRE as HardhatRuntimeEnvironment;
      const reserveData = await _lendingPool.getReserveData(_dai.address)
      const lDaiProxy = LTokenRev2Factory.connect(reserveData.lTokenAddress, hre.ethers.provider)

      const [name, symbol, decimals, underlyingAsset, revision] = await Promise.all([
        lDaiProxy.name(),
        lDaiProxy.symbol(),
        lDaiProxy.decimals(),
        lDaiProxy.UNDERLYING_ASSET_ADDRESS(),
        lDaiProxy.getCurrentRevision()
      ])
      expect(name).to.eq("Starlay interest bearing DAI")
      expect(symbol).to.eq("lDAI")
      expect(decimals).to.eq(18)
      expect(underlyingAsset.toLowerCase()).to.eq(_dai.address.toLowerCase())
      expect(revision.toNumber()).to.eq(2)
    })
    const generateUpdateLTokenInputParams = async (newLTokenImplAddress: string): Promise<UpdateLTokenInputParams> => ({
      asset: _dai.address,
      treasury: createRandomAddress(),
      incentivesController: createRandomAddress(),
      name: "Starlay interest bearing DAI UPDATED",
      symbol: "lDAI UPDATED",
      implementation: newLTokenImplAddress,
      params: await getLTokenExtraParams(eContractid.LToken, _dai.address),
    })
    it("fail if using lower version implementation", async () => {
      const hre = DRE as HardhatRuntimeEnvironment;
      const reserveData = await _lendingPool.getReserveData(_dai.address)
      const lDaiProxy = LTokenRev2Factory.connect(reserveData.lTokenAddress, hre.ethers.provider)

      const newLTokenImpl = await deployGenericLTokenImpl(false)

      const updateLTokenInputParams = await generateUpdateLTokenInputParams(newLTokenImpl.address)
      await expect(_configurator.updateLToken(updateLTokenInputParams)).to.reverted

      const [name, symbol, currentVersion] = await Promise.all([
        lDaiProxy.name(),
        lDaiProxy.symbol(),
        lDaiProxy.getCurrentRevision()
      ])
      expect(name).not.to.eq("Starlay interest bearing DAI UPDATED")
      expect(symbol).not.to.eq("lDAI UPDATIED")
      expect(currentVersion.toNumber()).to.eq(2)
    })
    it("fail if using same version implementation", async () => {
      const hre = DRE as HardhatRuntimeEnvironment;
      const reserveData = await _lendingPool.getReserveData(_dai.address)
      const lDaiProxy = LTokenRev2Factory.connect(reserveData.lTokenAddress, hre.ethers.provider)

      const newLTokenImpl = await deployGenericLTokenRev2Impl(false)

      const updateLTokenInputParams = await generateUpdateLTokenInputParams(newLTokenImpl.address)
      await expect(_configurator.updateLToken(updateLTokenInputParams)).to.reverted

      const [name, symbol, currentVersion] = await Promise.all([
        lDaiProxy.name(),
        lDaiProxy.symbol(),
        lDaiProxy.getCurrentRevision()
      ])
      expect(name).not.to.eq("Starlay interest bearing DAI UPDATED")
      expect(symbol).not.to.eq("lDAI UPDATIED")
      expect(currentVersion.toNumber()).to.eq(2)
    })
    it("success", async () => {
      const hre = DRE as HardhatRuntimeEnvironment;
      const reserveData = await _lendingPool.getReserveData(_dai.address)
      expect(reserveData.lTokenAddress.toLowerCase()).to.eq(_lDaiAddress.toLowerCase())

      const lDaiProxy = LTokenRev2Factory.connect(reserveData.lTokenAddress, hre.ethers.provider)
      const _lDaiProxy = LTokenRev3Factory.connect(reserveData.lTokenAddress, hre.ethers.provider)

      const [name, symbol, decimals, underlyingAsset, pool, treasury, incentivesController, scaledTotalSupply, revision] = await Promise.all([
        lDaiProxy.name(),
        lDaiProxy.symbol(),
        lDaiProxy.decimals(),
        lDaiProxy.UNDERLYING_ASSET_ADDRESS(),
        lDaiProxy.POOL(),
        lDaiProxy.RESERVE_TREASURY_ADDRESS(),
        lDaiProxy.getIncentivesController(),
        lDaiProxy.scaledTotalSupply(),
        lDaiProxy.getCurrentRevision(),
      ])
      expect(name).to.eq("Starlay interest bearing DAI")
      expect(symbol).to.eq("lDAI")
      expect(decimals).to.eq(18)
      expect(underlyingAsset.toLowerCase()).to.eq(_dai.address.toLowerCase())
      expect(revision.toNumber()).to.eq(2)

      const newLTokenImpl = await deployGenericLTokenRev3Impl(false)

      const _treasuryArg = createRandomAddress();
      const _incentivesControllerArg = createRandomAddress();
      const _nameArg = `${name} V3`
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

      const [_name, _symbol, _decimals, _underlyingAsset, _pool, _treasury, _incentivesController, _scaledTotalSupply, _revision] = await Promise.all([
        _lDaiProxy.name(),
        _lDaiProxy.symbol(),
        _lDaiProxy.decimals(),
        _lDaiProxy.UNDERLYING_ASSET_ADDRESS(),
        _lDaiProxy.POOL(),
        _lDaiProxy.RESERVE_TREASURY_ADDRESS(),
        _lDaiProxy.getIncentivesController(),
        _lDaiProxy.scaledTotalSupply(),
        _lDaiProxy.getCurrentRevision(),
      ])
      expect(_name).to.eq("Starlay interest bearing DAI V3")
      expect(_symbol).to.eq(symbol)
      expect(_decimals).to.eq(decimals)
      expect(_underlyingAsset.toLowerCase()).to.eq(underlyingAsset.toLowerCase())
      expect(_pool.toLowerCase()).to.eq(pool.toLowerCase())
      expect(_scaledTotalSupply.eq(scaledTotalSupply)).to.be.true
      expect(_treasury).to.eq(_treasuryArg)
      expect(_treasury.toLowerCase()).to.not.eq(treasury.toLowerCase())
      expect(_incentivesController).to.eq(_incentivesControllerArg)
      expect(_incentivesController.toLowerCase()).to.not.eq(incentivesController.toLowerCase())
      expect(_revision.toNumber()).to.eq(3)
    })
  })
})
