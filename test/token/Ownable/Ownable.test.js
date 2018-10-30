const { shouldBehaveLikeOwnable } = require('./Ownable.behavior');

const LivenCoin = artifacts.require('LivenCoin');

contract('Ownable', function ([_, owner, ...otherAccounts]) {
  beforeEach(async function () {
    this.ownable = await LivenCoin.new({ from: owner });
  });

  shouldBehaveLikeOwnable(owner, otherAccounts);
});
