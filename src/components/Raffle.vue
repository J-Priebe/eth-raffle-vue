<template>
<div>
    <button @click="connectWallet" :disabled="isConnected || !isWalletInstalled">
        {{connectButtonText}}
    </button>

    <h1> Raffle </h1>
    <table class="raffle-table">
        <tr>
            <th>Manager:</th>
            <td>{{managerAddress}}</td>
        </tr>
        <tr>
            <th>Players:</th>
            <td>{{players.length}} players, {{totalTickets}} tickets total</td>
        </tr>
        <tr>
            <th>Current Prize Pool</th>
            <td>{{contractBalanceEther}} ETH</td>
        </tr>
        <tr>
            <th>Result</th>
            <td>{{resultMsg}}</td>
        </tr>
    </table>

    <div v-if="isConnected">
      <form v-on:submit.prevent="enterRaffle">
          <h3> Enter the raffle? </h3>
          <div>
              <input :disabled="loading" v-model="numTickets" type="number" min="0" label="number of tickets" />
              X {{ticketPriceEther}} = {{totalPriceEther}} ETH
          </div>
          <button :disabled="loading">Enter</button>
      </form>
      <button class="btn" v-show="isManager" @click="drawWinner" :disabled="loading">Pick a Winner (manager only) </button>
    </div>

    <div class="toast" v-if="toastMessage || loading">
      {{loading? 'Processing.. please wait' : toastMessage}}
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
      winnerAddress: undefined,
      toastMessage: '',
    };
  },
  computed: {
    ...mapGetters([
      'currentAccount', 
      'isConnected',
      'isWalletInstalled',
    ]),
    winner() {
      // check for "null" address
      if (this.winnerAddress && this.winnerAddress !== '0x0000000000000000000000000000000000000000'){
        return this.winnerAddress;
      }
      return undefined;
    },
    resultMsg() {
      if (!this.winner) {
        return 'Winner has not yet been drawn.';
      } else if (this.winner === this.currentAccount) {
        return 'Congratulations! You won!'
      }
      return `Account ${this.winner.slice(0, 8)}*** won the draw.`
    },
    totalTickets() {
      return this.players.reduce((acc, currentVal) => acc + Number(currentVal.numTickets), 0)
    },
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
          return 'Connected to ' + this.currentAccount.slice(0, 6) + '***'
        } else{
          return 'Connect Wallet'
        }
    }, 
    isManager(){
      return this.currentAccount === this.managerAddress;
    }
  },
  async beforeMount() {
    await this.fetchAccounts(web3);
    await this.fetchContractData();
  },
  methods: {
    ...mapActions([
      'fetchAccounts',
    ]),
    async fetchContractData() {
      this.contractBalance = await web3.eth.getBalance(raffle.options.address);
      this.managerAddress = await raffle.methods.manager().call();
      this.ticketPrice = await raffle.methods.ticketPrice().call();
      this.winnerAddress = await raffle.methods.lastWinner().call();

      const tickets = await raffle.methods.getAllPlayerTicketCounts().call();
      const players = await raffle.methods.getAllPlayerAddresses().call();
      tickets.forEach((t, i)=>{
        this.players.push({
          address:players[i],
          numTickets: t
        })
      });
    },
    async resetContract() {
      // no need to fetch anything except the winner
      this.contractBalance = '0';
      this.winnerAddress = await raffle.methods.lastWinner().call();
      this.players = [];
    },
    async enterRaffle() {
      this.loading = true;
      try {
        await raffle.methods.enter().send({
          from: this.currentAccount,
          value: this.ticketPrice * this.numTickets,
        });
        this.players.push({
          address: this.currentAccount,
          numTickets: this.numTickets
        })
        this.contractBalance = `${this.ticketPrice * this.numTickets + Number(this.contractBalance)}`
        this.toastMessage = `Sucessfully entered ${this.numTickets} tickets!`
      } catch {
        this.toastMessage = 'An error has occurred. Please try again.'
      } finally {
        this.loading = false;
      }
    },
    async drawWinner() {
      this.loading = true;

      try {
        await raffle.methods.drawWinner().send({
          from: this.currentAccount,
        });
        // update the winner
        await this.resetContract();
      } catch {
        this.toastMessage = 'An error has occurred. Please try again.'
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
  margin: 20px;
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
th {
  text-align: left;
}
td {
  text-align: right;
}
button {
  margin: 5px;
}
.toast {
  margin: 15px;
}
</style>