<template>
<div>
    {{$store.state.currentAccount}}
    <button @click="connectWallet" :disabled="isConnected || !isEthereumSupported">
        {{connectButtonText}}
    </button>

    <h1> Raffle </h1>
    <p>
        Raffle Manager: {{managerAddress}}
    </p>
    <p>
        Current Players:
        <ol v-for="player in players" :key="player">
            <li>{{player}}</li>
        </ol>
    </p>
    <p>
        Total Prize Pool: {{contractBalanceEther}} ETH
    </p>
    <p> Ticket Price: {{ticketPriceEther}} ETH</p>
    <div v-if="isConnected">
    <form v-on:submit.prevent="getApproval">
        <h2> Enter the raffle? </h2>
        <div>
            <input v-model="numTickets" type="number" label="number of tickets" />
            X {{ticketPriceEther}} = {{totalPriceEther}} ETH
        </div>
        <button :disabled="loading">Enter</button>
    </form>
    <button @click="pickWinner" :disabled="loading">Pick a Winner (manager only) </button>
    </div>
</div>
</template>

<script>
import raffle from "../contracts/raffle";
import {web3, isEthereumSupported} from "../web3"; 

// TODO: callbacks (e.g., refresh the # players, etc), 
// add raffle, lastWinner to contract, loading icons

export default {
  name: "Raffle",
  data() {
    return {
      managerAddress: "",
      players: [],
      contractBalance: "",
      ticketPrice: "0",
      numTickets: 1,
      loading: false,
    };
  },
  computed: {
    contractBalanceEther() {
      return web3.utils.fromWei(this.contractBalance, "ether");
    },
    ticketPriceEther() {
      return web3.utils.fromWei(this.ticketPrice, "ether");
    },
    totalPriceEther() {
      // to prevent rounding issues or calling toFixed, calculate based off int value
      return web3.utils.fromWei(
        String(this.ticketPrice * this.numTickets),
        "ether"
      );
    },
    isConnected() {
      return this.$store.state.currentAccount !==undefined;
    },
    connectButtonText() {
        if(!isEthereumSupported){
            return 'Please install MetaMask or another wallet'
        } else if (this.isConnected) {
            return 'Connected to ' + this.$store.state.currentAccount.slice(0, 8)
        } else{
            return 'Connect Wallet'
        }
    }, 
    // put this in the store
    isEthereumSupported() {
        return isEthereumSupported
    }
  },
  async beforeMount() {
    this.managerAddress = await raffle.methods.manager().call();
    this.players = await raffle.methods.getAllPlayers().call();
    this.contractBalance = await web3.eth.getBalance(raffle.options.address);
    this.ticketPrice = await raffle.methods.ticketPrice().call();
    this.$store.dispatch('fetchAccounts', web3)
  },
  methods: {
    async getApproval() {
      this.loading = true;
      // TODO toast notification
      // error handling, allow site to use metamask
      try {
        const accounts = await web3.eth.getAccounts();
        const tx = await raffle.methods.enter().send({
          from: accounts[0],
          value: this.ticketPrice,
        });
        console.log("ok", tx);
      } catch {
        console.log("oops");
      } finally {
        this.loading = false;
      }
    },
    async pickWinner() {
      this.loading = true;

      try {
        const accounts = await web3.eth.getAccounts();
        const tx = await raffle.methods.pickWinner().send({
          from: accounts[0],
        });
        console.log("ok", tx);
      } catch {
        // show a differentr message for code 4001 (txn denied)
        // vs a catch-all
        console.log("oops you can't do that");
      } finally {
        this.loading = false;
      }
    },
    async connectWallet() {
      await web3.eth.requestAccounts();
    },
  },
};
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>