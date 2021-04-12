import Vue from 'vue'
import Vuex from 'vuex'
import {plugin} from '../web3'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    currentAccount: undefined,
    isWalletInstalled: typeof window.ethereum !== "undefined",
  },
  getters: {
    currentAccount: state => state.currentAccount,
    isConnected: state => state.currentAccount !== undefined,
    isWalletInstalled: state => state.isWalletInstalled,
  },
  actions: {
    fetchAccounts({commit}, web3) {
      web3.eth.getAccounts().then(
        accounts => commit(
            'updateCurrentAccount', accounts[0]
        )
    );     
    }
  },
  mutations: {
    updateCurrentAccount(state, newAccount) {
      state.currentAccount = newAccount;
    }
  },
  plugins: [plugin]
})
