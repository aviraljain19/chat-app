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
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        "https://chat-app-ochre-ten-30.vercel.app/api/users/register",
        {
          username,
          email,
          password,
        },
      );

      toast({
        title: "Account created",
        description: "Your account is ready. Sign in to continue.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      navigate("/login");
    } catch (error) {
      toast({
        title: "Registration failed",
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
      bg="radial-gradient(circle at top right, rgba(59,130,246,0.2), transparent 30%), linear-gradient(180deg, #0b1220 0%, #101828 100%)"
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
          bg="linear-gradient(135deg, rgba(76, 29, 149, 0.9), rgba(59,130,246,0.8)), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80')"
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
            <Box as={FiCheckCircle} color="white" fontSize="48px" mb={4} />
            <Text
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="800"
              color="white"
              mb={3}
            >
              Build your circle
            </Text>
            <Text fontSize="lg" color="whiteAlpha.800" lineHeight="1.7">
              Join a modern space for team updates, quick collaboration, and
              real-time conversations.
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
          <VStack spacing={5} w="100%" maxW="420px">
            <Box textAlign="center">
              <Text fontSize="3xl" fontWeight="800" color="white" mb={2}>
                Create account
              </Text>
              <Text color="gray.400">
                Set up your profile and start chatting in minutes.
              </Text>
            </Box>

            <FormControl>
              <FormLabel color="gray.300">Username</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sonya_dev"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300">Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.300">Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
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
              Create account
            </Button>

            <Box
              w="100%"
              borderTop="1px solid"
              borderColor="whiteAlpha.200"
              pt={4}
            >
              <Text color="gray.400" textAlign="center">
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#a5b4fc", fontWeight: 700 }}>
                  Sign in
                </Link>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
