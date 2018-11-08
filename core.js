module.exports = {
  makeApproveCheck: function (inst, firstAccount, secondAccount, value) {
    var bnc;

    return inst.deployed().then(function (instance) {
      bnc = instance;
      return bnc.approve(secondAccount, value, {from: firstAccount});
    }).then(function () {
      return bnc.allowance.call(firstAccount, secondAccount);
    }).then(function (balance) {
      assert.equal(balance.toNumber(), value,
          "Transfer failed. Incorrect Approved Amount");
      return bnc;
    });
  },
  callAndCatchError: function(inst, funcName, funcArgs) {
    var msg = '';

    return inst.deployed().then(function (instance) {
      return instance[funcName].apply(this, funcArgs);
    }).catch(function(error){
      msg = error.message;
    }).then(function(){
      return !!msg.match(/invalid opcode/);
    });
  }
};
