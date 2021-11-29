import React, { useState, useEffect } from "react";
import { useMoralis, useNFTBalances } from "react-moralis";
import { Card, Image, Tooltip, Modal, Input } from "antd";
import { useERC20Balance } from "hooks/useERC20Balance";
import {useAPIContract} from 'hooks/useAPIContract'
import {useMoralisWeb3Api} from "react-moralis";
import marketplace from "contracts/marketplace.json";
import bive from "contracts/bive.json";
import ERC721 from "contracts/ERC721.json"
import { FileSearchOutlined, ToolOutlined, ShoppingCartOutlined,CloseOutlined  } from "@ant-design/icons";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { getExplorer } from "helpers/networks";
import AddressInput from "./AddressInput";
const { Meta } = Card;
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

const biveAddress = "0x477a4143a0d28922e00c677f89a2347081f4d6d1";
const marketplaceAddress = "0x8417EBB62b71D55fa60e3EF15688754d9e460B46";
function NFTMarketplace(){
  const { chainId,walletAddress } = useMoralisDapp();
  const { Moralis } = useMoralis();
  const Web3API = useMoralisWeb3Api();
  const [openingOffers, setOpenningOffers] = useState(null);
  const [visible, setVisible] = useState(null);
  const [nftToken , setNftToken] = useState(null);
  const [offerPrice , setOfferPrice] = useState(null);
  const { fetchERC20Balance } = useERC20Balance();
  const [biveBalance, setBiveBalance] = useState(null);


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


  useEffect(() => {  
    let options = {
      chain: chainId,
      function_name:'fetchOpenOfferings',
      abi: marketplace.abi,
      address: marketplaceAddress,
      params:{}
    }
    Web3API.native.runContractFunction(options)
    .then(async (res)=>{
      let offer = res.map((item) => {
        let marketOffer = {
          offeringId : item[0],
          nftContract: item[1],
          tokenId: item[2],
          seller :item[3],
          price: item[4],
          closed: item[5]
        }
        getOfferMetadata(marketOffer).then(tokenMetadata => {
          tokenMetadata.metadata = JSON.parse(tokenMetadata.metadata);
          marketOffer.image = tokenMetadata.metadata?.image.replace('ipfs://','https://ipfs.io/ipfs/');
          marketOffer.tokenMetadata = tokenMetadata;
          console.log(marketOffer);
        })
      
        return marketOffer
      })
      
      setOpenningOffers(offer);
    });

    fetchERC20Balance().then((assets) => {
      let biveToken = assets.find(asset=>asset.token_address === biveAddress)
      setBiveBalance(biveToken);
    })
  },[])
  const handleChangePrice = async(nft)=>{
    setNftToken(nft);
    setVisible(true);
  }

  const submitChangePrice = async()=>{
    console.log(offerPrice, biveBalance?.decimals);
    let options = {
      abi: marketplace.abi,
      contractAddress: marketplaceAddress,
      functionName:'changeOfferingPrice',
      params:{
        offeringId: nftToken.offeringId,
        newPrice: Moralis.Units.Token(offerPrice,biveBalance?.decimals)
      }
    }
  await Moralis.executeFunction(options);
  }

  const handleCancelOffer = async(nft) => {
    let options = {
      abi: marketplace.abi,
      contractAddress: marketplaceAddress,
      functionName:'cancelOffering',
      params:{
        offeringId: nft.offeringId,
      }
  }
  await Moralis.executeFunction(options);
  }

  const handlePriceInput = (e) => {
    e.preventDefault();
    setOfferPrice(e.target.value);
  }

  const handleBuyOffer = async (nft) => {
    let allowance = allowanceCall?.contractResponse;
    if(allowance < nft.price){
      const options = {
        abi: bive.abi,
        contractAddress: biveAddress,
        functionName:'approve',
        params:{
          spender: marketplaceAddress,
          amount: nft.price - allowance
        }
      };
      await Moralis.executeFunction(options)
    }

    let options = {
      abi: marketplace.abi,
      contractAddress: marketplaceAddress,
      functionName:'buyOffering',
      params:{
        offeringId: nft.offeringId,
      }
  }
  await Moralis.executeFunction(options);
  }

  const getOfferMetadata = async(offer) => {
    let options = {
      address: offer.nftContract,
      token_id: offer.tokenId,
      chain:chainId
    }
    let tokenIdMetadata = await Moralis.Web3API.token.getTokenIdMetadata(options)
    return tokenIdMetadata
  }
  return(
    <>
    <div style={styles.NFTs}>
        {openingOffers &&
          openingOffers.map((nft, index) => (
            <Card
              hoverable
              actions={[
                <Tooltip title="View On Blockexplorer">
                  <FileSearchOutlined
                    onClick={() => window.open(`${getExplorer(chainId)}address/${nft.nft_contract}`, "_blank")}
                  />
                </Tooltip>,
                <Tooltip title="Cancel offer">
                  <CloseOutlined onClick={() => handleCancelOffer(nft)} />
                </Tooltip>,
                <Tooltip title="Change offer price">
                <ToolOutlined onClick={() => handleChangePrice(nft)} />
              </Tooltip>,
                <Tooltip title="Buy">
                  <ShoppingCartOutlined onClick={() => handleBuyOffer(nft)} />
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
              <Meta title={"Price: " + Moralis.Units.FromWei(nft.price,biveBalance?.decimals) + " " +  biveBalance?.symbol}  description={nft.nftContract} />
              <h4>{"Seller: " + nft.seller}</h4>
              
            </Card>
          ))}

      <Modal
        title={`Change price of market offer id ${nftToken?.offeringId || "NFT"} - ${nftToken?.nftContract} with ID ${nftToken?.tokenId}`}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={() => submitChangePrice()}
        okText="Change price"
      >
        <Input placeholder="New offer price" onChange={(e) => handlePriceInput(e)} />
      </Modal> : 
    </div>
    </>
  )
}

export default NFTMarketplace;