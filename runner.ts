import {getReportsForStrategy} from './reports';
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let currentTime = Date.now();
let oneHourAgo = currentTime - (1000*60*60);
let strategiesHelperAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/strategieshelper.json')));
let vaultAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2vault.json')));
let strategyAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2strategy.json')));
let helper_address = "0x5b4F3BE554a88Bd0f8d8769B9260be865ba03B4a"

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.GETH_NODE));

let helper = new web3.eth.Contract(strategiesHelperAbi, helper_address);

interface Harvest {
    profit?: number;
    loss?: number;
    timestamp?: Date;
    vaultAddress?: string;
    vaultName?: string;
    strategyAddress?: string;
    strategyName?: string;
    transactionHash?: string;
    decimals?: number;
}

function getStrategyName(address){
    return new Promise((resolve) => {
        let strategy = new web3.eth.Contract(strategyAbi, address);
        strategy.methods.name().call().then(name =>{
            resolve(name);
        })
    })
}

function getVaultName(address){
    return new Promise((resolve) => {
        let vault = new web3.eth.Contract(vaultAbi, address);
        vault.methods.name().call().then(name =>{
            resolve(name);
        })
    })
}

function getVaultDecimals(address){
    return new Promise((resolve) => {
        let vault = new web3.eth.Contract(vaultAbi, address);
        vault.methods.decimals().call().then(decimals =>{
            resolve(parseInt(decimals));
        })
    })
}

function getVaultAddress(address){
    return new Promise((resolve) => {
        let strategy = new web3.eth.Contract(strategyAbi, address);
        strategy.methods.vault().call().then(vaultAddress =>{
            resolve(vaultAddress);
        })
    })
}

function getReports(addr){
    return new Promise((resolve) => {
        let txns = [];
        getReportsForStrategy(addr).then((reports) => {
            console.log("checking " + addr + "...");
            for(let i=0;i<reports.length;i++){
                if(parseInt(reports[i].timestamp) > oneHourAgo){//Date.now()){
                    // 1629786582
                    // 1627318302000
                    reports[i].strategyAddress = addr;
                    txns.push(reports[i])
                }
            }
            resolve(txns);
        })
    })
}

function getAllStrategies(){
    return new Promise((resolve) => {
        helper.methods.assetsStrategiesAddresses().call().then(strats =>{
            resolve(strats);
        })
    })
}

async function getStrategies(){
    let strats;
    strats = await getAllStrategies();
    for(let idx=0;idx<strats.length;idx++){
        let s = strats[idx];
        let reports: any = await getReports(s);
        let strategyName;
        let results = [];
        if(reports.length > 0){
            strategyName = await getStrategyName(s);
            let vaultAddress = await getVaultAddress(s);
            let vaultName = await getVaultName(vaultAddress);
            let decimals: any = await getVaultDecimals(vaultAddress);
            let result: Harvest = {};
            for(let i=0;i<reports.length;i++){
                console.log(strategyName,s);
                console.log(vaultName,vaultAddress);
                console.log("Transaction Hash:",reports[i].transactionHash);
                result.profit = (parseInt(reports[i].results.currentReport.totalGain) - parseInt(reports[i].results.previousReport.totalGain))/10**decimals;
                result.loss = (parseInt(reports[i].results.currentReport.totalLoss) - parseInt(reports[i].results.previousReport.totalLoss))/10**decimals;
                result.timestamp = new Date(parseInt(reports[i].results.currentReport.timestamp));
                result.strategyAddress = s;
                result.strategyName = strategyName;
                result.vaultAddress = String(vaultAddress);
                result.vaultName = String(vaultName);
                result.decimals = parseInt(decimals);
                result.transactionHash = reports[i].transactionHash;
                console.log(result);
            }
        }
        
    }
    return strats;
}

getStrategies();



let strategyId = "0x2923a58c1831205c854dbea001809b194fdb3fa5";

