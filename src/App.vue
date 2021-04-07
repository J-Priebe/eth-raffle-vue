<template>
  <div id="app">
    <Raffle />
  </div>
</template>

<script>
import Raffle from "./components/Raffle.vue";

export default {
  name: "App",
  components: {
    Raffle,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
