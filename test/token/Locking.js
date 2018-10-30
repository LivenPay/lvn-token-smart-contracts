const Liven = artifacts.require('LivenCoin')
const Receiver = artifacts.require('./Generic223Receiver.sol')
const utils = require('tn-truffle-test-utils')

let token
let owner
let receiver

contract('Locking', function (accounts) {

  beforeEach(async () => {
    owner = accounts[0]
    token = await utils.deploy(Liven, { from: accounts[0] })
    receiver = await utils.deploy(Receiver, { from: accounts[1] })
  });


  it('should be locked after deploy', async function () {
    let unlocked = await token.unlocked.call()
    assert.isNotOk(unlocked)
  });

  it('should be unlocked', async function () {
    await token.unlock()
    let unlocked = await token.unlocked.call()
    assert.isOk(unlocked);
  });
  
});
