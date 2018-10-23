const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => { 

    const name = 'Star power 103!'
    const story = 'I love my wonderful star'
    const dec = 'ra_032.155'
    const mag = 'dec_121.874'
    const cent = 'mag_245.978'

    let defaultAccount = accounts[0]
    let user1 = accounts[1]
    let user2 = accounts[2]
    let operator = accounts[3]

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: defaultAccount})
    })
    
    describe('can create a star', () => { 
        let tokenId = 1

        it('can create a star and get its name', async function () { 
            await this.contract.createStar(name, story, dec, mag, cent, tokenId, {from: defaultAccount})
            assert.deepEqual(await this.contract.tokenIdToStarInfo(tokenId), [name, story, dec, mag, cent])
        })
    })

    describe('buying and selling stars', () => {         
        let starId = 1
        let starPrice = web3.toWei(.01, "ether")
        let tx

        beforeEach(async function () { 
            tx = await this.contract.createStar(name, story, dec, mag, cent, starId, {from: user1})    
        })

        it('user1 can put up their star for sale', async function () { 
            assert.equal(await this.contract.ownerOf(starId), user1)
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            assert.equal(await this.contract.starsForSale(starId), starPrice)
        })

        describe('user2 can buy a star that was put up for sale', () => { 
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it', async function() { 
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            it('user2 ether balance changed correctly', async function () { 
                let overpaidAmount = web3.toWei(.05, 'ether')
                const balanceBeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0})
                const balanceAfterTransaction = web3.eth.getBalance(user2)
                assert.equal(balanceBeforeTransaction.sub(balanceAfterTransaction), starPrice)
            })

            it('emits the correct event during creation of a new star', async function () { 
                assert.equal(tx.logs[0].event, 'Transfer')
            })
        })
    })

    describe('check if star exists', () => {
        let tokenId = 1

        it('star already exists', async function () {
            await this.contract.createStar(name, story, dec, mag, cent, tokenId, {from: defaultAccount})
            assert.equal(await this.contract.checkIfStarExist(dec, mag, cent), true)
        })
    })

    describe('can transfer star', () => { 
        let tokenId = 1
        let tx 

        beforeEach(async function () { 
            await this.contract.createStar(name, story, dec, mag, cent, tokenId, {from: user1})
            tx = await this.contract.safeTransferFrom(user1, user2, tokenId, {from: user1})
        })

        it('star has new owner', async function () { 
            assert.equal(await this.contract.ownerOf(tokenId), user2)
        })

        it('emits the correct event', async function () { 
            assert.equal(tx.logs[0].event, 'Transfer')
            assert.equal(tx.logs[0].args.tokenId, tokenId)
            assert.equal(tx.logs[0].args.to, user2)
            assert.equal(tx.logs[0].args.from, user1)
        })

        it('only permissioned users can transfer star', async function() { 
            let randomPersonTryingToStealTokens = accounts[4]
            await expectThrow(this.contract.safeTransferFrom(user1, randomPersonTryingToStealTokens, tokenId, {from: randomPersonTryingToStealTokens}))
        })
    })

    describe('can grant approval to transfer', () => { 
        let tokenId = 1
        let tx 

        beforeEach(async function () { 
            await this.contract.createStar(name, story, dec, mag, cent, tokenId, {from: user1})
            tx = await this.contract.approve(user2, tokenId, {from: user1})
        })

        it('set user2 as an approved address', async function () { 
            assert.equal(await this.contract.getApproved(tokenId), user2)
        })

        it('user2 can now transfer', async function () { 
            await this.contract.transferFrom(user1, user2, tokenId, {from: user2})

            assert.equal(await this.contract.ownerOf(tokenId), user2)
        })

        it('emits the correct event', async function () { 
            assert.equal(tx.logs[0].event, 'Approval')
        })
    })

    describe('can set an operator', () => { 
        let tokenId = 1
        let tx 

        beforeEach(async function () { 
            await this.contract.createStar(name, story, dec, mag, cent, tokenId, {from: user1})
            tx = await this.contract.setApprovalForAll(operator, true, {from: user1})
        })

        it('can set an operator', async function () { 
            assert.equal(await this.contract.isApprovedForAll(user1, operator), true)
        })

        it('emits the correct event', async function () { 
            assert.equal(tx.logs[0].event, 'ApprovalForAll')
        })
    })
})

var expectThrow = async function(promise) { 
    try { 
        await promise
    } catch (error) { 
        assert.exists(error)
        return
    }

    assert.fail('Expected an error but didnt see one!')
}