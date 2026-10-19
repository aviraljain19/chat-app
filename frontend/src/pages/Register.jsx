import { Box, Text } from "@chakra-ui/react";
import { SignUp, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

const Register = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to="/chat" replace />;

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
      <Box w="full" maxW="900px">
        <Text
          fontSize="2xl"
          fontWeight="700"
          color="white"
          mb={6}
          textAlign="center"
        >
          Create your account
        </Text>
        <SignUp
          path="/register"
          routing="path"
          signInUrl="/login"
          afterSignUpUrl="/chat"
        />
      </Box>
    </Box>
  );
};

export default Register;
