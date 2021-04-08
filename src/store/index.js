import Vue from 'vue'
import Vuex from 'vuex'
import {plugin} from '../web3'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    currentAccount: undefined,
    count: 0
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
    increment (state) {
      state.count++
    },
    updateCurrentAccount(state, newAccount) {
      state.currentAccount = newAccount;
    }
  },
  plugins: [plugin]
})
