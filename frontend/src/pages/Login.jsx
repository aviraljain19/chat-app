import { Box, Text } from "@chakra-ui/react";
import { SignIn, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to="/chat" replace />;

  return (
    <Box
      minH="100vh"
      bg="radial-gradient(circle at top left, rgba(79,70,229,0.18), transparent 30%), linear-gradient(180deg, #0b1220 0%, #101828 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={10}
    >
      <Box
        w="full"
        maxW="900px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Text
          fontSize="2xl"
          fontWeight="700"
          color="white"
          mb={6}
          textAlign="center"
        >
          Welcome back
        </Text>
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/register"
          forceRedirectUrl="/chat"
        />
      </Box>
    </Box>
  );
};

export default Login;
