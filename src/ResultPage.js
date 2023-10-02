import React, { useEffect, useState } from "react";
import { Box, Flex, Center, Text, Button, Progress, Badge, Skeleton } from "@chakra-ui/react";
import { data } from "./data"; // Assuming the data array is in the same directory
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk, { waitForConfirmation } from 'algosdk';


const peraWallet = new PeraWalletConnect();

const appIndex = 404238566;

const algod = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

const ResultPage = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [product, setProduct] = useState(null);

  const [accountAddress, setAccountAddress] = useState(null);
  const isConnectedToPeraWallet = !!accountAddress;
  const [retLocalVar, setRetLocalVar] = useState(null);
  const [retGlobalVar, setRetGlobalVar] = useState(null);

  useEffect(() => {
    checkGlobalVarState();

    const urlParams = new URLSearchParams(window.location.search);
    const term = urlParams.get("q");
    setSerialNumber(term);

    peraWallet.reconnectSession().then((accounts) => {
      // Setup disconnect event listener
      peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);

      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    })

    // Find the product with the given serial number
    const foundProduct = data.find((item) => item.serial_number === parseInt(term));
    setProduct(foundProduct);
  }, []);

  const calculateOverallRating = () => {
    if (!product) return null;

    const {
      seed_storage_grade,
      crop_growth_grade,
      transportation_emission_grade,
      processing_and_packaging_grade,
    } = product;

    return (
      (seed_storage_grade + crop_growth_grade + transportation_emission_grade + processing_and_packaging_grade) /
      4
    ).toFixed(1);
  };

  return (
    <Flex flexDirection="column" alignItems="center" mt="8">
      <Button className="btn-wallet"
        onClick={
          isConnectedToPeraWallet ? handleDisconnectWalletClick : handleConnectWalletClick
        }>
        {isConnectedToPeraWallet ? "Disconnect" : "Connect to Pera Wallet"}
      </Button>
      {product ? (
        <>
          <Badge variant="solid" colorScheme="blue" p={2} fontSize="lg" mb="2">
            Overall Rating: {calculateOverallRating}
          </Badge>
          <Skeleton isLoaded={!!product.image_url}>
            <img src={product.image_url} alt={product.product_name} style={{ width: "300px", marginBottom: "20px" }} />
          </Skeleton>
          <Text fontSize="2xl" mb="4">
            Product: {product.product_name}
          </Text>
          <Text fontSize="xl" mb="2">
            Serial Number: {serialNumber}
          </Text>

          <Box w="100%" maxW="500px">
            {["Seed Storage", "Crop Growth", "Transportation Emission", "Processing and Packaging"].map((label) => (
              <Box key={label} mb="4">
                <Text fontSize="lg" fontWeight="bold" mb="2">{label}</Text>
                <Flex alignItems="center">
                  <Progress value={product[`${label.toLowerCase().replace(/ /g, "_")}_grade`] * 10} colorScheme="blue" size="lg" flex="1" />
                  <Text fontSize="lg" fontWeight="bold">{product[`${label.toLowerCase().replace(/ /g, "_")}_grade`]}</Text>
                </Flex>
              </Box>
            ))}
          </Box>
          <Button colorScheme="blue" mt="4" onClick={() => (window.location.href = "/")}>
            Search for Another Product
          </Button>
        </>
      ) : (
        <>
          <Text fontSize="xl" mb="4">
            Product with Serial Number {serialNumber} not found.
          </Text>
          <Button colorScheme="blue" onClick={() => (window.location.href = "/")}>
            Go Back
          </Button>
        </>
      )}
    </Flex>
  );

  function handleConnectWalletClick() {
    peraWallet.connect().then((newAccounts) => {
      // setup the disconnect event listener
      peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);

      setAccountAddress(newAccounts[0]);
    });
  }

  function handleDisconnectWalletClick() {
    peraWallet.disconnect();
    setAccountAddress(null);
  }

  async function checkLocalVarState() {
    try {
      const accountInfo = await algod.accountApplicationInformation(accountAddress, appIndex).do();
      if (!!accountInfo['app-local-state']['key-value'][0].value.uint) {
        setRetLocalVar(accountInfo['app-local-state']['key-value'][0].value.uint);
      } else {
        setRetLocalVar(0);
      }
      console.log(accountInfo['app-local-state']['key-value'][0].value.uint);
    } catch (e) {
      console.error('There was an error connecting to the algorand node: ', e)
    }
  }

  async function optInToApp() {
    const suggestedParams = await algod.getTransactionParams().do();
    const optInTxn = algosdk.makeApplicationOptInTxn(
      accountAddress,
      suggestedParams,
      appIndex
    );

    const optInTxGroup = [{ txn: optInTxn, signers: [accountAddress] }];

    const signedTx = await peraWallet.signTransaction([optInTxGroup]);
    console.log(signedTx);
    const { txId } = await algod.sendRawTransaction(signedTx).do();
    const result = await waitForConfirmation(algod, txId, 2);
  }

  async function checkGlobalVarState() {
    try {
      const counter = await algod.getApplicationByID(appIndex).do();
      if (!!counter.params['global-state'][0].value.uint) {
        setRetGlobalVar(counter.params['global-state'][0].value.uint);
      } else {
        setRetGlobalVar(0);
      }
    } catch (e) {
      console.error('There was an error connecting to the algorand node: ', e)
    }
  }
};

export default ResultPage;
