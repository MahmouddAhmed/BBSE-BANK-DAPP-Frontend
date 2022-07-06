import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import Web3 from "web3";
import ETHBBSEPriceFeedOracle from "../build/contracts/ETHBBSEPriceFeedOracle.json" assert { type: "json" };
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: __dirname + "/../.env" });

// Use the local Ganache node to connect to the blockchain

const web3 = new Web3(
  `wss://rinkeby.infura.io/ws/v3/${process.env.INFURAAPIKEY}`
);
const netId = await web3.eth.net.getId();
const deployer = process.env.PUBLICKEY1;

// Initialize the contract object
const oracleContract = new web3.eth.Contract(
  ETHBBSEPriceFeedOracle.abi, // Contract ABI
  ETHBBSEPriceFeedOracle.networks[netId].address // Contract address
);

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
      console.log("sadasdas");
      console.log(err);
    }
  })
  .on("data", async () => {
    console.log("asd");
    const res = await getLatestPrice();
    // // Calls updateRate method on the oracle contract
    await oracleContract.methods
      .updateRate(
        Math.round(res.rate) // Round float to an int (for simplicity, let's neglect decimal points)
      )
      .send({ from: deployer }); // The updateRate method can only be called by the deployed of the oracle contract (which is accounts[0] with Ganache)
  })
  .on("error", (log) => {
    console.log("err " + log);
  });
