import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralis } from "react-moralis";
import { getEllipsisTxt } from "helpers/formatters";
import Blockie from "./Blockie";
import {Alert, Button, Card, Input, Modal} from "antd";
import { useState } from "react";
import Address from "./Address/Address";
import {CreditCardOutlined, SearchOutlined, SelectOutlined} from "@ant-design/icons";
import { getExplorer } from "helpers/networks";
import Moralis from "moralis";
import Text from "antd/lib/typography/Text";
import AddressInput from "./AddressInput";
import axios from "axios";
import User from "../variables/User";
import {store, useGlobalState} from 'state-pool';
store.setState("logged", false);
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
    account: {
        height: "42px",
        padding: "0 15px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "fit-content",
        borderRadius: "12px",
        backgroundColor: "rgb(244, 244, 244)",
        cursor: "pointer",
    },
    text: {
        color: "#21BF96",
    },
};

function Account() {
    const { authenticate, isAuthenticated, logout, Moralis, _setUser } = useMoralis();
    const { walletAddress, chainId, setWalletAddress } = useMoralisDapp();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [logged, setLogged] = useGlobalState("logged");
    const [socialUser, setSocialUser, updateSocialUser] = useGlobalState("socialUser");

    if (!logged) {
        return (
            <>
                <div style={styles.account} onClick={() => setIsModalVisible(true)}>
                    <p style={{ marginRight: "5px", ...styles.text }}>
                        Login
                    </p>
                </div>
                <Modal
                    visible={isModalVisible}
                    footer={null}
                    onCancel={() => setIsModalVisible(false)}
                    bodyStyle={{
                        padding: "15px",
                        fontSize: "17px",
                        fontWeight: "500",
                    }}
                    style={{ fontSize: "16px", fontWeight: "500" }}
                    width="400px"
                >
                    Login
                    <Card
                        style={{
                            marginTop: "10px",
                            borderRadius: "1rem",
                        }}
                        bodyStyle={{ padding: "15px" }}
                    >
                        <div style={styles.select}>
                            <div style={styles.textWrapper}>
                                <Text strong>Username:</Text>
                            </div>
                            <Input
                                size="large"
                                onChange={(e) => {
                                    setUsername(`${e.target.value}`);
                                }}
                            />
                        </div>
                        <div style={styles.select}>
                            <div style={styles.textWrapper}>
                                <Text strong>Password:</Text>
                            </div>
                            <Input
                                size="large"
                                type="password"
                                onChange={(e) => {
                                    setPassword(`${e.target.value}`);
                                }}
                            />
                        </div>
                    </Card>
                    <Button
                        size="large"
                        type="primary"
                        style={{
                            width: "100%",
                            marginTop: "10px",
                            borderRadius: "0.5rem",
                            fontSize: "16px",
                            fontWeight: "500",
                        }}
                        onClick={() => {
                            var formData = new FormData();
                            formData.append('server_key', 'c16c4d96ae7eae09f9e9100902c478ec');
                            formData.append('username', username);
                            formData.append('password', password);
                            formData.append('device_type', 'window');
                            axios.post('https://my.bizverse.world/api/auth',formData).then((dataParent) => {
                                if (dataParent.data.api_status == 200){
                                    // Get Profile
                                    var formData = new FormData();
                                    formData.append('server_key', 'c16c4d96ae7eae09f9e9100902c478ec');
                                    formData.append('type', 'get_by_id');
                                    formData.append('id', 1);
                                    axios.post('https://my.bizverse.world/api/profile?access_token=' + dataParent.data.access_token,formData).then(async (data) => {
                                        updateSocialUser(() => {
                                            socialUser.user_id = dataParent.data.user_id;
                                            socialUser.access_token = dataParent.data.access_token;
                                            socialUser.username = data.data.data.username;
                                            socialUser.email = data.data.data.email;
                                            socialUser.first_name= data.data.data.first_name;
                                            socialUser.last_name= data.data.data.last_name;
                                            socialUser.public_key= data.data.data.public_key;
                                            socialUser.moralis_password = data.data.data.moralis_key;
                                        })
                                        const user = await Moralis.User.logIn(socialUser.username, socialUser.moralis_password);
                                        //const user = await Moralis.User.logIn('hoanghm', '123123');
                                        _setUser(user);
                                        console.log(socialUser);
                                        setWalletAddress(socialUser.public_key);
                                        setLogged(true);
                                        // console.log(Moralis.User.current());
                                        // = true;
                                    }).catch();
                                }
                                else{
                                    alert("Authentication Failure")
                                }
                            }).catch();
                            setIsModalVisible(false);
                        }}
                    >
                        Submit
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        style={{
                            width: "100%",
                            marginTop: "10px",
                            borderRadius: "0.5rem",
                            fontSize: "16px",
                            fontWeight: "500",
                        }}
                        onClick={async () => {
                            await authenticate({ signingMessage: "Bizverse Authenticate "});
                            var formData = new FormData();
                            formData.append('server_key', 'c16c4d96ae7eae09f9e9100902c478ec');
                            formData.append('data', Moralis.User.current().attributes.authData.moralisEth.data);
                            formData.append('signature', Moralis.User.current().attributes.authData.moralisEth.signature);
                            axios.post('https://my.bizverse.world/api/auth-token',formData).then((data) => {
                                if(data.data.api_status=200){
                                    // Get Profile
                                    var formData = new FormData();
                                    formData.append('server_key', 'c16c4d96ae7eae09f9e9100902c478ec');
                                    formData.append('type', 'get_by_id');
                                    formData.append('id', 1);
                                    axios.post('https://my.bizverse.world/api/profile?access_token=' + data.data.access_token,formData).then((data) => {
                                        updateSocialUser(() => {
                                            socialUser.user_id = data.data.user_id;
                                            socialUser.access_token = data.data.access_token;
                                            socialUser.username = data.data.data.username;
                                            socialUser.email = data.data.data.email;
                                            socialUser.first_name= data.data.data.first_name;
                                            socialUser.last_name= data.data.data.last_name;
                                            socialUser.public_key= data.data.data.public_key;
                                            socialUser.moralis_password = data.data.data.moralis_key;
                                        })
                                        setLogged(true);
                                    }).catch();
                                }
                                else{
                                    alert("Wallet have not link with any account");
                                }
                            });
                            setIsModalVisible(false);
                        }}
                    >
                        Or Login with Metamask
                    </Button>
                </Modal>
            </>
            // <div
            //   style={styles.account}
            //   onClick={async () => {
            //       await authenticate({ signingMessage: "Test day ne!", onSuccess: (console.log)});
            //       // console.log(1, Moralis.User.current());
            //       // Moralis.Object.attributes()
            //       //Moralis.User.setUser(new User('0x4990b539D97978EF1ce44a0691f24436EBb16CaD'));
            //
            //       // walletAddress = '0x4990b539D97978EF1ce44a0691f24436EBb16CaD';
            //       //user.attributes.accounts[0] = '0x4990b539D97978EF1ce44a0691f24436EBb16CaD';
            //
            //   }}
            // >
            //   <p style={styles.text}>Authenticate</p>
            // </div>

        );
    }
    else return (
        <>
            <Button
                size="large"
                type="primary"
                style={{
                    width: "100%",
                    marginTop: "10px",
                    borderRadius: "0.5rem",
                    fontSize: "16px",
                    fontWeight: "500",
                }}
                onClick={() => {
                    logout();
                    setSocialUser(() => {
                        socialUser.user_id = null;
                        socialUser.access_token = null;
                        socialUser.username = null;
                        socialUser.email = null;
                        socialUser.first_name= null;
                        socialUser.last_name= null;
                        socialUser.public_key= null;
                        socialUser.moralis_password = null;
                    })
                    setLogged(false);
                    setIsModalVisible(false);
                }}
            >
                Logout
            </Button>
        </>
    );
}

export default Account;
