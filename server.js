'use strict';

const Hapi=require('hapi');
const Blockchain=require('./simpleChain')

const blockchain = new Blockchain();

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Add the route
server.route({
    method:'GET',
    path:'/block/{height}',
    handler:function(request, h) {
        return new Promise(resolve => {
            blockchain.getBlock(encodeURIComponent(request.params.height)).then(value => {
                resolve(h.response(value));
            }).catch(error => {
                resolve({message: error.message});
            });
        })
    }
});

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