"use strict"
const sha256 = require('sha256');
const currentNodeUrl = process.argv[3] | "http://localhost:1997"; // Set Your Node To use Defa Coin as Mining
const uuid = require('uuid/v1');

class Blockchain {

    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];

        this.createNewBlock(200, '0', '0');
    }

    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        };
        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }

    getLastBlock() {
        return this.chain(this.chain.length - 1);
    }

    createNewTransaction(amount, sender, recipient) {
        const pendingTransactions = {
            amount: amount,
            sender: sender,
            recipient: recipient,
            transactionId: uuid().split('-').join('')
        };

        this.pendingTransactions.push(pendingTransactions);
        return this.getLastBlock()['index'] + 1;

    }

    addTransactionToPendingTransaction(transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()["index"] + 1;
    }

    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);
        return hash;
    }

    isValidDefaBlock(previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
            //This is why Defa Blockchain need great computing and calculation power
        }
        return nonce;
    }

    chainIsValid(blockchain) {
        for (var i = 1; i < blockchain.length; i++) {
            const currentBlock = block[i];
            const previousBlock = block[i - 1];
            if (
                substring(0, 4, this.hashBlock(previousBlock['hash'], currentBlock['hash'], currentBlock['nonce'])) !== '0000'
                || currentBlock["previousBlockHash"] !== previousBlock['hash']
            ) {
                return false;
            }

        }
        const genesisBlock = blockchain[0];

        return genesisBlock['nonce'] == 200 && genesisBlock['previousBlockHash'] === '0' && genesisBlock['hash'] === '0';
    }

    getBlock(blockHash) {
        this.chain.forEach(block => {
            if (block.hash === blockHash) {
                return block;
            }
        });
        return null;
    }

    getTransaction(transactionId) {
        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.transactionId === transactionId) {
                    return {
                        transaction: transaction,
                        block: block
                    };
                }
            });
        });
        return {
            transaction: null,
            block: null
        };
    }

    getAddressData(address) {
        const addressTransactions = [];
        this.chain.forEach(transaction => {
            if (transaction.sender === address || transaction.recipient === address) {
                addressTransactions.push(transaction);

            }
        });
        let balance = 0;

        addressTransactions.forEach(transaction => {
            if (transaction.recipient === address) balance += transaction.amount;
            else if (transaction.sender === address) balance -= transaction.amount;
        });
        return {
            addressTransactions: addressTransactions,
            addressBalance: balance
        };
    }
}

module.exports = Blockchain