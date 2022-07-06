/* global BigInt */
App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",

  init: function () {
    return App.initWeb3();
  },

  isInstalled: async function () {
    return typeof window.ethereum !== "undefined";
  },

  requestConnection: async function () {
    try {
      t = await ethereum.request({ method: "eth_requestAccounts" });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  requestNetworkChange: async function () {
    try {
      t = await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${Number(4).toString(16)}` }],
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  isRinkbeyNetwork: function () {
    if (window.ethereum.networkVersion != 4) {
      return false;
    }
    return true;
  },

  isLoggedIn: async function () {
    web3 = await new Web3(web3.currentProvider);
    var t = await promisify(web3.eth.getAccounts);
    if (t.length < 1) {
      return false;
    } else {
      return true;
    }
  },

  initWeb3: async function () {
    var page1 = $("#page_1");
    var page2 = $("#page_2");
    _isInstalled = await App.isInstalled();
    if (_isInstalled) {
      $("#metamask-button-text").html("Login with MetaMask");
      App.web3Provider = web3.currentProvider;
      web3 = await new Web3(web3.currentProvider);
      _isLoggedIn = await App.isLoggedIn();
      console.log(_isLoggedIn);
      if (!_isLoggedIn) {
        page1.show();
        page2.hide();
        $("#metamaskbtn")
          .unbind()
          .click(async (e) => {
            var res = await App.requestConnection();
            if (res) {
              App.init();
            } else {
              alert("Connection failed please try again");
              return;
            }
          });
        return;
      }
      _isRinkbey = App.isRinkbeyNetwork();
      if (!_isRinkbey) {
        page1.show();
        page2.hide();
        var res = await App.requestNetworkChange();
        if (res) {
          App.init();
        } else {
          page1.show();
          page2.hide();
          $("#metamaskbtn")
            .unbind()
            .click(async (e) => {
              var res = await App.requestNetworkChange();
              if (res) {
                App.init();
              } else {
                alert("Pleasee change to rinkbey");
                return;
              }
            });
          alert("Pleasee change to rinkbey");
          return;
        }
      }
      return App.initContract();
      // try {
      //   await window.ethereum.request({
      //     method: "wallet_addEthereumChain",
      //     params: [
      //       {
      //         chainName: "Rinkeby Test Network",
      //         chainId: "0x4",
      //         nativeCurrency: {
      //           name: "Ethereum",
      //           decimals: 18,
      //           symbol: "RinkebyETH",
      //         },
      //         rpcUrls: ["https://rinkeby.infura.io/v3/"],
      //       },
      //     ],
      //   });

      // } catch (err) {
      //   // This error code indicates that the chain has not been added to MetaMask
      //   console.log(err);
      // }
    } else {
      $("#metamask-button-text").html("Install MetaMask");
      $("#metamaskbtn")
        .unbind()
        .click(async (e) => {
          window.location.href = "https://www.metamask.io/";
          console.log("12312");
        });

      const onboarding = new MetaMaskOnboarding({ forwarderOrigin });
      onboarding.startOnboarding();
    }

    // if (typeof web3 !== "undefined") {
    //   // If a web3 instance is already provided by Meta Mask.
    //   App.web3Provider = web3.currentProvider;
    //   web3 = new Web3(web3.currentProvider);
    // } else {
    //   // Specify default instance if no web3 instance provided
    //   // App.web3Provider = new Web3.providers.HttpProvider(
    //   //   "http://127.0.0.1:7545"
    //   // );
    //   // web3 = new Web3(App.web3Provider);
    // }
    // return App.initContract();
  },

  initContract: function () {
    $.getJSON("ETHBBSEPriceFeedOracle.json", function (ETHBBSEPriceFeedOracle) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.ETHBBSEPriceFeedOracle = TruffleContract(
        ETHBBSEPriceFeedOracle
      );
      // Connect provider to interact with contract
      App.contracts.ETHBBSEPriceFeedOracle.setProvider(App.web3Provider);
      $.getJSON("BBSEToken.json", function (BBSEToken) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.BBSEToken = TruffleContract(BBSEToken);
        // Connect provider to interact with contract
        App.contracts.BBSEToken.setProvider(App.web3Provider);
        $.getJSON("BBSEBank.json", function (BBSEBank) {
          // Instantiate a new truffle contract from the artifact
          App.contracts.BBSEBank = TruffleContract(BBSEBank);
          // Connect provider to interact with contract
          App.contracts.BBSEBank.setProvider(App.web3Provider);
          return App.render();
        });
      });
    });
  },

  render: async function () {
    var BBSETOBEAUTHORIZED;
    var bankBalance;
    var AuthorizedBBSE;
    var investorAmount;
    var BBSETokenBalance;
    var requestedLoanAmmount;
    var loader = $("#loader");
    var content = $("#content");
    var page1 = $("#page_1");
    var page2 = $("#page_2");
    var userBalance;
    var col_ratio;
    var bbse_rate;
    var fees;
    var minimumDepositAmountInETH;
    var interestPerSecondForMin;
    var yearlyReturnRate;
    var hasAvtiveDeposit;
    var depositAmount;
    var startBlock;
    var hasActiveLoan;
    var loanAmount;
    var collateral;
    var current_currency = "ETH";
    var current_ammount = 0;

    page1.hide();
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Public Key : " + account);
        web3.eth.getBalance(App.account, function (err, balance) {
          if (err === null) {
            $("#EthereumBalance").html(
              "Ethereum Balance: " + web3.fromWei(balance) + " ETH"
            );
            userBalance = web3.fromWei(Number(balance));
          }
        });
      }
    });

    App.contracts.ETHBBSEPriceFeedOracle.deployed().then(function (instance) {
      ETHBBSEPriceFeedOracleInstance = instance;
      ETHBBSEPriceFeedOracleInstance.getRate.call().then(function (rate) {
        bbse_rate = rate;
        $("#Rate").html(" Rate: 1 ETH is equal to " + rate + " BBSE ");
      });
    });

    App.contracts.BBSEToken.deployed().then(function (instance) {
      BBSETokenInstance = instance;
      BBSETokenInstance.balanceOf(App.account).then(function (balance) {
        BBSETokenBalance = balance;
        $("#BBSETokenBalance").html("BBSE Token Balance " + balance + " BBSE ");
      });

      BBSETokenInstance.totalSupply.call().then(function (totalSupply) {
        $("#TMBBSE").html("Total Minted BBSE Tokens " + totalSupply + " BBSE ");
      });

      App.contracts.BBSEBank.deployed().then(function (instance) {
        BBSEBankInstance = instance;
        BBSETokenInstance.allowance
          .call(App.account, BBSEBankInstance.address)
          .then(function (allowance) {
            AuthorizedBBSE = Number(allowance);
            $("#BBSEBANKALLOWANCE").html(
              "The total number of token authorized by BBSE BANK : " +
                Number(allowance) +
                " BBSE"
            );
          });
      });
    });
    //Current Yearly Return Rate
    App.contracts.BBSEBank.deployed().then(function (instance) {
      BBSEBankInstance = instance;
      web3.eth.getBalance(instance.address, function (err, balance2) {
        if (err === null) {
          bankBalance = Number(balance2);
          $("#BBSEBANKBalance").html(
            "Ethereum Balance: " + web3.fromWei(Number(balance2)) + " ETH"
          );
        }
      });
      BBSEBankInstance.yearlyReturnRate.call().then((res) => {
        yearlyReturnRate = res;
        $("#YRR").html("Current Yearly Return Rate : " + Number(res) + "%");
      });
      BBSEBankInstance.MIN_DEPOSIT_AMOUNT.call().then((res) => {
        minimumDepositAmountInETH = web3.fromWei(Number(res));
        $("#MDA").html(
          "Minimum Deposit Amount : " + web3.fromWei(Number(res)) + " ETH"
        );
      });
      BBSEBankInstance.COLLATERALIZATION_RATIO.call().then((res) => {
        col_ratio = Number(res);
        $("#COLRATIO").html("Collateralization Ratio : " + Number(res) + "%");
      });
      BBSEBankInstance.LOAN_FEE_RATE.call().then((res) => {
        fees = Number(res);
        $("#LOANFEE").html("Loan Fee Rate : " + Number(res) + "%");
      });
      BBSEBankInstance.interestPerSecondForMinDeposit.call().then((res) => {
        interestPerSecondForMin = Number(res);
        $("#IPS").html(
          "Estimated Interest Per Second/1ETH : " + Number(res) + " BBSE"
        );
      });
      BBSEBankInstance.totalDepositAmount.call().then((res) => {
        investorAmount = Number(res);
        $("#TDA").html(
          "Current total deposited ammount by Investors : " +
            web3.fromWei(Number(res)) +
            "ETH"
        );
      });
      BBSEBankInstance.borrowers.call(App.account).then(async (res, err) => {
        if (err == null) {
          hasActiveLoan = res[0];
          loanAmount = Number(res[1]);
          collateral = Number(res[2]);
          if (!hasActiveLoan) {
            $("#NoActiveLoan").show();
            $("#ActiveLoan").hide();
          } else {
            $("#ActiveLoan").show();
            $("#NoActiveLoan").hide();
          }
          $("#LoanAmount").html("Loan value : " + loanAmount + " Ether");
          $("#collateralttt").html("Collateral: " + collateral + " BBSE");
          if (userBalance >= loanAmount) {
            $("#PayBTN").prop("disabled", false);
          } else {
            $("#PayBTN").prop("disabled", true);
          }
        }
      });
      BBSEBankInstance.investors.call(App.account).then(async (res, err) => {
        if (err == null) {
          hasAvtiveDeposit = res[0];
          depositAmount = Number(res[1]);
          startBlock = Number(res[2]);
          if (!hasAvtiveDeposit) {
            $("#NoActiveDeposit").show();
            $("#ActiveDeposit").hide();
          } else {
            $("#ActiveDeposit").show();
            $("#NoActiveDeposit").hide();

            $("#DepositedAmount").html(
              "Deposited Amount : " + web3.fromWei(depositAmount) + " ETH"
            );
            $("#StartBlock").html("Start Block Number : " + startBlock);

            web3.eth.getBlockNumber(function (err, e) {
              $("#CurrentBlock").html("Current Block Number : " + e);
              var depositDuration = (e - startBlock) * 10000000;
              var interestPerSecond =
                (interestPerSecondForMin * depositAmount) /
                (minimumDepositAmountInETH * 10 ** 18);
              var interest = interestPerSecond * depositDuration;

              $("#AccumelatedInterest").html(
                "Total Accumelated Interest : " + interest + " BBSE"
              );
            });

            // Updates total deposited amount

            // Calculate interest per second
          }
        }
      });
    });

    $("#ddeth").click(function () {
      if (current_currency == "WEI") {
        current_ammount = web3.fromWei(current_ammount, "ether");
      }

      current_currency = "ETH";
      $("#DDLC").html(current_currency);
      $("#DepositI").val(current_ammount);
    });
    $("#ddWEI").click(function () {
      if (current_currency == "ETH") {
        current_ammount = current_ammount * 10 ** 18;
      }

      current_currency = "WEI";
      $("#DDLC").html(current_currency);
      $("#DepositI").val(current_ammount);
    });

    $("#DepositI").on("input", function (e) {
      current_ammount = parseInt($("#DepositI").val());

      var enteredAmount = current_ammount;

      if (current_currency == "WEI") {
        enteredAmount = enteredAmount / 10 ** 18;
      }

      if (enteredAmount < minimumDepositAmountInETH) {
        $("#DepositBTN").prop("disabled", true);
        $("#DepositWarn").html(
          "Please Enter an amount Greater than or equal the minimum deposit Amount"
        );
        $("#DepositWarn").show();
      } else {
        console.log();
        if (enteredAmount > userBalance) {
          $("#DepositBTN").prop("disabled", true);
          $("#DepositWarn").html(
            "Please Enter an amount Smaller than or equal to your balance"
          );
          $("#DepositWarn").show();
        } else {
          $("#DepositBTN").prop("disabled", false);
          $("#DepositWarn").hide();
        }
      }

      interest =
        (interestPerSecondForMin * enteredAmount) / minimumDepositAmountInETH;
      $("#IPS2").html(
        "Inerest per second For Entered Amount : " + interest + " BBSE"
      );
    });

    $("#DepositBTN")
      .unbind()
      .click(async (e) => {
        var amount = current_ammount;
        if (current_currency == "ETH") {
          amount = amount * 10 ** 18;
        }

        bank_instance = await App.contracts.BBSEBank.deployed();
        var res = await bank_instance.deposit({
          value: amount,
          from: App.account,
        });
        return App.init();

        // var result = await App.contracts.BBSEBank.deposit().send({
        //   from: App.account,
        //   value: amount,
        // });
      });
    $("#WithdrawBTN")
      .unbind()
      .click((e) => {
        App.contracts.BBSEBank.deployed().then(function (e) {
          e.withdraw({ from: App.account })
            .on("error", function (error) {
              App.init();
            })
            .then(function (eaa, a) {
              console.log(eaa);
              console.log(a);
              App.init();
            });
        });

        // var result = await App.contracts.BBSEBank.deposit().send({
        //   from: App.account,
        //   value: amount,
        // });
      });

    $("#AllowanceI").on("input", function (e) {
      BBSETOBEAUTHORIZED = parseInt($("#AllowanceI").val());
      console;
      if (BBSETOBEAUTHORIZED < 0.1 || BBSETOBEAUTHORIZED > BBSETokenBalance) {
        $("#AuthorizeAllowanceBTN").prop("disabled", true);
        $("#AllowanceWarn").html("Unfortunatly You dont have enough Tokens");
        $("#AllowanceWarn").show();
      } else {
        $("#AuthorizeAllowanceBTN").prop("disabled", false);
        $("#AllowanceWarn").hide();
      }
    });

    $("#AuthorizeAllowanceBTN")
      .unbind()
      .click(async (e) => {
        var amount = BBSETOBEAUTHORIZED;
        bank_instance = await App.contracts.BBSEBank.deployed();
        token_instance = await App.contracts.BBSEToken.deployed();
        var res = await token_instance.approve(bank_instance.address, amount, {
          from: App.account,
        });

        return App.init();

        // var result = await App.contracts.BBSEBank.deposit().send({
        //   from: App.account,
        //   value: amount,
        // });
      });

    $("#LoanI").on("input", function (e) {
      requestedLoanAmmount = parseInt($("#LoanI").val());

      var enteredAmount = requestedLoanAmmount;
      console.log(enteredAmount);
      console.log(investorAmount / 10 ** 18);
      console.log(bankBalance);
      console.log(fees);
      var collateral2 = (enteredAmount * col_ratio * bbse_rate) / 100;
      $("#collateral").html(
        "The total amount of required Collateral : " + collateral2 + " BBSE"
      );
      $("#fees").html(
        "The fees that will be deducted upon repay" +
          (collateral2 * fees) / 100 +
          " BBSE"
      );
      if (enteredAmount + investorAmount / 10 ** 18 > bankBalance / 10 ** 18) {
        $("#LoanBTN").prop("disabled", true);
        $("#LoanWarn").html(
          "Unfortunatly The bank does not have enough etherum now"
        );
        $("#LoanWarn").show();
      } else if (BBSETokenBalance < collateral2) {
        $("#LoanBTN").prop("disabled", true);
        $("#LoanWarn").html("Unfortunatly You dont have enough Collateral");
        $("#LoanWarn").show();
      } else if (AuthorizedBBSE < collateral2) {
        $("#LoanBTN").prop("disabled", true);
        $("#LoanWarn").html(
          "Please Authorize the specified BBSE TO THE BBSE BANK First"
        );
        $("#LoanWarn").show();
      } else {
        $("#LoanBTN").prop("disabled", false);
        $("#LoanWarn").hide();
      }
    });

    $("#LoanBTN")
      .unbind()
      .click((e) => {
        amount = BigInt(requestedLoanAmmount);
        App.contracts.BBSEBank.deployed().then(function (e) {
          e.borrow(amount, { from: App.account })
            .on("error", function (error) {
              App.init();
            })
            .then(function (eaa, a) {
              console.log(eaa);
              console.log(a);
              App.init();
            });
        });

        // var result = await App.contracts.BBSEBank.deposit().send({
        //   from: App.account,
        //   value: amount,
        // });
      });
    $("#PayBTN")
      .unbind()
      .click(async (e) => {
        bank_instance = await App.contracts.BBSEBank.deployed();
        var res = await bank_instance.payLoan({
          value: loanAmount,
          from: App.account,
        });
        App.init();

        // var result = await App.contracts.BBSEBank.deposit().send({
        //   from: App.account,
        //   value: amount,
        // });
      });

    loader.hide();
    content.show();
    page2.show();
    //   })
    //   .catch(function (error) {
    //     console.warn(error);
    //   });
  },
};

promisify = (fun, params = []) => {
  return new Promise((resolve, reject) => {
    fun(...params, (err, data) => {
      if (err !== null) reject(err);
      else resolve(data);
    });
  });
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
