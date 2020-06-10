<template>
    <div id="app">
        <router-view />
    </div>
</template>

<script>
export default {
    name: "app",
    components: {}
};
</script>

<style>
.el-container,
.el-main {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
}
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
}
</style>
