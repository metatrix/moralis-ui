import { Button, Card, Input, Typography, Form, notification } from "antd";
import { useMemo, useState } from "react";
import seedContractInfo from "contracts/bive.json";
import privateContractInfo from "contracts/private.json";
import publicContractInfo from "contracts/public.json";
import Address from "components/Address/Address";
import { useMoralis, useMoralisQuery } from "react-moralis";
import { useEffect } from "react";

const { Text } = Typography;

export default function Contract() {
    const { Moralis } = useMoralis();
    const [responsesSeed, setResponsesSeed] = useState({});
    const [responsesPrivate, setResponsesPrivate] = useState({});
    const [responsesPublic, setResponsesPublic] = useState({});
    const seedContractAbi= seedContractInfo.abi;
    const privateContractAbi = privateContractInfo.abi;
    const publicContractAbi = publicContractInfo.abi;
    const seedContractAddress = seedContractInfo.networks[1337].address;
    const privateContractAddress = privateContractInfo.networks[1337].address;
    const publicContractAddress = publicContractInfo.networks[1337].address;

    /**Live query */
    const { data } = useMoralisQuery("Events", (query) => query, [], {
        live: true,
    });

    useEffect(() => console.log("New data: ", data), [data]);

    const displayedSeedContractFunctions = useMemo(() => {
        if (!seedContractInfo.abi) return [];
        return seedContractInfo.abi.filter((method) => method["type"] === "function");
    }, [seedContractInfo.abi]);

    const displayedPrivateContractFunctions = useMemo(() => {
        if (!privateContractInfo.abi) return [];
        return privateContractInfo.abi.filter((method) => method["type"] === "function");
    }, [privateContractInfo.abi]);

    const displayedPublicContractFunctions = useMemo(() => {
        if (!publicContractInfo.abi) return [];
        return publicContractInfo.abi.filter((method) => method["type"] === "function");
    }, [publicContractInfo.abi]);

    const openNotification = ({ message, description }) => {
        notification.open({
            placement: "bottomRight",
            message,
            description,
            onClick: () => {
                console.log("Notification Clicked!");
            },
        });
    };

    return (
        <div>
            <div style={{ margin: "auto", display: "flex", gap: "20px", marginTop: "25", width: "70vw" }}>
                <Card
                    title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {seedContractInfo.contractName}
                            <Address avatar="left" copyable address={seedContractAddress} size={8} />
                        </div>
                    }
                    size="large"
                    style={{
                        width: "100%",
                        boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
                        border: "1px solid #e7eaf3",
                        borderRadius: "0.5rem",
                    }}
                >
                    <Form.Provider
                        onFormFinish={async (name, { forms }) => {
                            const params = forms[name].getFieldsValue();

                            let isView = false;

                            for (let method of seedContractInfo.abi) {
                                if (method.name !== name) continue;
                                if (method.stateMutability === "view") isView = true;
                            }

                            const options = {
                                contractAddress: seedContractAddress,
                                functionName: name,
                                abi: seedContractAbi,
                                params,
                            };

                            if (!isView) {
                                const tx = await Moralis.executeFunction({ awaitReceipt: false, ...options });
                                tx.on("transactionHash", (hash) => {
                                    setResponsesSeed({ ...responsesSeed, [name]: { result: null, isLoading: true } });
                                    openNotification({
                                        message: "🔊 New Transaction",
                                        description: `${hash}`,
                                    });
                                    console.log("🔊 New Transaction", hash);
                                })
                                    .on("receipt", (receipt) => {
                                        setResponsesSeed({ ...responsesSeed, [name]: { result: null, isLoading: false } });
                                        openNotification({
                                            message: "📃 New Receipt",
                                            description: `${receipt.transactionHash}`,
                                        });
                                        console.log("🔊 New Receipt: ", receipt);
                                    })
                                    .on("error", (error) => {
                                        console.log(error);
                                    });
                            } else {
                                Moralis.executeFunction(options).then((response) =>
                                    setResponsesSeed({ ...responsesSeed, [name]: { result: response, isLoading: false } })
                                );
                            }
                        }}
                    >
                        {displayedSeedContractFunctions &&
                        displayedSeedContractFunctions.map((item, key) => (
                            <Card
                                title={`${key + 1}. ${item?.name}`}
                                size="small"
                                style={{ marginBottom: "20px" }}
                            >
                                <Form layout="vertical" name={`${item.name}`}>
                                    {item.inputs.map((input, key) => (
                                        <Form.Item
                                            label={`${input.name} (${input.type})`}
                                            name={`${input.name}`}
                                            required
                                            style={{ marginBottom: "15px" }}
                                        >
                                            <Input placeholder="input placeholder" />
                                        </Form.Item>
                                    ))}
                                    <Form.Item style={{ marginBottom: "5px" }}>
                                        <Text style={{ display: "block" }}>
                                            {responsesSeed[item.name]?.result &&
                                            `Response: ${JSON.stringify(responsesSeed[item.name]?.result)}`}
                                        </Text>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={responsesSeed[item?.name]?.isLoading}
                                        >
                                            {item.stateMutability === "view" ? "Read🔎" : "Transact💸"}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        ))}
                    </Form.Provider>
                </Card>

            </div>
            <div style={{ margin: "auto", display: "flex", gap: "20px", marginTop: "25px", width: "57vw", marginLeft:"0px" }}>
                <Card
                    title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {publicContractInfo.contractName}
                            <Address avatar="left" copyable address={publicContractAddress} size={8} />
                        </div>
                    }
                    size="large"
                    style={{
                        width: "100%",
                        boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
                        border: "1px solid #e7eaf3",
                        borderRadius: "0.5rem",
                    }}
                >
                    <Form.Provider
                        onFormFinish={async (name, { forms }) => {
                            const params = forms[name].getFieldsValue();

                            let isView = false;

                            for (let method of publicContractAbi) {
                                if (method.name !== name) continue;
                                if (method.stateMutability === "view") isView = true;
                            }

                            const options = {
                                contractAddress :publicContractAddress,
                                functionName: name,
                                abi: publicContractAbi,
                                params,
                            };

                            if (!isView) {
                                const tx = await Moralis.executeFunction({ awaitReceipt: false, ...options });
                                tx.on("transactionHash", (hash) => {
                                    setResponsesPublic({ ...responsesPublic, [name]: { result: null, isLoading: true } });
                                    openNotification({
                                        message: "🔊 New Transaction",
                                        description: `${hash}`,
                                    });
                                    console.log("🔊 New Transaction", hash);
                                })
                                    .on("receipt", (receipt) => {
                                        setResponsesPublic({ ...responsesPublic, [name]: { result: null, isLoading: false } });
                                        openNotification({
                                            message: "📃 New Receipt",
                                            description: `${receipt.transactionHash}`,
                                        });
                                        console.log("🔊 New Receipt: ", receipt);
                                    })
                                    .on("error", (error) => {
                                        console.log(error);
                                    });
                            } else {
                                Moralis.executeFunction(options).then((response) =>
                                    setResponsesPublic({ ...responsesPublic, [name]: { result: response, isLoading: false } })
                                );
                            }
                        }}
                    >
                        {displayedPublicContractFunctions &&
                        displayedPublicContractFunctions.map((item, key) => (
                            <Card
                                title={`${key + 1}. ${item?.name}`}
                                size="small"
                                style={{ marginBottom: "20px" }}
                            >
                                <Form layout="vertical" name={`${item.name}`}>
                                    {item.inputs.map((input, key) => (
                                        <Form.Item
                                            label={`${input.name} (${input.type})`}
                                            name={`${input.name}`}
                                            required
                                            style={{ marginBottom: "15px" }}
                                        >
                                            <Input placeholder="input placeholder" />
                                        </Form.Item>
                                    ))}
                                    <Form.Item style={{ marginBottom: "5px" }}>
                                        <Text style={{ display: "block" }}>
                                            {responsesPublic[item.name]?.result &&
                                            `Response: ${JSON.stringify(responsesPublic[item.name]?.result)}`}
                                        </Text>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={responsesPublic[item?.name]?.isLoading}
                                        >
                                            {item.stateMutability === "view" ? "Read🔎" : "Transact💸"}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        ))}
                    </Form.Provider>
                </Card>
                <Card
                    title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {privateContractInfo.contractName}
                            <Address avatar="left" copyable address={privateContractAddress} size={8} />
                        </div>
                    }
                    size="large"
                    style={{
                        width: "100%",
                        boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
                        border: "1px solid #e7eaf3",
                        borderRadius: "0.5rem",
                    }}
                >
                    <Form.Provider
                        onFormFinish={async (name, { forms }) => {
                            const params = forms[name].getFieldsValue();

                            let isView = false;

                            for (let method of privateContractAbi) {
                                if (method.name !== name) continue;
                                if (method.stateMutability === "view") isView = true;
                            }

                            const options = {
                                contractAddress: privateContractAddress,
                                functionName: name,
                                abi: privateContractAbi,
                                params,
                            };

                            if (!isView) {
                                const tx = await Moralis.executeFunction({ awaitReceipt: false, ...options });
                                tx.on("transactionHash", (hash) => {
                                    setResponsesPrivate({ ...responsesPrivate, [name]: { result: null, isLoading: true } });
                                    openNotification({
                                        message: "🔊 New Transaction",
                                        description: `${hash}`,
                                    });
                                    console.log("🔊 New Transaction", hash);
                                })
                                    .on("receipt", (receipt) => {
                                        setResponsesPrivate({ ...responsesPrivate, [name]: { result: null, isLoading: false } });
                                        openNotification({
                                            message: "📃 New Receipt",
                                            description: `${receipt.transactionHash}`,
                                        });
                                        console.log("🔊 New Receipt: ", receipt);
                                    })
                                    .on("error", (error) => {
                                        console.log(error);
                                    });
                            } else {
                                Moralis.executeFunction(options).then((response) =>
                                    setResponsesPrivate({ ...responsesPrivate, [name]: { result: response, isLoading: false } })
                                );
                            }
                        }}
                    >
                        {displayedPrivateContractFunctions &&
                        displayedPrivateContractFunctions.map((item, key) => (
                            <Card
                                title={`${key + 1}. ${item?.name}`}
                                size="small"
                                style={{ marginBottom: "20px" }}
                            >
                                <Form layout="vertical" name={`${item.name}`}>
                                    {item.inputs.map((input, key) => (
                                        <Form.Item
                                            label={`${input.name} (${input.type})`}
                                            name={`${input.name}`}
                                            required
                                            style={{ marginBottom: "15px" }}
                                        >
                                            <Input placeholder="input placeholder" />
                                        </Form.Item>
                                    ))}
                                    <Form.Item style={{ marginBottom: "5px" }}>
                                        <Text style={{ display: "block" }}>
                                            {responsesPrivate[item.name]?.result &&
                                            `Response: ${JSON.stringify(responsesPrivate[item.name]?.result)}`}
                                        </Text>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={responsesPrivate[item?.name]?.isLoading}
                                        >
                                            {item.stateMutability === "view" ? "Read🔎" : "Transact💸"}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        ))}
                    </Form.Provider>
                </Card>

            </div>
        </div>
    );
}
