import {
  Avatar,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Flex,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  FiChevronRight,
  FiLogOut,
  FiMessageSquare,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const Sidebar = ({ setSelectedGroup }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchGroups();
  }, []);

  const currentUser = useMemo(() => getStoredUser(), []);

  const checkAdminStatus = () => {
    const userInfo = getStoredUser();
    if (userInfo && userInfo.isAdmin) {
      setIsAdmin(true);
    }
  };

  const fetchGroups = async () => {
    try {
      const userInfo = getStoredUser();
      const token = userInfo?.token;
      if (!token) {
        navigate("/login");
        return;
      }

      const { data } = await axios.get(
        "https://chat-app-ochre-ten-30.vercel.app/api/groups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setGroups(data || []);
      const userGroupIds = (data || [])
        .filter((group) =>
          group?.members?.some((member) => member?._id === userInfo?._id),
        )
        .map((group) => group?._id);
      setUserGroups(userGroupIds);
    } catch (error) {
      console.log("Error fetching groups:", error);
    }
  };

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch =
        !query ||
        group?.name?.toLowerCase().includes(query) ||
        group?.description?.toLowerCase().includes(query);

      const isJoined = userGroups.includes(group?._id);
      const joinedMatches = activeFilter === "joined" ? isJoined : true;
      const adminMatches =
        activeFilter === "admin"
          ? group?.admin?._id === currentUser?._id
          : true;

      return matchesSearch && joinedMatches && adminMatches;
    });
  }, [groups, searchTerm, userGroups, activeFilter, currentUser?._id]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Group name required",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      const userInfo = getStoredUser();
      const token = userInfo?.token;
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.post(
        "https://chat-app-ochre-ten-30.vercel.app/api/groups",
        {
          name: newGroupName,
          description: newGroupDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast({
        title: "Group created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setNewGroupName("");
      setNewGroupDescription("");
      await fetchGroups();
    } catch (error) {
      toast({
        title: "Error creating group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description: error.response?.data?.message || "An error occurred",
      });
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const userInfo = getStoredUser();
      const token = userInfo?.token;
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.post(
        `https://chat-app-ochre-ten-30.vercel.app/api/groups/${groupId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchGroups();
      const group = groups.find((item) => item._id === groupId);
      if (group) setSelectedGroup(group);

      toast({
        title: "Joined group successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error joining group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description: error.response?.data?.message || "An error occurred",
      });
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const userInfo = getStoredUser();
      const token = userInfo?.token;
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.post(
        `https://chat-app-ochre-ten-30.vercel.app/api/groups/${groupId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchGroups();
      setSelectedGroup(null);

      toast({
        title: "Left group successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error leaving group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description: error.response?.data?.message || "An error occurred",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  return (
    <Box
      h="100%"
      display="flex"
      flexDirection="column"
      bg="rgba(15, 23, 42, 0.88)"
    >
      <Flex
        p={4}
        pt={5}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        bg="rgba(15, 23, 42, 0.7)"
      >
        <Flex align="center" gap={3} minW={0}>
          <Box
            w="40px"
            h="40px"
            borderRadius="16px"
            bgGradient="linear(to-br, brand.500, brand.400)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 12px 28px rgba(79, 70, 229, 0.42)"
          >
            <Icon as={FiMessageSquare} color="white" fontSize="20px" />
          </Box>
          <Box minW={0}>
            <Text
              fontSize="lg"
              fontWeight="700"
              letterSpacing="-0.03em"
              color="white"
            >
              EchoSpace
            </Text>
            <Text
              fontSize="11px"
              color="gray.400"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Team chat
            </Text>
          </Box>
        </Flex>

        {isAdmin && (
          <Tooltip label="Create new group" placement="left">
            <IconButton
              aria-label="Create group"
              icon={<FiPlus />}
              variant="ghost"
              size="sm"
              color="gray.200"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
              onClick={onOpen}
            />
          </Tooltip>
        )}
      </Flex>

      <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
        <Flex
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="16px"
          px={3}
          py={2.5}
          align="center"
          gap={2}
        >
          <Icon as={FiSearch} color="gray.400" fontSize="15px" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups"
            variant="unstyled"
            color="white"
            _placeholder={{ color: "gray.400" }}
          />
        </Flex>
      </Box>

      <Box px={4} py={3}>
        <Flex gap={2} wrap="wrap">
          {[
            { id: "all", label: "All" },
            { id: "joined", label: "Joined" },
            { id: "admin", label: "Admin" },
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "solid" : "ghost"}
              colorScheme={activeFilter === filter.id ? "brand" : "gray"}
              onClick={() => setActiveFilter(filter.id)}
              borderRadius="full"
              px={3}
              fontWeight="600"
              size="sm"
            >
              {filter.label}
            </Button>
          ))}
        </Flex>
      </Box>

      <Box p={4} pb={0}>
        <Flex
          align="center"
          gap={3}
          bg="linear-gradient(135deg, rgba(79,70,229,0.2), rgba(15,23,42,0.7))"
          border="1px solid"
          borderColor="brand.500"
          borderRadius="20px"
          p={3}
        >
          <Avatar
            name={currentUser?.username || "You"}
            size="md"
            bg="linear-gradient(135deg, #4f46e5, #8b5cf6)"
            color="white"
          />
          <Box flex="1" minW={0}>
            <Text fontSize="sm" fontWeight="700" color="white" noOfLines={1}>
              {currentUser?.username || "User"}
            </Text>
            <Flex align="center" gap={2} mt={0.5}>
              <Box
                w={2.5}
                h={2.5}
                bg="green.400"
                borderRadius="full"
                boxShadow="0 0 0 3px rgba(52, 211, 153, 0.15)"
              />
              <Text fontSize="12px" color="gray.300">
                Online
              </Text>
            </Flex>
          </Box>
          <Button
            variant="ghost"
            size="sm"
            color="gray.200"
            rightIcon={<FiChevronRight />}
            onClick={handleLogout}
            _hover={{ bg: "whiteAlpha.100" }}
          >
            Exit
          </Button>
        </Flex>
      </Box>

      <Box flex="1" overflowY="auto" px={4} py={4}>
        <VStack spacing={3} align="stretch">
          {filteredGroups.length === 0 ? (
            <Box
              border="1px dashed"
              borderColor="whiteAlpha.200"
              p={6}
              borderRadius="18px"
              textAlign="center"
              bg="whiteAlpha.50"
            >
              <Text fontWeight="600" color="gray.200">
                No groups found
              </Text>
              <Text fontSize="sm" color="gray.400" mt={1}>
                Try a different search or create a new group.
              </Text>
            </Box>
          ) : (
            filteredGroups.map((group) => {
              const joined = userGroups.includes(group?._id);
              const active = group?._id === currentUser?._activeGroup;

              return (
                <Box
                  key={group._id}
                  onClick={() => setSelectedGroup(group)}
                  p={3}
                  borderRadius="20px"
                  bg={
                    joined ? "rgba(79, 70, 229, 0.12)" : "rgba(15, 23, 42, 0.7)"
                  }
                  border="1px solid"
                  borderColor={
                    joined ? "rgba(129, 140, 248, 0.4)" : "whiteAlpha.100"
                  }
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    transform: "translateY(-1px)",
                    borderColor: "rgba(129, 140, 248, 0.6)",
                    bg: "rgba(79, 70, 229, 0.14)",
                  }}
                  boxShadow={
                    active ? "0 18px 38px rgba(79, 70, 229, 0.18)" : "none"
                  }
                >
                  <Flex align="center" gap={3}>
                    <Avatar
                      name={group.name}
                      size="sm"
                      bg={
                        joined
                          ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                          : "gray.700"
                      }
                      color="white"
                    />

                    <Box flex="1" minW={0}>
                      <Flex align="center" justify="space-between" gap={2}>
                        <Text fontWeight="700" color="white" noOfLines={1}>
                          {group.name}
                        </Text>
                        {joined && (
                          <Badge
                            variant="subtle"
                            colorScheme="purple"
                            borderRadius="full"
                          >
                            Joined
                          </Badge>
                        )}
                      </Flex>

                      <Text
                        fontSize="12px"
                        color="gray.400"
                        noOfLines={2}
                        mt={1}
                      >
                        {group.description || "No description available"}
                      </Text>
                      <Flex align="center" justify="space-between" mt={2}>
                        <Text fontSize="11px" color="gray.500">
                          {group.members?.length || 0} members
                        </Text>
                        {!joined ? (
                          <Text
                            fontSize="11px"
                            fontWeight="600"
                            color="brand.300"
                          >
                            Open
                          </Text>
                        ) : (
                          <Text
                            fontSize="11px"
                            fontWeight="600"
                            color="green.300"
                          >
                            Active
                          </Text>
                        )}
                      </Flex>
                    </Box>
                  </Flex>

                  <Button
                    mt={3}
                    size="sm"
                    w="100%"
                    variant={joined ? "outline" : "solid"}
                    colorScheme={joined ? "red" : "brand"}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (joined) handleLeaveGroup(group._id);
                      else handleJoinGroup(group._id);
                    }}
                    borderRadius="12px"
                  >
                    {joined ? "Leave group" : "Join group"}
                  </Button>
                </Box>
              );
            })
          )}
        </VStack>
      </Box>

      <Box
        p={4}
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
        bg="rgba(15, 23, 42, 0.7)"
      >
        <Button
          onClick={handleLogout}
          variant="ghost"
          colorScheme="red"
          leftIcon={<FiLogOut />}
          width="100%"
          justifyContent="flex-start"
          borderRadius="14px"
          _hover={{ bg: "rgba(239, 68, 68, 0.08)" }}
        >
          Log out
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent
          bg="gray.900"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="24px"
          mx={4}
        >
          <ModalHeader color="white" fontSize="lg" fontWeight="700">
            Create group
          </ModalHeader>
          <ModalCloseButton color="gray.300" />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="gray.300">Group name</FormLabel>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Design team, product updates..."
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Description</FormLabel>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Add a quick description"
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>

              <Button
                onClick={handleCreateGroup}
                colorScheme="brand"
                size="lg"
                borderRadius="14px"
                mt={2}
              >
                Create group
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sidebar;
