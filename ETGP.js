// Specifically request an abstraction for ETGP
var ETGP = artifacts.require("ETGP");
var testContract = artifacts.require("Test");
var BigNumber = require('bignumber.js');
var math = require('mathjs');
var core = require('./core');

var totalTokens = new BigNumber(6000000000).pow(8);

contract('ETGP', function (accounts) {
  /* constructor */
  it("should put 6000000000 ETGP in the first account", function () {
    return ETGP.deployed().then(function (instance) {
      return instance.balanceOf.call(accounts[0]);
    }).then(function (balance) {
      var totalSupply = new BigNumber(6000000000).mul(new BigNumber(10).pow(8));
      assert.equal(balance.valueOf(), totalSupply.valueOf(),
          "6000000000 ETGP wasn't in the first account");
    });
  });
  /* transfer */
  it("should send coin correctly", function () {
    var ETGP;

    // Get initial balances of first and second account.
    var account_one = accounts[0];
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 10;

    return ETGP.deployed().then(function (instance) {
      ETGP = instance;
      return ETGP.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_starting_balance = balance.toNumber();
      return ETGP.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_starting_balance = balance.toNumber();
      return ETGP.transfer(account_two, amount, {from: account_one});
    }).then(function () {
      return ETGP.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_ending_balance = balance.toNumber();
      return ETGP.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance
          - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance
          + amount, "Amount wasn't correctly sent to the receiver");
    });
  });
  it("should send 10 tokens from contract to address", function () {
    var ETGP;
    var test;

    // Get initial balances of first and second account.
    var account_one;
    var account_two = accounts[7];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 10;

    return ETGP.deployed().then(function (instance) {
      ETGP = instance;
      return testContract.deployed();
    }).then(function (testInst) {
      test = testInst;
      account_one = testInst.address;

      return ETGP.transferFrom(accounts[0], account_one, 10,
          {from: accounts[0]});
    }).then(function () {
      return ETGP.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_starting_balance = balance.toNumber();
      return ETGP.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_starting_balance = balance.toNumber();
      return test.testTransfer(ETGP.address, account_two, amount,
          {from: accounts[0]});
    }).then(function () {
      return ETGP.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_ending_balance = balance.toNumber();
      return ETGP.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance
          - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance
          + amount, "Amount wasn't correctly sent to the receiver");
    });
  });
  /* approve */
  it("should approve transfer of 10 ETGP from first account to second account",
      function () {
        return core.makeApproveCheck(ETGP, accounts[0], accounts[1], 10);
      });
  it("should disapprove transfer of 10 ETGP from first account to second account",
      function () {
        return core.makeApproveCheck(ETGP, accounts[0], accounts[1], 0);
      });
  /* transferFrom */
  it("should approve and send 10 ETGP from first account to second account",
      function () {
        var ETGP;

        return core.makeApproveCheck(ETGP, accounts[0], accounts[1], 10).then(
            function (instance) {
              ETGP = instance;
              return instance.transferFrom(accounts[0], accounts[1], 10,
                  {from: accounts[1]});
            }).then(function () {
          return ETGP.balanceOf.call(accounts[1]);
        }).then(function (balance) {
          assert.equal(balance.toNumber(), 20,
              "Transfer Failed. user 2 have incorrect balance");
          return ETGP.allowance.call(accounts[0], accounts[1]);
        }).then(function (balance) {
          assert.equal(balance.toNumber(), 0,
              "Allowance is incorrect after transfer");
        });
      });
  it("should use transferFrom to send 10 ETGP from first account as sender also, to 7th account without approval.",
      function () {
        var ETGP;
        return ETGP.deployed().then(function (instance) {
          ETGP = instance;
          return instance.transferFrom(accounts[0], accounts[6], 10,
              {from: accounts[0]});
        }).then(function () {
          return ETGP.balanceOf.call(accounts[6]);
        }).then(function (balance) {
          assert.equal(balance.toNumber(), 10,
              "Transfer Failed. user 6 have incorrect balance");
        });
      });
  it("should approve unlimited and send 10 ETGP from first account to second account",
      function () {
        var ETGP;
        var UINT256_MAX = new BigNumber('2').pow(256).minus(1);

        return core.makeApproveCheck(ETGP, accounts[0], accounts[1],
            UINT256_MAX).then(
            function (instance) {
              ETGP = instance;
              return instance.transferFrom(accounts[0], accounts[1], 10,
                  {from: accounts[1]});
            }).then(function () {
          return ETGP.balanceOf.call(accounts[1]);
        }).then(function (balance) {
          assert.equal(balance.toNumber(), 30,
              "Transfer Failed. user 2 have incorrect balance");
          return ETGP.allowance.call(accounts[0], accounts[1]);
        }).then(function (balance) {
          assert.equal(balance.toNumber(), UINT256_MAX,
              "Allowance is incorrect after transfer");
        });
      });
  /* multiPartyTransfer */
  it("should execute a batch transfer of 10 ETGP in 5 accounts", function () {
    var ETGP;
    var values = [10, 10, 10, 10, 10];
    var expected = [40, 10, 10, 10, 10];
    var rets = [];
    var targets = accounts.slice(1, 6);

    return ETGP.deployed().then(function (instance) {
      ETGP = instance;
      return instance.multiPartyTransfer(targets, values, {from: accounts[0]});
    }).then(function () {
      for (var i = 0; i < 5; i++) {
        rets.push(ETGP.balanceOf.call(targets[i]));
      }
      return Promise.all(rets).then(function (results) {
        for (var i = 0; i < 5; i++) {
          assert.equal(results[i].toNumber(), expected[i], "Transfer to "
              + accounts[i] + " failed");
        }
      });
    });
  });
  it("should execute a batch transfer of 10 ETGP 5 times in 1 account",
      function () {
        var ETGP;
        var values = [10, 10, 10, 10, 10];
        var expected = 90;
        var targets = [accounts[1], accounts[1], accounts[1], accounts[1],
          accounts[1]];

        return ETGP.deployed().then(function (instance) {
          ETGP = instance;
          return instance.multiPartyTransfer(targets, values,
              {from: accounts[0]});
        }).then(function () {
          return ETGP.balanceOf.call(targets[1]).then(function (balance) {
            assert.equal(balance.toNumber(), expected, "Transfer to "
                + accounts[1] + " failed");
          });
        });
      });
  /* multiPartyTransferFrom */
  it("should execute a batch approved transfer of 10 ETGP in 5 accounts",
      function () {
        var ETGP;
        var values = [10, 10, 10, 10, 10];
        var expected = [100, 20, 20, 20, 20];
        var rets = [];
        var targets = accounts.slice(1, 6);

        return core.makeApproveCheck(ETGP, accounts[0], accounts[1],
            math.sum(values)).then(function (instance) {
          ETGP = instance;
          return instance.multiPartyTransferFrom(accounts[0], targets, values,
              {from: accounts[1]});
        }).then(function () {
          for (var i = 0; i < 5; i++) {
            rets.push(ETGP.balanceOf.call(targets[i]));
          }
          return Promise.all(rets).then(function (results) {
            for (var i = 0; i < 5; i++) {
              assert.equal(results[i].toNumber(), expected[i], "Transfer to "
                  + accounts[i] + " failed");
            }
          });
        });
      });
  it("should execute a batch approved transfer of 10 ETGP 5 times in 1 account",
      function () {
        var ETGP;
        var values = [10, 10, 10, 10, 10];
        var expected = 150;
        var targets = [accounts[1], accounts[1], accounts[1], accounts[1],
          accounts[1]];

        return core.makeApproveCheck(ETGP, accounts[0], accounts[1],
            math.sum(values)).then(function (instance) {
          ETGP = instance;
          return instance.multiPartyTransferFrom(accounts[0], targets, values,
              {from: accounts[1]});
        }).then(function () {
          return ETGP.balanceOf.call(targets[1]).then(function (balance) {
            assert.equal(balance.toNumber(), expected, "Transfer to "
                + accounts[1] + " failed");
          });
        });
      });
  /* transfer must fail checks */
  it("should not send tokens to 0 address", function () {
    return core.callAndCatchError(ETGP, 'transfer',
        ["0x0", 10, {from: accounts[0]}]).then(function (result) {
      assert.isTrue(result, 'Sent tokens to 0 address');
    });
  });
  it("should not send tokens to contracts", function () {
    return testContract.deployed().then(function (instance) {
      return core.callAndCatchError(ETGP, 'transfer',
          [instance.address, 10, {from: accounts[0]}]).then(function (result) {
        assert.isTrue(result, 'Sent tokens to contract');
      });
    });
  });
  it("should not transfer 0 tokens", function () {
    return core.callAndCatchError(ETGP, 'transfer',
        [accounts[1], 0, {from: accounts[0]}]).then(function (result) {
      assert.isTrue(result, 'Sent 0 tokens');
    });
  });
  it("should not transfer with zeroed out input", function () {
    return core.callAndCatchError(ETGP, 'transfer',
        [0, 0, {from: accounts[0]}]).then(function (result) {
      assert.isTrue(result, 'Sent zeroed out');
    });
  });
  it("should not transfer more tokens that it haves", function () {
    var val = totalTokens.add(1);
    return core.callAndCatchError(ETGP, 'transfer',
        [accounts[3], val, {from: accounts[0]}]).then(function (result) {
      assert.isTrue(result, 'Sent more tokens than it have');
    });
  });
  /* transferFrom must fail checks */
  it("should not transferFrom _from 0 address", function () {
    return core.callAndCatchError(ETGP, 'transferFrom',
        [0, accounts[1], 10, {from: accounts[0]}]).then(function (result) {
      assert.isTrue(result, 'Sent _from 0 address');
    });
  });
  it("should not transferFrom _to 0 address", function () {
    return core.callAndCatchError(ETGP, 'transferFrom',
        [accounts[0], 0, 10, {from: accounts[1]}]).then(function (result) {
      assert.isTrue(result, 'Sent _to 0 address');
    });
  });
  it("should not transferFrom 0 value", function () {
    return core.callAndCatchError(ETGP, 'transferFrom',
        [accounts[0], accounts[1], 0, {from: accounts[2]}]).then(
        function (result) {
          assert.isTrue(result, 'Sent 0 value');
        });
  });
  it("should not transferFrom 0 all", function () {
    return core.callAndCatchError(ETGP, 'transferFrom',
        [0, 0, 0, {from: accounts[2]}]).then(function (result) {
      assert.isTrue(result, 'Sent with zeroed input');
    });
  });
  it("should not transferFrom send tokens to this contract", function () {
    return ETGP.deployed().then(function (instance) {
      return core.makeApproveCheck(ETGP, accounts[0], accounts[2],
          10).then(
          function () {
            return core.callAndCatchError(ETGP, 'transferFrom',
                [accounts[0], instance.address, 10, {from: accounts[2]}]).then(
                function (result) {
                  assert.isTrue(result, 'Sent to this contract');
                });
          });
    });
  });
  it("should not transferFrom send more tokens than it haves", function () {
    var val = totalTokens.add(1);
    return core.makeApproveCheck(ETGP, accounts[0], accounts[2], val).then(
        function () {
          return core.callAndCatchError(ETGP, 'transferFrom',
              [accounts[0], accounts[1], val, {from: accounts[2]}]).then(
              function (result) {
                assert.isTrue(result, 'Sent more tokens than it haves');
              });
        });
  });
  /* multiPartyTransfer must fail checks */
  it("should not multiPartyTransfer if address array length is greater to 255",
      function () {
        var addrs = Array.apply(null, new Array(256)).map(function () {
          return accounts[8]
        });
        var values = Array.apply(null, new Array(256)).map(function () {
          return 10
        });

        return core.callAndCatchError(ETGP, 'multiPartyTransfer',
            [addrs, values, {from: accounts[0]}]).then(function (result) {
          assert.isTrue(result, 'Sent 10 ETGP to 256 addresses');
        });
      });
  it("should not multiPartyTransfer if address array length is not equal to values array length",
      function () {
        var addrs = Array.apply(null, new Array(2)).map(function () {
          return accounts[8]
        });
        var values = Array.apply(null, new Array(1)).map(function () {
          return 10
        });

        return core.callAndCatchError(ETGP, 'multiPartyTransfer',
            [addrs, values, {from: accounts[0]}]).then(function (result) {
          assert.isTrue(result, 'Sent one instance of 10 ETGP to 2 addresses');
        });
      });
  /* multiPartyTransferFrom must fail checks */
  it("should not multiPartyTransferFrom if address array length is greater to 255",
      function () {
        var addrs = Array.apply(null, new Array(256)).map(function () {
          return accounts[8]
        });
        var values = Array.apply(null, new Array(256)).map(function () {
          return 10
        });

        return core.callAndCatchError(ETGP, 'multiPartyTransferFrom',
            [accounts[0], addrs, values, {from: accounts[0]}]).then(
            function (result) {
              assert.isTrue(result, 'Sent 10 ETGP to 256 addresses');
            });
      });
  it("should not multiPartyTransferFrom if address array length is not equal to values array length",
      function () {
        var addrs = Array.apply(null, new Array(2)).map(function () {
          return accounts[8]
        });
        var values = Array.apply(null, new Array(1)).map(function () {
          return 10
        });

        return core.callAndCatchError(ETGP, 'multiPartyTransferFrom',
            [accounts[0], addrs, values, {from: accounts[0]}]).then(
            function (result) {
              assert.isTrue(result,
                  'Sent one instance of 10 ETGP to 2 addresses');
            });
      });
  /* approve must fail checks */
  it("should not approve transfer of 10 ETGP 0 spender",
      function () {
        return core.callAndCatchError(ETGP, 'approve',
            [0, 10, {from: accounts[0]}]).then(function (result) {
          assert.isTrue(result, 'Approved 10 ETGP to 0 spender');
        });
      });
  /* anonymous eth receive blocker */
  it("should not receive ether",
      function () {
        var testInst;
        var msg;

        return ETGP.deployed().then(function (instance) {
          testInst = instance;
          return ETGP.web3.eth.sendTransaction({
            from: accounts[0],
            to: instance.address,
            value: ETGP.web3.toWei(1, "ether")
          }, function (error) {
            msg = error.message;
            return ETGP.web3.eth.getBalance(testInst.address,
                function (error, balance) {
                  assert.equal(balance.toNumber(), 0, "Contract received "
                      + ETGP.web3.fromWei(balance) + " ether");
                  assert.isTrue(!!msg.match(/invalid opcode/),
                      "Contract received 10 ether");
                });
          });
        });
      });
});
