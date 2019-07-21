const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const defacoin = new Blockchain();
const uuid = require('uuid/v1');
const rp = require('request-promise');
const port = process.argv[2] | 1991;
const thisNode = uuid().split('-').join('');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.sendFile('./blockexplorer/index.html', { root: __dirname });
});

app.get('/blockchain', function (req, res) {
    res.send(defacoin);
});

app.post('/transaction', function (req, res) {
    const newTransaction = req.body;
    const blockindex = defacoin.addTransactionToPendingTransaction(newTransaction);

    res.json({ note: `Transaction will be added in block ${blockindex}.` })
});

app.post('/transaction/broadcast', function (req, res) {
    const newTransaction = defacoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    defacoin.addTransactionToPendingTransaction(newTransaction);
    const requestPromises = [];
    defacoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));

    });
    Promise.all(requestPromises).then(data => {
        res.json({ note: "Transaction created and broadcast successfully" });
    });
});

app.post('/mine', function (req, res) {
    const lastBlock = defacoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: defacoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    const nonce = defacoin.isValidDefaBlock(previousBlockHash, currentBlockData);
    const defahash = defacoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    const newBlock = defacoin.createNewBlock(nonce, previousBlockHash, defahash);
    const requestPromises = [];
    defacoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receivenewblock',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        }
        requestPromises.push(rp(requestOptions));
        Promise.all(requestPromises).then(data => {
            //Give 2  Defa Coin For Miner as Reward
            const requestOptions = {
                uri: defacoint.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 2,
                    sender: "00",
                    recipient: thisNode
                },
                json: true
            }
            return rp(requestOptions);

        }).then(data => {
            res.json({
                note: "New Block mined successfully",
                block: newBlock
            });
        });

    });
    res.json({ note: "New Block mined successfully", block: newBlock });
});
app.post('/receivenewblock', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = defacoin.getLastBlock();
    if (lastBlock.hash === newBlock.previousBlockHash && lastBlock['index'] + 1 === newBlock['index']) {
        // This Block is Come After and Legitimate
        defacoin.chain.push(newBlock);
        defacoin.pendingTransactions = [];
        res.json({
            note: 'New Block received and accepted.',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New Block is rejected',
            newBlock: newBlock
        });
    }

});
app.post('/registernode', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (defacoin.networkNodes.indexOf(newNodeUrl) == -1) {
        //If node is not exist yet
        defacoin.networkNodes.push(newNodeUrl);
        res.jsoin({ note: 'New node registered successfully' });
    } else {
        //If node is already exist
        res.json({ note: 'Node already registed with Defa Coin' });
    }
});

app.post('/registernodesbulk', function (req, res) {
    const allNodeUrl = req.body.allNodeUrl;
    allNodeUrl.forEach(networkNodeUrl => {
        if (defacoin.networkNodes.indexOf(networkNodeUrl) == -1) {
            defacoin.networkNodes.push(networkNodeUrl);
        }
        res.jsoin({ note: 'Bulk Node registered successfully' });
    });
});

app.post('/registernodewithbroadcast', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (defacoin.networkNodes.indexOf(newNodeUrl) == -1) {
        // Defa Register New Node If Not Exist

        const requestPromises = [];
        defacoin.networkNodes.push(newNodeUrl);
        defacoin.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + '/registernode',
                method: 'POST',
                body: { newNodeuri: newNodeUrl },
                json: true
            };
            //Broadcast Node To Register Defa Coin Node
            requestPromises.push(rp(requestOptions));
        });
    }

    Promise.all(requestPromises).then(data => {
        //Send All Register Node To New Defa Coin Miner
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/registernodesbulk',
            method: 'POST',
            body: { allNetworkNodes: [...defacoin.allNetworkNodes, defacoin.currentNodeUrl] }
        };
        rp(bulkRegisterOptions);

    }).then(data => {
        res.json({ note: "New node registered with network successfully" });
    });
});

app.get('/consensus', function (req, res) {
    defacoin.networkNodes.forEach(networkNodeUrl => {
        const requestPromises = [];
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };
        requestPromises.push(rp(requestOptions));
        Promise.all(requestPromises).then(blockchains => {
            const currentChainLength = defacoin.chain.length;
            let maxChainLength = currentChainLength;
            let newLongestChain = null;
            let newPendingTransaction = null;
            blockchains.forEach(blockchain => {
                if (blockchain.chain.length > maxChainLength) {
                    maxChainLength = blockchain.chain.length;
                    newLongestChain = blockchain.chain;
                    newPendingTransaction = blockchain.pendingTransactions;
                }
            });
            if (!newLongestchain || (newLongestChain && !defacoin.chainIsValid(newLongestChain))) {
                res.json({
                    note: 'Current chain has not been replaced',
                    chain: defacoin.chain
                });
            } else if (newLongestChain && defacoin.chainIsValid(newLongestChain)) {
                defacoin.chain = newLongestChain;
                defacoin.pendingTransactions = newPendingTransaction;
                res.json({
                    note: 'This chain has been replaced',
                    chain: defacoin.chain
                });
            }
        })
    });
});


app.get('/block/:blockHash', function (req, res) {
    const blockHash = req.params.blockHash;
    res.json({
        block: defacoin.getBlock(blockHash)
    });
});

app.get('/transaction/:transactionId', function (req, res) {
    const transactionId = req.params.transactionId;
    res.json(defacoin.getTransaction(transactionId));

});

app.get('/address/:address', function (req, res) {
    const address = req.params.address;
    const addressData = defacoin.getAddressData(address);
    res.json({
        addressData: addressData
    });
});


app.listen(port, function () {
    console.log('Listening on port ' + port.toString() + '...');
});