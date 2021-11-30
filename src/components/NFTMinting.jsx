import {React, useState } from "react";
import {Upload, Button, Input, Select} from 'antd';
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import {useMoralis} from 'react-moralis'
import AddressInput from "./AddressInput";
import Address from "./Address/Address";
import contractAddress from "../contracts/contractAddresses";
import bizverseNFT from "contracts/bizverseNFT.json"
const {TextArea} = Input;
const {Option} = Select;
function NFTMinting(){
  const { chainId,walletAddress } = useMoralisDapp();
  const { Moralis } = useMoralis();
  const [thumbnails, setThumbnails] = useState(null)
  const [model3D, setModel3D] = useState(null);
  const [title, setTitle] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const[description, setDescription] = useState(null);

  const handleThumbnails = async(e) => {
    if(e.fileList.length > 0){
      setThumbnails(e.fileList[0].originFileObj);
    }
  }

  const handleModel3D = async(e) => {
    if(e.fileList.length > 0){
      setModel3D(e.fileList[0].originFileObj);
    }
  }

  const uploadMetadata = async(title,description,thumnailsCID, modelCID) => {
    const metadata = {
      title: title,
      description: description,
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

  let ops = Object.entries(contractAddress[parseInt(chainId, 16)]).map(item=>{
    return <Option key={item[1]} value={item[1]}>{item[0]}</Option>
  });
  
  

  

  const handleUploadIPFS = async(e) => {
    const thumbnailsFile = new Moralis.File(thumbnails.name, thumbnails);
    await thumbnailsFile.saveIPFS();
    const modelFile = new Moralis.File(model3D.name, model3D);
    await modelFile.saveIPFS();
    await uploadMetadata(title,description, thumbnailsFile.hash(), modelFile.hash());
  }
  return(
    <>
    <div>
    <Input placeholder="Title" onChange={(e)=>handleTitleChange(e)} />
    <TextArea placeholder="Description" allowClear onChange={(e)=>setDescription(e.target.value)} />
    <Upload maxCount={1} onChange={(e)=>handleThumbnails(e)}>
      <Button>Select Thumbnails</Button>
    </Upload>
    <Upload maxCount={1} onChange={(e)=>handleModel3D(e)}>
      <Button>Select 3D Model</Button>
    </Upload>
    <AddressInput placeholder="Receiver" onChange={setReceiver} />
    <Select style={{ width: 300 }} onChange={(e)=> setNftContract(e)}>      
      {ops}
    </Select>
    <br/>
    {/* <AddressInput placeholder="ERC-721 Contract Address" onChange={setNftContract} /> */}
    <Button onClick={(e)=> handleUploadIPFS()}>Mint</Button>
    
    </div>
    
    </>
  )
}

export default NFTMinting;