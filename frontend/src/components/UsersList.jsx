import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Icon,
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
import { useMemo, useState } from "react";
import {
  FiCircle,
  FiEdit2,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";

const normalizeId = (value) => String(value ?? "").trim();

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const UsersList = ({
  users = [],
  selectedGroup = null,
  onGroupUpdated,
  onGroupDeleted,
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inviteUserId, setInviteUserId] = useState("");
  const [groupName, setGroupName] = useState(selectedGroup?.name || "");
  const [groupDescription, setGroupDescription] = useState(
    selectedGroup?.description || "",
  );
  const currentUser = useMemo(() => getStoredUser(), []);
  const isAdmin = selectedGroup?.admin?._id === currentUser?._id;

  const memberList = selectedGroup?.members?.length
    ? selectedGroup.members
    : users || [];
  const onlineUserIds = new Set(
    (users || []).map((onlineUser) =>
      normalizeId(onlineUser?._id || onlineUser?.id || onlineUser?.userId),
    ),
  );

  const handleGroupAction = async (endpoint, payload, successMessage) => {
    if (!selectedGroup?._id) return;

    try {
      const token = currentUser?.token;
      if (!token) return;

      await axios.post(
        `http://localhost:5000/api/groups/${selectedGroup._id}${endpoint}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        title: successMessage,
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      onGroupUpdated?.();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup?._id) return;

    try {
      const token = currentUser?.token;
      if (!token) return;

      await axios.delete(
        `http://localhost:5000/api/groups/${selectedGroup._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        title: "Group deleted",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      onGroupDeleted?.();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRenameGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      const token = currentUser?.token;
      if (!token) return;

      await axios.put(
        `http://localhost:5000/api/groups/${selectedGroup._id}/rename`,
        {
          name: groupName,
          description: groupDescription,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast({
        title: "Group updated",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      onGroupUpdated?.();
      onClose();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      h="100%"
      w="100%"
      borderLeft="1px solid"
      borderColor="whiteAlpha.200"
      bg="rgba(15, 23, 42, 0.88)"
      position="relative"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        p={5}
        borderBottom="1px solid"
        borderColor="whiteAlpha.200"
        bg="rgba(15, 23, 42, 0.9)"
        align="center"
        position="sticky"
        top={0}
        zIndex={1}
        boxShadow="sm"
      >
        <Icon as={FiUsers} fontSize="20px" color="brand.300" mr={2} />
        <Text fontSize="lg" fontWeight="700" color="white">
          Members
        </Text>
        <Badge
          ml={2}
          colorScheme="brand"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="xs"
        >
          {memberList.length}
        </Badge>
      </Flex>

      {/* Admin Controls */}
      {isAdmin && (
        <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.200">
          <Flex gap={2} mb={3}>
            <Input
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              placeholder="User ID to invite"
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              color="white"
              size="sm"
            />
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              size="sm"
              onClick={() => {
                if (!inviteUserId.trim()) {
                  toast({
                    title: "User ID required",
                    status: "warning",
                    duration: 2000,
                    isClosable: true,
                  });
                  return;
                }
                handleGroupAction(
                  "/invite",
                  { userId: inviteUserId },
                  "User invited",
                );
                setInviteUserId("");
              }}
            >
              Invite
            </Button>
          </Flex>

          <Flex gap={2} wrap="wrap">
            <Button
              leftIcon={<FiEdit2 />}
              variant="ghost"
              colorScheme="brand"
              size="sm"
              onClick={onOpen}
            >
              Rename group
            </Button>
            <Button
              leftIcon={<FiTrash2 />}
              variant="ghost"
              colorScheme="red"
              size="sm"
              onClick={handleDeleteGroup}
            >
              Delete group
            </Button>
          </Flex>
        </Box>
      )}

      {/* Users List */}
      <Box flex="1" overflowY="auto" p={4}>
        {memberList.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            h="100%"
            color="gray.400"
            textAlign="center"
            px={6}
          >
            <Text fontWeight="600" color="gray.200" mb={1}>
              No members yet
            </Text>
            <Text fontSize="sm">Invite someone to join this group.</Text>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={3}>
            {memberList.map((user) => {
              const memberId = normalizeId(
                user?._id || user?.id || user?.userId,
              );
              const isOnline = onlineUserIds.has(memberId);
              const isGroupAdmin = selectedGroup?.admin?._id === memberId;

              return (
                <Box key={memberId || user?.email || user?.username}>
                  <Tooltip
                    label={
                      isOnline
                        ? `${user.username} is online`
                        : `${user.username} is offline`
                    }
                    placement="left"
                  >
                    <Flex
                      p={3}
                      bg="rgba(17, 24, 39, 0.9)"
                      borderRadius="18px"
                      borderWidth="1px"
                      borderColor={
                        isGroupAdmin
                          ? "rgba(129, 140, 248, 0.8)"
                          : "whiteAlpha.100"
                      }
                      align="center"
                      gap={3}
                      _hover={{
                        bg: "rgba(79, 70, 229, 0.08)",
                        borderColor: "brand.400",
                      }}
                    >
                      <Avatar
                        size="sm"
                        name={user.username}
                        bg={
                          isOnline
                            ? "linear-gradient(135deg, #4f46e5, #8b5cf6)"
                            : "gray.700"
                        }
                        color="white"
                      />

                      <Box flex="1" minW={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color="white"
                          noOfLines={1}
                        >
                          {user.username}
                        </Text>
                        <Text fontSize="11px" color="gray.400">
                          {user.email || "Group member"}
                        </Text>
                      </Box>

                      {isGroupAdmin && (
                        <Badge colorScheme="purple" borderRadius="full" px={2}>
                          Admin
                        </Badge>
                      )}

                      {isAdmin && !isGroupAdmin && (
                        <Flex gap={1}>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="purple"
                            leftIcon={<FiShield />}
                            onClick={() =>
                              handleGroupAction(
                                "/promote-admin",
                                { userId: memberId },
                                "Admin promoted",
                              )
                            }
                          >
                            Promote
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            leftIcon={<FiTrash2 />}
                            onClick={() =>
                              handleGroupAction(
                                "/remove-member",
                                { userId: memberId },
                                "Member removed",
                              )
                            }
                          >
                            Remove
                          </Button>
                        </Flex>
                      )}

                      <Flex
                        align="center"
                        bg={
                          isOnline
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(148, 163, 184, 0.12)"
                        }
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        <Icon
                          as={FiCircle}
                          color={isOnline ? "green.400" : "gray.400"}
                          fontSize="8px"
                          mr={1}
                        />
                        <Text
                          fontSize="xs"
                          color={isOnline ? "green.300" : "gray.300"}
                          fontWeight="600"
                        >
                          {isOnline ? "online" : "offline"}
                        </Text>
                      </Flex>
                    </Flex>
                  </Tooltip>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Rename Group Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent
          bg="gray.900"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="20px"
        >
          <ModalHeader color="white">Rename group</ModalHeader>
          <ModalCloseButton color="gray.300" />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                bg="whiteAlpha.50"
                borderColor="whiteAlpha.200"
                color="white"
              />
              <Input
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Group description"
                bg="whiteAlpha.50"
                borderColor="whiteAlpha.200"
                color="white"
              />
              <Button colorScheme="brand" onClick={handleRenameGroup}>
                Save changes
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UsersList;
