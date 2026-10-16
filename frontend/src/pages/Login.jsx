import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { FiArrowRight, FiMail, FiMessageSquare } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        "https://chat-app-ochre-ten-30.vercel.app/api/users/login",
        { email, password },
      );

      localStorage.setItem("userInfo", JSON.stringify(data?.user));
      navigate("/chat");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

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
        maxW="1100px"
        minH={{ base: "auto", md: "640px" }}
        bg="rgba(15, 23, 42, 0.82)"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="32px"
        overflow="hidden"
        boxShadow="0 30px 80px rgba(15, 23, 42, 0.55)"
        display="flex"
        flexDirection={{ base: "column", md: "row" }}
      >
        <Box
          flex="1"
          bg="linear-gradient(135deg, rgba(79,70,229,0.9), rgba(59,130,246,0.8)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80')"
          bgSize="cover"
          bgPosition="center"
          position="relative"
          px={{ base: 6, md: 10 }}
          py={{ base: 8, md: 12 }}
          display="flex"
          alignItems="flex-end"
        >
          <Box
            bg="rgba(15, 23, 42, 0.22)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="24px"
            p={6}
            maxW="420px"
            backdropFilter="blur(8px)"
          >
            <Box as={FiMessageSquare} color="white" fontSize="48px" mb={4} />
            <Text
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="800"
              color="white"
              mb={3}
            >
              Welcome back
            </Text>
            <Text fontSize="lg" color="whiteAlpha.800" lineHeight="1.7">
              Your conversations, workspace updates, and team moments are
              waiting for you.
            </Text>
          </Box>
        </Box>

        <Box
          flex="1"
          bg="rgba(15, 23, 42, 0.86)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 6, md: 10 }}
        >
          <VStack spacing={6} w="100%" maxW="420px">
            <Box textAlign="center">
              <Text fontSize="3xl" fontWeight="800" color="white" mb={2}>
                Sign in
              </Text>
              <Text color="gray.400">
                Access your workspace and continue the conversation.
              </Text>
            </Box>

            <FormControl>
              <FormLabel color="gray.300">Email</FormLabel>
              <Box
                display="flex"
                alignItems="center"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="12px"
                px={3}
                _focusWithin={{
                  borderColor: "brand.400",
                  boxShadow: "0 0 0 1px rgba(99,102,241,0.5)",
                }}
              >
                <Box as={FiMail} color="gray.400" mr={2} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  bg="transparent"
                  border="none"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                />
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300">Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <Button
              onClick={handleSubmit}
              isLoading={loading}
              colorScheme="brand"
              size="lg"
              width="100%"
              borderRadius="14px"
              rightIcon={<FiArrowRight />}
            >
              Sign in
            </Button>

            <Box
              w="100%"
              borderTop="1px solid"
              borderColor="whiteAlpha.200"
              pt={4}
            >
              <Text color="gray.400" textAlign="center">
                Need an account?{" "}
                <Link
                  to="/register"
                  style={{ color: "#a5b4fc", fontWeight: 700 }}
                >
                  Create one
                </Link>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
