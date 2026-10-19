import { Box, Button, FormControl, FormLabel, Input, Text, VStack, useToast } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";

const ProfileSetup = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) navigate("/", { replace: true });
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u?.username && !/^clerk-/i.test(u.username)) {
          navigate("/chat", { replace: true });
        }
      } catch {}
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim()) {
      toast({ title: "Choose a username", status: "warning" });
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.patch(
        "http://localhost:5000/api/users/profile",
        { username: username.trim() },
        { withCredentials: true },
      );

      if (data?.user) {
        localStorage.setItem("userInfo", JSON.stringify(data.user));
        navigate("/chat", { replace: true });
      } else {
        throw new Error("No user returned");
      }
    } catch (err) {
      toast({
        title: "Could not set username",
        description: err.response?.data?.message || err.message || "Error",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4} py={10}>
      <Box w="full" maxW="480px">
        <Text fontSize="2xl" fontWeight="700" color="white" mb={6} textAlign="center">
          Choose a username
        </Text>
        <VStack spacing={4} as="form" onSubmit={handleSubmit}>
          <FormControl>
            <FormLabel color="gray.300">Username</FormLabel>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your-name" />
          </FormControl>

          <Button colorScheme="blue" isLoading={loading} onClick={handleSubmit} width="100%">
            Save
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default ProfileSetup;
