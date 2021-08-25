const Web3 = require('web3');

module.exports = () => {
    //const web3 = new Web3(new Web3.providers.HttpProvider(process.env.GETH_NODE));
    const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_NODE));
    return web3;
}
