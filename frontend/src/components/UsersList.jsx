import {
  Avatar,
  Badge,
  Box,
  Flex,
  Icon,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { FiCircle, FiUsers } from "react-icons/fi";

const normalizeId = (value) => String(value ?? "").trim();

const UsersList = ({ users = [], selectedGroup = null }) => {
  const memberList = selectedGroup?.members?.length
    ? selectedGroup.members
    : users || [];
  const onlineUserIds = new Set(
    (users || []).map((onlineUser) =>
      normalizeId(onlineUser?._id || onlineUser?.id || onlineUser?.userId),
    ),
  );

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
                      borderColor="whiteAlpha.100"
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
    </Box>
  );
};

export default UsersList;
