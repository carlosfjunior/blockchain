# Private Blockchain
Udacity Blockchain Nanodegree 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

NodeJS, installers are available at https://nodejs.org.

### Installing

Run:
```
$ npm install
```
## Running the tests
Run:
```
$ npm start
```
This starts the API server, listening on port 8000 of localhost.

## Endpoints

### GET /block/{height}
GET request with url path http://localhost:8000/block/{BLOCK_HEIGHT} .

Example: Block Height 0
```
http://localhost:8000/block/0
```
Response output:
```
{"hash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3","height":0,"body":"First block in the chain - Genesis block","time":"1530311457","previousBlockHash":""}
```
### POST /block
POST request with url path http://localhost:8000/block with body payload option.

Example: POST request for a new block
```
POST URL path: http://localhost:8000/block
Content-Type: application/json
Request body: {"body":"block body contents"}
```
Response output:
```
{"hash":"9327355aa9523e3e41ffc8b9cdb566591b259fd5ed017a16450c22f4b6a2c258","height":2,"body":"block body contents","time":"1531787866","previousBlockHash":"ffaffeb2330a12397acc069791323783ef1a1c8aab17ccf2d6788cdab0360b90"}
```
## Built With

* [Hapi](https://hapijs.com/) -  Web application framework
