'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const simpleChain = require('./simpleChain');
const blockchain = new simpleChain.Blockchain();

const validation = require('./validation');
const sessionValidation = new validation.SessionValidation();

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000
});

// GET Block endpoint using URL path with block height parameter.
server.route({
    method: 'GET',
    path: '/block/{height}',
    handler: function (request, h) {
        return new Promise(resolve => {
            blockchain.getBlock(encodeURIComponent(request.params.height)).then(value => {
                value.body.star.storyDecoded = Buffer.from(value.body.star.story, 'hex').toString('utf8');
                resolve(h.response(value));
            }).catch(error => {
                resolve({ message: error.message });
            });
        })
    }
});

// GET Block endpoint using URL path with hash parameter.
server.route({
    method: 'GET',
    path: '/stars/hash:{hash}',
    handler: function (request, h) {
        return new Promise(resolve => {
            blockchain.getBlockByHash(encodeURIComponent(request.params.hash)).then(value => {
                value.body.star.storyDecoded = Buffer.from(value.body.star.story, 'hex').toString('utf8');
                resolve(h.response(value));
            }).catch(error => {
                resolve({ message: error.message });
            });
        })
    }
});

// GET Block endpoint using URL path with address parameter.
server.route({
    method: 'GET',
    path: '/stars/address:{address}',
    handler: function (request, h) {
        return new Promise(resolve => {
            blockchain.getBlockByAddress(encodeURIComponent(request.params.address)).then(value => {
                value.forEach(element => {
                    element.body.star.storyDecoded = Buffer.from(element.body.star.story, 'hex').toString('utf8');
                });
                resolve(h.response(value));
            }).catch(error => {
                resolve({ message: error.message });
            });
        })
    }
});

// POST endpoint for registration block star.
server.route({
    method: 'POST',
    path: '/block',
    handler: function (request, h) {
        return new Promise(resolve => {
            sessionValidation.isValidAddress(request.payload.address).then(value => {
                if (value) {
                    request.payload.star.story = Buffer.from(request.payload.star.story, 'utf8').toString('hex');
                    blockchain.addBlock(new simpleChain.Block(request.payload)).then(value => {
                        sessionValidation.remove(request.payload.address);
                        resolve(h.response(value));
                    }).catch(error => {
                        resolve({ message: error.message });
                    });
                } else {
                    resolve({ message: 'Address invalid or expired' });
                }
            });
        })
    },
    options: {
        validate: {
            payload: Joi.object({
                address: Joi.string().required(),
                star: Joi.object({
                    ra: Joi.string().required(),
                    dec: Joi.string().required(),
                    mag: Joi.string().optional(),
                    cen: Joi.string().optional(),
                    story: Joi.string().regex(/^[\x00-\x7F]+$/).max(500).required()
                })
            })
        }
    }
});

// POST endpoint to validate signature.
server.route({
    method: 'POST',
    path: '/message-signature/validate',
    handler: function (request, h) {
        return new Promise(resolve => {
            sessionValidation.validate(request.payload).then(value => {
                resolve(h.response(value));
            }).catch(error => {
                resolve({ message: error.message });
            });
        })
    },
    options: {
        validate: {
            payload: Joi.object({
                address: Joi.string().required(),
                signature: Joi.string().required()
            })
        }
    }
})

// POST endpoint to validate user request.
server.route({
    method: 'POST',
    path: '/requestValidation',
    handler: function (request, h) {
        return new Promise(resolve => {
            sessionValidation.resquestValidation(request.payload.address).then(value => {
                resolve(h.response(value));
            }).catch(error => {
                resolve({ message: error.message });
            });
        })
    },
    options: {
        validate: {
            payload: Joi.object({
                address: Joi.string().required()
            })
        }
    }
})

// Start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();