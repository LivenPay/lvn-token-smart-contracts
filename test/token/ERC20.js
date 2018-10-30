// Zeppelin tests for ERC20 StandardToken. Run against Standard23Token to check full backwards compatibility.

const Liven = artifacts.require('LivenCoin')
const utils = require('tn-truffle-test-utils')

let token
let owner

contract('ERC20Token', function(accounts) {

  beforeEach(async () => {
    owner = accounts[0]
    token = await utils.deploy(Liven, { from: accounts[0] })
  });

  it("should return the correct totalSupply after construction", async function() {
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), 10000000000 * (10 ** 18));
  });

  it("should refuse ETH", async function() {
    await utils.assertThrows(token.sendTransaction({ value: web3.toWei(1, "ether") }));
  });

  describe('approve', () => {

    describe('after unlocking', () => {

      beforeEach(async () => {
        await token.unlock();
        await token.approve(accounts[1], 100);
      });

      it("should return the correct allowance amount after approval", async function() {
        await token.approve(accounts[1], 100, { from: accounts[1] });
        let allowance = await token.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 100);
      });

      it("should return the correct allowance amount after safe approval", async function() {
        let prevAllowance = await token.allowance(accounts[1], accounts[0]);
        await token.safeApprove(accounts[0], prevAllowance, 100, { from: accounts[1] });
        let allowance = await token.allowance(accounts[1], accounts[0]);
        assert.equal(allowance.toNumber(), 100);
      });

      it("should disallow safe approval if previous allowance does not match", async function() {
        let prevAllowance = await token.allowance(accounts[1], accounts[0]);
        let wrongAllowance = prevAllowance + 1;
        await utils.assertThrows(token.safeApprove(accounts[0], wrongAllowance, 100, { from: accounts[1] }))
      });

      it("should disallow safe approval if allowance is not sufficient", async function() {
        let prevAllowance = await token.allowance(accounts[1], accounts[0]);
        let wrongAllowance = prevAllowance + 1;
        await utils.assertThrows(token.safeApprove(accounts[0], wrongAllowance, 100, { from: accounts[1] }))
      });
    })

    describe('before unlocking', () => {

      beforeEach(async () => {
        await token.approve(accounts[1], 100);
      });

      it("should disallow approval", async function() {
        await utils.assertThrows(token.approve(accounts[0], 100, { from: accounts[1] }));
      });

      it("should disallow safeApproval", async function() {
        let prevAllowance = await token.allowance(accounts[1], accounts[0]);
        await utils.assertThrows(token.safeApprove(accounts[0], prevAllowance, 100, { from: accounts[1] }));
      });

      it("should disallow increasing approval", async function() {
        await utils.assertThrows(token.increaseApproval(accounts[0], 100, { from: accounts[1] }));
      });

      it("should disallow decreasing approval", async function() {
        await utils.assertThrows(token.decreaseApproval(accounts[0], 100, { from: accounts[1] }));
      });

      it("should allow owner to approve", async function() {
        await token.approve(accounts[1], 200, { from: accounts[0] });
        let allowance = await token.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 200);
      });

      it("should allow owner to safeApprove", async function() {
        let prevAllowance = await token.allowance(accounts[0], accounts[1]);
        await token.safeApprove(accounts[1], prevAllowance, 200, { from: accounts[0] });
        let allowance = await token.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 200);
      });
    })
  })

  

  describe('transfer', () => {
    describe('after unlocking', () => {

      beforeEach(async () => {
        await token.unlock();
      });

      it("should return correct balances after transfer", async function() {
        await token.transfer(accounts[1], 100);
        let balance0 = await token.balanceOf(accounts[0]);
        let totalSupply = await token.totalSupply.call();
        assert.equal(balance0, totalSupply - 100);
        let balance1 = await token.balanceOf(accounts[1]);
        assert.equal(balance1, 100);
      });

      it("should throw an error when trying to transfer more than balance", async function() {
        await utils.assertThrows(token.transfer(accounts[0], 101, {from: accounts[1]}))
      });

      it("should return correct balances after transfering from another account", async function() {
        await token.approve(accounts[1], 100);
        await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

        let totalSupply = await token.totalSupply.call();
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, totalSupply - 100);

        let balance1 = await token.balanceOf(accounts[2]);
        assert.equal(balance1, 100);

        let balance2 = await token.balanceOf(accounts[1]);
        assert.equal(balance2, 0);
      });

      it("should throw an error when trying to transfer more than allowed", async function() {
        let approve = await token.approve(accounts[1], 99);
        await utils.assertThrows(token.transfer(accounts[2], 100, {from: accounts[1]}))
      });

      it("should throw an error when trying to transferFrom more than allowed", async function() {
        let approve = await token.approve(accounts[1], 99);
        await utils.assertThrows(token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]}))
      });

      it('should throw an error when trying to transfer less than 0', async function () {
        await utils.assertThrows(token.transfer(accounts[1], -2));
      });
    })

    describe('before unlocking', () => {

      it("should allow the owner to transfer anything", async function() {
        await token.transfer(accounts[2], 100, {from: accounts[0]});

        let totalSupply = await token.totalSupply.call();
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, totalSupply - 100);

        let balance1 = await token.balanceOf(accounts[2]);
        assert.equal(balance1, 100);
      });

      it("should throw an error when trying to transfer anything from a non-owner", async function() {
        await token.approve(accounts[1], 100);
        await utils.assertThrows(token.transfer(accounts[0], 100, {from: accounts[1]}))
      });

      it("should throw an error when trying to transferFrom anything from a non-owner", async function() {
        await token.approve(accounts[1], 100);
        await utils.assertThrows(token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]}))
      });
    })

  });

  describe('safeTransfer', () => {

    describe('after unlocking', () => {

      beforeEach(async () => {
        await token.unlock();
      });
      
      it("should return correct balances after safeTransfer", async function() {
        await token.safeTransfer(accounts[1], 100);
        let balance0 = await token.balanceOf(accounts[0]);
        let totalSupply = await token.totalSupply.call();
        assert.equal(balance0, totalSupply - 100);
        let balance1 = await token.balanceOf(accounts[1]);
        assert.equal(balance1, 100);
      });

      it("should throw an error when trying to safeTransfer more than balance", async function() {
        await utils.assertThrows(token.safeTransfer(accounts[0], 101, {from: accounts[1]}))
      });

      it("should return correct balances after safeTransfering from another account", async function() {
        await token.approve(accounts[1], 100);
        await token.safeTransferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

        let totalSupply = await token.totalSupply.call();
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, totalSupply - 100);

        let balance1 = await token.balanceOf(accounts[2]);
        assert.equal(balance1, 100);

        let balance2 = await token.balanceOf(accounts[1]);
        assert.equal(balance2, 0);
      });

      it("should throw an error when trying to safeTransfer more than allowed", async function() {
        let approve = await token.approve(accounts[1], 99);
        await utils.assertThrows(token.safeTransfer(accounts[2], 100, {from: accounts[1]}))
      });

      it("should throw an error when trying to safeTransferFrom more than allowed", async function() {
        let approve = await token.approve(accounts[1], 99);
        await utils.assertThrows(token.safeTransferFrom(accounts[0], accounts[2], 100, {from: accounts[1]}))
      });

      it('should throw an error when trying to safeTransfer less than 0', async function () {
        await utils.assertThrows(token.safeTransfer(accounts[1], -2));
      });
    })

    describe('before unlocking', () => {

      it("should allow the owner to safeTransfer anything", async function() {
        await token.safeTransfer(accounts[2], 100, {from: accounts[0]});

        let totalSupply = await token.totalSupply.call();
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, totalSupply - 100);

        let balance1 = await token.balanceOf(accounts[2]);
        assert.equal(balance1, 100);
      });

      it("should throw an error when trying to safeTransfer anything", async function() {
        await token.approve(accounts[1], 100);
        await utils.assertThrows(token.safeTransfer(accounts[0], 100, {from: accounts[1]}))
      });

      it("should throw an error when trying to safeTransferFrom anything", async function() {
        await token.approve(accounts[1], 100);
        await utils.assertThrows(token.safeTransferFrom(accounts[0], accounts[2], 100, {from: accounts[1]}))
      });
    })
  });
});
