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
        <ol v-for="(player, i) in players" :key="player.address + i">
            <li>{{player.address}} ({{player.numTickets}} tickets)</li>
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
    <button v-show="isManager" @click="pickWinner" :disabled="loading">Pick a Winner (manager only) </button>
    </div>
</div>
</template>

<script>
import raffle from "../contracts/raffle";
import {web3} from "../web3"; 
import { mapActions, mapGetters } from 'vuex'

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
    ...mapGetters([
      'currentAccount', 
      'isConnected',
      'isWalletInstalled',
    ]),
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
    connectButtonText() {
      if(!this.isWalletInstalled){
        return 'Please install MetaMask or another wallet'
        } else if (this.isConnected) {
          return 'Connected to ' + this.currentAccount.slice(0, 8)
        } else{
          return 'Connect Wallet'
        }
    }, 
    isManager(){
      return this.currentAccount === this.managerAddress;
    }
  },
  async beforeMount() {
    this.managerAddress = await raffle.methods.manager().call();
    
    const tickets = await raffle.methods.getAllPlayerTicketCounts().call();
    const players = await raffle.methods.getAllPlayerAddresses().call();
    tickets.forEach((t, i)=>{
      this.players.push({
        address:players[i],
        numTickets: t
      })
    });

    this.contractBalance = await web3.eth.getBalance(raffle.options.address);
    this.ticketPrice = await raffle.methods.ticketPrice().call();
    this.fetchAccounts(web3)
  },
  methods: {
    ...mapActions([
      'fetchAccounts',
    ]),
    async getApproval() {
      this.loading = true;
      // TODO toast notification
      // error handling, allow site to use metamask
      try {
        const accounts = await web3.eth.getAccounts();
        const tx = await raffle.methods.enter().send({
          from: accounts[0],
          value: this.ticketPrice * this.numTickets,
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