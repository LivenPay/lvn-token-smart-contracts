const { expectThrow } = require('../helpers/expectThrow');
const { assertRevert } = require('../helpers/assertRevert');

var Liven = artifacts.require('LivenCoin');
let token;

contract('Basic223Token', function (accounts) {
  beforeEach(async () => {
    token = await Liven.new();
  })

  it('should return the correct totalSupply after construction', async function () {
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 10000000000 * (10 ** 18));
  });

  it('should return correct balances after transfer', async function () {
    let firstAccountBalanceBefore = await token.balanceOf(accounts[0]);
    await token.transfer(accounts[1], 100);

    let firstAccountBalanceAfter = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalanceBefore.toNumber(), firstAccountBalanceAfter.toNumber() + 100);

    let secondAccountBalance = await token.balanceOf(accounts[1]);
    assert.equal(secondAccountBalance.toNumber(), 100);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
    try {
      await token.transfer(accounts[1], 1);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transfer to 0x0', async function () {
    try {
      await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transfer less than 0', async function () {
    await expectThrow(token.transfer(accounts[1], -2));
  });

  it('should throw an error when trying to transfer without any tokens', async function () {
    await expectThrow(token.transfer(accounts[0], 100, { from: accounts[1] }));
  });
});
