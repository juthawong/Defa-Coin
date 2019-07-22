# Defa-Coin
Simple Cryptocurrency Blockchain Demo using  Node.js

This Application is a Demo of Basic Cryptocurrency using Block Chain.

![Defa Coin Finder](https://i.imgur.com/19YBd0O.png)

[Image Hosting By Imgur.com](https://imgur.com)

## How To Use 
### Installation

Clone or Download ZIP File

```shell
npm install
```

To Run This Apllication with Default Parameter which is Run on Localhost Port 1991

```bash
npm start
```

Or To Run This Application Multiple Time in The Same Computer - For Testing , Debugging or Development Purpose

```posh
node dev/node.js (port-number) (currentnode-url such as http://localhost:1991)
```

### Using The Blockchain

In order for each node to communicate to each other, 

This Demo is Only Server based and doesn't provide each Graphical User Interface on every single action

## Register Node

You must register the node via Node URL/registernode ( http://localhost:1991/registernode) with POST Method using JSON 
```javascript
{
'newNodeUrl' : 'https://your-node-url:1991'
}
```

## Send Currency Money

You must register the node via Node URL/transaction ( http://localhost:1991/transaction) with POST Method using JSON 

This Create Transaction inside Genesis Block and Broadcast To Other Node in Blockchain.

```javascript
{
                    'amount': 'DefaCoinAmount',
                    'sender': 'yourAddress',
                    'recipient': 'receipientAddress'
}
```

## Begin Mining

Send POST Method To Node URL/mine ( http://localhost:1991/mine ). Mining Server will get 2 Defa Coin For Each Mining


## Consensus

Send Post Method To Node URL/consensus( http://localhost:1991/consensus ).

