const Liven = artifacts.require('LivenCoin')
const Receiver = artifacts.require('./Generic223Receiver.sol')
const utils = require('tn-truffle-test-utils')
var abi = require('ethereumjs-abi')

let token
let owner
let receiver
let data
let parameterTypes
let parameterValues

contract('ERC223', function (accounts) {

  beforeEach(async () => {
    owner = accounts[0]
    token = await utils.deploy(Liven, { from: accounts[0] })
    receiver = await utils.deploy(Receiver, { from: accounts[1] })
  });

  describe('transfer', function () { 

    beforeEach(async () => {
      data = new Uint8Array(4);
      data[0] = 0xc2; data[1] = 0x98; data[2] = 0x55; data[3] = 0x78;   // 'foo()'
      parameterTypes = ["address", "uint256", "bytes"];
    });

    describe('after unlock', () => {

      beforeEach(async () => {
        await token.unlock();
      });

      it('should call the contract transfer function when transferring to a contract', async function () {
        parameterValues = [receiver.address, 100, data];
        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');       // 0xbe45fd62 == web3.sha3("transfer(address,uint256,bytes)").substr(0,10)

        var transactionObject = {
          "from": accounts[0],
          "to": token.address,
          "data": dta,
          "gas": 5000000          // Use lots of gas to let the token callback do its work.
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          if (err) {
            console.log(err);
          }
        });

        let tokenAddr = await receiver.tokenAddr.call();
        assert.equal(tokenAddr, token.address);
        let tokenSender = await receiver.tokenSender.call();
        assert.equal(tokenSender, accounts[0]);
        let sentValue = await receiver.sentValue.call();
        assert.equal(sentValue, 100);
        let balance = await token.balanceOf(receiver.address);
        assert.equal(balance, 100);
      });

      it('transfer to contract should fail if receiving address is zero', async function () {
        parameterTypes = ["address", "uint256", "bytes"];
        parameterValues = ["0x0000000000000000000000000000000000000000", 100, data];

        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');       // 0xbe45fd62 == web3.sha3("transfer(address,uint256,bytes)").substr(0,10)

        var transactionObject = {
          "from": accounts[0],
          "to": token.address,
          "data": dta,
          "gas": 5000000          // Use lots of gas to let the token callback do its work.
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          // assert.include(err.message, 'Cannot transfer token to zero address')
          assert.include(err.message, 'VM Exception')
        });
      });

      it('transfer to contract should fail if msg.sender does not have enough balance', async function () {
        parameterTypes = ["address", "uint256", "bytes"];
        parameterValues = [receiver.address, 100, data];

        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');       // 0xbe45fd62 == web3.sha3("transfer(address,uint256,bytes)").substr(0,10)

        var transactionObject = {
          "from": accounts[1],
          "to": token.address,
          "data": dta,
          "gas": 5000000          // Use lots of gas to let the token callback do its work.
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          // assert.include(err.message, 'Value exceeds balance of msg.sender')
          assert.include(err.message, 'VM Exception')
        });
      });

      it('should call the token fallback function when transferring to a contract', async function () {
        parameterTypes = ["address", "uint256", "bytes"];
        parameterValues = [receiver.address, 100, data];

        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');       // 0xbe45fd62 == web3.sha3("transfer(address,uint256,bytes)").substr(0,10)

        var transactionObject = {
          "from": accounts[0],
          "to": token.address,
          "data": dta,
          "gas": 5000000          // Use lots of gas to let the token callback do its work.
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          if (err) {
            console.log(err);
          }
        });

        let tokenAddr = await receiver.tokenAddr.call();
        assert.equal(tokenAddr, token.address);
        let tokenSender = await receiver.tokenSender.call();
        assert.equal(tokenSender, accounts[0]);
        let sentValue = await receiver.sentValue.call();
        assert.equal(sentValue, 100);
        let balance = await token.balanceOf(receiver.address);
        assert.equal(balance, 100);
      });

      it('should still transfer tokens even if fallback function is provided for regular address', async function () {
        parameterTypes = ["address", "uint256", "bytes"];
        parameterValues = [accounts[1], 100, data];
        let balanceBefore = await token.balanceOf(accounts[1]);

        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');

        var transactionObject = {
          "from": accounts[0],
          "to": token.address,
          "data": dta
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          if (err) {
            console.log(err);
          }
        });

        let balanceAfter = await token.balanceOf(accounts[1]);
        assert.equal(balanceBefore.add(100).toNumber(), balanceAfter.toNumber())
      });
    })

    describe('before unlock', () => {

      it('owner should be able to call transfer function', async function () {
        parameterValues = [receiver.address, 100, data];
        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');       // 0xbe45fd62 == web3.sha3("transfer(address,uint256,bytes)").substr(0,10)

        var transactionObject = {
          "from": accounts[0],
          "to": token.address,
          "data": dta,
          "gas": 5000000          // Use lots of gas to let the token callback do its work.
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          if(err) {
            assert.fail(false, 'Error during transaction:')
            console.log(err)
          }
        });

        let tokenAddr = await receiver.tokenAddr.call();
        assert.equal(tokenAddr, token.address);
        let tokenSender = await receiver.tokenSender.call();
        assert.equal(tokenSender, accounts[0]);
        let sentValue = await receiver.sentValue.call();
        assert.equal(sentValue, 100);
        let balance = await token.balanceOf(receiver.address);
        assert.equal(balance, 100);
      });

      it('should fail for non-owner', async function () {
        parameterValues = [receiver.address, 100, data];
        var encoded = abi.rawEncode(parameterTypes, parameterValues);
        var dta = '0xbe45fd62' + encoded.toString('hex');       // 0xbe45fd62 == web3.sha3("transfer(address,uint256,bytes)").substr(0,10)

        var transactionObject = {
          "from": accounts[1],
          "to": token.address,
          "data": dta,
          "gas": 5000000          // Use lots of gas to let the token callback do its work.
        };

        web3.eth.sendTransaction(transactionObject, function(err, transactionHash) {
          assert.isOk(err)
        });
      });
    })
  });
  
});
