/* ===== level ===============================
|  Configuration of the levelDB              |
|  ===========================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB, { valueEncoding: 'json' });

class LevelDB {

    // Get data length from levelDB 
    getLength() {
        return new Promise(resolve => {
            let blocks = [];
            db.createReadStream()
                .on('data', (data) => {
                    blocks.push(data);
                })
                .on('close', () => {
                    resolve(blocks.length);
                });
        });
    }

    // Add data to levelDB with key/value pair
    addLevelDBData(key, value) {
        db.put(key, value, (err) => {
            if (err) return console.log('Block ' + key + ' submission failed', err);
        })
    }

    // Get data from levelDB with key
    getLevelDBData(key) {
        return new Promise((resolve, reject) => {
            db.get(key, (error, value) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(value);
                }
            })
        });
    }

    // Add data to levelDB with value
    addDataToLevelDB(value) {
        let i = 0;
        db.createReadStream().on('data', (data) => {
            i++;
        }).on('error', (err) => {
            return console.log('Unable to read data stream!', err)
        }).on('close', () => {
            console.log('Block #' + i);
            console.log('Value:' + value);
            db.put(i, value, (err) => {
                if (err) return console.log('Block ' + i + ' submission failed', err);
            })
        });
    }

}

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
    constructor(data) {
        this.hash = "",
            this.height = 0,
            this.body = data,
            this.time = 0,
            this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
    constructor() {
        this.levelDB = new LevelDB();
        // get current height 
        this.levelDB.getLength().then((value) => {
            // only the first block is create in the constructor
            if (!value) this.addBlock(new Block("First block in the . - Genesis block"));
        });
    }

    // Add new block
    addBlock(newBlock) {
        this.levelDB.getLength()
            .then(length => {
                new Promise(resolve => {
                    // Block height
                    newBlock.height = length;
                    if (length > 0) {
                        this.getBlock(length - 1)
                            .then(block => {
                                // Previous block hash
                                newBlock.previousBlockHash = block.hash;
                                resolve();
                            });
                    } else {
                        resolve();
                    }
                }).then(_ => {
                    // UTC timestamp
                    newBlock.time = new Date().getTime().toString().slice(0, -3);
                    // Block hash with SHA256 using newBlock and converting to a string
                    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                    // Adding block object to chain
                    this.levelDB.addDataToLevelDB(JSON.stringify(newBlock));
                })
            });
    }

    // Get block height
    getBlockHeight() {
        return this.levelDB.getLength()
            .then(length => {
                return length - 1;
            }).catch(error => {
                throw new Error(error);
            });
    }

    // Get block with height
    getBlock(blockHeight) {
        // return object Block
        return this.levelDB.getLevelDBData(blockHeight).then(value => {
            return JSON.parse(value);
        }).catch(error => {
            throw new Error(error);
        });

    }

    // Validate block
    validateBlock(blockHeight) {
        // get block object
        return this.getBlock(blockHeight).then(block => {
            // get block hash
            let blockHash = block.hash;
            // remove block hash to test block integrity
            block.hash = '';
            // generate block hash
            let validBlockHash = SHA256(JSON.stringify(block)).toString();
            // compare
            if (blockHash === validBlockHash) {
                return true;
            } else {
                console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
                return false;
            }
        })
    }

    // Validate blockchain
    validateChain() {
        this.levelDB.getLength().then(length => {
            // Create a async method to keep the interation syncronous
            return new Promise(async resolve => {
                let errorLog = [];
                for (let i = 0; i < length; i++) {
                    // Keep the interation syncronous in this point
                    await Promise.all([
                        // Validate the current block
                        this.validateBlock(i),
                        // Get the current block
                        this.getBlock(i),
                    ]).then(results => {
                        // If result validate was false push block heigth in error log
                        if (!results[0]) errorLog.push(i);
                        // get the next block
                        this.getBlock(i + 1).then(block => {
                            // when return the next block, validate with your previous block hash
                            let blockHash = results[1].hash;
                            let previousHash = block.previousBlockHash;
                            if (blockHash !== previousHash) {
                                errorLog.push(i + 1);
                            }
                        }).catch(e => {
                            // Don't have next block
                        });                       
                    })
                }
                resolve(errorLog);
            })
        }).then(errorLog => {
            // Print log on console
            if (errorLog.length > 0) {
                console.log('Block errors = ' + errorLog.length);
                console.log('Blocks: ' + errorLog);
            } else {
                console.log('No errors detected');
            }
        })
    }
}

module.exports = Blockchain