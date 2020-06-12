import { provide, inject } from "@vue/composition-api";

// 数据key
const StoreSymbol = Symbol();

export function provideStore(store) {
    provide(StoreSymbol, store);
}

export function useStore() {
    const store = inject(StoreSymbol);
    if (!store) {
        console.error("没有读取到store对象！！！");
    }
    return store;
}
