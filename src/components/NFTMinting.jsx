import {React, useState} from "react";
import {Upload, Button, Input} from 'antd';
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import {useMoralis} from 'react-moralis'
import AddressInput from "./AddressInput";
import Address from "./Address/Address";
import bizverseNFT from "contracts/bizverseNFT.json"
const {TextArea} = Input;

function NFTMinting(){
  const { chainId,walletAddress } = useMoralisDapp();
  const { Moralis } = useMoralis();
  const [thumbnails, setThumbnails] = useState(null)
  const [model3D, setModel3D] = useState(null);
  const [title, setTitle] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  // const handleFileUpload = async (e) => {
  //   if(e.fileList.length > 0){
  //     let myFile = e.fileList[0];
  //     const fileToUpload = new Moralis.File(myFile.name , myFile.originFileObj);
  //     setFile(fileToUpload)
  //   }
    
  // }
  // const uploadIPFS = async() => {
  //   console.log(file);
  //   await file.saveIPFS();
  //   console.log(file.ipfs(), file.hash());
  // }
  const handleThumbnails = async(e) => {
    if(e.fileList.length > 0){
      setThumbnails(e.fileList[0].originFileObj);
    }
    console.log(thumbnails);
  }

  const handleModel3D = async(e) => {
    if(e.fileList.length > 0){
      setModel3D(e.fileList[0].originFileObj);
    }
    console.log(model3D);
  }

  const uploadMetadata = async(title,thumnailsCID, modelCID) => {
    const metadata = {
      title: title,
      description: `Just a test metadata`,
      image: `ipfs://${thumnailsCID}`,
      attributes:{
        model: `ipfs://${modelCID}`,
      }
    }
    const content = Buffer.from(JSON.stringify(metadata)).toString('base64');
    const fileName = title.toString(16);
    const metadataFile = new Moralis.File(fileName, {base64: content})
    await metadataFile.saveIPFS();
    handleMintNFT(`ipfs://${metadataFile.hash()}`)
  }

  const handleMintNFT = (tokenURI)=>{
    let options = {
      contractAddress: nftContract,
      functionName: 'mint',
      abi: bizverseNFT.abi,
      params:{
        _to: receiver,
        _tokenURI : tokenURI,
      }
    };
    Moralis.executeFunction(options).then(console.log);
  }

  const handleTitleChange = (e) => {
    e.preventDefault();
    setTitle(e.target.value);
  }

  const handleUploadIPFS = async(e) => {
    const thumbnailsFile = new Moralis.File(thumbnails.name, thumbnails);
    await thumbnailsFile.saveIPFS();
    const modelFile = new Moralis.File(model3D.name, model3D);
    await modelFile.saveIPFS();
    await uploadMetadata(title, thumbnailsFile.hash(), modelFile.hash());
  }
  return(
    <>
    <div>
    <Input placeholder="Title" onChange={(e)=>handleTitleChange(e)} />
    <TextArea placeholder="Description" allowClear onChange={(e)=>console.log(e.target.value)} />
    <Upload maxCount={1} onChange={(e)=>handleThumbnails(e)}>
      <Button>Select Thumbnails</Button>
    </Upload>
    <Upload maxCount={1} onChange={(e)=>handleModel3D(e)}>
      <Button>Select 3D Model</Button>
    </Upload>
    <AddressInput placeholder="Receiver" onChange={setReceiver} />
    <AddressInput placeholder="ERC-721 Contract Address" onChange={setNftContract} />
    <Button onClick={(e)=> handleUploadIPFS()}>Mint</Button>
    
    </div>
    
    </>
  )
}

export default NFTMinting;