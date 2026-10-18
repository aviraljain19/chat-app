import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      bg="radial-gradient(circle at top right, rgba(59,130,246,0.2), transparent 30%), linear-gradient(180deg, #0b1220 0%, #101828 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={10}
    >
      <Box
        w="full"
        maxW="560px"
        bg="rgba(15, 23, 42, 0.82)"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="32px"
        overflow="hidden"
        boxShadow="0 30px 80px rgba(15, 23, 42, 0.55)"
        p={{ base: 5, md: 8 }}
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Text fontSize="3xl" fontWeight="800" color="white" mb={2}>
              Create your account
            </Text>
            <Text color="gray.400">
              Use Google authentication with a verified email address.
            </Text>
          </Box>

          <Box display="flex" justifyContent="center">
            <SignUp routing="path" path="/login" forceRedirectUrl="/chat" />
          </Box>

          <Button
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate("/login")}
          >
            Already have an account? Sign in
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Register;
