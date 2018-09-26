/* ===== level ===============================
|  Configuration of the levelDB              |
|  ===========================================*/

const level = require('level');
const sessionDB = './sessiondata';
const db = level(sessionDB, { valueEncoding: 'json' });

class LevelDB {

    // Add data to levelDB with key/value pair
    addLevelDBData(address, value) {
        return new Promise((resolve, reject) => {
            db.put(address, value, (err) => {
                if (err) reject(err);
                db.get(address, (err, value) => {
                    if (err) reject(err);
                    resolve(value);
                })
            })
        });
    }

    // Get data from levelDB with key
    getLevelDBData(address) {
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(value);
                }
            });
        });
    }

    remove(address) {
        db.del(address);
    }
}

const bitcoinMessage = require('bitcoinjs-message');

/* ===== StatusSignature Class ====================
|  Class with a constructor for status signature  |
|  ===============================================*/
class StatusSignature {
    constructor(address) {
        this.address = address,
        this.requestTimeStamp = Date.now(),
        this.message = `${this.address}:${this.requestTimeStamp}:starRegistry`,
        this.validationWindow,
        this.messageSignature;
    }
}

/* ===== RegisterStar Class =======================
|  Class with a constructor for status star 	  |
|  ===============================================*/
class RegisterStar {
    constructor(registerStatus, status) {
        this.registerStar = registerStatus,
        this.status = status;
    }
}

class SessionValidation {

    constructor() {
        this.levelDB = new LevelDB();
    }

    resquestValidation(address) {
        return this.levelDB.getLevelDBData(address).then(value => {
            value.validationWindow = this.getValidationWindow(value.requestTimeStamp);
            if (value.validationWindow < 0)
                return this.addAddressToSession(address);
            return value;
        }).catch(e => {
            if (e.type === 'NotFoundError')  
                return this.addAddressToSession(address);
            throw new Error(e);
        })
    }

    getValidationWindow(resquestTimeStamp) {
        return Math.floor((resquestTimeStamp + (5 * 60 * 1000) - Date.now()) / 1000);
    }

    addAddressToSession(address) {
        let statusSignature = new StatusSignature(address);
        statusSignature.validationWindow = this.getValidationWindow(statusSignature.requestTimeStamp);
        return this.levelDB.addLevelDBData(address, statusSignature).then(value => value);
    }

    isValidAddress(address) {
        return this.levelDB.getLevelDBData(address).then(value => {
            value.validationWindow = this.getValidationWindow(value.requestTimeStamp);
            if (value.validationWindow >= 0 && value.messageSignature === 'valid') {
                return true;
            }
            return false;
        }).catch(() => false);
    }

    validate(payload) {
        let verified = false;
        return this.levelDB.getLevelDBData(payload.address).then(value => {
            value.validationWindow = this.getValidationWindow(value.requestTimeStamp);
            if (value.validationWindow < 0) {
                value.validationWindow = 0
                value.messageSignature = 'expired'
                return new RegisterStar(verified, value);
            }
                        
            try {
                verified = bitcoinMessage.verify(value.message, payload.address, payload.signature);
            } catch (e) {
                verified = false;
            }
            
            value.messageSignature = verified ? 'valid' : 'invalid';
            return this.levelDB.addLevelDBData(payload.address, value).then(value => {
                return new RegisterStar(verified, value);
            });
           
        }).catch(() => {
            throw new Error('Address not found.');
        })
    }

    remove(address) {
        this.levelDB.remove(address);
    }

}

module.exports = { SessionValidation }