pragma solidity ^0.4.23;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract StarNotary is ERC721 { 

    struct Star { 
        string name;
        string story;
        Coordinators coordinators;
    }

    struct Coordinators {
        string dec;
        string mag;
        string cent;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    mapping (bytes32 => bool) private _existingStars;


    function createStar(string _name, string _story, string _dec, string _mag, string _cent, uint256 _tokenId) public { 
        
        require(!checkIfStarExist(_dec, _mag, _cent), "This Star is already exists!");
        
        Coordinators memory newCoordinators = Coordinators(_dec, _mag, _cent);
        Star memory newStar = Star(_name, _story, newCoordinators);

        tokenIdToStarInfo[_tokenId] = newStar;
        _existingStars[generateStarHash(_dec, _mag, _cent)] = true;

        _mint(msg.sender, _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender);

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0);
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost);

        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }

    function checkIfStarExist(string dec, string mag, string cent) public view returns(bool) {
        return _existingStars[generateStarHash(dec, mag, cent)];
    }

    function generateStarHash(string dec, string mag, string cent) private pure returns(bytes32) {
        return keccak256(abi.encodePacked(dec, mag, cent));
    }

    function tokenIdToStarInfo(uint256 tokenId) public view returns(string, string, string, string, string) {
        return (tokenIdToStarInfo[tokenId].name, tokenIdToStarInfo[tokenId].story, tokenIdToStarInfo[tokenId].coordinators.dec, tokenIdToStarInfo[tokenId].coordinators.mag, tokenIdToStarInfo[tokenId].coordinators.cent);
    }
   
}