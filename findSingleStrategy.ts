import axios from 'axios';
import {getReportsForStrategy} from './reports';
const Web3 = require('web3');
const commaNumber = require('comma-number');
const request = require('request');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const environment = process.env.ENVIRONMENT;
const tgChat = process.env.TELEGRAM_CHANNEL_ID;
const tgBot = process.env.HARVEST_COLLECTOR_BOT;
const mins = process.env.MINUTES;
let currentTime = Date.now();
let minutes = parseInt(mins);
let timeCheckPoint = currentTime - (1000*60*minutes + 5000);
let strategiesHelperAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/strategieshelper.json')));
let vaultAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2vault.json')));
let strategyAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2strategy.json')));
let tokenAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/token.json')));

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_NODE));

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
    strategist?: string;
    tokenSymbol?: string;
    transactionTo?: string;
    keeperTriggered?: boolean;
    multisigTriggered?: boolean;
    strategistTriggered?: boolean;
}

function getStrategyName(address){
    return new Promise((resolve) => {
        let strategy = new web3.eth.Contract(strategyAbi, address);
        strategy.methods.name().call().then(name =>{
            resolve(name);
        })
    })
}

function getStrategist(address){
    return new Promise((resolve) => {
        let strategy = new web3.eth.Contract(strategyAbi, address);
        strategy.methods.strategist().call().then(strategist =>{
            resolve(strategist);
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

function getTokenAddress(address){
    return new Promise((resolve) => {
        let strategy = new web3.eth.Contract(strategyAbi, address);
        strategy.methods.want().call().then(tokenAddress =>{
            resolve(tokenAddress);
        })
    })
}

function getTokenSymbol(address){
    return new Promise((resolve) => {
        let token = new web3.eth.Contract(tokenAbi, address);
        token.methods.symbol().call().then(symbol =>{
            resolve(symbol);
        })
    })
}

function getTransactionTo(txhash){
    return new Promise((resolve) => {
        web3.eth.getTransaction(txhash).then((tx)=>{
            resolve(tx.to);
        })
    })
}

function getReports(addr){
    return new Promise((resolve) => {
        let txns = [];
        getReportsForStrategy(addr).then((reports) => {
            for(let i=0;i<reports.length;i++){
                if(parseInt(reports[i].timestamp) > 0){// timeCheckPoint){//Date.now()){
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

function formatTelegram(d: Harvest){
    let byIndicator = "";
    if(d.multisigTriggered){
        byIndicator = "✍ ";
    }
    else if(d.strategistTriggered){
        byIndicator = "🧠 ";
    }
    else if(d.keeperTriggered){
        byIndicator = "🤖 ";
    }
    let message = "";
    let harvestEmoji = "👨‍🌾"
    //message += harvestEmoji;
    message += byIndicator;
    message += ` [${d.vaultName}](https://etherscan.io/address/${d.vaultAddress})  --  [${d.strategyName}](https://etherscan.io/address/${d.strategyAddress})\n\n`;
    message += "📅 " + new Date(d.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }) + "UTC\n\n";
    let netProft = d.profit - d.loss;
    let precision = 4;
    message += `💰 Net profit: ${commaNumber(netProft.toFixed(precision))} ${d.tokenSymbol}\n\n`;
    message += `🔗 [View on Etherscan](https://etherscan.io/tx/${d.transactionHash})`;

    d.transactionHash
    return message;
}

function checkIsKeeper(to){
    let knownAddresses = [
        "0x0a61c2146A7800bdC278833F21EBf56Cd660EE2a",// stealth relayer
        "0xeE15010105b9BB564CFDfdc5cee676485092AEDd",// CrvStrategyKeep3rJob2
        "0x736D7e3c5a6CB2CE3B764300140ABF476F6CFCCF" // V2 Keeper
    ];
    return knownAddresses.includes(to);
}

function checkIsMultisig(to){
    let knownAddresses = [
        "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52",// governance
        "0x16388463d60FFE0661Cf7F1f31a7D658aC790ff7",// strategist
    ];
    return knownAddresses.includes(to);
}

async function getStrategies(strats: string[]){
    let results: Harvest[] = [];
    for(let idx=0;idx<strats.length;idx++){
        let s = strats[idx];
        let reports: any = await getReports(s);
        let strategyName;
        if(reports.length > 0){
            strategyName = await getStrategyName(s);
            let strategist = await getStrategist(s);
            let vaultAddress = await getVaultAddress(s);
            let vaultName = await getVaultName(vaultAddress);
            let decimals: any = await getVaultDecimals(vaultAddress);
            let tokenAddress = await getTokenAddress(s);
            let tokenSymbol = await getTokenSymbol(tokenAddress);
            let result: Harvest = {};
            for(let i=0;i<reports.length;i++){
                result.profit = (parseInt(reports[i].results.currentReport.totalGain) - parseInt(reports[i].results.previousReport.totalGain))/10**decimals;
                result.loss = (parseInt(reports[i].results.currentReport.totalLoss) - parseInt(reports[i].results.previousReport.totalLoss))/10**decimals;
                result.timestamp = new Date(parseInt(reports[i].results.currentReport.timestamp));
                result.strategyAddress = s;
                result.strategyName = strategyName;
                result.vaultAddress = String(vaultAddress);
                result.vaultName = String(vaultName);
                result.decimals = parseInt(decimals);
                result.tokenSymbol = String(tokenSymbol);
                result.transactionHash = reports[i].transactionHash;
                result.strategist = String(strategist);
                let to = await getTransactionTo(result.transactionHash);
                result.transactionTo = String(to);
                result.keeperTriggered = checkIsKeeper(String(to));
                result.multisigTriggered = checkIsMultisig(String(to));
                result.strategistTriggered = s == String(to);
                results.push(result);
                let message = formatTelegram(result);
                console.log(message)
            }
        }
    }
}





let strategyId = "0x2923a58c1831205c854dbea001809b194fdb3fa5";
getStrategies([strategyId]);

