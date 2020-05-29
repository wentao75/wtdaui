<template>
    <div id="home">
        <TrendGraph tsCode="000001.SZ" />
    </div>
</template>

<script>
// @ is an alias to /src
import TrendGraph from "@/components/TrendGraph.vue";

export default {
    name: "Home",
    components: {
        TrendGraph
    }
};
</script>

<style>
#home {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
}
</style>
