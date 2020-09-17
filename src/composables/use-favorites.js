/**
 * 用于管理自选股的添加，删除，自选股保存在store中，通过当前选择和查看的股票来进行自选股的添加/删除
 * @param {*} store
 * @param {*} tsCode
 */
// import { computed } from "@vue/composition-api";
// import { ipcRenderer } from "electron";
// import _ from "lodash";
// import { utils } from "@wt/lib-stock";

export default function useFavorite(store, tsCode) {
    // const isFavorite = computed(() => {
    //     return store.getters.isFavorite(tsCode.value);
    // });

    const addFavorite = () => {
        console.log(`添加自选：${tsCode.value}`);
        store.dispatch("addFavorite", tsCode.value);
    };

    const removeFavorite = () => {
        console.log(`删除自选：${tsCode.value}`);
        store.dispatch("removeFavorite", tsCode.value);
    };

    return {
        // isFavorite,
        addFavorite,
        removeFavorite
    };
}
