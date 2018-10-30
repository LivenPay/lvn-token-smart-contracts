const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC20DetailedMock = artifacts.require('LivenCoin');


contract('ERC20Detailed', function ([_, owner, recipient, anotherAccount]) {
  let detailedERC20 = null;

  beforeEach(async function () {
    detailedERC20 = await ERC20DetailedMock.new( { from: owner } );
  });

  it('has a name', async function () {
    (await detailedERC20.name()).should.be.equal("LivenCoin");
  });

  it('has a symbol', async function () {
    (await detailedERC20.symbol()).should.be.equal("LVN");
  });

  it('has an amount of decimals', async function () {
    (await detailedERC20.decimals()).should.be.bignumber.equal(18);
  });
});
