/**
 * @file app.js
 * @author huangzongzhe
 * @description
 * 启动时，初始化aelf示例。减少后续开销。
 */
/* global Proxy */
/* eslint-disable fecs-camelcase */

const AElf = require('aelf-sdk');
// address: 65dDNxzcd35jESiidFXN5JV8Z7pCwaFnepuYQToNefSgqk9
const defaultPrivateKey = 'bdb3b39ef4cd18c2697a920eb6d9e8c3cf1a930570beb37d04fb52400092c42b';
var wallet = AElf.wallet.getWalletByPrivateKey(defaultPrivateKey);

module.exports = app => {
    if (app.config.aelf.app && !app.aelf) {
        app.aelf = {
            AElf,
            wallet,
            instances: {},
            contractInstances: {},
            initInstance: null,
            initContractInstance: null
        };
        const aelfEgg = new AElfEgg(app.aelf, app.config.aelf);

        if (app.config.aelf.metaSource) {
            app.curl(app.config.aelf.metaSource, {
                dataType: 'json'
            }).then(result => {
                if (result.data.list) {
                    aelfEgg.createAelf(result.data.list);
                }
                else {
                    throw Error(JSON.stringify(result.res));
                }
            });
        }
    }
};

class AElfEgg {
    constructor(aelf, config) {
        this.config = JSON.parse(JSON.stringify(config));
        this.httpProvider = this.config.httpProvider;
        this.aelf = aelf;
        this.aelf.initInstance = this.initInstance.bind(this);
        this.aelf.initContractInstance = this.initContractInstance.bind(this);
    }

    initInstance(url) {
        let httpProvider = Array.from(this.httpProvider);
        httpProvider[0] = httpProvider[0] || url.includes('/chain') ? url : url + '/chain';
        const aelf = new AElf(new AElf.providers.HttpProvider(...httpProvider));
        this.aelf.instances[httpProvider[0]] = aelf;
    }

    // {
    //     contract_address: '3AhZRe8RvTiZUBdcqCsv37K46bMU2L2hH81JF8jKAnAUup9',
    //     chain_id: 'AELF',
    //     api_ip: 'http://localhost:7101',
    //     api_domain: 'http://localhost:7101',
    //     rpc_ip: 'http://192.168.197.56:8000',
    //     rpc_domain: 'http://192.168.197.56:8000',
    //     token_name: 'ELF',
    //     owner: 'hzz780',
    //     status: 1,
    //     create_time: '2019-03-12T10:54:44.000Z'
    // }
    initContractInstance(apiInfo) {
        let aelfInstances = this.aelf.instances;
        let aelfContractInstances = this.aelf.contractInstances;

        return new Promise((resolve, reject) => {
            const {
                contract_address,
                chain_id,
                rpc_ip,
                rpc_domain
            } = apiInfo;

            let urlTemp = rpc_ip || rpc_domain;
            let httpProvider = Array.from(this.httpProvider);
            httpProvider[0] = httpProvider[0] || urlTemp.includes('/chain') ? urlTemp : urlTemp + '/chain';

            const aelf = new AElf(new AElf.providers.HttpProvider(...httpProvider));
            aelfInstances[httpProvider[0]] = aelf;
            aelf.chain.contractAtAsync(contract_address, wallet, (err, contract) => {
                // TODO: production:ust writy log, but not throw Error.
                if (err) {
                    reject(err);
                    // throw Error('Initlize token contract Failed');
                }
                else {
                    aelfContractInstances[contract_address + chain_id] = contract;
                    resolve(contract);
                }
            });
        });
    }

    // const rpcApiList = [{
    //     contract_address: '3AhZRe8RvTiZUBdcqCsv37K46bMU2L2hH81JF8jKAnAUup9',
    //     chain_id: 'AELF',
    //     api_ip: 'http://localhost:7101',
    //     api_domain: 'http://localhost:7101',
    //     rpc_ip: 'http://192.168.197.56:8000',
    //     rpc_domain: 'http://192.168.197.56:8000',
    //     token_name: 'ELF',
    //     owner: 'hzz780',
    //     status: 1,
    //     create_time: '2019-03-12T10:54:44.000Z'
    // }];
    createAelf(rpcApiList) {
        // let aelfInstances = new Proxy({}, {
        //     get: function (target, property) {
        //         if (target[property] === undefined) {
        //             target[property] = setValue();
        //             return target[property];
        //         }
        //     }
        // });
        // Proxy重载的是 . 操作符
        // 用Proxy后，没法用aelfInstances[key]拿到想要得功能了。
        // let aelfInstances = this.aelf.instances;

        let requestCount = 0;
        const requestFlow = (apiInfoList, max = 20) => {
            if (apiInfoList instanceof Array) {
                for (let i = 0, length = apiInfoList.length; i < length; i++) {
                    if (apiInfoList[i]) {
                        if (requestCount < max) {
                            const apiInfo = JSON.parse(JSON.stringify(apiInfoList[i]));
                            initTokenContract({
                                apiInfo,
                                apiInfoList,
                                max
                            });
                            apiInfoList[i] = null;
                        }
                        requestCount++;
                    }
                }
            }
            else {
                throw Error('egg-aelf: get wrong list, list is not Array' + JSON.stringify(apiInfoList));
            }
        };

        const initTokenContract = inputOptions => {
            const {
                apiInfo,
                apiInfoList,
                max
            } = inputOptions;
            this.initContractInstance(apiInfo).then(result => {
                requestCount--;
                requestFlow(apiInfoList, max);
            }).catch(error => {
                console.log('init error', error, apiInfo);
            });
        };

        requestFlow(rpcApiList, this.config.initRequestLimit);
    }
}
