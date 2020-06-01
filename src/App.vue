<template>
    <div id="app">
        <div>
            <p>
                If Element is successfully added to this project, you'll see an
                <code v-text="'<el-button>'"></code>
                below
            </p>
            <el-button>el-button</el-button>
        </div>
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
html,
body,
#app,
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
    text-align: center;
    color: #2c3e50;
}
</style>
