import {
  Avatar,
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiInfo,
  FiMessageCircle,
  FiSearch,
  FiSend,
  FiSmile,
} from "react-icons/fi";
import UsersList from "./UsersList";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const ChatArea = ({
  selectedGroup,
  selectedDM,
  socket,
  setSelectedGroup,
  setSelectedDM,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toast = useToast();

  const currentUser = useMemo(() => getStoredUser(), []);

  const refreshSelectedGroup = useCallback(async () => {
    if (!selectedGroup?._id) return;

    try {
      const token = currentUser?.token;
      if (!token) return;

      const { data } = await axios.get(
        `https://chat-app-ochre-ten-30.vercel.app/api/groups`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedGroup = (data || []).find(
        (group) => group._id === selectedGroup._id,
      );
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    } catch {
      console.log("Failed to refresh selected group");
    }
  }, [currentUser?.token, selectedGroup?._id]);

  const fetchMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    const token = currentUser?.token;

    try {
      const endpoint = selectedGroup
        ? `https://chat-app-ochre-ten-30.vercel.app/api/messages/${selectedGroup?._id}`
        : selectedDM
          ? `https://chat-app-ochre-ten-30.vercel.app/api/dm/${selectedDM?._id}/messages`
          : null;

      if (!endpoint) {
        setMessages([]);
        return;
      }

      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data || []);
    } catch {
      console.log("Failed to fetch messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser?.token, selectedGroup?._id, selectedDM?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    if ((!selectedGroup && !selectedDM) || !socket) return undefined;

    const syncMessages = async () => {
      await fetchMessages();
    };

    syncMessages();

    if (selectedGroup) {
      socket.emit("join room", selectedGroup?._id);
    }

    if (selectedDM) {
      socket.emit("join dm", selectedDM?._id);
    }

    const handleMessageReceived = (newMessageData) => {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) => msg?._id === newMessageData?._id,
        );

        if (alreadyExists) return prev;
        return [...prev, newMessageData];
      });
      fetchMessages();
    };

    const handleDMMessageReceived = (newMessageData) => {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) => msg?._id === newMessageData?._id,
        );

        if (alreadyExists) return prev;
        return [...prev, newMessageData];
      });
      fetchMessages();
    };

    const handleUsersInRoom = (users) => setConnectedUsers(users);
    const handleUserJoined = (user) => {
      setConnectedUsers((prev) => {
        if (!prev.some((entry) => entry?._id === user?._id)) {
          return [...prev, user];
        }
        return prev;
      });
    };
    const handleUserLeft = (userId) => {
      setConnectedUsers((prev) => prev.filter((user) => user?._id !== userId));
    };
    const handleNotification = (notification) => {
      toast({
        title:
          notification?.type === "USER_JOINED" ? "New member" : "Notification",
        description: notification.message,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    };
    const handleUserTyping = ({ username }) => {
      setTypingUsers((prev) => new Set(prev).add(username));
    };
    const handleUserStopTyping = ({ username }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    };

    socket.on("message received", handleMessageReceived);
    socket.on("dm message received", handleDMMessageReceived);
    socket.on("users in room", handleUsersInRoom);
    socket.on("user joined", handleUserJoined);
    socket.on("user left", handleUserLeft);
    socket.on("notification", handleNotification);
    socket.on("user typing", handleUserTyping);
    socket.on("user stop typing", handleUserStopTyping);
    socket.on("user typing dm", handleUserTyping);
    socket.on("user stop typing dm", handleUserStopTyping);

    return () => {
      if (selectedGroup) {
        socket.emit("leave room", selectedGroup?._id);
      }
      if (selectedDM) {
        socket.emit("leave dm", selectedDM?._id);
      }
      socket.off("message received", handleMessageReceived);
      socket.off("dm message received", handleDMMessageReceived);
      socket.off("users in room", handleUsersInRoom);
      socket.off("user joined", handleUserJoined);
      socket.off("user left", handleUserLeft);
      socket.off("notification", handleNotification);
      socket.off("user typing", handleUserTyping);
      socket.off("user stop typing", handleUserStopTyping);
      socket.off("user typing dm", handleUserTyping);
      socket.off("user stop typing dm", handleUserStopTyping);
      setTypingUsers(new Set());
    };
  }, [selectedGroup, selectedDM, socket, toast, fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || (!selectedGroup && !selectedDM)) return;

    try {
      const token = currentUser.token;
      const endpoint = selectedGroup
        ? "https://chat-app-ochre-ten-30.vercel.app/api/messages"
        : "https://chat-app-ochre-ten-30.vercel.app/api/dm/" +
          selectedDM._id +
          "/message";

      const payload = selectedGroup
        ? { content: newMessage, groupId: selectedGroup?._id }
        : { content: newMessage };

      const { data } = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (selectedGroup) {
        socket.emit("new message", {
          ...data,
          groupId: selectedGroup?._id,
        });
      }

      if (selectedDM) {
        socket.emit("new dm message", {
          ...data,
          threadId: selectedDM?._id,
        });
      }

      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch {
      toast({
        title: "Error sending message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    if (selectedGroup) {
      if (value.trim() && !typingTimeoutRef.current) {
        socket.emit("typing", {
          groupId: selectedGroup?._id,
          username: currentUser.username,
        });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (selectedGroup) {
          socket.emit("stop typing", { groupId: selectedGroup?._id });
        }
        typingTimeoutRef.current = null;
      }, 1800);
    }

    if (selectedDM) {
      if (value.trim() && !typingTimeoutRef.current) {
        socket.emit("typing dm", {
          threadId: selectedDM?._id,
          username: currentUser.username,
        });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (selectedDM) {
          socket.emit("stop typing dm", { threadId: selectedDM?._id });
        }
        typingTimeoutRef.current = null;
      }, 1800);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateSeparator = (date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));

  const messageGroups = messages.reduce((acc, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {});

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;

    const typingUsersArray = Array.from(typingUsers).filter(
      (username) => username !== currentUser?.username,
    );

    if (!typingUsersArray.length) return null;

    return (
      <Flex align="center" gap={2} alignSelf="flex-start" px={2}>
        <Avatar size="xs" name={typingUsersArray[0]} bg="brand.500" />
        <Box
          bg="rgba(15, 23, 42, 0.9)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          px={3}
          py={2}
          borderRadius="18px"
        >
          <Text
            fontSize="12px"
            color="gray.300"
            fontWeight="600"
            textTransform="capitalize"
          >
            {typingUsersArray[0]} is typing
          </Text>
          <Flex mt={1} gap={1}>
            {[1, 2, 3].map((dot) => (
              <Box
                key={dot}
                w="5px"
                h="5px"
                borderRadius="full"
                bg="gray.400"
                opacity={0.8 - dot * 0.25}
              />
            ))}
          </Flex>
        </Box>
      </Flex>
    );
  };

  const activeConversation = selectedGroup || selectedDM;
  const activeTitle =
    selectedGroup?.name ||
    (() => {
      const otherUser = (selectedDM?.participants || []).find(
        (participant) => participant?._id !== currentUser?._id,
      );

      return (
        otherUser?.username ||
        selectedDM?.otherUser?.username ||
        "Direct message"
      );
    })();

  return (
    <Flex h="100%" w="100%" bg="brand.950" position="relative">
      <Box flex="1" display="flex" flexDirection="column" minW={0} h="100%">
        {activeConversation ? (
          <>
            <Flex
              px={{ base: 4, md: 6 }}
              py={4}
              bg="rgba(15, 23, 42, 0.7)"
              borderBottom="1px solid"
              borderColor="whiteAlpha.100"
              align="center"
              gap={3}
              backdropFilter="blur(12px)"
            >
              <IconButton
                display={{ base: "flex", md: "none" }}
                aria-label="Back to conversations"
                size="sm"
                variant="ghost"
                color="gray.200"
                icon={<FiArrowLeft />}
                onClick={() => {
                  setSelectedGroup(null);
                  setSelectedDM(null);
                }}
              />

              <Avatar
                name={selectedGroup ? selectedGroup?.name : activeTitle}
                size="md"
                bg={
                  selectedGroup
                    ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                    : "brand.500"
                }
                color="white"
              />

              <Box flex="1" minW={0}>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  color="white"
                  noOfLines={1}
                >
                  {selectedGroup ? selectedGroup?.name : activeTitle}
                </Text>
                <Text fontSize="12px" color="gray.400">
                  {selectedGroup
                    ? selectedGroup?.description || "Group conversation"
                    : "Direct message"}
                </Text>
              </Box>

              <Flex align="center" gap={2}>
                <IconButton
                  aria-label="Search in conversation"
                  variant="ghost"
                  size="sm"
                  icon={<FiSearch />}
                  color="gray.300"
                  _hover={{ bg: "whiteAlpha.100" }}
                />
                <IconButton
                  aria-label="Conversation info"
                  variant="ghost"
                  size="sm"
                  icon={<FiInfo />}
                  color="gray.300"
                  _hover={{ bg: "whiteAlpha.100" }}
                />
              </Flex>
            </Flex>

            <VStack
              flex="1"
              overflowY="auto"
              spacing={4}
              align="stretch"
              px={{ base: 3, md: 6 }}
              py={{ base: 4, md: 6 }}
              bg="rgba(9, 15, 29, 0.7)"
            >
              {isLoadingMessages ? (
                <Flex align="center" justify="center" h="100%" color="gray.300">
                  <Spinner size="sm" mr={3} />
                  <Text>Loading messages…</Text>
                </Flex>
              ) : messages.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  h="100%"
                  textAlign="center"
                  px={8}
                >
                  <Box
                    as={FiMessageCircle}
                    fontSize="56px"
                    color="gray.600"
                    mb={4}
                  />
                  <Text fontSize="2xl" fontWeight="700" color="white" mb={2}>
                    Start the conversation
                  </Text>
                  <Text color="gray.400" maxW="420px">
                    {selectedGroup
                      ? "Say hello to your team and share updates, ideas, and quick progress notes here."
                      : "Send a quick hello and start your direct conversation."}
                  </Text>
                </Flex>
              ) : (
                Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
                  <Box key={dateKey}>
                    <Flex align="center" my={3} justify="center">
                      <Box flex="1" height="1px" bg="whiteAlpha.200" />
                      <Text
                        fontSize="11px"
                        color="gray.400"
                        mx={4}
                        letterSpacing="0.08em"
                        textTransform="uppercase"
                      >
                        {formatDateSeparator(dateKey)}
                      </Text>
                      <Box flex="1" height="1px" bg="whiteAlpha.200" />
                    </Flex>

                    {dayMessages.map((message, index) => {
                      const isCurrentUser =
                        message.sender?._id === currentUser?._id;
                      const isSequence =
                        index > 0 &&
                        dayMessages[index - 1].sender?._id ===
                          message.sender?._id;

                      return (
                        <Flex
                          key={message._id}
                          direction="column"
                          align={isCurrentUser ? "flex-end" : "flex-start"}
                          mb={3}
                          maxW="100%"
                        >
                          {!isSequence && (
                            <Text
                              fontSize="11px"
                              color="gray.400"
                              mb={1}
                              mx={2}
                              fontWeight="600"
                            >
                              {isCurrentUser
                                ? "You"
                                : message.sender?.username || "Member"}
                            </Text>
                          )}

                          <Flex align="center" gap={2} maxW="75%">
                            {!isCurrentUser && !isSequence && (
                              <Avatar
                                size="xs"
                                name={message.sender?.username || "Member"}
                                bg="gray.700"
                              />
                            )}

                            <Box
                              px={4}
                              py={3}
                              borderRadius="20px"
                              bg={
                                isCurrentUser
                                  ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                                  : "rgba(15,23,42,0.9)"
                              }
                              border={isCurrentUser ? "none" : "1px solid"}
                              borderColor={
                                isCurrentUser ? "transparent" : "whiteAlpha.200"
                              }
                              color={isCurrentUser ? "white" : "gray.100"}
                              boxShadow={
                                isCurrentUser
                                  ? "0 10px 24px rgba(79, 70, 229, 0.28)"
                                  : "none"
                              }
                              wordBreak="break-word"
                            >
                              <Text lineHeight="1.5" whiteSpace="pre-wrap">
                                {message.content}
                              </Text>
                            </Box>

                            {isCurrentUser && !isSequence && (
                              <Avatar
                                size="xs"
                                name={currentUser?.username || "You"}
                                bg="brand.500"
                              />
                            )}
                          </Flex>

                          {!isSequence && (
                            <Text
                              fontSize="10px"
                              color="gray.500"
                              mt={1}
                              mx={2}
                              alignSelf={
                                isCurrentUser ? "flex-end" : "flex-start"
                              }
                            >
                              {formatTime(message.createdAt)}
                            </Text>
                          )}
                        </Flex>
                      );
                    })}
                  </Box>
                ))
              )}

              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </VStack>

            <Box
              bg="rgba(15, 23, 42, 0.8)"
              borderTop="1px solid"
              borderColor="whiteAlpha.100"
              px={{ base: 3, md: 5 }}
              py={4}
            >
              <Flex
                align="center"
                gap={3}
                bg="rgba(17, 24, 39, 0.9)"
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="18px"
                px={3}
                py={2}
              >
                <IconButton
                  aria-label="Emoji picker"
                  variant="ghost"
                  size="sm"
                  icon={<FiSmile />}
                  color="gray.300"
                  _hover={{ bg: "whiteAlpha.100" }}
                />
                <Input
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder={
                    selectedGroup ? "Message to #group" : "Write a message"
                  }
                  variant="unstyled"
                  color="white"
                  resize="none"
                  _placeholder={{ color: "gray.500" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  colorScheme="brand"
                  borderRadius="12px"
                  px={4}
                  rightIcon={<FiSend />}
                  isDisabled={!newMessage.trim()}
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                  onClick={sendMessage}
                >
                  Send
                </Button>
              </Flex>
            </Box>
          </>
        ) : (
          <Flex
            h="100%"
            direction="column"
            align="center"
            justify="center"
            p={8}
            textAlign="center"
            bg="linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(9, 15, 29, 0.95))"
          >
            <Box
              as={FiMessageCircle}
              fontSize="72px"
              color="brand.400"
              mb={6}
            />
            <Text fontSize="2xl" fontWeight="700" color="white" mb={2}>
              Welcome to EchoSpace
            </Text>
            <Text color="gray.400" maxW="420px">
              Select a group or start a direct message from the sidebar.
            </Text>
          </Flex>
        )}
      </Box>

      <Box
        w={{ base: "0px", xl: "280px" }}
        minW={{ base: "0px", xl: "280px" }}
        display={{ base: "none", xl: "block" }}
        borderLeft="1px solid"
        borderColor="whiteAlpha.100"
        bg="rgba(15, 23, 42, 0.88)"
      >
        {selectedGroup && (
          <UsersList
            users={connectedUsers}
            selectedGroup={selectedGroup}
            onGroupUpdated={refreshSelectedGroup}
            onGroupDeleted={() => {
              setSelectedGroup(null);
              setSelectedDM(null);
            }}
          />
        )}
      </Box>
    </Flex>
  );
};

export default ChatArea;
