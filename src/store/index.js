import Vue from "vue";
import Vuex from "vuex";
import _ from "lodash";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        initDataFinished: false,
        symbolMap: null,
        stockList: null,
        indexList: null,
        favoriteList: null
    },
    getters: {
        queryCodeBySymbol: state => symbol => {
            if (_.isEmpty(symbol) && symbol.length !== 6) return [];
            return state.symbolMap.get(symbol);
        },
        queryInfoByCode: state => code => {
            if (_.isEmpty(code)) return null;
            // console.log(
            //     `${code}, %o, %o, %o, %o`,
            //     state.stockList,
            //     state.indexList,
            //     state.stockList && state.stockList.get(code),
            //     state.indexList && state.indexList.get(code)
            // );
            return (
                (state.stockList && state.stockList.get(code)) ||
                (state.indexList && state.indexList.get(code))
            );
        },
        // 通过输入字符串过滤查询符合的股票代码列表
        queryCodes: state => query => {
            // 使用字符串查询是否有匹配的代码
            if (_.isEmpty(query)) return state.favoriteList;
            let codes = [];
            for (let code of state.stockList.keys()) {
                if (code.match(query)) {
                    let tmp = state.stockList.get(code);
                    codes.push({ value: code, name: tmp.name, stock: tmp });
                }
            }
            for (let code of state.indexList.keys()) {
                if (code.match(query)) {
                    let tmp = state.indexList.get(code);
                    codes.push({ value: code, name: tmp.name, stock: tmp });
                }
            }
            for (let stock of state.stockList.values()) {
                if (stock.name.match(query)) {
                    codes.push({
                        value: stock.ts_code,
                        name: stock.name,
                        stock
                    });
                }
            }
            for (let fav of state.favoriteList) {
                if (fav.ts_code.match(query)) continue;
                codes.push(fav);
            }
            return codes;
        }
    },
    mutations: {
        setInitDataFinished(state) {
            console.log(`初始化完成！`);
            state.initDataFinished = true;
        },
        setStockList(state, data) {
            console.log(`setStockList`);
            state.stockList = data;
        },
        setIndexList(state, data) {
            console.log(`setIndexList`);
            state.indexList = data;
        },
        setSymbols(state, data) {
            console.log(`setSymbols`);
            state.symbolMap = data;
        },
        setFavorites(state, data) {
            state.favoriteList = data;
        }
    },
    actions: {
        setListData({ commit }, data) {
            // 这里需要从原始的数组，准备symbol map和两个队列信息
            commit("setInitDataFinished");

            if (!data) return;
            let tmpSymbolMap = new Map();
            let tmpStockMap = new Map();
            let tmpIndexMap = new Map();
            if (data.stock && data.stock.length > 0) {
                for (let i = 0; i < data.stock.length - 1; i++) {
                    let tmp = data.stock[i];
                    let symbol = tmp.symbol;
                    let tsCode = tmp.ts_code;
                    if (tmpSymbolMap.has(symbol)) {
                        if (Array.isArray(tmpSymbolMap.get(symbol))) {
                            tmpSymbolMap.get(symbol).push(tsCode);
                        } else {
                            tmpSymbolMap.set(symbol, [
                                tmpSymbolMap.get(symbol),
                                tsCode
                            ]);
                        }
                    } else {
                        tmpSymbolMap.set(symbol, tsCode);
                    }

                    tmpStockMap.set(tsCode, tmp);
                }
            }
            commit("setStockList", tmpStockMap);

            if (data.index && data.index.length > 0) {
                for (let i = 0; i < data.index.length - 1; i++) {
                    let tmp = data.index[i];
                    //let symbol = tmp.symbol;
                    let tsCode = tmp.ts_code;
                    let symbol = tsCode.substring(0, 6);
                    if (tmpSymbolMap.has(symbol)) {
                        if (Array.isArray(tmpSymbolMap.get(symbol))) {
                            tmpSymbolMap.get(symbol).push(tsCode);
                        } else {
                            tmpSymbolMap.set(symbol, [
                                tmpSymbolMap[symbol],
                                tsCode
                            ]);
                        }
                    } else {
                        tmpSymbolMap.set(symbol, tsCode);
                    }

                    tmpIndexMap.set(tsCode, tmp);
                }
            }
            commit("setIndexList", tmpIndexMap);
            commit("setSymbols", tmpSymbolMap);

            commit("setFavorites", data.favorites);
            tmpIndexMap = null;
            tmpStockMap = null;
            tmpSymbolMap = null;
        }
    },
    modules: {}
});
