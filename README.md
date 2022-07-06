## BBSE Bank 2.0
BBSEBank is a decentralized application (dApp) that enables users to earn interest by depositing Ether.
The interest is calculated based on a pre-defined yearly return rate. Although the users can withdraw their Ether back anytime they want, the longer the deposit stays, the more interest they earn. The interest is paid in the form of BBSE token which is an ERC20 token. In BBSEBank 2.0, the users can now borrow ETH by collateralizing their BBSE tokens.

## An example of the running application can be found on: http://15.237.160.28:3000/


### To run: 

## 1) install dependencies
```sh
npm i
```
## 2) to deploy contracts to rinkbey network
```sh
truffle migrate --network rinkeby 
```
## 3) to Start the front end
```sh
npm run dev
```


## .env File:
```sh
API_HOST=  // The api host used to connect to the rinkbey chain
BASE=ETH
QUOTE=AAVE
API_KEY=  // CoinApi.io APi key used in oracle.js to get exchange rate between base anq quote
PRIVATEKEY1  = // The private key used for contract deployment and listing for oracle events
INFURAAPIKEY = //API key of infura to connect to the rinkbey test chain
```
