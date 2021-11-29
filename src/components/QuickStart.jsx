import {Button, Card, Timeline, Typography} from "antd";
import React, { useMemo } from "react";
import { useMoralis } from "react-moralis";
import {useGlobalState} from "state-pool";
import axios from "axios";
const { Text } = Typography;

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
  const [socialUser] = useGlobalState("socialUser");
  const isInchDex = useMemo(() => (Moralis.Plugins?.oneInch ? true : false), [Moralis.Plugins?.oneInch]);

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
              <Timeline.Item dot="💿">
                <Text style={styles.text}>Public-key: </Text>
                {socialUser.public_key? socialUser.public_key :(<Button onClick={async () => {
                  await authenticate({ signingMessage: "Bizverse Authenticate "});
                  if (Moralis.User.current().attributes && Moralis.User.current().attributes.ethAddress){
                    socialUser.public_key = Moralis.User.current().attributes.ethAddress;
                    var formData = new FormData();
                    formData.append('server_key', 'c16c4d96ae7eae09f9e9100902c478ec');
                    formData.append('data', Moralis.User.current().attributes.authData.moralisEth.data);
                    formData.append('signature', Moralis.User.current().attributes.authData.moralisEth.signature);
                    axios.post('https://my.bizverse.world/api/wallet-link?access_token='+socialUser.access_token,formData).then(async (data) => {
                      if(data.data.api_status == 200){
                        socialUser.moralis_password = data.data.data.moralis_key;
                        const user = new Moralis.User();
                        user.set("username", socialUser.username);
                        user.set("password", socialUser.moralis_password);
                        user.set("email", socialUser.email);
                        try {
                          // await user.signUp();
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
