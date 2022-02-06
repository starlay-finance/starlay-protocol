pragma solidity 0.6.12;

/************
@title IPriceAggregator interface
@notice Interface for price oracle.*/
interface IPriceAggregatorAdapter {
  /**
   * @dev returns the asset price
   * @param asset The asset address
   * @return the price of the asset
   **/
  function currentPrice(address asset) external view returns (int256);
}
