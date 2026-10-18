import { Box, Button, Text, VStack, useToast } from "@chakra-ui/react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://chat-app-ochre-ten-30.vercel.app");

const Login = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const syncClerkUser = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        const clerkToken = await getToken();
        const { data } = await axios.post(
          `${API_BASE}/api/users/clerk-session`,
          {},
          {
            headers: {
              Authorization: `Bearer ${clerkToken}`,
            },
          },
        );

        localStorage.setItem("userInfo", JSON.stringify(data.user));
        navigate("/chat");
      } catch (error) {
        console.error("Failed to sync Clerk user:", error);
        toast({
          title: "Authentication failed",
          description:
            error.response?.data?.message ||
            "Could not initialize your secure session.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    };

    syncClerkUser();
  }, [isLoaded, isSignedIn, user, getToken, navigate, toast]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      toast({
        title: "Signed in successfully",
        description: "You are now using secure Google authentication.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [isLoaded, isSignedIn, toast]);

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
              Welcome to Chat App
            </Text>
            <Text color="gray.400">
              Sign in with your verified Google account to continue.
            </Text>
          </Box>

          <Box
            display="flex"
            justifyContent="center"
            sx={{
              ".cl-signIn-root": {
                width: "100% !important",
              },
            }}
          >
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/login"
              forceRedirectUrl="/chat"
            />
          </Box>

          <Button
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate("/")}
          >
            Back to home
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;
