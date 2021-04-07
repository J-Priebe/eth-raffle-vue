<template>
<div>
    <button @click="connectWallet" :disabled="isConnected || !isWalletInstalled">
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
import web3 from "../web3";

// TODO: callbacks (e.g., refresh the # players, etc), 
// add raffle, lastWinner to contract, disconnect event, loading icons

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
      connectedAccounts: [],
      thing: null,
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
    isWalletInstalled() {
      return typeof window.ethereum !== "undefined";
    },
    isConnected() {
      return this.connectedAccounts.length > 0;
    },
    connectButtonText() {
        if(!this.isWalletInstalled){
            return 'Please install MetaMask'
        } else if (this.isConnected) {
            return 'Connected to ' + this.connectedAccounts[0].slice(0, 8)
        } else{
            return 'Connect Wallet'
        }
    }
  },
  async beforeMount() {
    this.managerAddress = await raffle.methods.manager().call();
    this.players = await raffle.methods.getAllPlayers().call();
    this.contractBalance = await web3.eth.getBalance(raffle.options.address);
    this.ticketPrice = await raffle.methods.ticketPrice().call();

    await this.refreshAccounts();
  },
  methods: {
    async refreshAccounts() {
      this.connectedAccounts = await web3.eth.getAccounts();
    },
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
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await this.refreshAccounts();
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