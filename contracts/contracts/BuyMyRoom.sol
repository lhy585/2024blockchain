// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment the line to use openzeppelin/ERC721,ERC20
// You can use this dependency directly because it has been installed by TA already
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./MyERC20.sol";
contract BuyMyRoom is ERC721{

    // use a event if you want
    // to represent time you can choose block.timestamp
    event HouseListed(uint256 tokenId, uint256 price, address owner);
    MyERC20 public myERC20; // 彩票相关的代币合约

    
    // maybe you need a struct to store car information
    struct House {
        uint256 id;
        address owner;
        uint256 listedTimestamp;
        uint256 price;
        // ...
    }
    address public manager;

    // 合约构造函数，在合约部署时初始化管理者
    constructor() ERC721("HNFT", "HT") {
        manager = msg.sender; // 将合约创建者设为管理者
        myERC20 = new MyERC20("ZJUToken", "ZJUTokenSymbol");
        for(uint256 i=0;i<10;i++){
            houses[i]=(House({id:i,owner:manager,listedTimestamp:block.timestamp,price:100}));
        }
    }
    function Airdrop() payable public {
        myERC20.airdrop(msg.sender);
    }
    // 返回管理者地址的公共方法
    function getManager() public view returns (address) {
        return manager;
    }
    mapping(uint256 => House) public houses; // A map from house-index to its information
    // ...
    // TODO add any variables and functions if you want
    function getHouses() public view returns (House[] memory) {
        House[] memory houseList = new House[](10);
        for (uint256 i = 0; i < 10; i++) {
            houseList[i] = houses[i];
        }
        return houseList;
    }

    function setOnSale(uint256 id,uint256 price) public{
        houses[id].price=price;
        houses[id].listedTimestamp=block.timestamp;
    }

    function buyHouse(uint256 i)public{
        if(myERC20.balanceOf(msg.sender)<houses[i].price){
            require(1==2);
            return;
        }
        else{
            uint256 money=houses[i].price*(uint256(block.timestamp)-houses[i].listedTimestamp)/10000;
            if(money>houses[i].price/2)
                money=houses[i].price/2;
            myERC20.trans(msg.sender, manager,money);
            myERC20.trans(msg.sender, houses[i].owner,houses[i].price-money);
        }
        houses[i].price=0;
        houses[i].owner=msg.sender;
    }

    function helloworld() pure external returns(string memory) {
        return "hello world";
    }

    // ...
    // TODO add any logic if you want
}