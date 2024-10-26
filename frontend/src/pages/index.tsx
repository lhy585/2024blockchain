import {useEffect, useState} from 'react';
import {Button, Image} from 'antd';
import './index.css';
import {houseContract,myERC20Contract,web3} from "../utils/contracts";
import { Address } from 'web3';
import { isAddress } from 'ethers';
import { listenerCount } from 'process';
import Item from 'antd/es/list/Item';


const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'

interface House {
    id: number;
    owner: string;
    listedTimestamp: number;
    price: number;
}

const HomePage = () => {
    const [account, setAccount] = useState('');
    const [accountBalance, setAccountBalance] = useState(0)
    const [houseList, setHouseList] = useState<House[]>([]);
    const [myHouses, setMyHouses] = useState<number[]>([]);
    const [saleHouses, setsaleHouses] = useState<number[]>([]);
    const [managerAccount, setManagerAccount] = useState('');
    const [newPrice,setnewPrice]=useState<number[]>([])
    const [showDetails, setshowDetails] = useState<boolean[]>(() => {
        // 从 localStorage 中读取初始值
        const savedDetails = localStorage.getItem('showDetails');
        return savedDetails ? JSON.parse(savedDetails) : []; // 如果存在，则解析并返回；否则返回空数组
    });

    useEffect(() => {
        // 初始化检查用户是否已经连接钱包
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        const initCheckAccounts = async () => {
            // @ts-ignore
            const {ethereum} = window;
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                // 尝试获取连接的用户账户
                const accounts = await web3.eth.getAccounts()
                if(accounts && accounts.length) {
                    setAccount(accounts[0])
                }
            }
        }
        
        initCheckAccounts()
    }, [account])

    useEffect(() => {
        const getHouseContractInfo = async () => {
            if (houseContract) {
                try {
                    const ma = await houseContract.methods.getManager().call();
                    setManagerAccount(ma);
                    console.log("Manager account:", ma); // 输出manager地址，帮助调试
                } catch (error) {
                    console.error("Error fetching manager:", error);
                    alert('Failed to fetch manager account. Please check the contract and try again.');
                }
            } else {
                alert('Contract does not exist.');
            }
        };
    
        getHouseContractInfo();
    }, [houseContract]); // 确保在houseContract变化时也能调用
    
    useEffect(() => {
        const getAccountInfo = async () => {
            if (myERC20Contract) {
                try {
                    const ab = await myERC20Contract.methods.balanceOf(account).call();
                    setAccountBalance(ab);
                    console.log("Account balance:", accountBalance); // 输出账户余额，帮助调试
                } catch (error) {
                    console.error("Error fetching balance:", error);
                    alert('Failed to fetch account balance. Please check the contract and try again.');
                }
            } else {
                alert('Contract does not exist.');
            }
        };
    
        if (account !== '') {
            getAccountInfo();
        }
    }, [account, myERC20Contract]); // 确保在myERC20Contract变化时也能调用

    useEffect(() => {
        const fetchHouses = async () => {
            const houses=await houseContract.methods.getHouses().call();
            const houses3 = houses.map((element:any) => ({
                id: element.id,
                owner: element.owner,
                listedTimestamp: element.listedTimestamp,
                price: element.price
            }));
            setHouseList(houses3);
        };

        fetchHouses()
    }, [account]); // 空依赖数组意味着只在组件挂载时运行一次

    useEffect(() => {
        const fetchmyhouses = async () => {
            const houses1:number[] = [];
            const houses2:number[] = [];
            for(let i=0;i<houseList.length;i++){
            if(houseList[i].owner==account){
                houses1.push(i);
            }
            else if(houseList[i].price>0){
                houses2.push(i);
            }
            }
            setMyHouses(houses1);
            setsaleHouses(houses2);
            console.log("houselist in fetchmyhouse: ",houseList)
            console.log("myhouselist in fetchmyhouse: ",myHouses)
            console.log("salehouselist in fetchmyhouse: ",saleHouses)
        }

        fetchmyhouses();
    },[houseList,account])

    const onClickConnectWallet = async () => {
            // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
            // @ts-ignore
        const {ethereum} = window;
        if (!Boolean(ethereum && ethereum.isMetaMask)) {
            alert('MetaMask is not installed!');
            return
        }

        try {
            console.log("小狐狸"+ethereum.chainId !== GanacheTestChainId)
            // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
            if (ethereum.chainId !== GanacheTestChainId) {
                const chain = {
                    chainId: GanacheTestChainId, // Chain-ID
                    chainName: GanacheTestChainName, // Chain-Name
                    rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
                    nativeCurrency: null
                };
                
                try {
                    // 尝试切换到本地网络
                    await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: chain.chainId}]})
                } catch (switchError: any) {
                    // 如果本地网络没有添加到Metamask中，添加该网络
                    if (switchError.code === 4902) {
                        await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain]
                        });
                    }
                    else{
                        alert("network fail")
                    }
                }
            }
            // 小狐狸成功切换网络了，接下来让小狐狸请求用户的授权
            await ethereum.request({method: 'eth_requestAccounts'});
            // // 获取小狐狸拿到的授权用户列表
            const accounts = await ethereum.request({method: 'eth_accounts'});
            // // 如果用户存在，展示其account，否则显示错误信息
            setAccount(accounts[0] || 'Not able to get accounts');
        } catch (error: any) {
            alert(error.message)
        }
    }

    const onClaimTokenAirdrop = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (myERC20Contract) {
            try {
                await houseContract.methods.Airdrop().send({
                    from: account,
                })
                alert('You have claimed ZJU Token.')
            } catch (error: any) {
                alert(error.message)
            }

        } else {
            alert('Contract not exists.')
        }
    }

    const changeTimeform= (timestamp:number) =>{

        // 创建 Date 对象
        const date = new Date(Number(timestamp)*1000);

        // 格式化日期和时间
        const formattedDate = date.toLocaleString();
        return formattedDate;
    }

    const buyHouse = async (i:number) => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (houseContract && myERC20Contract) {
            try {
                // 当前用户调用投注操作
                console.log(i)
                await houseContract.methods.buyHouse(i).send({
                    from: account
                })

                alert('You have bought the house.')
            } catch (error: any) {
                console.log(error)
                alert('you do not have enough money or other errors')
            }
        } else {
            alert('Contract not exists.')
        }
        window.location.reload();
    }

    const handlePriceChange = (i:number,value:number) => {
        // 更新状态以保存用户输入的价格
        // 这里可以调用 setState 更新房屋列表的状态
        // 例如: setHouseList(prev => {
        //    const newList = [...prev];
        //    newList[index].inputPrice = value; // 假设你想在房屋对象中存储输入的价格
        //    return newList;
        // });
        let a=newPrice;
        a[i]=value;
        setnewPrice(a);
    };

    const sellHouse = async (i:number) => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (houseContract && myERC20Contract) {
            try {
                // 当前用户调用投注操作
                console.log(i)
                if(newPrice[i]<=0){
                    alert("the price should not be less or equal to zero!");
                }
                else{
                    await houseContract.methods.setOnSale(i,newPrice[i]).send({
                        from: account
                    })
                    alert('You have set the house on sale.')
                }
                
                handlePriceChange(i,0);
                
            } catch (error: any) {
                console.log(error)
            }
        } else {
            alert('Contract not exists.')
        }
        window.location.reload();
    }

    const ShowDetails = async (i:number) => {
        let a=showDetails;
        a[i]=true;
        setshowDetails(a);
        localStorage.setItem('showDetails', JSON.stringify(showDetails));
        window.location.reload();
    }
    const HideDetails = async (i:number) => {
        let a=showDetails;
        a[i]=false;
        setshowDetails(a);
        localStorage.setItem('showDetails', JSON.stringify(showDetails));
        window.location.reload();
    }
    return (
        <div>
            <h1>房屋出售系统</h1>
            <Button onClick={onClickConnectWallet}>连接钱包</Button>
            <h2>当前地址</h2>
            {account}
            <h3>存款</h3>
            <div>{accountBalance.toString()}</div>
            <Button onClick={onClaimTokenAirdrop}>领取浙大币空投</Button>
            <h2>我的房屋</h2>
            <ul>共有{myHouses.length}个房子
                {myHouses.map((i) => (
                    <li key={houseList[i].id}>
                        <img src={`/house${houseList[i].id}.jpeg`} style={{ width: '300px', height: 'auto' }}/> <br />
                        房屋ID: {houseList[i].id.toString()}<br />
                        是否正在出售：{houseList[i].price==0?'否':'是'}<br />
                        <input
                            type="number"
                            placeholder="输入出售价格"
                            onChange={(e) => handlePriceChange(i,Number(e.target.value))}
                            style={{visibility:houseList[i].price==0 ? 'visible' : 'hidden'}}
                        />
                        <Button style={{width: '200px', visibility:houseList[i].price==0 ? 'visible' : 'hidden'}} onClick={() => sellHouse(i)}>出售</Button>
                    </li>
                ))}
            </ul>
            <h2>出售中的房屋</h2>
            <ul>共有{saleHouses.length}个房子（不算当前账户正在出售的）
                {saleHouses.map((i) => (
                    <li key={houseList[i].id}>
                        <img src={`/house${houseList[i].id}.jpeg`} style={{ width: '300px', height: 'auto' }}/> <br />
                        房屋ID: {houseList[i].id.toString()}<br />
                        售价: {houseList[i].price.toString()} <br />
                        { showDetails[houseList[i].id]&& 
                        <div>
                         所有者: {houseList[i].owner.toString()} <br />
                        上架时间：{changeTimeform(houseList[i].listedTimestamp)} <br /> 
                        </div>
                        }
                        <Button style={{width: '200px'}} onClick={() => buyHouse(i)}>购买</Button>
                        <Button style={{width: '200px'}} onClick={() => ShowDetails(i)}>查看详情</Button>
                        <Button style={{width: '200px'}} onClick={() => HideDetails(i)}>隐藏详情</Button>
                        <br />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default HomePage