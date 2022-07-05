const fetch = require("node-fetch");
const deployer = global.deployer;
const oracleContract = global.contracts.ETHBBSEPriceFeedOracle;

// Fetches the latest rate from http://rest.coinapi.io for BASE and QUOTE
const getLatestPrice = async () => {
  let ref = `${process.env.API_HOST}/v1/exchangerate/${process.env.BASE}/${process.env.QUOTE}`;
  let res = await fetch(ref, {
    method: "GET", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "X-CoinAPI-Key": process.env.API_KEY,
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });

  const data = await res.json();

  return data;
};

// Listens to the GetNewRate events starting from block 0
oracleContract?.events
  ?.GetNewRate({ fromBlock: 0 }, (err, event) => {
    if (err) {
      console.log(err);
    }
  })
  .on("data", async () => {
    const res = { rate: 18 }; //await getLatestPrice();
    // Calls updateRate method on the oracle contract
    await oracleContract.methods
      .updateRate(
        Math.round(res.rate) // Round float to an int (for simplicity, let's neglect decimal points)
      )
      .send({ from: deployer }); // The updateRate method can only be called by the deployed of the oracle contract (which is accounts[0] with Ganache)
  })
  .on("error", (log) => {
    console.log("err " + log);
  });
