import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const ENDPOINT = "https://chat-app-ochre-ten-30.vercel.app";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const Chat = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userInfo = getStoredUser();
    const newSocket = io(ENDPOINT, {
      auth: { user: userInfo || {} },
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <Flex
      h="100vh"
      w="100vw"
      maxW="100vw"
      bg="brand.950"
      color="white"
      direction={{ base: "column", md: "row" }}
      overflow="hidden"
      border="none"
    >
      <Box
        w={{ base: "100%", md: "360px" }}
        minW={{ base: "100%", md: "360px" }}
        h={{ base: selectedGroup ? "0" : "100%", md: "100vh" }}
        display={{ base: selectedGroup ? "none" : "flex", md: "flex" }}
        borderRight="1px solid"
        borderColor="whiteAlpha.200"
        bg="rgba(15, 23, 42, 0.75)"
        backdropFilter="blur(16px)"
      >
        <Sidebar setSelectedGroup={setSelectedGroup} />
      </Box>
      <Box
        flex="1"
        minW={0}
        w="100%"
        display={{ base: selectedGroup ? "flex" : "flex", md: "flex" }}
        bg="brand.950"
      >
        {socket && (
          <ChatArea
            selectedGroup={selectedGroup}
            socket={socket}
            setSelectedGroup={setSelectedGroup}
          />
        )}
      </Box>
    </Flex>
  );
};

export default Chat;
