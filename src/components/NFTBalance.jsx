import React, { useState } from "react";
import { useMoralis, useNFTBalances } from "react-moralis";
import { Card, Image, Tooltip, Modal, Input } from "antd";
import { useERC20Balance } from "hooks/useERC20Balance";
import {useAPIContract} from 'hooks/useAPIContract'
import {useMoralisWeb3Api} from "react-moralis";
import marketplace from "contracts/marketplace.json";
import bive from "contracts/bive.json";
import ERC721 from "contracts/ERC721.json"
import { FileSearchOutlined, SendOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { getExplorer } from "helpers/networks";
import AddressInput from "./AddressInput";


const { Meta } = Card;


const biveAddress = "0x477a4143a0d28922e00c677f89a2347081f4d6d1";
const marketplaceAddress = "0x8417EBB62b71D55fa60e3EF15688754d9e460B46";
const styles = {
  NFTs: {
    display: "flex",
    flexWrap: "wrap",
    WebkitBoxPack: "start",
    justifyContent: "flex-start",
    margin: "0 auto",
    maxWidth: "1000px",
    gap: "10px",
  },
};

function NFTBalance() {
  const { data: NFTBalances } = useNFTBalances();
  const { chainId,walletAddress } = useMoralisDapp();
  const { Moralis } = useMoralis();
  const Web3API = useMoralisWeb3Api();
  const [visible, setVisibility] = useState(false);
  const [receiverToSend, setReceiver] = useState(null);
  const [amountToSend, setAmount] = useState(null);
  const [nftToken, setNftToken] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [biveBalance, setBiveBalance] = useState(null);
  const [offerPrice, setOfferPrice] = useState(null);
  const { fetchERC20Balance } = useERC20Balance();
  
  const listingPriceCall = useAPIContract({
    chain: chainId,
    abi: marketplace.abi,
    address: marketplaceAddress,
    function_name:'listingPrice',
  })
  

  const allowanceCall = useAPIContract({
    chain: chainId,
    abi: bive.abi,
    address: biveAddress,
    function_name:'allowance',
    params:{
      owner: walletAddress,
      spender: marketplaceAddress
    }
  })
  

  async function transfer(nft, amount, receiver) {
    const options = {
      type: nft.contract_type.toLowerCase(),
      tokenId: nft.token_id,
      receiver: receiver,
      contractAddress: nft.token_address,
    };
    console.log(nft);
    if (options.type === "erc1155") {
      options.amount = amount;
    }
    
    setIsPending(true);
    Moralis.transfer(options)
    .then(setIsPending(false))
    .catch(console.err);
    
  }

  const handleTransferClick = (nft) => {
    setNftToken(nft);
    setModalType('transfer')
    setVisibility(true);
  };

  const handleChange = (e) => {
    setAmount(e.target.value);
  };

  const handleOfferPrice = (e)=>{
    e.preventDefault();
    setOfferPrice(e.target.value);
    
  }

  const handleOfferingMarketplace = async (nft) => {
    console.log(nft);
    listingPriceCall.runContractFunction();
    allowanceCall.runContractFunction();
    fetchERC20Balance().then((assets)=>{
      setBiveBalance(assets.find(asset=>asset.token_address===biveAddress));
    })
    setNftToken(nft);
    setModalType('offer');
    setVisibility(true);
  }

  const getERC721Approval = async(nftToken) => {
    const options = {
      chain:chainId,
      abi: ERC721.abi,
      address : nftToken.token_address,
      function_name: 'getApproved',
      params:{
        tokenId: nftToken.token_id
      }
    }
    return await Web3API.native.runContractFunction(options);
  }

  const handleApproveListingPrice = async (nftToken) =>{
    let allowance = allowanceCall?.contractResponse;
    let listingFee = listingPriceCall?.contractResponse;

    
    if(allowance < listingFee) {
      const options = {
        abi: bive.abi,
        contractAddress: biveAddress,
        functionName:'approve',
        params:{
          spender: marketplaceAddress,
          amount: listingFee - allowance
        }
      };
      await Moralis.executeFunction(options)
    }
    let tokenApproved = await getERC721Approval(nftToken);
    if(tokenApproved !== marketplaceAddress){
      let options ={
        abi:  ERC721.abi,
        contractAddress: nftToken.token_address,
        functionName: 'approve',
        params:{
          to: marketplaceAddress,
          tokenId: nftToken.token_id,
        }
      }
      await Moralis.executeFunction(options);
    }
  
    const options = {
      abi:marketplace.abi,
      contractAddress: marketplaceAddress,
      functionName: 'offer',
      params:{
        nftContract: nftToken.token_address,
        tokenId: nftToken.token_id,
        price: Moralis.Units.Token(offerPrice, biveBalance?.decimals)
      }
    }
    const tx = await Moralis.executeFunction(options);
    console.log(tx);
  }

  console.log("nft:" , NFTBalances);
  
  return (
    <>
      <div style={styles.NFTs}>
        {NFTBalances?.result &&
          NFTBalances.result.map((nft, index) => (
            <Card
              hoverable
              actions={[
                <Tooltip title="View On Blockexplorer">
                  <FileSearchOutlined
                    onClick={() => window.open(`${getExplorer(chainId)}address/${nft.token_address}`, "_blank")}
                  />
                </Tooltip>,
                <Tooltip title="Transfer NFT">
                  <SendOutlined onClick={() => handleTransferClick(nft)} />
                </Tooltip>,
                <Tooltip title="Sell On Bizverse Marketplace">
                  <ShoppingCartOutlined onClick={() => handleOfferingMarketplace(nft)} />
                </Tooltip>,
              ]}
              style={{ width: 240, border: "2px solid #e7eaf3" }}
              cover={
                <Image
                  preview={false}
                  src={nft?.image || "error"}
                  fallback="data:image/png;base64,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"
                  alt=""
                  style={{ height: "300px" }}
                />
              }
              key={index}
            >
              <Meta title={nft.name + " " + nft.token_id} description={nft.token_address} />
            </Card>
          ))}
      </div>
      {modalType === 'transfer' ? 
      <Modal
        title={`Transfer ${nftToken?.name || "NFT"}`}
        visible={visible}
        onCancel={() => setVisibility(false)}
        onOk={() => transfer(nftToken, amountToSend, receiverToSend)}
        confirmLoading={isPending}
        okText="Send"
      >
        <AddressInput autoFocus placeholder="Receiver" onChange={setReceiver} />
        {nftToken && nftToken.contract_type === "erc1155" && (
          <Input placeholder="amount to send" onChange={(e) => handleChange(e)} />
        )}
      </Modal> : 
      <Modal
      title={`Offer ${nftToken?.name || "NFT"} for selling`}
      visible={visible}
      onCancel={() => setVisibility(false)}
      onOk={() => handleApproveListingPrice(nftToken)}
      confirmLoading={listingPriceCall.isLoading && allowanceCall.isLoading}
      okText="Offer"
    >
      <div style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: "8px",
        }}
      >
        Listing Fee
        <Image
          src={
            // item.logo ||
            "https://etherscan.io/images/main/empty-token.png"
          }
          alt="nologo"
          width="24px"
          height="24px"
          preview={false}
          style={{ borderRadius: "15px" }}
        />
        {Moralis.Units.FromWei(listingPriceCall?.contractResponse, biveBalance?.decimals).toFixed(6)}
        {biveBalance?.symbol}
        
      </div>
      <div style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: "8px",
        }}>
        You have already approved the marketplace amount of 
        <Image
          src={
            // item.logo ||
            "https://etherscan.io/images/main/empty-token.png"
          }
          alt="nologo"
          width="24px"
          height="24px"
          preview={false}
          style={{ borderRadius: "15px" }}
        />
        {Moralis.Units.FromWei(allowanceCall?.contractResponse, biveBalance?.decimals).toFixed(6)}
        {biveBalance?.symbol}
      </div>
      <p><strong>You need to approve enough {biveBalance?.symbol} to the marketplace for listing fee</strong></p>

      <div style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: "8px",
        }}>
        <Input placeholder="Amount to Offer" onChange={(e) => handleOfferPrice(e)} />
      </div>
      
      
    </Modal>
      }
      
    </>
  );
}

export default NFTBalance;
