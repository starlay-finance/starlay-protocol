import BigNumber from 'bignumber.js';
import { evmRevert, evmSnapshot } from '../../helpers/misc-utils';
import { PriceAggregatorAdapterDiaImpl } from '../../types';
import {
  deployMockAggregatorDIA,
  deployPriceAggregatorDiaImpl,
} from './../../helpers/contracts-deployments';
import { MockAggregatorDIA } from './../../types/MockAggregatorDIA.d';
import { makeSuite, TestEnv } from './helpers/make-suite';

const { expect } = require('chai');
const oneEther = new BigNumber(Math.pow(10, 18));

const mockPrices = () => {
  return [
    {
      price: oneEther.multipliedBy('0.00367714136416').toFixed(),
      tokenAddress: '0xDAC17F958D2Ee523a2206206994597C13d831ec1',
      symbol: 'USDC',
    },
    {
      price: oneEther.toFixed(),
      tokenAddress: '0xDac17f958D2eE523a2206206994597c13d831EC2',
      symbol: 'ETH',
    },
    {
      price: oneEther.multipliedBy('47.332685').toFixed(),
      tokenAddress: '0xdaC17F958d2Ee523A2206206994597c13d831EC3',
      symbol: 'BTC',
    },
  ];
};

// NOTE: fail "after all" in this test suite
//   "after all" hook in "Price Aggregator Implementation for DIA"
makeSuite('Price Aggregator Implementation for DIA', (testEnv: TestEnv) => {
  let mockAggregatorDIA: MockAggregatorDIA;
  const quoteCurrency = 'USD';
  const prices = mockPrices();
  let evmSnapshotId;
  beforeEach(async () => {
    evmSnapshotId = await evmSnapshot();
  });

  before(async () => {
    mockAggregatorDIA = await deployMockAggregatorDIA([
      prices.map((m) => `${m.symbol}/${quoteCurrency}`),
      prices.map((m) => m.price),
    ]);
  });

  describe('PriceAggregatorDiaImpl', () => {
    describe('constructor', () => {
      it('should deploy with correct parameters', async () => {
        await deployPriceAggregatorDiaImpl([mockAggregatorDIA.address, 'USD']);
      });

      it('should revert if not valid addresses provider', async () => {
        await expect(
          deployPriceAggregatorDiaImpl([
            '0', // any invalid contract address can be used here
            'USD',
          ])
        ).to.be.reverted;
      });
      describe('setAssetSources', () => {
        it('should correctly set asset sources', async () => {
          const target = await deployPriceAggregatorDiaImpl([mockAggregatorDIA.address, 'USD']);
          const assets = prices.map((m) => m.tokenAddress);
          const symbols = prices.map((m) => m.symbol);
          expect(await target.setAssetSources(assets, symbols))
            .to.emit(target, 'AssetSourcesUpdated')
            .withArgs(assets, symbols);
        });

        it('should revert if with invalid toekn address', async () => {
          const target = await deployPriceAggregatorDiaImpl([mockAggregatorDIA.address, 'USD']);
          await expect(target.setAssetSources(['0'], ['BTC'])).to.be.reverted;
        });
      });
    });
    describe('setAggregator', () => {
      it('aggregator updated', async () => {
        const target = await deployPriceAggregatorDiaImpl([mockAggregatorDIA.address, 'USD']);
        const newAggregator = '0xDac17f958D2eE523a2206206994597c13d831EC2';
        expect(await target.setAggregator(newAggregator))
          .to.emit(target, 'AggregatorUpdated')
          .withArgs(newAggregator);
      });
    });
    describe('currentPrice', () => {
      let target: PriceAggregatorAdapterDiaImpl;
      before(async () => {
        target = await deployPriceAggregatorDiaImpl([mockAggregatorDIA.address, 'USD']);
        await target.setAssetSources(
          prices.map((m) => m.tokenAddress),
          prices.map((m) => m.symbol)
        );
      });
      prices.forEach((p) =>
        it(`should return ${p.symbol} price`, async () => {
          await expect(await target.currentPrice(p.tokenAddress)).to.be.eq(p.price);
        })
      );
      it('should return 0 value if with unsupported assets', async () => {
        await expect(target.currentPrice('0xdac17f958d2ee523a2206206994597c13d831ec5')).to.be.empty;
      });
    });
  });
});
