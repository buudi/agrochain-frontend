import React, { useEffect, useState } from "react";
import { Box, Flex, Center, Text, Button, Progress, Badge, Skeleton } from "@chakra-ui/react";
import { data } from "./data"; // Assuming the data array is in the same directory

const ResultPage = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const term = urlParams.get("q");
    setSerialNumber(term);

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
      {product ? (
        <>
          <Badge variant="solid" colorScheme="blue" p={2} fontSize="lg" mb="2">
            Overall Rating: {calculateOverallRating()}
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
};

export default ResultPage;
