/*
See metamask onboarding docs for a more fluid workflow.
*/

import Web3 from "web3";

let web3;
let plugin;

const ethereum = window.ethereum;

// use metamask or other wallet provider if they've got it installed
if (typeof ethereum !== "undefined") {
  web3 = new Web3(ethereum);
  
  // and define a store plugin for handling some events
  plugin = (store) => {
    ethereum.on('accountsChanged', (accounts) => {
      store.commit('updateCurrentAccount', accounts[0]);
    });
    
    ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  };

  // otherwise create our own Infura provider
  // to read current contracts. We can prompt them to connect
  // or install metamask when they perform an action (gradual engagement)
  // until they need to connect their wallet.
} else {
  const providerUrl = `https://rinkeby.infura.io/v3/${process.env.VUE_APP_WEB3_INFURA_PROJECT_ID}`;
  const provider = new Web3.providers.HttpProvider(providerUrl);
  web3 = new Web3(provider);
  // no listeners if we don't have a wallet to work with
  plugin = () => {};
}

export { web3, plugin };
