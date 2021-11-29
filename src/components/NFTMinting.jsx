import {React, useState} from "react";
import {Upload, Button} from 'antd';
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import {useMoralis} from 'react-moralis'

function NFTMinting(){
  const { chainId,walletAddress } = useMoralisDapp();
  const { Moralis } = useMoralis();
  const [file, setFile] = useState(null)

  const handleFileUpload = async (e) => {
    if(e.fileList.length > 0){
      let myFile = e.fileList[0];
      const fileToUpload = new Moralis.File(myFile.name , myFile.originFileObj);
      setFile(fileToUpload)
    }
    
  }
  const uploadIPFS = async() => {
    console.log(file);
    await file.saveIPFS();
    console.log(file.ipfs(), file.hash());
  }

  return(
    <>
    <div>
    <Upload onChange={(e)=>handleFileUpload(e)}>
      <Button>Select File</Button>
    </Upload>
    <Button onClick={(e)=> uploadIPFS()}>Upload</Button>
    
    </div>
    
    </>
  )
}

export default NFTMinting;