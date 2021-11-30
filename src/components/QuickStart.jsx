import {Button, Card, Timeline, Typography} from "antd";
import React, {useMemo, useState} from "react";
import { useMoralis } from "react-moralis";
import {store, useGlobalState} from "state-pool";
import axios from "axios";
const { Text } = Typography;

store.setState("socialUser",{
  user_id: null,
  username: null,
  email: null,
  first_name: null,
  last_name: null,
  public_key: null,
  moralis_password: null,
  access_token: null
});

const styles = {
  title: {
    fontSize: "20px",
    fontWeight: "700",
  },
  text: {
    fontSize: "16px",
  },
  card: {
    boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
    border: "1px solid #e7eaf3",
    borderRadius: "0.5rem",
  },
  timeline: {
    marginBottom: "-45px",
  },
};

export default function QuickStart({ isServerInfo }) {
  const { Moralis, authenticate} = useMoralis();
  const [logged] = useGlobalState("logged");
  const [socialUser, setSocialUser, updateSocialUser] = useGlobalState("socialUser");
  const isInchDex = useMemo(() => (Moralis.Plugins?.oneInch ? true : false), [Moralis.Plugins?.oneInch]);
  const [publicKey, setPublicKey] = useState();
  const [secret, setSecret] = useState();
  const [token, setToken] = useState();

  return (
      <div style={{ display: "flex", gap: "10px" }}>
        <Card style={styles.card} title={<h1 style={styles.title}>📝 User Info</h1>}>
          <Timeline mode="left" style={styles.timeline}>
            <Timeline.Item dot="📄">
              <Text style={styles.text}> User_id: {socialUser.user_id}</Text>
            </Timeline.Item>

            <Timeline.Item dot="💿">
              <Text style={styles.text}>
                <Text style={styles.text}> Username: {socialUser.username}</Text>
              </Text>
            </Timeline.Item>

            <Timeline.Item dot="💾">
              <Text style={styles.text}>
                <Text style={styles.text}> Email: {socialUser.email}</Text>
              </Text>
            </Timeline.Item>

            <Timeline.Item dot="🔁">
              <Text style={styles.text}> Name: {socialUser.first_name ? socialUser.first_name + " " + socialUser.last_name : ''}</Text>
            </Timeline.Item>


          </Timeline>
        </Card>
        <div>
          <Card
              style={styles.card}
              title={<h1 style={styles.title}>💣 Wallet Info</h1>}
          >
            <Timeline mode="left" style={styles.timeline}>
              <Timeline.Item dot="📡">
                <Text style={styles.text}>
                  First: Connect correct your address you wanna link to this site
                </Text>
              </Timeline.Item>
              <Timeline.Item dot="💿">
                <Text style={styles.text}>Public-key: </Text>
                {socialUser.public_key != null ? socialUser.public_key :(<Button onClick={async () => {
                  await authenticate({ signingMessage: "Bizverse Authenticate "});
                  if (Moralis.User.current().attributes && Moralis.User.current().attributes.ethAddress){
                    // updateSocialUser( () =>{
                    //   socialUser.user_id = socialUser.user_id;
                    //   socialUser.access_token = socialUser.access_token;
                    //   socialUser.username = socialUser.username;
                    //   socialUser.email = socialUser.email;
                    //   socialUser.first_name = socialUser.first_name;
                    //   socialUser.last_name = socialUser.last_name;
                    //   socialUser.public_key = Moralis.User.current().attributes.ethAddress;
                    //   socialUser.moralis_password = null
                    // });
                    setSocialUser( {
                      user_id : socialUser.user_id,
                      access_token : socialUser.access_token,
                      username : socialUser.username,
                      email : socialUser.email,
                      first_name : socialUser.first_name,
                      last_name : socialUser.last_name,
                      public_key : Moralis.User.current().attributes.ethAddress,
                      moralis_password : null
                    });
                    var formData = new FormData();
                    formData.append('server_key', 'c16c4d96ae7eae09f9e9100902c478ec');
                    formData.append('data', Moralis.User.current().attributes.authData.moralisEth.data);
                    formData.append('signature', Moralis.User.current().attributes.authData.moralisEth.signature);


                    axios.post('https://my.bizverse.world/api/wallet-link?access_token='+socialUser.access_token,formData).then(async (data) => {
                      if(data.data.api_status == 200){
                        await updateSocialUser(() => {
                          socialUser.user_id = socialUser.user_id;
                          socialUser.access_token = socialUser.access_token;
                          socialUser.username = socialUser.username;
                          socialUser.email = socialUser.email;
                          socialUser.first_name= socialUser.first_name;
                          socialUser.last_name= socialUser.last_name;
                          socialUser.public_key= data.data.data.moralis_key
                          socialUser.moralis_password = data.data.data.moralis_key;
                        })
                        const user = new Moralis.User();
                        user.set("username", socialUser.username);
                        user.set("password", socialUser.moralis_password);
                        user.set("email", socialUser.email);
                        try {
                          await user.signUp();
                        } catch (error) {
                          alert("Error: " + error.code + " " + error.message);
                        }
                      };
                    });
                  }
                }}> Link Wallet</Button>)}
              </Timeline.Item>
              <Timeline.Item dot="📡">
                <Text style={styles.text}>
                  You can link: <Text code> only one time </Text> to your wallet. This active cannot revert
                </Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </div>
      </div>
  );
}
