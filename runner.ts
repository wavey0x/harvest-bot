import axios from 'axios';
import {getReportsForStrategy} from './reports';
const Web3 = require('web3');
const commaNumber = require('comma-number');
const _ = require('lodash');
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
let oneDayAgo = currentTime - (1000*60*60*24 + 5000);
let strategiesHelperAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/strategieshelper.json')));
let vaultAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2vault.json')));
let strategyAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2strategy.json')));
let tokenAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/token.json')));
let oracleAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/oracle.json')));
let helper_address = "0x5b4F3BE554a88Bd0f8d8769B9260be865ba03B4a"
let discordSecret = process.env.DISCORD_SECRET;
let discordUrl = `https://discord.com/api/webhooks/${discordSecret}`;
const yvboostStrategy: string = "0x2923a58c1831205c854dbea001809b194fdb3fa5";

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_NODE));


let helper = new web3.eth.Contract(strategiesHelperAbi, helper_address);

interface Harvest {
    transactionHash?: string;
    profit?: number;
    loss?: number;
    netProfit?: number;
    usdValue?: number;
    timestamp?: Date;
    rawTimestamp?: number;
    vaultAddress?: string;
    vaultName?: string;
    strategyAddress?: string;
    strategyName?: string;
    decimals?: number;
    strategist?: string;
    tokenSymbol?: string;
    transactionTo?: string;
    keeperTriggered?: boolean;
    multisigTriggered?: boolean;
    strategistTriggered?: boolean;
    txnCost?: number
}

interface TxnDetails {
    to?: string;
    transactionCost?: number;
}

function getStrategyName(address){
    return new Promise((resolve) => {
        let strategy = new web3.eth.Contract(strategyAbi, address);
        strategy.methods.name().call().then(name =>{
            resolve(name);
        })
    })
}

function getOraclePrice(token){
    return new Promise<number>((resolve) => {
        let oracle = new web3.eth.Contract(oracleAbi, "0x83d95e0D5f402511dB06817Aff3f9eA88224B030");
        oracle.methods.getPriceUsdcRecommended(token).call().then(price =>{
            resolve(price / 10**6);
        })
    })
}

function getWethPrice(){
    let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    return new Promise<number>((resolve) => {
        let oracle = new web3.eth.Contract(oracleAbi, "0x83d95e0D5f402511dB06817Aff3f9eA88224B030");
        oracle.methods.getPriceUsdcRecommended(weth).call().then(price =>{
            resolve(price / 10**6);
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

function getTransactionReceipt(txhash){
    return new Promise<number>((resolve) => {
        web3.eth.getTransactionReceipt(txhash).then((tx)=>{
            //console.log(tx.logs)
            resolve(tx.gasUsed);
        })
    })
}

function getTransactionTo(txhash){
    return new Promise<TxnDetails>((resolve) => {
        web3.eth.getTransaction(txhash).then((tx)=>{
            getTransactionReceipt(txhash).then(gasUsed =>{
                let txnCost = tx.gasPrice * gasUsed;
                let payload: TxnDetails = {
                    to: tx.to,
                    transactionCost: txnCost
                }
                resolve(payload);
            })            
        })
    })
}

function getReports(addr){
    return new Promise((resolve) => {
        let txns = [];
        getReportsForStrategy(addr).then((reports) => {
            for(let i=0;i<reports.length;i++){
                if(parseInt(reports[i].timestamp) > timeCheckPoint){//Date.now()){
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

function getReportsPastDay(addr){
    return new Promise((resolve) => {
        let txns = [];
        getReportsForStrategy(addr).then((reports) => {
            for(let i=0;i<reports.length;i++){
                if(parseInt(reports[i].timestamp) > oneDayAgo){//Date.now()){
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

function getAllStrategies() {
    return new Promise<string[]>((resolve) => {
        helper.methods.assetsStrategiesAddresses().call().then(strats =>{
            let strategies: string[] = [];
            for(let i=0;i<strats.length; i++){
                strategies.push(strats[i])
            }
            if(!strategies.includes(yvboostStrategy)){
                strategies.push(yvboostStrategy);
            }
            resolve(strategies as string[]);
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
    message += "📅 " + new Date(d.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }) + " UTC\n\n";
    let netProfit = d.profit - d.loss;
    let precision = 4;
    message += `💰 Net profit: ${commaNumber(netProfit.toFixed(precision))} ${d.tokenSymbol} ($${commaNumber(d.usdValue.toFixed(2))})\n\n`;
    message += `💸 Transaction Cost: $${commaNumber(d.txnCost.toFixed(2))}\n\n`; // ($${commaNumber(d.usdValue.toFixed(2))})\n\n`;
    message += `🔗 [View on Etherscan](https://etherscan.io/tx/${d.transactionHash})`;

    d.transactionHash
    return message;
}

function formatDiscord(d: Harvest){
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
    message += "📅 " + new Date(d.timestamp).toLocaleString('en-US', { timeZone: 'UTC' }) + " UTC\n\n";
    let netProft = d.profit - d.loss;
    let precision = 4;
    message += `💰 Net profit: ${commaNumber(netProft.toFixed(precision))} ${d.tokenSymbol} ($${commaNumber(d.usdValue.toFixed(2))})\n\n`;
    message += `💸 Transaction Cost: $${commaNumber(d.txnCost.toFixed(2))}\n\n`;
    message += `🔗 [View on Etherscan](https://etherscan.io/tx/${d.transactionHash})`;

    d.transactionHash
    return message;
}

function checkIsKeeper(to){
    let knownAddresses = [
        "0x0a61c2146A7800bdC278833F21EBf56Cd660EE2a", // stealth relayer
        "0xeE15010105b9BB564CFDfdc5cee676485092AEDd", // CrvStrategyKeep3rJob2
        "0x736D7e3c5a6CB2CE3B764300140ABF476F6CFCCF", // V2 Keeper
        "0xCC268041259904bB6ae2c84F9Db2D976BCEB43E5", // Block protection manual script
        "0x2C01B4AD51a67E2d8F02208F54dF9aC4c0B778B6"  // yMech multisig
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

async function getStrategies(){
    let results: Harvest[] = [];
    let strats: string[] = await getAllStrategies();
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
            let oraclePrice: number = await getOraclePrice(tokenAddress);
            for(let i=0;i<reports.length;i++){
                let result: Harvest = {};
                result.profit = (parseInt(reports[i].results.currentReport.totalGain) - parseInt(reports[i].results.previousReport.totalGain))/10**decimals;
                result.loss = (parseInt(reports[i].results.currentReport.totalLoss) - parseInt(reports[i].results.previousReport.totalLoss))/10**decimals;
                result.netProfit = result.profit - result.loss;
                result.usdValue = oraclePrice * result.netProfit;
                result.rawTimestamp = reports[i].results.currentReport.timestamp;
                result.timestamp = new Date(parseInt(reports[i].results.currentReport.timestamp));
                result.strategyAddress = s;
                result.strategyName = strategyName;
                result.vaultAddress = String(vaultAddress);
                result.vaultName = String(vaultName);
                result.decimals = parseInt(decimals);
                result.tokenSymbol = String(tokenSymbol);
                result.transactionHash = reports[i].transactionHash;
                result.strategist = String(strategist);
                let txnDetails: TxnDetails = await getTransactionTo(result.transactionHash);
                let to = txnDetails.to;
                let wethPrice = await getWethPrice();
                result.txnCost = (txnDetails.transactionCost / 1e18) * wethPrice;
                result.transactionTo = String(to);
                result.keeperTriggered = checkIsKeeper(String(to));
                result.multisigTriggered = checkIsMultisig(String(to));
                result.strategistTriggered = s == String(to);
                results.push(result);
            }
        }
    }
    console.log(strats.length+" strategies found. "+results.length+" new harvests found in last "+minutes+" minutes since previous run.")
    if(results.length>0){
        // Sort results by oldest to newist
        results = _.sortBy(results, ['rawTimestamp', 'transactionHash']);
        for(let i=0;i<results.length;i++){
            let result = results[i];
            // Send to telegram
            let messageTelegram = formatTelegram(result);
            let messageDiscord = formatDiscord(result);
            if(environment=="PROD"){
                let encoded_message = encodeURIComponent(messageTelegram);
                let url = `https://api.telegram.org/${tgBot}/sendMessage?chat_id=${tgChat}&text=${encoded_message}&parse_mode=markdown&disable_web_page_preview=true`
                const res = await axios.post(url);
                let params = {
                    content: "",
                    embeds: [{
                        "title":"New harvest",
                        "description": messageDiscord
                    }]
                }
                const resp = await axios.post(discordUrl,params);
            }
            else{
                console.log(messageTelegram)
            }

        }
    }
    
    return strats;
}

async function dailyReport(){
    let results: Harvest[] = [];
    let strats: string[] = await getAllStrategies();
    let totalFeesUsd = 0;
    let totalProfitsUsd = 0;
    let strategiesHarvested = 0;
    for(let idx=0;idx<strats.length;idx++){
        let s = strats[idx];
        let reports: any = await getReportsPastDay(s);
        let strategyName;    
        if(reports.length > 0){
            strategyName = await getStrategyName(s);
            let strategist = await getStrategist(s);
            let vaultAddress = await getVaultAddress(s);
            let vaultName = await getVaultName(vaultAddress);
            let decimals: any = await getVaultDecimals(vaultAddress);
            let tokenAddress = await getTokenAddress(s);
            let tokenSymbol = await getTokenSymbol(tokenAddress);
            let oraclePrice: number = await getOraclePrice(tokenAddress);
            for(let i=0;i<reports.length;i++){
                let result: Harvest = {};
                strategiesHarvested++;
                result.profit = (parseInt(reports[i].results.currentReport.totalGain) - parseInt(reports[i].results.previousReport.totalGain))/10**decimals;
                result.loss = (parseInt(reports[i].results.currentReport.totalLoss) - parseInt(reports[i].results.previousReport.totalLoss))/10**decimals;
                result.netProfit = result.profit - result.loss;
                result.usdValue = oraclePrice * result.netProfit;
                totalProfitsUsd += result.usdValue;
                result.rawTimestamp = reports[i].results.currentReport.timestamp;
                result.timestamp = new Date(parseInt(reports[i].results.currentReport.timestamp));
                result.strategyAddress = s;
                result.strategyName = strategyName;
                result.vaultAddress = String(vaultAddress);
                result.vaultName = String(vaultName);
                result.decimals = parseInt(decimals);
                result.tokenSymbol = String(tokenSymbol);
                result.transactionHash = reports[i].transactionHash;
                result.strategist = String(strategist);
                let txnDetails: TxnDetails = await getTransactionTo(result.transactionHash);
                let to = txnDetails.to;
                let wethPrice = await getWethPrice();
                result.txnCost = (txnDetails.transactionCost / 1e18) * wethPrice;
                totalFeesUsd += result.txnCost;
                result.transactionTo = String(to);
                result.keeperTriggered = checkIsKeeper(String(to));
                result.multisigTriggered = checkIsMultisig(String(to));
                result.strategistTriggered = s == String(to);
                results.push(result);
            }
        }
    }
    console.log("-----")
    console.log("TOTAL FEES USD",totalFeesUsd)
    console.log("TOTAL PROFITS USD",totalProfitsUsd)
    let d = new Date();
    d.setHours(d.getHours()-15)
    let dateString = d.
        toLocaleString('en-us', {year: 'numeric', month: '2-digit', day: '2-digit'}).
        replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
    let message = `-- Daily report: ${dateString} --\n\n`;
    message += `💰 $${commaNumber(totalProfitsUsd.toFixed(2))} Profit harvested: \n\n`
    message += `👨‍🌾 ${strategiesHarvested} Strategies harvested\n\n`
    message += `💸 $${commaNumber(totalFeesUsd.toFixed(2))} in transaction fees`
    if(environment=="PROD"){
        console.log(message)
        let encoded_message = encodeURIComponent(message);
        let url = `https://api.telegram.org/${tgBot}/sendMessage?chat_id=${tgChat}&text=${encoded_message}&parse_mode=markdown&disable_web_page_preview=true`
        const res = await axios.post(url);
        let params = {
            content: "",
            embeds: [{
                "title":"New harvest",
                "description": message
            }]
        }
        const resp = await axios.post(discordUrl,params);
    }
    else{
        console.log(message)
    }
}

getStrategies();
let d = new Date();
console.log(d.getHours(), d.getMinutes())
if(environment=="PROD"){
    if(d.getHours() == 0 && d.getMinutes() < 15){
        dailyReport()
    }
}
else{
    dailyReport()
}
